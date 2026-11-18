<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('doctors', 'available_dates')) {
            Schema::table('doctors', function (Blueprint $table) {
                $table->json('available_dates')->nullable()->after('is_active');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('doctors', 'available_dates')) {
            Schema::table('doctors', function (Blueprint $table) {
                $table->dropColumn('available_dates');
            });
        }
    }
};
