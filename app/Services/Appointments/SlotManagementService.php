<?php

namespace App\Services\Appointments;

use App\Exceptions\ActiveBookingsException;
use App\Exceptions\SlotOverlapException;
use App\Models\Slot;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Support\WibClock;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SlotManagementService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Membuat slot praktik baru dengan validasi bentrok (overlap) dan audit log atomik.
     *
     * @throws SlotOverlapException|ValidationException
     */
    public function createSlot(User $admin, array $data): Slot
    {
        $doctorId = $data['dokter_id'] ?? $data['doctor_id'];
        $tanggal = $data['tanggal'] ?? $data['date'];
        $jamMulai = $data['jam_mulai'] ?? $data['starts_at'];
        $jamSelesai = $data['jam_selesai'] ?? $data['ends_at'];
        $tersedia = isset($data['tersedia']) ? (bool) $data['tersedia'] : (isset($data['available']) ? (bool) $data['available'] : true);

        // Validasi jam mulai < jam selesai
        if ($jamMulai >= $jamSelesai) {
            throw ValidationException::withMessages([
                'jam_selesai' => 'Jam selesai praktik harus setelah jam mulai.',
            ]);
        }

        // Validasi tanggal tidak boleh lampau
        $slotDate = Carbon::parse($tanggal);
        if ($slotDate->isBefore(Carbon::parse(WibClock::today()))) {
            throw ValidationException::withMessages([
                'tanggal' => 'Tidak dapat menambahkan slot praktik untuk tanggal lampau.',
            ]);
        }

        // Validasi bentrok slot (overlap) untuk dokter yang sama pada tanggal yang sama
        $this->assertNoOverlap($doctorId, $tanggal, $jamMulai, $jamSelesai);

        $id = (string) Str::uuid();

        return $this->auditService->executeMutation(
            mutation: function () use ($id, $doctorId, $tanggal, $jamMulai, $jamSelesai, $tersedia) {
                return Slot::create([
                    'id' => $id,
                    'dokter_id' => $doctorId,
                    'tanggal' => $tanggal,
                    'jam_mulai' => $jamMulai,
                    'jam_selesai' => $jamSelesai,
                    'kuota' => 1,
                    'tersedia' => $tersedia,
                ]);
            },
            aksi: 'TAMBAH_SLOT',
            objek: 'slot',
            objekId: $id,
            nilaiSebelum: null,
            nilaiSesudah: fn (Slot $s) => [
                'dokter_id' => $s->dokter_id,
                'tanggal' => $s->tanggal->format('Y-m-d'),
                'jam_mulai' => $s->jam_mulai,
                'jam_selesai' => $s->jam_selesai,
                'tersedia' => $s->tersedia,
            ],
            alasan: 'Penambahan slot jadwal praktik dokter',
            actor: $admin
        );
    }

    /**
     * Memperbarui slot praktik dengan validasi proteksi janji aktif dan audit log atomik.
     *
     * @throws ActiveBookingsException|SlotOverlapException|ValidationException
     */
    public function updateSlot(User $admin, Slot $slot, array $data, string $reason): Slot
    {
        $hasActiveAppointment = $slot->appointments()
            ->whereIn('status', ['aktif', 'perubahan_diusulkan'])
            ->exists();

        $jamMulai = $data['jam_mulai'] ?? $data['starts_at'] ?? $slot->jam_mulai;
        $jamSelesai = $data['jam_selesai'] ?? $data['ends_at'] ?? $slot->jam_selesai;

        $targetTersedia = null;
        if (array_key_exists('tersedia', $data)) {
            $targetTersedia = (bool) $data['tersedia'];
        } elseif (array_key_exists('available', $data)) {
            $targetTersedia = (bool) $data['available'];
        }

        // Jika slot sudah memiliki janji aktif:
        // Tidak boleh mengubah jam atau mengubah ketersediaan tanpa alur usulan perubahan jadwal
        if ($hasActiveAppointment) {
            $isTimeChanged = ($jamMulai !== $slot->jam_mulai || $jamSelesai !== $slot->jam_selesai);
            $isAvailabilityChanged = ($targetTersedia !== null && $targetTersedia !== $slot->tersedia);

            if ($isTimeChanged || $isAvailabilityChanged) {
                throw new ActiveBookingsException('Tidak dapat mengubah slot yang sudah memiliki janji aktif. Gunakan alur usulan perubahan jadwal.');
            }
        }

        if ($jamMulai >= $jamSelesai) {
            throw ValidationException::withMessages([
                'jam_selesai' => 'Jam selesai praktik harus setelah jam mulai.',
            ]);
        }

        // Validasi overlap jika jam berubah
        if ($jamMulai !== $slot->jam_mulai || $jamSelesai !== $slot->jam_selesai) {
            $this->assertNoOverlap($slot->dokter_id, $slot->tanggal->format('Y-m-d'), $jamMulai, $jamSelesai, $slot->id);
        }

        $nilaiSebelum = [
            'jam_mulai' => $slot->jam_mulai,
            'jam_selesai' => $slot->jam_selesai,
            'tersedia' => $slot->tersedia,
        ];

        $tersedia = $targetTersedia !== null ? $targetTersedia : $slot->tersedia;

        return $this->auditService->executeMutation(
            mutation: function () use ($slot, $jamMulai, $jamSelesai, $tersedia) {
                $slot->update([
                    'jam_mulai' => $jamMulai,
                    'jam_selesai' => $jamSelesai,
                    'tersedia' => $tersedia,
                ]);

                return $slot->fresh();
            },
            aksi: 'UBAH_SLOT',
            objek: 'slot',
            objekId: $slot->id,
            nilaiSebelum: $nilaiSebelum,
            nilaiSesudah: fn (Slot $s) => [
                'jam_mulai' => $s->jam_mulai,
                'jam_selesai' => $s->jam_selesai,
                'tersedia' => $s->tersedia,
            ],
            alasan: $reason,
            actor: $admin
        );
    }

    /**
     * Memastikan tidak ada bentrok waktu praktik untuk dokter yang sama pada tanggal tersebut.
     *
     * @throws SlotOverlapException
     */
    protected function assertNoOverlap(string $doctorId, string $tanggal, string $jamMulai, string $jamSelesai, ?string $excludeSlotId = null): void
    {
        $hasOverlap = Slot::query()
            ->where('dokter_id', $doctorId)
            ->where('tanggal', $tanggal)
            ->when($excludeSlotId, fn ($q) => $q->where('id', '!=', $excludeSlotId))
            ->where(function ($q) use ($jamMulai, $jamSelesai) {
                $q->where('jam_mulai', '<', $jamSelesai)
                    ->where('jam_selesai', '>', $jamMulai);
            })
            ->exists();

        if ($hasOverlap) {
            throw new SlotOverlapException('Jadwal slot bertabrakan dengan slot praktik yang sudah ada untuk dokter ini.');
        }
    }
}
