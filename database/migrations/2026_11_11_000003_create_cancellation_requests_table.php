<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('cancellation_requests')) {
            Schema::create('cancellation_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('appointment_id')->constrained('appointments')->restrictOnDelete();
                $table->foreignId('doctor_id')->constrained('doctors')->restrictOnDelete();
                $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
                $table->string('reason_category', 40);
                $table->text('reason');
                $table->string('status', 30)->default('diajukan');
                $table->uuid('batch_id')->nullable()->index();
                $table->text('admin_note')->nullable();
                $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('handled_at')->nullable();
                $table->timestamp('due_at');
                $table->timestamps();

                $table->index(['status', 'due_at']);
                $table->index(['doctor_id', 'status']);
            });
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE klinik.cancellation_requests DROP CONSTRAINT IF EXISTS cancellation_requests_status_check');
            DB::statement("
                ALTER TABLE klinik.cancellation_requests
                ADD CONSTRAINT cancellation_requests_status_check
                CHECK (status IN ('diajukan', 'disetujui', 'dijadwalkan_ulang', 'ditolak', 'ditarik', 'gugur', 'kedaluwarsa'))
            ");

            DB::statement('ALTER TABLE klinik.cancellation_requests DROP CONSTRAINT IF EXISTS cancellation_requests_reason_category_check');
            DB::statement("
                ALTER TABLE klinik.cancellation_requests
                ADD CONSTRAINT cancellation_requests_reason_category_check
                CHECK (reason_category IN ('cuti_mendadak', 'sakit', 'tugas_darurat', 'bentrok_jadwal', 'lainnya'))
            ");

            DB::statement("
                CREATE UNIQUE INDEX IF NOT EXISTS cancellation_requests_open_unique
                ON klinik.cancellation_requests (appointment_id)
                WHERE status = 'diajukan'
            ");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS klinik.cancellation_requests_open_unique');
        }

        Schema::dropIfExists('cancellation_requests');
    }
};
