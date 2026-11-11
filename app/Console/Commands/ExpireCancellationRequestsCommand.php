<?php

namespace App\Console\Commands;

use App\Services\CancellationRequestService;
use Illuminate\Console\Command;

class ExpireCancellationRequestsCommand extends Command
{
    protected $signature = 'pengajuan:kedaluwarsa';

    protected $description = 'Tandai pengajuan pembatalan yang melewati jadwal sebagai kedaluwarsa dan kirim pengingat SLA admin';

    public function handle(CancellationRequestService $service): int
    {
        $expiredCount = $service->expireOverdueRequests();
        $slaNotifiedCount = $service->notifyOverdueSlaRequests();

        $this->info("Pengajuan kedaluwarsa diproses: {$expiredCount}. Pengingat SLA dikirim: {$slaNotifiedCount}.");

        return self::SUCCESS;
    }
}
