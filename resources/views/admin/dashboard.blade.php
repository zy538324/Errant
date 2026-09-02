<x-app-layout>
    <x-slot name="title">Admin Dashboard - Errant Arts</x-slot>

    <div class="content-shell py-12">
        <div class="flex items-center justify-between mb-8">
            <h1 class="font-serif text-3xl font-bold text-stone-100">Admin Dashboard</h1>
            <form method="POST" action="{{ route('admin.logout') }}">
                @csrf
                <button type="submit" class="text-sm text-stone-400 hover:text-accent">Sign out</button>
            </form>
        </div>

        <nav class="flex flex-wrap gap-6 mb-10 text-sm">
            <a href="{{ route('admin.artworks.index') }}" class="text-stone-300 hover:text-accent">Artworks</a>
            <a href="{{ route('admin.collections.index') }}" class="text-stone-300 hover:text-accent">Collections</a>
        </nav>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="panel-surface p-6 rounded-lg">
                <h3 class="text-sm font-medium text-stone-400">Total Artworks</h3>
                <p class="text-2xl font-bold text-stone-100 mt-2">{{ $totalArtworks }}</p>
            </div>
            <div class="panel-surface p-6 rounded-lg">
                <h3 class="text-sm font-medium text-stone-400">Total Orders</h3>
                <p class="text-2xl font-bold text-stone-100 mt-2">{{ $totalOrders }}</p>
            </div>
            <div class="panel-surface p-6 rounded-lg">
                <h3 class="text-sm font-medium text-stone-400">Email Subscribers</h3>
                <p class="text-2xl font-bold text-stone-100 mt-2">{{ $emailSubscribers }}</p>
            </div>
        </div>
    </div>
</x-app-layout>
