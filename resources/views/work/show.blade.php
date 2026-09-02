<x-app-layout>
    <x-slot name="title">{{ $artwork->title }} - Errant Arts</x-slot>

    <div class="content-shell py-16">
        <div class="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div class="overflow-hidden rounded-2xl border border-white/10 bg-panel-elevated">
                @if ($artwork->previewUrl)
                    <img src="{{ $artwork->previewUrl }}" alt="{{ $artwork->title }}" class="w-full h-auto object-contain">
                @else
                    <div class="aspect-square flex items-center justify-center text-stone-600">No preview available</div>
                @endif
            </div>

            <div>
                @if ($artwork->collection)
                    <a href="{{ route('collections.show', $artwork->collection->slug) }}" class="eyebrow hover:text-accent">{{ $artwork->collection->name }}</a>
                @elseif ($artwork->category)
                    <div class="eyebrow">{{ $artwork->category }}</div>
                @endif

                <h1 class="mt-3 font-serif text-4xl text-stone-50">{{ $artwork->title }}</h1>

                <p class="mt-4 text-2xl font-semibold text-accent">£{{ number_format($artwork->pricePence / 100, 2) }}</p>

                @if ($artwork->description)
                    <p class="mt-6 text-lg leading-8 text-stone-300">{{ $artwork->description }}</p>
                @endif

                @if ($artwork->stockOnHand !== null && $artwork->stockOnHand <= 0)
                    <p class="mt-6 text-sm font-semibold text-red-400">Sold out</p>
                @else
                    <div class="mt-8">
                        @livewire('add-to-cart', ['artworkId' => $artwork->id])
                    </div>
                @endif

                <p class="mt-6 text-xs text-stone-500">
                    Purchasing a digital download grants a personal-use licence only. See the
                    <a href="{{ url('/digital-download-licence') }}" class="underline hover:text-accent">Digital Download Licence Agreement</a>.
                </p>
            </div>
        </div>

        @if ($related->isNotEmpty())
            <div class="mt-20">
                <h2 class="font-serif text-2xl text-stone-50 mb-6">You might also like</h2>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    @foreach ($related as $item)
                        <x-artwork-card :artwork="$item" />
                    @endforeach
                </div>
            </div>
        @endif
    </div>
</x-app-layout>
