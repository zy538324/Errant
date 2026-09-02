<footer class="border-t border-white/10 bg-panel py-12 mt-20">
    <div class="content-shell flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-stone-400">
        <p>&copy; {{ date('Y') }} Errant Arts. All rights reserved.</p>
        <div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="{{ url('/shop') }}" class="hover:text-accent">Shop</a>
            <a href="{{ url('/portfolio') }}" class="hover:text-accent">Portfolio</a>
            <a href="{{ url('/about') }}" class="hover:text-accent">About</a>
            <a href="{{ url('/contact') }}" class="hover:text-accent">Contact</a>
            <a href="{{ url('/reviews') }}" class="hover:text-accent">Reviews</a>
            <a href="{{ url('/privacy') }}" class="hover:text-accent">Privacy</a>
            <a href="{{ url('/terms') }}" class="hover:text-accent">Terms</a>
            <a href="{{ url('/refunds-returns') }}" class="hover:text-accent">Refunds &amp; Returns</a>
            <a href="{{ url('/digital-download-licence') }}" class="hover:text-accent">Download Licence</a>
        </div>
    </div>
</footer>
