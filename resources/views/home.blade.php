<x-app-layout>
    <x-slot name="title">Errant Arts - Fine Art &amp; Sports Photography</x-slot>

    <section class="relative overflow-hidden border-b border-white/10 bg-panel">
        <div class="content-shell py-20 lg:py-28 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
                <div class="eyebrow">Errant Arts</div>
                <h1 class="mt-4 font-serif text-4xl lg:text-6xl text-stone-50 leading-tight">Fine Art &amp; Sports Photography</h1>
                <p class="mt-6 max-w-xl text-lg leading-8 text-stone-300">
                    Original photography for people who want striking artwork from real places, real moments,
                    and live sport. Buy selected images as licensed digital downloads, ready to enjoy after checkout.
                </p>
                <div class="mt-8 flex flex-wrap gap-4">
                    <a href="{{ url('/shop') }}" class="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-black hover:bg-accent-strong">
                        Shop digital downloads
                    </a>
                    <a href="{{ url('/portfolio') }}" class="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-stone-100 hover:bg-white/5">
                        View portfolio
                    </a>
                </div>
            </div>
            <div class="flex justify-center">
                <img src="{{ asset('logo-black-and-white.png') }}" alt="Errant Arts" class="max-h-72 w-auto opacity-90">
            </div>
        </div>
    </section>

    <section class="content-shell py-16">
        <h2 class="font-serif text-3xl text-stone-50 mb-8">Recent Works</h2>

        @if ($recentWorks->isEmpty())
            <p class="text-stone-400">New work is on its way — check back soon.</p>
        @else
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                @foreach ($recentWorks as $artwork)
                    <a href="{{ route('work.show', $artwork->slug) }}" class="group block overflow-hidden rounded-lg bg-panel-elevated aspect-square">
                        @if ($artwork->previewUrl)
                            <img src="{{ $artwork->previewUrl }}" alt="{{ $artwork->title }}" class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300">
                        @else
                            <div class="flex h-full w-full items-center justify-center text-stone-600 text-xs">{{ $artwork->title }}</div>
                        @endif
                    </a>
                @endforeach
            </div>
        @endif
    </section>
</x-app-layout>
