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
        // 1. Dokter
        if (! Schema::hasTable('dokter')) {
            Schema::create('dokter', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('nama');
                $table->string('spesialisasi');
                $table->string('nomor_izin', 100)->nullable();
                $table->boolean('aktif')->default(true);
                $table->timestamps();

                $table->index('aktif');
            });
        }

        // 2. Slot
        if (! Schema::hasTable('slot')) {
            Schema::create('slot', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('dokter_id');
                $table->date('tanggal');
                $table->string('jam_mulai', 10);
                $table->string('jam_selesai', 10);
                $table->integer('kuota')->default(1);
                $table->boolean('tersedia')->default(true);
                $table->timestamp('dikunci_sampai')->nullable();
                $table->timestamps();

                $table->foreign('dokter_id')->references('id')->on('dokter')->onDelete('cascade');
                $table->index(['dokter_id', 'tanggal']);
                $table->index('tersedia');
            });
        }

        // 3. Janji
        if (! Schema::hasTable('janji')) {
            Schema::create('janji', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pasien_id');
                $table->uuid('dokter_id');
                $table->uuid('slot_id');
                $table->string('status', 50)->default('aktif');
                $table->text('keluhan')->nullable();
                $table->text('catatan')->nullable();
                $table->text('alasan_batal')->nullable();
                $table->uuid('dibatalkan_oleh')->nullable();
                $table->timestamps();

                $table->foreign('pasien_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('dokter_id')->references('id')->on('dokter')->onDelete('restrict');
                $table->foreign('slot_id')->references('id')->on('slot')->onDelete('restrict');
                $table->foreign('dibatalkan_oleh')->references('id')->on('users')->onDelete('set null');

                $table->index('pasien_id');
                $table->index('dokter_id');
                $table->index('status');
            });

            // Partial unique index untuk PostgreSQL:
            // Hanya satu janji berstatus 'aktif' atau 'perubahan_diusulkan' per slot_id
            $driver = DB::getDriverName();
            if ($driver === 'pgsql') {
                DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS janji_slot_aktif_unique_idx ON janji (slot_id) WHERE status IN ('aktif', 'perubahan_diusulkan');");
            }
        }

        // 4. Usulan Perubahan (Reschedule)
        if (! Schema::hasTable('usulan_perubahan')) {
            Schema::create('usulan_perubahan', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('janji_id');
                $table->uuid('slot_baru_id');
                $table->text('alasan');
                $table->string('status', 50)->default('menunggu_tanggapan');
                $table->timestamp('batas_waktu_jawab');
                $table->timestamp('ttl_kunci_slot');
                $table->uuid('dibuat_oleh');
                $table->timestamps();

                $table->foreign('janji_id')->references('id')->on('janji')->onDelete('cascade');
                $table->foreign('slot_baru_id')->references('id')->on('slot')->onDelete('restrict');
                $table->foreign('dibuat_oleh')->references('id')->on('users')->onDelete('restrict');

                $table->index('janji_id');
                $table->index('status');
            });

            // Partial unique index: Slot baru yang diusulkan tidak boleh memiliki lebih dari satu usulan aktif (menunggu_tanggapan)
            $driver = DB::getDriverName();
            if ($driver === 'pgsql') {
                DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS usulan_slot_baru_pending_unique_idx ON usulan_perubahan (slot_baru_id) WHERE status = 'menunggu_tanggapan';");
            }
        }

        // 5. Notifikasi (append-only, tanpa updated_at)
        if (! Schema::hasTable('notifikasi')) {
            Schema::create('notifikasi', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id');
                $table->string('judul');
                $table->text('pesan');
                $table->string('tipe', 50)->default('sistem');
                $table->boolean('dibaca')->default(false);
                $table->json('data_terkait')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->index(['user_id', 'dibaca']);
                $table->index('created_at');
            });
        }

        // 6. Audit Log (append-only, tanpa updated_at)
        if (! Schema::hasTable('audit_log')) {
            Schema::create('audit_log', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id')->nullable();
                $table->string('aksi', 100);
                $table->string('objek', 100);
                $table->string('objek_id', 100);
                $table->json('nilai_sebelum')->nullable();
                $table->json('nilai_sesudah')->nullable();
                $table->text('alasan')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
                $table->index(['objek', 'objek_id']);
                $table->index('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_log');
        Schema::dropIfExists('notifikasi');
        Schema::dropIfExists('usulan_perubahan');
        Schema::dropIfExists('janji');
        Schema::dropIfExists('slot');
        Schema::dropIfExists('dokter');
    }
};
