@props(['title' => 'Errant-Arts'])

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Errant-Arts' }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles
</head>
<body class="bg-background text-foreground antialiased min-h-screen flex flex-col">
    <header class="border-b border-stone-800 bg-stone-950/80 backdrop-blur sticky top-0 z-50" x-data="{ mobileMenuOpen: false }">
        <div class="content-shell flex items-center justify-between h-16">
            <a href="{{ url('/') }}" class="font-serif text-xl font-bold tracking-wide text-amber-500">Errant-Arts</a>
            <nav class="hidden md:flex items-center space-x-8 text-sm font-medium">
                <a href="{{ url('/shop') }}" class="hover:text-amber-500">Shop</a>
                <a href="{{ url('/portfolio') }}" class="hover:text-amber-500">Portfolio</a>
                <a href="{{ url('/blog') }}" class="hover:text-amber-500">Blog</a>
            </nav>
            <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden text-stone-300 hover:text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </div>
        <div x-show="mobileMenuOpen" x-cloak class="md:hidden border-b border-stone-800 bg-stone-900 px-4 py-4 space-y-3">
            <a href="{{ url('/shop') }}" class="block text-sm hover:text-amber-500">Shop</a>
            <a href="{{ url('/portfolio') }}" class="block text-sm hover:text-amber-500">Portfolio</a>
            <a href="{{ url('/blog') }}" class="block text-sm hover:text-amber-500">Blog</a>
        </div>
    </header>

    <main class="flex-grow">
        {{ $slot }}
    </main>

    <x-footer />

    @livewireScripts
</body>
</html>
