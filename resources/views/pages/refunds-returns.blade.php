<x-app-layout>
    <x-slot name="title">Refunds &amp; Returns - Errant Arts</x-slot>

    <div class="content-shell py-16 text-stone-300">
        <h1 class="font-serif text-5xl text-stone-50">Refunds &amp; Returns</h1>

        <section class="mt-8 max-w-3xl space-y-6">
            <div>
                <h2 class="text-lg font-semibold text-stone-50">Digital downloads</h2>
                <p class="mt-2 text-base leading-7">
                    Online checkout currently sells digital downloads only. Due to the instant and irrevocable
                    nature of digital content, all digital sales are final once the download is made available.
                </p>
                <p class="mt-2 text-base leading-7">
                    If your file is defective, corrupted, inaccessible or clearly not the file purchased, we
                    will investigate and provide a replacement where the issue is verified.
                </p>
            </div>

            <div>
                <h2 class="text-lg font-semibold text-stone-50">Need help with an order?</h2>
                <p class="mt-2 text-base leading-7">
                    Please <a href="{{ url('/contact') }}" class="underline hover:text-accent">contact us</a>
                    with your order email address, order reference and a short description of the issue so we
                    can help locate and resolve the problem.
                </p>
            </div>
        </section>
    </div>
</x-app-layout>
