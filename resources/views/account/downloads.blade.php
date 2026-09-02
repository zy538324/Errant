<x-app-layout>
    <x-slot name="title">Your Downloads - Errant Arts</x-slot>

    <div class="content-shell py-16">
        <h1 class="font-serif text-4xl text-stone-50 mb-10">Your Downloads</h1>

        @forelse ($entitlements as $entitlement)
            <div class="panel-surface rounded-lg p-4 mb-3 flex items-center justify-between gap-4">
                <div>
                    <p class="text-stone-200">{{ $entitlement->artwork->title ?? 'Artwork' }}</p>
                    <p class="text-xs text-stone-500">{{ $entitlement->downloadCount }} / {{ $entitlement->maxDownloads }} downloads used</p>
                </div>
                @if ($entitlement->downloadCount < $entitlement->maxDownloads)
                    <form method="POST" action="{{ route('downloads.issue', $entitlement->id) }}">
                        @csrf
                        <button type="submit" class="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black hover:bg-accent-strong">Download</button>
                    </form>
                @else
                    <span class="text-xs text-stone-500">Limit reached</span>
                @endif
            </div>
        @empty
            <p class="text-stone-400">No downloads yet.</p>
        @endforelse
    </div>
</x-app-layout>
