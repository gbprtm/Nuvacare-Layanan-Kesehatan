<?php

namespace App\Services;

use App\Models\StatusChangeLog;
use App\Models\User;

class StatusChangeLogger
{
    public function log(
        string $subjectType,
        int $subjectId,
        ?User $actor,
        ?string $fromStatus,
        string $toStatus,
        ?string $reason = null,
        ?array $changes = null,
        ?string $actorRoleOverride = null,
    ): StatusChangeLog {
        $actorRole = $actorRoleOverride !== null && $actorRoleOverride !== ''
            ? $actorRoleOverride
            : ($actor?->role ?? 'system');

        return StatusChangeLog::create([
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'actor_user_id' => $actor?->id,
            'actor_role' => $actorRole,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'changes' => $changes,
            'reason' => $reason,
            'created_at' => now(),
        ]);
    }
}
