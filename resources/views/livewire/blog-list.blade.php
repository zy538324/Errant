<div class="space-y-8">
    @if($posts->isEmpty())
        <div class="text-center py-12">
            <p class="text-stone-400">No blog posts published yet.</p>
        </div>
    @else
        <div class="space-y-8">
            @foreach($posts as $post)
                <article class="border-b border-stone-800 pb-8 last:border-b-0">
                    <div class="space-y-3">
                        <p class="text-sm text-stone-500">{{ $post->publishedAt->format('M d, Y') }}</p>
                        <h3 class="font-serif text-2xl font-bold text-stone-100">
                            <a href="{{ url('/blog/' . $post->slug) }}" class="hover:text-amber-500 transition-colors">
                                {{ $post->title }}
                            </a>
                        </h3>
                        <p class="text-sm text-stone-400">
                            By <span class="text-stone-300">{{ $post->author->username ?? 'Anonymous' }}</span>
                        </p>
                        <p class="text-stone-300 leading-relaxed">{{ $post->excerpt }}</p>
                        <a href="{{ url('/blog/' . $post->slug) }}" class="inline-block text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors">
                            Read More →
                        </a>
                    </div>
                </article>
            @endforeach
        </div>
    @endif
</div>
