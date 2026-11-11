<?php

return [
    'mode' => env('APP_SURFACE', 'combined') ?: 'combined',
    'pasien_url' => env('PASIEN_APP_URL', 'https://nuvacare.id'),
    'staf_url' => env('STAF_APP_URL', 'https://staf.nuvacare.id'),
    'allowed_staff_ips' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('STAFF_ALLOWED_IPS', '')),
    ))),
];
