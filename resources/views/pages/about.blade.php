<x-app-layout>
    <x-slot name="title">About - Errant Arts</x-slot>

    <div class="content-shell mx-auto max-w-5xl px-6 py-16 text-stone-300">
        <div class="eyebrow">About</div>
        <h1 class="mt-3 font-serif text-5xl text-stone-50">A note from behind the lens.</h1>

        <div class="mt-8 space-y-6 max-w-3xl">
            <p class="text-lg leading-8 font-medium text-stone-200">
                Errant Arts is a personal photography practice shaped by place, light, and story.
            </p>

            <h3 class="font-serif text-2xl text-stone-50 mt-8 mb-2">Using art to share my passions with the world</h3>
            <p class="text-lg leading-8">
                Errant Arts is about atmospheric landscapes, sacred architecture, and quiet images presented
                with the same care they receive behind the camera.
            </p>

            <h3 class="font-serif text-2xl text-stone-50 mt-8 mb-2">How each collection is built</h3>
            <p class="text-lg leading-8">
                Collections are edited slowly and deliberately, with each image chosen to carry mood, memory,
                and a sense of place.
            </p>
        </div>

        <section class="mt-12 max-w-3xl border-t border-white/10 pt-10">
            <p class="pt-4 text-5xl" style="font-family: 'Great Vibes', cursive; color: var(--brand-accent); transform: rotate(-6deg) skewX(-8deg); display: inline-block;">
                Sean
            </p>
        </section>

        <div class="mt-12">
            <a href="{{ url('/shop') }}" class="inline-block bg-accent hover:bg-accent-strong text-black font-semibold px-8 py-3 rounded transition-colors">
                Browse the Shop
            </a>
        </div>
    </div>
</x-app-layout>
