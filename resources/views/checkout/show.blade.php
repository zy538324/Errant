<x-app-layout>
    <x-slot name="title">Checkout - Errant Arts</x-slot>

    <div class="content-shell py-16 max-w-2xl mx-auto">
        <h1 class="font-serif text-4xl text-stone-50 mb-10">Checkout</h1>

        <div class="panel-surface rounded-2xl p-6 mb-8">
            @foreach ($lines as $line)
                <div class="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                    <span class="text-stone-200">{{ $line['artwork']->title }}</span>
                    <span class="text-accent font-semibold">£{{ number_format($line['subtotalPence'] / 100, 2) }}</span>
                </div>
            @endforeach
            <div class="flex items-center justify-between pt-4 mt-2 text-lg">
                <span class="text-stone-100 font-medium">Total</span>
                <span class="text-accent font-semibold">£{{ number_format($totalPence / 100, 2) }}</span>
            </div>
        </div>

        @if ($errors->any())
            <div class="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                @foreach ($errors->all() as $error)
                    <p>{{ $error }}</p>
                @endforeach
            </div>
        @endif

        <form method="POST" action="{{ route('checkout.session') }}" class="space-y-6">
            @csrf

            @unless ($user)
                <div>
                    <label class="block text-sm font-medium text-stone-300 mb-1">Email address</label>
                    <input type="email" name="email" value="{{ old('email') }}" required
                        class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
                    <p class="mt-1 text-xs text-stone-500">We'll use this to create your account and deliver your downloads.</p>
                </div>
            @else
                <p class="text-sm text-stone-400">Signed in as {{ $user->email }}</p>
            @endunless

            <label class="flex items-start gap-3 text-sm text-stone-300">
                <input type="checkbox" name="accepted_licence" value="1" class="mt-1">
                <span>I have read and accept the <a href="{{ url('/digital-download-licence') }}" target="_blank" class="underline hover:text-accent">Digital Download Licence Agreement</a>.</span>
            </label>

            <button type="submit" class="w-full bg-accent hover:bg-accent-strong text-black font-semibold py-3 rounded transition-colors">
                Continue to Payment
            </button>
        </form>
    </div>
</x-app-layout>
