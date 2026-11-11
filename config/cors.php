<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => (static function (): array {
        $explicitOrigins = array_values(array_filter(array_map(
            static fn (string $origin): string => rtrim(trim($origin), '/'),
            explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
        )));

        if ($explicitOrigins !== []) {
            return $explicitOrigins;
        }

        $surface = env('APP_SURFACE', 'combined') ?: 'combined';
        $pasienUrl = rtrim((string) env('PASIEN_APP_URL', 'https://nuvacare.id'), '/');
        $stafUrl = rtrim((string) env('STAF_APP_URL', 'https://staf.nuvacare.id'), '/');

        $origins = match ($surface) {
            'pasien' => [$pasienUrl],
            'staf' => [$stafUrl],
            default => [$pasienUrl, $stafUrl],
        };

        if (in_array(env('APP_ENV', 'production'), ['local', 'testing'], true)) {
            $origins = array_merge($origins, [
                'http://localhost:3000',
                'http://127.0.0.1:8000',
                'http://localhost:8000',
            ]);
        }

        return array_values(array_unique(array_filter($origins)));
    })(),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
