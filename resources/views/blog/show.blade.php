<x-app-layout>
    <x-slot name="title">{{ $post->title }} - Errant Arts</x-slot>

    <div class="reading-shell py-12">
        <div class="mb-8">
            <a href="{{ url('/blog') }}" class="text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors">← Back to Blog</a>
        </div>

        <article class="prose prose-invert max-w-none">
            <div class="mb-8">
                <p class="text-sm text-stone-500">{{ $post->publishedAt->format('F d, Y') }}</p>
                <h1 class="font-serif text-4xl font-bold text-stone-100 mt-2">{{ $post->title }}</h1>
                <p class="text-stone-400 mt-2">
                    By <span class="text-stone-300 font-medium">{{ $post->author->username ?? 'Anonymous' }}</span>
                </p>
            </div>

            <div class="border-t border-b border-stone-800 py-8 my-8">
                <p class="text-lg text-stone-300 leading-relaxed">{{ $post->excerpt }}</p>
            </div>

            <div class="max-w-none prose prose-invert space-y-6 text-stone-300">
                {!! $post->content !!}
            </div>
        </article>

        <div class="mt-12 pt-8 border-t border-stone-800">
            <h3 class="font-serif text-xl font-bold text-stone-100 mb-6">More Articles</h3>
            @livewire('blog-list')
        </div>
    </div>
</x-app-layout>
