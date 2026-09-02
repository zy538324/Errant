<x-app-layout>
    <x-slot name="title">{{ $artwork->exists ? 'Edit' : 'New' }} Artwork - Admin</x-slot>

    <div class="content-shell py-12 max-w-2xl">
        <h1 class="font-serif text-3xl text-stone-50 mb-8">{{ $artwork->exists ? 'Edit Artwork' : 'New Artwork' }}</h1>

        @if ($errors->any())
            <div class="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                @foreach ($errors->all() as $error)
                    <p>{{ $error }}</p>
                @endforeach
            </div>
        @endif

        <form method="POST" action="{{ $artwork->exists ? route('admin.artworks.update', $artwork) : route('admin.artworks.store') }}" enctype="multipart/form-data" class="space-y-5">
            @csrf
            @if ($artwork->exists) @method('PUT') @endif

            <div>
                <label class="block text-sm text-stone-300 mb-1">Title</label>
                <input type="text" name="title" required value="{{ old('title', $artwork->title) }}" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
            </div>

            <div>
                <label class="block text-sm text-stone-300 mb-1">Slug (optional — auto-generated from title)</label>
                <input type="text" name="slug" value="{{ old('slug', $artwork->slug) }}" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
            </div>

            <div>
                <label class="block text-sm text-stone-300 mb-1">Description</label>
                <textarea name="description" rows="4" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">{{ old('description', $artwork->description) }}</textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm text-stone-300 mb-1">Category</label>
                    <input type="text" name="category" value="{{ old('category', $artwork->category) }}" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm text-stone-300 mb-1">Collection</label>
                    <select name="collectionId" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
                        <option value="">—</option>
                        @foreach ($collections as $collection)
                            <option value="{{ $collection->id }}" @selected(old('collectionId', $artwork->collectionId) === $collection->id)>{{ $collection->name }}</option>
                        @endforeach
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm text-stone-300 mb-1">Price (£)</label>
                    <input type="number" step="0.01" min="0" name="price" required value="{{ old('price', $artwork->exists ? number_format($artwork->pricePence / 100, 2, '.', '') : '') }}" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm text-stone-300 mb-1">Currency</label>
                    <input type="text" name="currency" maxlength="3" value="{{ old('currency', $artwork->currency ?? 'GBP') }}" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm text-stone-300 mb-1">Stock (blank = unlimited)</label>
                    <input type="number" min="0" name="stockOnHand" value="{{ old('stockOnHand', $artwork->stockOnHand) }}" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
                </div>
            </div>

            <div>
                <label class="block text-sm text-stone-300 mb-1">Status</label>
                <select name="status" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
                    @foreach (['DRAFT', 'PUBLISHED', 'ARCHIVED'] as $status)
                        <option value="{{ $status }}" @selected(old('status', $artwork->status) === $status)>{{ $status }}</option>
                    @endforeach
                </select>
            </div>

            <div>
                <label class="block text-sm text-stone-300 mb-1">Preview image (public — shown in shop/gallery)</label>
                <input type="file" name="preview_image" accept="image/*" class="w-full text-sm text-stone-300">
                @if ($artwork->previewUrl)
                    <img src="{{ $artwork->previewUrl }}" class="mt-2 h-24 rounded border border-white/10">
                @endif
            </div>

            <div>
                <label class="block text-sm text-stone-300 mb-1">Download master file (private — delivered to buyers)</label>
                <input type="file" name="download_master" class="w-full text-sm text-stone-300">
                @if ($artwork->exists && $artwork->assets->firstWhere('kind', 'DOWNLOAD_MASTER'))
                    <p class="mt-1 text-xs text-accent">Download master already uploaded.</p>
                @endif
            </div>

            <button type="submit" class="w-full bg-accent hover:bg-accent-strong text-black font-semibold py-3 rounded transition-colors">
                {{ $artwork->exists ? 'Save Changes' : 'Create Artwork' }}
            </button>
        </form>
    </div>
</x-app-layout>
