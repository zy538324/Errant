<x-app-layout>
    <x-slot name="title">Portfolio - Errant-Arts</x-slot>

    <div class="content-shell py-12">
        <h1 class="font-serif text-3xl font-bold text-stone-100 mb-8">Portfolio</h1>
        <p class="text-stone-400 text-sm mb-12">Discover featured works and visual collections.</p>
        
        @if($collections->isNotEmpty())
            <div class="space-y-16">
                @foreach($collections as $collection)
                    <div>
                        <h2 class="font-serif text-2xl font-bold text-stone-100 mb-6">{{ $collection->name }}</h2>
                        @if($collection->description)
                            <p class="text-stone-400 mb-6">{{ $collection->description }}</p>
                        @endif
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            @forelse($collection->artworks as $artwork)
                                <div class="group">
                                    <div class="relative overflow-hidden rounded-lg bg-stone-900 aspect-square mb-3">
                                        @if($artwork->previewUrl)
                                            <img src="{{ $artwork->previewUrl }}" alt="{{ $artwork->title }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                                        @else
                                            <div class="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center">
                                                <svg class="w-8 h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        @endif
                                    </div>
                                    <h3 class="font-serif text-lg font-bold text-stone-100 group-hover:text-amber-500 transition-colors">{{ $artwork->title }}</h3>
                                </div>
                            @empty
                                <p class="text-stone-400 col-span-full">No artworks in this collection yet.</p>
                            @endforelse
                        </div>
                    </div>
                @endforeach
            </div>
        @else
            <div class="text-center py-12">
                <p class="text-stone-400">No collections available yet.</p>
            </div>
        @endif
    </div>
</x-app-layout>
