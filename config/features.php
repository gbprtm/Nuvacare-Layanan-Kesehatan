<?php

return [
    'doctor_portal' => filter_var(env('FEATURE_DOCTOR_PORTAL', true), FILTER_VALIDATE_BOOL),
];
