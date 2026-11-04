<?php

// Prepare /tmp storage and cache for Vercel serverless environment
$storagePath = '/tmp/storage';
$cachePath = '/tmp/cache';

$dirs = [
    $storagePath,
    $cachePath,
    $storagePath.'/framework',
    $storagePath.'/framework/views',
    $storagePath.'/framework/cache',
    $storagePath.'/framework/cache/data',
    $storagePath.'/framework/sessions',
    $storagePath.'/logs',
];

foreach ($dirs as $dir) {
    if (! is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

putenv('LARAVEL_STORAGE_PATH='.$storagePath);
$_ENV['LARAVEL_STORAGE_PATH'] = $storagePath;

putenv('APP_SERVICES_CACHE='.$cachePath.'/services.php');
$_ENV['APP_SERVICES_CACHE'] = $cachePath.'/services.php';

putenv('APP_PACKAGES_CACHE='.$cachePath.'/packages.php');
$_ENV['APP_PACKAGES_CACHE'] = $cachePath.'/packages.php';

putenv('APP_CONFIG_CACHE='.$cachePath.'/config.php');
$_ENV['APP_CONFIG_CACHE'] = $cachePath.'/config.php';

putenv('APP_ROUTES_CACHE='.$cachePath.'/routes.php');
$_ENV['APP_ROUTES_CACHE'] = $cachePath.'/routes.php';

putenv('APP_EVENTS_CACHE='.$cachePath.'/events.php');
$_ENV['APP_EVENTS_CACHE'] = $cachePath.'/events.php';

putenv('VIEW_COMPILED_PATH='.$storagePath.'/framework/views');
$_ENV['VIEW_COMPILED_PATH'] = $storagePath.'/framework/views';

// Route request to Laravel's public entry
try {
    require __DIR__.'/../public/index.php';
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'Serverless Bootstrap Error',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
    exit;
}
