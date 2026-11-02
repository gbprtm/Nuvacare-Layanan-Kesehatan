<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Log Aktivitas Pasien (Opsional L17)
        if (! Schema::hasTable('log_aktivitas')) {
            Schema::create('log_aktivitas', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id');
                $table->string('jenis_aksi', 100);
                $table->string('objek', 100);
                $table->string('objek_id', 100)->nullable();
                $table->text('keterangan');
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->index('user_id');
                $table->index('created_at');
            });
        }

        // 2. Konten Edukasi Statis (Opsional L17)
        if (! Schema::hasTable('konten_statis')) {
            Schema::create('konten_statis', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('slug', 150)->unique();
                $table->string('judul');
                $table->text('ringkasan');
                $table->text('isi');
                $table->string('kategori', 100);
                $table->string('kondisi_terkait', 100)->nullable();
                $table->string('url_sumber', 500);
                $table->date('tanggal_pengambilan');
                $table->boolean('aktif')->default(true);
                $table->timestamps();

                $table->index('kategori');
                $table->index('kondisi_terkait');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('konten_statis');
        Schema::dropIfExists('log_aktivitas');
    }
};
