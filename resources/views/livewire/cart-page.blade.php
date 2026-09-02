<div class="content-shell py-16">
    <h1 class="font-serif text-4xl text-stone-50 mb-10">Your Cart</h1>

    @if (empty($lines))
        <div class="panel-surface rounded-2xl p-10 text-center text-stone-400">
            <p>Your cart is empty.</p>
            <a href="{{ url('/shop') }}" class="mt-4 inline-block text-accent hover:text-accent-strong">Browse the shop &rarr;</a>
        </div>
    @else
        <div class="space-y-4">
            @foreach ($lines as $line)
                <div class="panel-surface rounded-xl p-4 flex items-center gap-4">
                    <div class="h-16 w-16 shrink-0 overflow-hidden rounded bg-panel-elevated">
                        @if ($line['artwork']->previewUrl)
                            <img src="{{ $line['artwork']->previewUrl }}" alt="{{ $line['artwork']->title }}" class="h-full w-full object-cover">
                        @endif
                    </div>
                    <div class="flex-grow">
                        <p class="font-medium text-stone-100">{{ $line['artwork']->title }}</p>
                        <p class="text-xs uppercase tracking-wide text-stone-500">{{ $line['kind'] }}</p>
                    </div>
                    <p class="text-sm font-semibold text-accent">£{{ number_format($line['subtotalPence'] / 100, 2) }}</p>
                    <button wire:click="remove('{{ $line['key'] }}')" class="text-xs text-stone-500 hover:text-red-400">Remove</button>
                </div>
            @endforeach
        </div>

        <div class="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
            <span class="text-lg text-stone-300">Total</span>
            <span class="text-2xl font-semibold text-accent">£{{ number_format($totalPence / 100, 2) }}</span>
        </div>

        <div class="mt-8 text-right">
            <a href="{{ route('checkout.show') }}" class="inline-flex items-center rounded-full bg-accent px-8 py-3 text-sm font-semibold text-black hover:bg-accent-strong">
                Proceed to Checkout
            </a>
        </div>
    @endif
</div>
