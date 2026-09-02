<div class="space-y-8">
    @if($artworks->isEmpty())
        <div class="text-center py-12">
            <p class="text-stone-400">No artworks found matching your criteria.</p>
        </div>
    @else
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @foreach($artworks as $artwork)
                <div class="group">
                    <div class="relative overflow-hidden rounded-lg bg-stone-900 aspect-square mb-4">
                        @if($artwork->previewUrl)
                            <img src="{{ $artwork->previewUrl }}" alt="{{ $artwork->title }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                        @else
                            <div class="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center">
                                <svg class="w-12 h-12 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        @endif
                    </div>
                    <div class="space-y-2">
                        <h3 class="font-serif text-lg font-bold text-stone-100 group-hover:text-amber-500 transition-colors">{{ $artwork->title }}</h3>
                        @if($artwork->collection)
                            <p class="text-sm text-stone-400">{{ $artwork->collection->name }}</p>
                        @endif
                        <p class="text-sm text-stone-400">£{{ number_format($artwork->pricePence / 100, 2) }}</p>
                        <div class="pt-2">
                            @livewire('add-to-cart', ['artworkId' => $artwork->id], key($artwork->id))
                        </div>
                    </div>
                </div>
            @endforeach
        </div>

        <div class="pt-8">
            {{ $artworks->links() }}
        </div>
    @endif
</div>
