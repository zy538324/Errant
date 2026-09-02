<x-app-layout>
    <x-slot name="title">{{ $collection->exists ? 'Edit' : 'New' }} Collection - Admin</x-slot>

    <div class="content-shell py-12 max-w-xl">
        <h1 class="font-serif text-3xl text-stone-50 mb-8">{{ $collection->exists ? 'Edit Collection' : 'New Collection' }}</h1>

        @if ($errors->any())
            <div class="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                @foreach ($errors->all() as $error)
                    <p>{{ $error }}</p>
                @endforeach
            </div>
        @endif

        <form method="POST" action="{{ $collection->exists ? route('admin.collections.update', $collection) : route('admin.collections.store') }}" class="space-y-5">
            @csrf
            @if ($collection->exists) @method('PUT') @endif

            <div>
                <label class="block text-sm text-stone-300 mb-1">Name</label>
                <input type="text" name="name" required value="{{ old('name', $collection->name) }}" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-stone-300 mb-1">Slug (optional)</label>
                <input type="text" name="slug" value="{{ old('slug', $collection->slug) }}" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-stone-300 mb-1">Description</label>
                <textarea name="description" rows="3" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">{{ old('description', $collection->description) }}</textarea>
            </div>
            <div>
                <label class="block text-sm text-stone-300 mb-1">Sort order</label>
                <input type="number" name="sortOrder" value="{{ old('sortOrder', $collection->sortOrder ?? 0) }}" class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
            </div>

            <button type="submit" class="w-full bg-accent hover:bg-accent-strong text-black font-semibold py-3 rounded transition-colors">
                {{ $collection->exists ? 'Save Changes' : 'Create Collection' }}
            </button>
        </form>
    </div>
</x-app-layout>
