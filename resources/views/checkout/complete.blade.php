<x-app-layout>
    <x-slot name="title">Order Complete - Errant Arts</x-slot>

    <div class="content-shell py-20 max-w-xl mx-auto text-center">
        @if ($order)
            <h1 class="font-serif text-4xl text-stone-50">Thank you for your order.</h1>
            <p class="mt-4 text-stone-300">Order reference <strong>{{ $order->id }}</strong>. A confirmation email is on its way.</p>
            <a href="{{ route('account.downloads') }}" class="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-sm font-semibold text-black hover:bg-accent-strong">
                Go to your downloads
            </a>
        @else
            <h1 class="font-serif text-4xl text-stone-50">We're confirming your payment.</h1>
            <p class="mt-4 text-stone-300">
                If your payment succeeded, your downloads will appear in your account shortly.
                Contact us if you don't see them within a few minutes.
            </p>
            <a href="{{ route('account.downloads') }}" class="mt-8 inline-block rounded-full border border-white/20 px-8 py-3 text-sm font-semibold text-stone-100 hover:bg-white/5">
                Check your account
            </a>
        @endif
    </div>
</x-app-layout>
