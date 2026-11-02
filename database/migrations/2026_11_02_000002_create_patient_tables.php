<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Profil Pasien
        if (! Schema::hasTable('profil')) {
            Schema::create('profil', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id')->unique();
                $table->string('nik', 16)->nullable();
                $table->string('nomor_telepon', 20)->nullable();
                $table->date('tanggal_lahir')->nullable();
                $table->string('jenis_kelamin', 20)->nullable();
                $table->string('golongan_darah', 5)->nullable();
                $table->integer('tinggi_badan')->nullable();
                $table->integer('berat_badan')->nullable();
                $table->text('kondisi_kesehatan')->nullable();
                $table->text('riwayat_alergi')->nullable();
                $table->string('kontak_darurat_nama')->nullable();
                $table->string('kontak_darurat_telepon', 20)->nullable();
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->index('user_id');
            });
        }

        // 2. Aturan Kontrol
        if (! Schema::hasTable('aturan_kontrol')) {
            Schema::create('aturan_kontrol', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pasien_id');
                $table->uuid('dokter_id')->nullable();
                $table->integer('interval_hari');
                $table->date('tanggal_mulai');
                $table->integer('anchor_hari');
                $table->boolean('aktif')->default(true);
                $table->text('catatan')->nullable();
                $table->uuid('dibuat_oleh');
                $table->timestamps();

                $table->foreign('pasien_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('dokter_id')->references('id')->on('dokter')->onDelete('set null');
                $table->foreign('dibuat_oleh')->references('id')->on('users')->onDelete('restrict');
                $table->index('pasien_id');
            });
        }

        // 3. Jadwal Kontrol
        if (! Schema::hasTable('jadwal_kontrol')) {
            Schema::create('jadwal_kontrol', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pasien_id');
                $table->uuid('aturan_kontrol_id')->nullable();
                $table->uuid('dokter_id')->nullable();
                $table->date('tanggal_rencana');
                $table->string('status', 50)->default('terjadwal');
                $table->uuid('janji_id')->nullable();
                $table->text('catatan')->nullable();
                $table->timestamps();

                $table->foreign('pasien_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('aturan_kontrol_id')->references('id')->on('aturan_kontrol')->onDelete('set null');
                $table->foreign('dokter_id')->references('id')->on('dokter')->onDelete('set null');
                $table->foreign('janji_id')->references('id')->on('janji')->onDelete('set null');

                $table->index('pasien_id');
                $table->index('tanggal_rencana');
                $table->index('status');
            });
        }

        // 4. Tiket Antrian
        if (! Schema::hasTable('tiket_antrian')) {
            Schema::create('tiket_antrian', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('janji_id')->unique();
                $table->uuid('pasien_id');
                $table->date('tanggal');
                $table->integer('nomor_antrian_final')->nullable();
                $table->string('status', 50)->default('belum_check_in');
                $table->timestamp('waktu_check_in')->nullable();
                $table->timestamp('waktu_panggil')->nullable();
                $table->timestamp('waktu_selesai')->nullable();
                $table->text('alasan_koreksi')->nullable();
                $table->timestamps();

                $table->foreign('janji_id')->references('id')->on('janji')->onDelete('cascade');
                $table->foreign('pasien_id')->references('id')->on('users')->onDelete('cascade');

                $table->index('pasien_id');
                $table->index('tanggal');
                $table->index('status');
            });

            $driver = DB::getDriverName();
            if ($driver === 'pgsql') {
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS tiket_antrian_tanggal_nomor_final_unique_idx ON tiket_antrian (tanggal, nomor_antrian_final) WHERE nomor_antrian_final IS NOT NULL;');
            }
        }

        // 5. Catatan Kebiasaan (FB-5 Wajib)
        if (! Schema::hasTable('catatan_kebiasaan')) {
            Schema::create('catatan_kebiasaan', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pasien_id');
                $table->date('tanggal');
                $table->integer('hidrasi_ml')->nullable();
                $table->integer('jam_tidur')->nullable();
                $table->integer('aktivitas_menit')->nullable();
                $table->text('catatan')->nullable();
                $table->timestamps();

                $table->foreign('pasien_id')->references('id')->on('users')->onDelete('cascade');
                $table->unique(['pasien_id', 'tanggal'], 'catatan_kebiasaan_pasien_tanggal_unique');
                $table->index('pasien_id');
                $table->index('tanggal');
            });
        }

        // 6. Resep Klinis (Admin/Dokter)
        if (! Schema::hasTable('resep')) {
            Schema::create('resep', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pasien_id');
                $table->uuid('janji_id')->nullable();
                $table->uuid('dokter_id')->nullable();
                $table->string('nomor_resep', 100)->nullable();
                $table->text('diagnosis')->nullable();
                $table->text('catatan')->nullable();
                $table->uuid('dibuat_oleh');
                $table->date('tanggal_resep');
                $table->timestamps();

                $table->foreign('pasien_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('janji_id')->references('id')->on('janji')->onDelete('set null');
                $table->foreign('dokter_id')->references('id')->on('dokter')->onDelete('set null');
                $table->foreign('dibuat_oleh')->references('id')->on('users')->onDelete('restrict');

                $table->index('pasien_id');
                $table->index('tanggal_resep');
            });
        }

        // 7. Obat Resep
        if (! Schema::hasTable('obat')) {
            Schema::create('obat', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('resep_id');
                $table->string('nama_obat');
                $table->string('dosis', 100);
                $table->string('aturan_pakai', 100);
                $table->integer('frekuensi_per_hari')->default(1);
                $table->date('tanggal_mulai');
                $table->date('tanggal_selesai');
                $table->string('rujukan_fornas')->nullable();
                $table->text('keterangan')->nullable();
                $table->boolean('aktif')->default(true);
                $table->timestamps();

                $table->foreign('resep_id')->references('id')->on('resep')->onDelete('cascade');
                $table->index('resep_id');
                $table->index('aktif');
            });
        }

        // 8. Catatan Minum Obat Harian
        if (! Schema::hasTable('catatan_minum_obat')) {
            Schema::create('catatan_minum_obat', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pasien_id');
                $table->uuid('obat_id');
                $table->date('tanggal');
                $table->string('status', 50)->default('sudah');
                $table->timestamp('waktu_minum')->nullable();
                $table->text('catatan')->nullable();
                $table->timestamps();

                $table->foreign('pasien_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('obat_id')->references('id')->on('obat')->onDelete('cascade');

                $table->unique(['pasien_id', 'obat_id', 'tanggal'], 'catatan_minum_obat_unique_idx');
                $table->index(['pasien_id', 'tanggal']);
            });
        }

        // 9. Katalog Obat FORNAS
        if (! Schema::hasTable('katalog_obat_fornas')) {
            Schema::create('katalog_obat_fornas', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('nama_indonesia');
                $table->string('nama_internasional')->nullable();
                $table->string('kode_resmi', 100)->nullable();
                $table->string('sumber', 100)->default('fornas');
                $table->text('sumber_url');
                $table->string('versi_snapshot', 100)->nullable();
                $table->date('tanggal_snapshot');
                $table->string('cakupan_snapshot', 50);
                $table->boolean('aktif')->default(true);
                $table->timestamps();

                $table->unique(['sumber', 'tanggal_snapshot', 'nama_indonesia'], 'katalog_obat_fornas_snapshot_nama_idx');
                $table->index('nama_indonesia');
                $table->index('kode_resmi');
            });
        }

        // 10. Obat Pasien (Laporan Mandiri Pasien - Terpisah dari Resep Klinis)
        if (! Schema::hasTable('obat_pasien')) {
            Schema::create('obat_pasien', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pasien_id');
                $table->uuid('katalog_obat_fornas_id')->nullable();
                $table->string('nama_obat');
                $table->string('nama_internasional')->nullable();
                $table->string('dosis_catatan', 100)->nullable();
                $table->string('frekuensi_catatan', 100)->nullable();
                $table->date('mulai_pada')->nullable();
                $table->date('selesai_pada')->nullable();
                $table->text('catatan')->nullable();
                $table->string('sumber', 50)->default('dilaporkan_pasien');
                $table->timestamps();

                $table->foreign('pasien_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('katalog_obat_fornas_id')->references('id')->on('katalog_obat_fornas')->onDelete('set null');

                $table->index('pasien_id');
                $table->index('katalog_obat_fornas_id');
            });
        }

        // 11. Login Attempts
        if (! Schema::hasTable('login_attempts')) {
            Schema::create('login_attempts', function (Blueprint $table) {
                $table->string('account_key', 64)->primary();
                $table->integer('failed_attempts')->default(0);
                $table->timestamp('window_started_at');
                $table->timestamp('locked_until')->nullable();
                $table->timestamp('updated_at')->useCurrent();

                $table->index('updated_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('login_attempts');
        Schema::dropIfExists('obat_pasien');
        Schema::dropIfExists('katalog_obat_fornas');
        Schema::dropIfExists('catatan_minum_obat');
        Schema::dropIfExists('obat');
        Schema::dropIfExists('resep');
        Schema::dropIfExists('catatan_kebiasaan');
        Schema::dropIfExists('tiket_antrian');
        Schema::dropIfExists('jadwal_kontrol');
        Schema::dropIfExists('aturan_kontrol');
        Schema::dropIfExists('profil');
    }
};
