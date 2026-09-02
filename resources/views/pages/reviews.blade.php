<x-app-layout>
    <x-slot name="title">Reviews - Errant Arts</x-slot>

    <div class="content-shell py-16 text-stone-300">
        <h1 class="font-serif text-5xl text-stone-50">Customer Reviews</h1>

        <div class="mt-10 grid gap-6 md:grid-cols-2">
            @forelse ($reviews as $review)
                <div class="panel-surface rounded-2xl p-6">
                    <div class="flex items-center gap-1 text-accent">
                        @for ($i = 0; $i < 5; $i++)
                            <span>{{ $i < $review->rating ? '★' : '☆' }}</span>
                        @endfor
                    </div>
                    <p class="mt-3 text-sm leading-7">{{ $review->body }}</p>
                    <p class="mt-4 text-xs uppercase tracking-[0.2em] text-stone-500">{{ $review->displayName }}</p>
                </div>
            @empty
                <p class="text-stone-400">No reviews yet.</p>
            @endforelse
        </div>

        <div class="mt-10">{{ $reviews->links() }}</div>
    </div>
</x-app-layout>
