<x-app-layout>
    <x-slot name="title">About - Errant-Arts</x-slot>

    <div class="reading-shell py-12">
        <h1 class="font-serif text-4xl font-bold text-stone-100 mb-6">About Errant-Arts</h1>
        
        <div class="prose prose-invert max-w-none space-y-6 text-stone-300">
            <p class="text-lg leading-relaxed">
                Welcome to Errant-Arts, a curated collection of digital artwork and physical prints created by passionate artists.
            </p>

            <p class="leading-relaxed">
                Our mission is to bring unique, high-quality artistic works directly to collectors and enthusiasts worldwide. 
                Whether you're looking for stunning digital downloads or beautifully printed pieces, we're committed to delivering 
                exceptional quality and customer service.
            </p>

            <h2 class="font-serif text-2xl font-bold text-stone-100 mt-8 mb-4">Our Collections</h2>
            <p class="leading-relaxed">
                Browse through our carefully curated collections, each featuring works that showcase different artistic styles and themes. 
                From digital illustrations to fine art prints, we have something for every taste.
            </p>

            <h2 class="font-serif text-2xl font-bold text-stone-100 mt-8 mb-4">Quality & Authenticity</h2>
            <p class="leading-relaxed">
                Every piece in our collection is selected for its artistic merit and quality. We work directly with artists to ensure 
                that all works are authentic and represent their creative vision.
            </p>

            <h2 class="font-serif text-2xl font-bold text-stone-100 mt-8 mb-4">Support Us</h2>
            <p class="leading-relaxed">
                By purchasing from Errant-Arts, you're directly supporting independent artists and contributing to the growth of creative communities. 
                Thank you for your support!
            </p>

            <div class="text-center pt-12">
                <a href="{{ url('/shop') }}" class="inline-block bg-amber-600 hover:bg-amber-500 text-white font-semibold px-8 py-3 rounded transition-colors">
                    Browse Our Shop
                </a>
            </div>
        </div>
    </div>
</x-app-layout>
