@props([
    'artwork',
])

<div class="panel-surface rounded-lg overflow-hidden group">
    @if($artwork->previewUrl)
        <div class="aspect-w-4 aspect-h-3 overflow-hidden bg-stone-900">
            <img src="{{ $artwork->previewUrl }}" alt="{{ $artwork->title }}" class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300">
        </div>
    @endif
    <div class="p-4">
        <h3 class="font-serif text-lg font-medium text-stone-100">{{ $artwork->title }}</h3>
        @if($artwork->category)
            <p class="text-xs text-stone-400 mt-1">{{ $artwork->category }}</p>
        @endif
        <div class="mt-4 flex items-center justify-between">
            <span class="text-sm font-semibold text-amber-500">£{{ number_format($artwork->pricePence / 100, 2) }}</span>
            <x-button variant="primary" class="text-xs">View</x-button>
        </div>
    </div>
</div>
