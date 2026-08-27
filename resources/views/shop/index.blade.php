<x-app-layout>
    <x-slot name="title">Shop - Errant-Arts</x-slot>

    <div class="content-shell py-12">
        <h1 class="font-serif text-3xl font-bold text-stone-100 mb-8">Shop Artworks</h1>
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div>
                @livewire('filters')
            </div>
            <div class="lg:col-span-3">
                <p class="text-stone-400 text-sm">Explore our curated collection of digital downloads and physical prints.</p>
            </div>
        </div>
    </div>
</x-app-layout>
