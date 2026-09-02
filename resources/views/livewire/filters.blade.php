<div class="panel-surface p-4 rounded-lg space-y-4">
    <div>
        <label class="text-sm font-medium text-stone-300">Search</label>
        <input type="text" wire:model.live.debounce.300ms="search" placeholder="Search artwork..." class="mt-1 bg-stone-900 border border-stone-700 text-stone-200 rounded px-3 py-1.5 text-sm w-full focus:border-amber-500 focus:outline-none transition-colors">
    </div>

    @if($categories->isNotEmpty())
        <div>
            <label class="text-sm font-medium text-stone-300">Category</label>
            <select wire:model.live="category" class="mt-1 bg-stone-900 border border-stone-700 text-stone-200 rounded px-3 py-1.5 text-sm w-full focus:border-amber-500 focus:outline-none transition-colors">
                <option value="">All Categories</option>
                @foreach($categories as $cat)
                    <option value="{{ $cat }}">{{ ucfirst($cat) }}</option>
                @endforeach
            </select>
        </div>
    @endif

    <div>
        <label class="text-sm font-medium text-stone-300">Sort By</label>
        <select wire:model.live="sortBy" class="mt-1 bg-stone-900 border border-stone-700 text-stone-200 rounded px-3 py-1.5 text-sm w-full focus:border-amber-500 focus:outline-none transition-colors">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
        </select>
    </div>
</div>
