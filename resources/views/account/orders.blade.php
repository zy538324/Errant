<x-app-layout>
    <x-slot name="title">Your Orders - Errant Arts</x-slot>

    <div class="content-shell py-16">
        <h1 class="font-serif text-4xl text-stone-50 mb-10">Your Orders</h1>

        @forelse ($orders as $order)
            <div class="panel-surface rounded-lg p-6 mb-4">
                <div class="flex items-center justify-between mb-3">
                    <p class="text-stone-200 font-medium">Order {{ $order->id }}</p>
                    <span class="text-xs uppercase tracking-wide text-stone-500">{{ $order->status }}</span>
                </div>
                <ul class="text-sm text-stone-400 space-y-1">
                    @foreach ($order->items as $item)
                        <li>{{ $item->artwork->title ?? 'Artwork' }} — £{{ number_format($item->unitPence / 100, 2) }}</li>
                    @endforeach
                </ul>
                <p class="mt-3 text-accent font-semibold">£{{ number_format($order->totalPence / 100, 2) }}</p>
            </div>
        @empty
            <p class="text-stone-400">No orders yet.</p>
        @endforelse

        <div class="mt-8">{{ $orders->links() }}</div>
    </div>
</x-app-layout>
