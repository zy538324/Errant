<x-app-layout>
    <x-slot name="title">Admin Dashboard - Errant-Arts</x-slot>

    <div class="content-shell py-12">
        <h1 class="font-serif text-3xl font-bold text-stone-100 mb-8">Admin Dashboard</h1>
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
