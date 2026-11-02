<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\User;
use App\Support\WibClock;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Throwable;

class AuditService
{
    /**
     * Daftar kunci yang wajib disensor dari snapshot audit.
     */
    protected const SENSITIVE_KEYS = [
        'password',
        'password_hash',
        'password_confirmation',
        'token',
        'remember_token',
        'secret',
        'api_key',
        'kebiasaan',
        'profil_lengkap',
    ];

    /**
     * Eksekusi mutasi domain dan pencatatan audit log secara atomik dalam satu transaksi.
     *
     * @param  callable  $mutation  Callback mutasi bisnis
     * @param  string  $aksi  Nama aksi operasional (misal: 'DOKTER_TAMBAH', 'JANJI_BATAL')
     * @param  string  $objek  Nama entitas objek (misal: 'dokter', 'janji', 'slot')
     * @param  string|callable  $objekId  ID entitas atau callable($result): string
     * @param  array|callable|null  $nilaiSebelum  Snapshot sebelum mutasi atau callable(): ?array
     * @param  array|callable|null  $nilaiSesudah  Snapshot sesudah mutasi atau callable($result): ?array
     * @param  string|null  $alasan  Alasan operasional jika diwajibkan
     * @param  User|null  $actor  Aktor pengguna (default: user yang sedang terautentikasi)
     * @param  string|null  $ipAddress  Alamat IP (default: IP request aktif jika ada)
     * @return mixed Hasil dari callback mutasi bisnis
     *
     * @throws Throwable Jika mutasi atau pencatatan audit gagal
     */
    public function executeMutation(
        callable $mutation,
        string $aksi,
        string $objek,
        string|callable $objekId,
        array|callable|null $nilaiSebelum = null,
        array|callable|null $nilaiSesudah = null,
        ?string $alasan = null,
        ?User $actor = null,
        ?string $ipAddress = null,
    ): mixed {
        if (trim($aksi) === '') {
            throw new InvalidArgumentException('Parameter aksi audit tidak boleh kosong.');
        }

        if (trim($objek) === '') {
            throw new InvalidArgumentException('Parameter objek audit tidak boleh kosong.');
        }

        return DB::transaction(function () use (
            $mutation,
            $aksi,
            $objek,
            $objekId,
            $nilaiSebelum,
            $nilaiSesudah,
            $alasan,
            $actor,
            $ipAddress
        ) {
            // Evaluasi snapshot nilai sebelum sebelum mutasi berjalan (jika callable)
            $sebelumData = is_callable($nilaiSebelum) ? $nilaiSebelum() : $nilaiSebelum;

            // Jalankan mutasi bisnis domain
            $result = $mutation();

            // Evaluasi ID objek setelah mutasi
            $resolvedObjekId = is_callable($objekId) ? (string) $objekId($result) : (string) $objekId;

            if (trim($resolvedObjekId) === '') {
                throw new InvalidArgumentException('Parameter objek_id audit tidak boleh kosong.');
            }

            // Evaluasi snapshot nilai sesudah mutasi
            $sesudahData = is_callable($nilaiSesudah) ? $nilaiSesudah($result) : $nilaiSesudah;

            // Tentukan aktor
            $resolvedActor = $actor ?? Auth::user();
            $resolvedIp = $ipAddress ?? (request()?->ip());

            // Bersihkan data rahasia dari snapshot
            $cleanSebelum = $sebelumData !== null ? $this->sanitizePayload($sebelumData) : null;
            $cleanSesudah = $sesudahData !== null ? $this->sanitizePayload($sesudahData) : null;

            // Catat tepat satu entri audit log
            AuditLog::create([
                'user_id' => $resolvedActor?->id,
                'aksi' => $aksi,
                'objek' => $objek,
                'objek_id' => $resolvedObjekId,
                'nilai_sebelum' => $cleanSebelum,
                'nilai_sesudah' => $cleanSesudah,
                'alasan' => $alasan,
                'ip_address' => $resolvedIp,
                'created_at' => WibClock::now(),
            ]);

            return $result;
        });
    }

    /**
     * Sanitasi array payload secara rekursif untuk mencegah bocornya data rahasia ke audit log.
     */
    public function sanitizePayload(array $payload): array
    {
        $sanitized = [];

        foreach ($payload as $key => $value) {
            $normalizedKey = strtolower((string) $key);

            if (in_array($normalizedKey, self::SENSITIVE_KEYS, true)) {
                $sanitized[$key] = '[REDACTED]';

                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizePayload($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }
}
