@props([
    'artwork',
])

<a href="{{ route('work.show', $artwork->slug) }}" class="panel-surface rounded-lg overflow-hidden group block">
    <div class="aspect-[4/3] overflow-hidden bg-panel-elevated">
        @if($artwork->previewUrl)
            <img src="{{ $artwork->previewUrl }}" alt="{{ $artwork->title }}" class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300">
        @else
            <div class="flex h-full w-full items-center justify-center text-xs text-stone-600">{{ $artwork->title }}</div>
        @endif
    </div>
    <div class="p-4">
        <h3 class="font-serif text-lg font-medium text-stone-100">{{ $artwork->title }}</h3>
        @if($artwork->category)
            <p class="text-xs text-stone-400 mt-1">{{ $artwork->category }}</p>
        @endif
        <div class="mt-4 flex items-center justify-between">
            <span class="text-sm font-semibold text-accent">£{{ number_format($artwork->pricePence / 100, 2) }}</span>
            <span class="text-xs uppercase tracking-wide text-stone-400 group-hover:text-accent">View &rarr;</span>
        </div>
    </div>
</a>
