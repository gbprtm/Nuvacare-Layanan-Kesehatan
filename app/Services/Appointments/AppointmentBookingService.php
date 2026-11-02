<?php

namespace App\Services\Appointments;

use App\Exceptions\SlotUnavailableException;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Slot;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Support\WibClock;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentBookingService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Mengambil daftar spesialisasi beserta jumlah slot yang tersedia.
     */
    public function getSpecialtiesWithSlotCounts(): Collection
    {
        $today = WibClock::today();

        // Ambil semua spesialisasi unik dari dokter yang aktif
        $specialties = Doctor::query()
            ->where('aktif', true)
            ->distinct()
            ->pluck('spesialisasi')
            ->sort()
            ->values();

        // Hitung slot tersedia per spesialisasi
        return $specialties->map(function (string $specialty) use ($today) {
            $count = Slot::query()
                ->where('tersedia', true)
                ->where('tanggal', '>=', $today)
                ->whereHas('doctor', function ($query) use ($specialty) {
                    $query->where('aktif', true)
                        ->where('spesialisasi', $specialty);
                })
                ->whereDoesntHave('appointments', function ($query) {
                    $query->whereIn('status', ['aktif', 'perubahan_diusulkan']);
                })
                ->count();

            return (object) [
                'nama' => $specialty,
                'slot_tersedia_count' => $count,
                'bisa_dipilih' => $count > 0,
            ];
        });
    }

    /**
     * Mengambil daftar slot untuk spesialisasi dan tanggal tertentu.
     */
    public function getSlotsForBooking(?string $specialty = null, ?string $date = null, ?string $doctorId = null): Collection
    {
        $today = WibClock::today();
        $targetDate = $date ?: $today;

        return Slot::query()
            ->with(['doctor'])
            ->when($doctorId, fn ($q) => $q->where('dokter_id', $doctorId))
            ->when($specialty, function ($q) use ($specialty) {
                $q->whereHas('doctor', fn ($dq) => $dq->where('spesialisasi', $specialty));
            })
            ->where('tanggal', $targetDate)
            ->whereHas('doctor', fn ($dq) => $dq->where('aktif', true))
            ->orderBy('jam_mulai')
            ->get();
    }

    /**
     * Mengunci slot praktik dan membuat janji temu pasien secara anti-race / atomik.
     *
     * @throws SlotUnavailableException
     */
    public function bookAppointment(User $patient, string $slotId, ?string $complaint = null): Appointment
    {
        try {
            return DB::transaction(function () use ($patient, $slotId, $complaint) {
                // 1. Kunci baris slot di database PostgreSQL dengan FOR UPDATE
                /** @var Slot|null $slot */
                $slot = Slot::where('id', $slotId)->lockForUpdate()->first();

                if (! $slot) {
                    throw new SlotUnavailableException('Slot praktik tidak ditemukan.');
                }

                // Periksa apakah slot masih bertanda tersedia
                if (! $slot->tersedia) {
                    throw new SlotUnavailableException('Slot ini baru saja diambil pasien lain. Silakan pilih waktu lain.');
                }

                // Periksa apakah sudah ada janji aktif pada slot ini
                $activeAppointmentExists = Appointment::query()
                    ->where('slot_id', $slotId)
                    ->whereIn('status', ['aktif', 'perubahan_diusulkan'])
                    ->lockForUpdate()
                    ->exists();

                if ($activeAppointmentExists) {
                    throw new SlotUnavailableException('Slot ini baru saja diambil pasien lain. Silakan pilih waktu lain.');
                }

                // Periksa apakah slot ini sedang ditahan oleh usulan perubahan (reschedule pending)
                $pendingProposalExists = DB::table('usulan_perubahan')
                    ->where('slot_baru_id', $slotId)
                    ->where('status', 'menunggu_tanggapan')
                    ->where('ttl_kunci_slot', '>', WibClock::now())
                    ->exists();

                if ($pendingProposalExists) {
                    throw new SlotUnavailableException('Slot ini sedang ditahan untuk usulan jadwal pasien lain. Silakan pilih waktu lain.');
                }

                // Periksa apakah slot adalah tanggal lampau
                $slotDate = Carbon::parse($slot->tanggal);
                if ($slotDate->isBefore(Carbon::parse(WibClock::today()))) {
                    throw new SlotUnavailableException('Tidak dapat memesan slot praktik pada tanggal yang sudah terlewat.');
                }

                // Tandai slot sebagai tidak tersedia
                $slot->tersedia = false;
                $slot->save();

                // Buat janji temu baru
                return Appointment::create([
                    'pasien_id' => $patient->id,
                    'dokter_id' => $slot->dokter_id,
                    'slot_id' => $slot->id,
                    'status' => 'aktif',
                    'keluhan' => $complaint ? trim($complaint) : null,
                ]);
            });
        } catch (UniqueConstraintViolationException $e) {
            // Tertangkap oleh PostgreSQL partial unique index janji_slot_aktif_unique_idx
            throw new SlotUnavailableException('Slot ini baru saja diambil pasien lain. Silakan pilih waktu lain.', 409, $e);
        }
    }

    /**
     * Membatalkan janji temu pasien.
     */
    public function cancelAppointment(User $actor, Appointment $appointment, string $reason): Appointment
    {
        if ($appointment->status !== 'aktif') {
            throw ValidationException::withMessages([
                'status' => 'Janji temu dengan status '.$appointment->status.' tidak dapat dibatalkan.',
            ]);
        }

        if ($actor->isPatient()) {
            // Pembatalan mandiri oleh pasien
            return DB::transaction(function () use ($actor, $appointment, $reason) {
                $appointment->update([
                    'status' => 'dibatalkan',
                    'alasan_batal' => $reason,
                    'dibatalkan_oleh' => $actor->id,
                ]);

                if ($appointment->slot) {
                    $appointment->slot->update(['tersedia' => true]);
                }

                return $appointment;
            });
        }

        // Pembatalan oleh admin wajib menggunakan AuditService
        return $this->auditService->executeMutation(
            mutation: function () use ($actor, $appointment, $reason) {
                $appointment->update([
                    'status' => 'dibatalkan',
                    'alasan_batal' => $reason,
                    'dibatalkan_oleh' => $actor->id,
                ]);

                if ($appointment->slot) {
                    $appointment->slot->update(['tersedia' => true]);
                }

                return $appointment;
            },
            aksi: 'BATAL_JANJI',
            objek: 'janji',
            objekId: $appointment->id,
            nilaiSebelum: ['status' => 'aktif', 'alasan_batal' => null],
            nilaiSesudah: ['status' => 'dibatalkan', 'alasan_batal' => $reason],
            alasan: $reason,
            actor: $actor
        );
    }
}
