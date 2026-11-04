<?php

// Forward Vercel requests to Laravel's entry point
// Prepare /tmp storage for Vercel serverless environment
$storagePath = '/tmp/storage';
$dirs = [
    '',
    '/framework',
    '/framework/views',
    '/framework/cache',
    '/framework/cache/data',
    '/framework/sessions',
    '/logs',
];

foreach ($dirs as $dir) {
    if (! is_dir($storagePath.$dir)) {
        @mkdir($storagePath.$dir, 0755, true);
    }
}

putenv('LARAVEL_STORAGE_PATH='.$storagePath);
$_ENV['LARAVEL_STORAGE_PATH'] = $storagePath;

// Route request to Laravel's public entry
require __DIR__.'/../public/index.php';
