<x-app-layout>
    <x-slot name="title">Blog - Errant-Arts</x-slot>

    <div class="content-shell py-12">
        <h1 class="font-serif text-3xl font-bold text-stone-100 mb-8">Articles & Blog</h1>
        <p class="text-stone-400 text-sm mb-12">Insights, updates, and artistic reflections.</p>
        
        <div class="reading-shell">
            @livewire('blog-list')
        </div>
    </div>
</x-app-layout>
