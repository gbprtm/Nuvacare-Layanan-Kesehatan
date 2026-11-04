<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('appointments', 'appointment_time')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->string('appointment_time', 5)->default('09:00')->after('appointment_date');
            });
        }

        // Ensure existing test rows have no active slot collisions before creating the unique index
        DB::statement("
            UPDATE klinik.appointments a
            SET status = 'dibatalkan'
            WHERE a.status = 'terjadwal'
              AND EXISTS (
                  SELECT 1
                  FROM klinik.appointments b
                  WHERE b.status = 'terjadwal'
                    AND b.doctor_id = a.doctor_id
                    AND b.appointment_date = a.appointment_date
                    AND b.appointment_time = a.appointment_time
                    AND b.id > a.id
              )
        ");

        DB::statement("
            CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_slot_unique
            ON klinik.appointments (doctor_id, appointment_date, appointment_time)
            WHERE status = 'terjadwal'
        ");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS klinik.appointments_active_slot_unique');

        if (Schema::hasColumn('appointments', 'appointment_time')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->dropColumn('appointment_time');
            });
        }
    }
};
