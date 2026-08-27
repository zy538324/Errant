<div class="panel-surface p-8 border-2 border-dashed border-stone-700 rounded-lg text-center" x-data="{ dragging: false }">
    <input type="file" wire:model="files" multiple class="hidden" id="file-upload">
    <label for="file-upload" class="cursor-pointer space-y-2 block">
        <svg class="mx-auto h-12 w-12 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-sm text-stone-300 font-medium">Drag and drop assets here, or <span class="text-amber-500 underline">browse</span></p>
        <p class="text-xs text-stone-500">PNG, JPG, WEBP up to 10MB</p>
    </label>
</div>
