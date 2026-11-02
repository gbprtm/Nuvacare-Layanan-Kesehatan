@props([
    'title' => 'Belum Ada Data',
    'description' => 'Saat ini belum ada informasi yang dapat ditampilkan.',
    'actionLabel' => null,
    'actionUrl' => null,
])

<div {{ $attributes->merge(['class' => 'empty-state-box']) }}>
    <h3 style="margin-bottom: 0.5rem; color: var(--color-ink);">{{ $title }}</h3>
    <p class="text-muted" style="margin-bottom: 1.25rem; max-width: 440px; margin-left: auto; margin-right: auto;">
        {{ $description }}
    </p>

    @if($actionLabel && $actionUrl)
        <a href="{{ $actionUrl }}" class="btn btn-secondary">
            {{ $actionLabel }}
        </a>
    @endif
</div>

