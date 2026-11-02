@props([
    'title' => null,
    'subtitle' => null,
])

<div {{ $attributes->merge(['class' => 'card']) }}>
    @if($title)
        <div style="margin-bottom: 1rem;">
            <h3>{{ $title }}</h3>
            @if($subtitle)
                <p class="text-muted text-small" style="margin-top: 0.25rem;">{{ $subtitle }}</p>
            @endif
        </div>
    @endif

    {{ $slot }}
</div>

