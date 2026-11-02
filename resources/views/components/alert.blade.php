@props([
    'type' => 'info', // success, danger, warning, info
    'message' => null,
])

@php
    $typeClasses = [
        'success' => 'alert alert-success',
        'danger' => 'alert alert-danger',
        'warning' => 'alert alert-warning',
        'info' => 'alert alert-info',
    ];

    $class = $typeClasses[$type] ?? 'alert alert-info';
@endphp

<div {{ $attributes->merge(['class' => $class, 'role' => 'alert']) }}>
    <div>
        @if($message)
            {{ $message }}
        @else
            {{ $slot }}
        @endif
    </div>
</div>

