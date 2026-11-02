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
        // 1. Users (RANCANGAN FINAL §3.1)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['pasien', 'admin'])->default('pasien');
            $table->string('phone_number', 30)->nullable();
            $table->date('birth_date')->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
        });

        // 2. Polyclinics (RANCANGAN FINAL §3.2)
        Schema::create('polyclinics', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 3. Doctors (RANCANGAN FINAL §3.3)
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('polyclinic_id')->constrained('polyclinics')->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. Appointments (RANCANGAN FINAL §3.4)
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('polyclinic_id')->constrained('polyclinics')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->date('appointment_date');
            $table->enum('type', ['janji_baru', 'kontrol_rutin'])->default('janji_baru');
            $table->enum('status', ['terjadwal', 'selesai', 'dibatalkan'])->default('terjadwal');
            $table->text('complaint')->nullable();
            $table->text('doctor_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('doctors');
        Schema::dropIfExists('polyclinics');
        Schema::dropIfExists('users');
    }
};
