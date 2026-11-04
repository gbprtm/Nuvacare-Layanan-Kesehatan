<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'google_id')) {
                $table->string('google_id')->nullable()->unique()->after('email');
            }

            if (! Schema::hasColumn('users', 'phone_verified_at')) {
                $table->timestamp('phone_verified_at')->nullable()->after('phone_number');
            }
        });

        DB::table('users')
            ->whereNotNull('phone_number')
            ->where('phone_number', '!=', '')
            ->whereNull('phone_verified_at')
            ->update(['phone_verified_at' => now()]);

        if (! Schema::hasTable('whatsapp_otps')) {
            Schema::create('whatsapp_otps', function (Blueprint $table) {
                $table->id();
                $table->string('phone_number', 30)->index();
                $table->string('purpose', 30)->index();
                $table->string('code_hash');
                $table->jsonb('payload')->nullable();
                $table->unsignedSmallInteger('attempts')->default(0);
                $table->timestamp('expires_at');
                $table->timestamp('last_sent_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_otps');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'phone_verified_at')) {
                $table->dropColumn('phone_verified_at');
            }

            if (Schema::hasColumn('users', 'google_id')) {
                $table->dropUnique(['google_id']);
                $table->dropColumn('google_id');
            }
        });
    }
};
