<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('doctor_slot_requests')) {
            Schema::create('doctor_slot_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
                $table->date('schedule_date');
                $table->time('start_time');
                $table->time('end_time');
                $table->integer('quota');
                $table->text('reason');
                $table->string('status', 30)->default('diajukan');
                $table->text('admin_note')->nullable();
                $table->timestamps();

                $table->index(['doctor_id', 'status']);
                $table->index(['schedule_date', 'status']);
            });
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE klinik.doctor_slot_requests DROP CONSTRAINT IF EXISTS doctor_slot_requests_status_check');
            DB::statement("
                ALTER TABLE klinik.doctor_slot_requests
                ADD CONSTRAINT doctor_slot_requests_status_check
                CHECK (status IN ('diajukan', 'disetujui', 'ditolak'))
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_slot_requests');
    }
};
