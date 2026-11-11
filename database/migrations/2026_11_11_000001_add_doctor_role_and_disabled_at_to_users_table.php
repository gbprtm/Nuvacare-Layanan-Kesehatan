<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'disabled_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('disabled_at')->nullable()->after('role');
            });
        }

        if (DB::getDriverName() === 'pgsql') {
            $this->dropRoleCheckConstraints();
            DB::statement("ALTER TABLE klinik.users ADD CONSTRAINT users_role_check CHECK (role IN ('pasien', 'admin', 'dokter'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql' && ! DB::table('users')->where('role', 'dokter')->exists()) {
            $this->dropRoleCheckConstraints();
            DB::statement("ALTER TABLE klinik.users ADD CONSTRAINT users_role_check CHECK (role IN ('pasien', 'admin'))");
        }

        if (Schema::hasColumn('users', 'disabled_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('disabled_at');
            });
        }
    }

    private function dropRoleCheckConstraints(): void
    {
        $constraints = DB::select("
            SELECT DISTINCT c.conname
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
            WHERE n.nspname = 'klinik'
              AND t.relname = 'users'
              AND c.contype = 'c'
              AND a.attname = 'role'
        ");

        foreach ($constraints as $constraint) {
            $quotedName = '"'.str_replace('"', '""', $constraint->conname).'"';
            DB::statement("ALTER TABLE klinik.users DROP CONSTRAINT IF EXISTS {$quotedName}");
        }

        DB::statement('ALTER TABLE klinik.users DROP CONSTRAINT IF EXISTS users_role_check');
    }
};
