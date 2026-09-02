<x-app-layout>
    <x-slot name="title">Artworks - Admin</x-slot>

    <div class="content-shell py-12">
        <div class="flex items-center justify-between mb-8">
            <h1 class="font-serif text-3xl text-stone-50">Artworks</h1>
            <a href="{{ route('admin.artworks.create') }}" class="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black hover:bg-accent-strong">New Artwork</a>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-stone-300">
                <thead class="text-xs uppercase text-stone-500 border-b border-white/10">
                    <tr>
                        <th class="py-2 pr-4">Title</th>
                        <th class="py-2 pr-4">Collection</th>
                        <th class="py-2 pr-4">Status</th>
                        <th class="py-2 pr-4">Price</th>
                        <th class="py-2 pr-4">Stock</th>
                        <th class="py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($artworks as $artwork)
                        <tr class="border-b border-white/5">
                            <td class="py-3 pr-4">{{ $artwork->title }}</td>
                            <td class="py-3 pr-4">{{ $artwork->collection->name ?? '—' }}</td>
                            <td class="py-3 pr-4">
                                <span class="rounded-full px-2 py-1 text-xs {{ $artwork->status === 'PUBLISHED' ? 'bg-accent/20 text-accent' : 'bg-white/10 text-stone-400' }}">{{ $artwork->status }}</span>
                            </td>
                            <td class="py-3 pr-4">£{{ number_format($artwork->pricePence / 100, 2) }}</td>
                            <td class="py-3 pr-4">{{ $artwork->stockOnHand ?? '∞' }}</td>
                            <td class="py-3 text-right">
                                <a href="{{ route('admin.artworks.edit', $artwork) }}" class="text-accent hover:text-accent-strong">Edit</a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="mt-8">{{ $artworks->links() }}</div>
    </div>
</x-app-layout>
