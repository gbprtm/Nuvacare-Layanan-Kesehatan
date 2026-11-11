<?php

return [
    'cancellation_deadline_hours' => (int) env('CANCELLATION_DEADLINE_HOURS', 2),
    'sla_max_hours' => 24,
    'sla_min_before_appointment_hours' => 1,
    'batch_max_days' => 14,
];
