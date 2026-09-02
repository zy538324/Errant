<x-app-layout>
    <x-slot name="title">{{ $collection->name }} - Errant Arts</x-slot>

    <div class="content-shell py-16">
        <div class="eyebrow">Collection</div>
        <h1 class="mt-3 font-serif text-5xl text-stone-50">{{ $collection->name }}</h1>
        @if ($collection->description)
            <p class="mt-4 max-w-2xl text-lg leading-8 text-stone-300">{{ $collection->description }}</p>
        @endif

        <div class="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @forelse ($collection->artworks as $artwork)
                <x-artwork-card :artwork="$artwork" />
            @empty
                <p class="text-stone-400">No published artworks in this collection yet.</p>
            @endforelse
        </div>
    </div>
</x-app-layout>
