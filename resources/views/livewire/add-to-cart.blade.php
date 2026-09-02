<div>
    <button wire:click="addToCart" class="w-full sm:w-auto bg-accent hover:bg-accent-strong text-black font-semibold py-3 px-8 rounded transition-colors">
        Add to Cart — Digital Download
    </button>

    @if (session('message'))
        <p class="mt-3 text-sm text-accent">{{ session('message') }}</p>
    @endif
</div>
