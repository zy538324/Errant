<div class="space-y-4">
    <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-stone-300">Format:</label>
        <select wire:model.live="kind" class="bg-stone-900 border border-stone-700 text-stone-200 rounded px-3 py-1.5 text-sm focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors">
            <option value="digital">Digital Download</option>
            <option value="print">Physical Print</option>
        </select>
    </div>

    @if($kind === 'print')
        <div>
            <label class="text-sm font-medium text-stone-300">Print SKU:</label>
            <input type="text" wire:model.live="printSku" placeholder="Enter SKU" class="mt-1 bg-stone-900 border border-stone-700 text-stone-200 rounded px-3 py-1.5 text-sm w-full focus:border-amber-500 focus:outline-none transition-colors">
        </div>
    @endif

    <button wire:click="addToCart" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 px-4 rounded transition-colors">
        Add to Cart
    </button>
</div>
