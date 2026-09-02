<x-app-layout>
    <x-slot name="title">Collections - Admin</x-slot>

    <div class="content-shell py-12">
        <div class="flex items-center justify-between mb-8">
            <h1 class="font-serif text-3xl text-stone-50">Collections</h1>
            <a href="{{ route('admin.collections.create') }}" class="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black hover:bg-accent-strong">New Collection</a>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-stone-300">
                <thead class="text-xs uppercase text-stone-500 border-b border-white/10">
                    <tr>
                        <th class="py-2 pr-4">Name</th>
                        <th class="py-2 pr-4">Slug</th>
                        <th class="py-2 pr-4">Artworks</th>
                        <th class="py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($collections as $collection)
                        <tr class="border-b border-white/5">
                            <td class="py-3 pr-4">{{ $collection->name }}</td>
                            <td class="py-3 pr-4">{{ $collection->slug }}</td>
                            <td class="py-3 pr-4">{{ $collection->artworks_count }}</td>
                            <td class="py-3 text-right">
                                <a href="{{ route('admin.collections.edit', $collection) }}" class="text-accent hover:text-accent-strong">Edit</a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</x-app-layout>
