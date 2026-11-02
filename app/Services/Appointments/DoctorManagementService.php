<?php

namespace App\Services\Appointments;

use App\Exceptions\ActiveBookingsException;
use App\Models\Doctor;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Support\Str;

class DoctorManagementService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Membuat data dokter baru dengan pencatatan audit log atomik.
     */
    public function createDoctor(User $admin, array $data): Doctor
    {
        $id = (string) Str::uuid();
        $nama = $data['nama'] ?? $data['name'];
        $spesialisasi = $data['spesialisasi'] ?? $data['specialty'];
        $nomorIzin = $data['nomor_izin'] ?? $data['license_number'] ?? null;
        $aktif = isset($data['aktif']) ? (bool) $data['aktif'] : (isset($data['active']) ? (bool) $data['active'] : true);

        return $this->auditService->executeMutation(
            mutation: function () use ($id, $nama, $spesialisasi, $nomorIzin, $aktif) {
                return Doctor::create([
                    'id' => $id,
                    'nama' => $nama,
                    'spesialisasi' => $spesialisasi,
                    'nomor_izin' => $nomorIzin,
                    'aktif' => $aktif,
                ]);
            },
            aksi: 'TAMBAH_DOKTER',
            objek: 'dokter',
            objekId: $id,
            nilaiSebelum: null,
            nilaiSesudah: fn (Doctor $doc) => [
                'nama' => $doc->nama,
                'spesialisasi' => $doc->spesialisasi,
                'nomor_izin' => $doc->nomor_izin,
                'aktif' => $doc->aktif,
            ],
            alasan: 'Penambahan data dokter baru ke sistem',
            actor: $admin
        );
    }

    /**
     * Memperbarui data dokter dengan pencatatan audit log atomik dan validasi janji aktif.
     *
     * @throws ActiveBookingsException
     */
    public function updateDoctor(User $admin, Doctor $doctor, array $data, string $reason): Doctor
    {
        $nilaiSebelum = [
            'nama' => $doctor->nama,
            'spesialisasi' => $doctor->spesialisasi,
            'nomor_izin' => $doctor->nomor_izin,
            'aktif' => $doctor->aktif,
        ];

        $targetAktif = null;
        if (array_key_exists('aktif', $data)) {
            $targetAktif = (bool) $data['aktif'];
        } elseif (array_key_exists('active', $data)) {
            $targetAktif = (bool) $data['active'];
        }

        // Jika akan menonaktifkan dokter, pastikan tidak ada janji aktif atau usulan perubahan
        if ($targetAktif === false && $doctor->aktif) {
            $hasActiveBookings = $doctor->appointments()
                ->whereIn('status', ['aktif', 'perubahan_diusulkan'])
                ->exists();

            if ($hasActiveBookings) {
                throw new ActiveBookingsException('Tidak dapat menonaktifkan dokter yang masih memiliki janji aktif atau usulan jadwal.');
            }
        }

        $nama = $data['nama'] ?? $data['name'] ?? $doctor->nama;
        $spesialisasi = $data['spesialisasi'] ?? $data['specialty'] ?? $doctor->spesialisasi;
        $nomorIzin = array_key_exists('nomor_izin', $data)
            ? $data['nomor_izin']
            : (array_key_exists('license_number', $data) ? $data['license_number'] : $doctor->nomor_izin);
        $aktif = $targetAktif !== null ? $targetAktif : $doctor->aktif;

        return $this->auditService->executeMutation(
            mutation: function () use ($doctor, $nama, $spesialisasi, $nomorIzin, $aktif) {
                $doctor->update([
                    'nama' => $nama,
                    'spesialisasi' => $spesialisasi,
                    'nomor_izin' => $nomorIzin,
                    'aktif' => $aktif,
                ]);

                return $doctor->fresh();
            },
            aksi: 'UBAH_DOKTER',
            objek: 'dokter',
            objekId: $doctor->id,
            nilaiSebelum: $nilaiSebelum,
            nilaiSesudah: fn (Doctor $doc) => [
                'nama' => $doc->nama,
                'spesialisasi' => $doc->spesialisasi,
                'nomor_izin' => $doc->nomor_izin,
                'aktif' => $doc->aktif,
            ],
            alasan: $reason,
            actor: $admin
        );
    }
}
