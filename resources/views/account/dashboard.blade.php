<x-app-layout>
    <x-slot name="title">Your Account - Errant Arts</x-slot>

    <div class="content-shell py-16">
        <div class="flex items-center justify-between mb-10">
            <h1 class="font-serif text-4xl text-stone-50">Your Account</h1>
            <form method="POST" action="{{ route('account.logout') }}">
                @csrf
                <button type="submit" class="text-sm text-stone-400 hover:text-accent">Sign out</button>
            </form>
        </div>

        <nav class="flex flex-wrap gap-6 mb-10 text-sm">
            <a href="{{ route('account.dashboard') }}" class="text-accent">Overview</a>
            <a href="{{ route('account.orders') }}" class="text-stone-400 hover:text-accent">Orders</a>
            <a href="{{ route('account.downloads') }}" class="text-stone-400 hover:text-accent">Downloads</a>
            <a href="{{ route('account.privacy') }}" class="text-stone-400 hover:text-accent">Privacy</a>
        </nav>

        <h2 class="font-serif text-xl text-stone-100 mb-4">Recent Orders</h2>
        @forelse ($recentOrders as $order)
            <div class="panel-surface rounded-lg p-4 mb-3 flex items-center justify-between">
                <div>
                    <p class="text-stone-200">Order {{ $order->id }}</p>
                    <p class="text-xs text-stone-500">{{ $order->createdAt->format('d M Y') }} &middot; {{ $order->status }}</p>
                </div>
                <span class="text-accent font-semibold">£{{ number_format($order->totalPence / 100, 2) }}</span>
            </div>
        @empty
            <p class="text-stone-400">No orders yet. <a href="{{ url('/shop') }}" class="text-accent hover:text-accent-strong">Browse the shop &rarr;</a></p>
        @endforelse
    </div>
</x-app-layout>
