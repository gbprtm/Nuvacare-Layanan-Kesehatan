<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('status_change_logs')) {
            Schema::create('status_change_logs', function (Blueprint $table) {
                $table->id();
                $table->string('subject_type', 40);
                $table->unsignedBigInteger('subject_id');
                $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('actor_role', 30)->nullable();
                $table->string('from_status', 30)->nullable();
                $table->string('to_status', 30);
                $table->json('changes')->nullable();
                $table->text('reason')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['subject_type', 'subject_id', 'created_at'], 'status_change_logs_subject_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('status_change_logs');
    }
};
