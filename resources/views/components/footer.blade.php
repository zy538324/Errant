<footer class="border-t border-stone-800 bg-stone-950 py-12 mt-20">
    <div class="content-shell flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-stone-400">
        <p>&copy; {{ date('Y') }} Errant-Arts. All rights reserved.</p>
        <div class="flex space-x-6">
            <a href="{{ url('/shop') }}" class="hover:text-amber-500">Shop</a>
            <a href="{{ url('/portfolio') }}" class="hover:text-amber-500">Portfolio</a>
            <a href="{{ url('/about') }}" class="hover:text-amber-500">About</a>
        </div>
    </div>
</footer>
