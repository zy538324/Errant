@props(['title' => 'Errant Arts'])

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Errant Arts' }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles
</head>
<body class="bg-background text-foreground antialiased min-h-screen flex flex-col">
    <header class="sticky top-0 z-50 border-b border-white/10 bg-[#3C3E47]/95 backdrop-blur" x-data="{ mobileMenuOpen: false }">
        <div class="content-shell flex items-center justify-between h-16 gap-4">
            <a href="{{ url('/') }}" aria-label="Errant Arts home" class="font-serif text-xl font-bold tracking-wide text-accent shrink-0">
                Errant Arts
            </a>
            <nav class="hidden lg:flex items-center gap-6 text-sm text-stone-300">
                <a href="{{ url('/') }}" class="hover:text-white">Home</a>
                <a href="{{ url('/portfolio') }}" class="hover:text-white">Portfolio</a>
                <a href="{{ url('/shop') }}" class="hover:text-white">Shop</a>
                <a href="{{ url('/about') }}" class="hover:text-white">About</a>
                <a href="{{ url('/contact') }}" class="hover:text-white">Contact</a>
                <a href="{{ url('/account') }}" class="hover:text-white">Account</a>
            </nav>
            <div class="flex items-center gap-3">
                <a href="{{ route('cart') }}" class="hidden lg:inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-stone-300 hover:bg-white/5 hover:text-white">
                    Cart
                    @if (\App\Support\Cart::count() > 0)
                        <span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-black">{{ \App\Support\Cart::count() }}</span>
                    @endif
                </a>
                <button @click="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden text-stone-300 hover:text-white">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </div>
        <div x-show="mobileMenuOpen" x-cloak class="lg:hidden border-t border-white/10 bg-[#3C3E47] px-4 py-4 space-y-3">
            <a href="{{ url('/') }}" class="block text-sm text-stone-300 hover:text-white">Home</a>
            <a href="{{ url('/portfolio') }}" class="block text-sm text-stone-300 hover:text-white">Portfolio</a>
            <a href="{{ url('/shop') }}" class="block text-sm text-stone-300 hover:text-white">Shop</a>
            <a href="{{ url('/about') }}" class="block text-sm text-stone-300 hover:text-white">About</a>
            <a href="{{ url('/contact') }}" class="block text-sm text-stone-300 hover:text-white">Contact</a>
            <a href="{{ url('/account') }}" class="block text-sm text-stone-300 hover:text-white">Account</a>
            <a href="{{ route('cart') }}" class="block text-sm text-stone-300 hover:text-white">Cart ({{ \App\Support\Cart::count() }})</a>
        </div>
    </header>

    @if (session('message'))
        <div class="content-shell mt-4">
            <div class="rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">{{ session('message') }}</div>
        </div>
    @endif
    @if (session('error'))
        <div class="content-shell mt-4">
            <div class="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{{ session('error') }}</div>
        </div>
    @endif

    <main class="flex-grow">
        {{ $slot }}
    </main>

    <x-footer />

    @livewireScripts
    @stack('scripts')
</body>
</html>
