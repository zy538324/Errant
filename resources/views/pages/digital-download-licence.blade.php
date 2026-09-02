@php
    $allowedUses = [
        'Download the purchased file for your own personal use.',
        'Print the file at home for personal use.',
        'Save the file to your personal device.',
        'Share the image with friends and family through private messages such as WhatsApp or email.',
        'Post the image on personal social media accounts, provided it is not used commercially and credit is given where appropriate.',
    ];
    $restrictedUses = [
        'Resell the image in digital or printed form.',
        'Upload the file to marketplaces or print-on-demand platforms.',
        'Use the image on products for sale.',
        'Claim the artwork or design as your own.',
        'Edit, adapt or alter the image for resale.',
        'Use the image for business, branding, advertising or commercial purposes without written permission.',
        'Print the image through a professional print company for resale or commercial distribution.',
        'Share the original downloadable file publicly or make it available for others to download.',
    ];
@endphp
<x-app-layout>
    <x-slot name="title">Digital Download Licence - Errant Arts</x-slot>

    <div class="content-shell py-16 text-stone-300">
        <div class="eyebrow">Licence terms</div>
        <h1 class="mt-3 max-w-4xl font-serif text-5xl leading-tight text-stone-50">Digital Download Licence Agreement</h1>
        <p class="mt-5 max-w-3xl text-lg leading-8">
            When you purchase a digital download from this website, you are buying a personal-use licence
            only. You are not buying ownership of the artwork, image, design, copyright, or intellectual property.
        </p>

        <div class="mt-10 grid gap-8 lg:grid-cols-2">
            <div class="panel-surface rounded-2xl p-8">
                <h2 class="font-serif text-3xl text-stone-50">What you can do</h2>
                <ul class="mt-6 space-y-4 text-sm leading-7">
                    @foreach ($allowedUses as $item)
                        <li class="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">{{ $item }}</li>
                    @endforeach
                </ul>
            </div>
            <div class="panel-surface rounded-2xl p-8">
                <h2 class="font-serif text-3xl text-stone-50">What you cannot do</h2>
                <ul class="mt-6 space-y-4 text-sm leading-7">
                    @foreach ($restrictedUses as $item)
                        <li class="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">{{ $item }}</li>
                    @endforeach
                </ul>
            </div>
        </div>

        <div class="panel-surface mt-8 rounded-2xl p-8 text-sm leading-7">
            Questions about a licence, or need a commercial usage licence? Contact
            <a href="mailto:contact@errant-arts.co.uk" class="underline hover:text-accent">contact@errant-arts.co.uk</a>.
        </div>
    </div>
</x-app-layout>
