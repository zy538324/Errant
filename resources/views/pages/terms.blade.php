<x-app-layout>
    <x-slot name="title">Terms &amp; Conditions - Errant Arts</x-slot>

    <div class="mx-auto max-w-3xl px-6 py-16 text-stone-300">
        <h1 class="font-serif text-5xl text-stone-50">Terms &amp; Conditions</h1>

        <section class="mt-8 space-y-8">
            <div>
                <h2 class="font-serif text-2xl text-stone-50">1. Introduction</h2>
                <p class="mt-3 text-lg leading-8">
                    These Terms &amp; Conditions govern use of the Errant Arts website and all online purchases
                    made through it. By using the site or placing an order, you confirm that you have read,
                    understood and agree to these terms.
                </p>
                <p class="mt-3 text-lg leading-8">
                    &ldquo;We&rdquo;, &ldquo;our&rdquo; and &ldquo;us&rdquo; refer to Sean Cutland, trading as
                    Errant Arts. &ldquo;You&rdquo; refers to the customer or visitor using the site.
                </p>
            </div>

            <div>
                <h2 class="font-serif text-2xl text-stone-50">2. Digital download purchases</h2>
                <p class="mt-3 text-lg leading-8">
                    Online checkout currently sells licensed digital downloads only. Once payment is confirmed,
                    download access is provided through your account. Download links are unique to your order
                    and are subject to expiry and download limits for security reasons.
                </p>
                <p class="mt-3 text-lg leading-8">
                    Each digital download is supplied under the separate
                    <a href="{{ url('/digital-download-licence') }}" class="underline hover:text-accent">Digital Download Licence Agreement</a>,
                    which explains what you can and cannot do with the purchased file.
                </p>
            </div>

            <div>
                <h2 class="font-serif text-2xl text-stone-50">3. Accounts and security</h2>
                <p class="mt-3 text-lg leading-8">
                    You may create or use an account to access purchases, downloads and order history. You are
                    responsible for keeping your account access secure. Errant Arts will never ask for your
                    password by email or any insecure channel.
                </p>
            </div>

            <div>
                <h2 class="font-serif text-2xl text-stone-50">4. Refunds and support</h2>
                <p class="mt-3 text-lg leading-8">
                    Digital download sales are normally final once the file has been made available. Full
                    details are set out in the
                    <a href="{{ url('/refunds-returns') }}" class="underline hover:text-accent">Refunds &amp; Returns Policy</a>.
                </p>
            </div>

            <div>
                <h2 class="font-serif text-2xl text-stone-50">5. Copyright and creator rights</h2>
                <p class="mt-3 text-lg leading-8">
                    All images, artworks, text and digital materials remain the intellectual property of Sean
                    Cutland / Errant Arts unless otherwise stated in writing. Buying a digital download gives
                    you a personal-use licence only. It does not transfer copyright, ownership or commercial rights.
                </p>
            </div>

            <div>
                <h2 class="font-serif text-2xl text-stone-50">6. Privacy</h2>
                <p class="mt-3 text-lg leading-8">
                    Personal data is handled according to the
                    <a href="{{ url('/privacy') }}" class="underline hover:text-accent">Privacy &amp; Cookie Policy</a>.
                </p>
            </div>

            <div>
                <h2 class="font-serif text-2xl text-stone-50">7. Changes to these terms</h2>
                <p class="mt-3 text-lg leading-8">
                    These terms may be updated periodically to reflect changes in the site, services or
                    applicable law. The latest version will be available on this page.
                </p>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7">
                <p>Errant Arts — Fine Art Photography — Digital Downloads</p>
            </div>
        </section>
    </div>
</x-app-layout>
