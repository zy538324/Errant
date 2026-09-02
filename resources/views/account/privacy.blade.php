<x-app-layout>
    <x-slot name="title">Privacy Settings - Errant Arts</x-slot>

    <div class="content-shell py-16 max-w-2xl">
        <h1 class="font-serif text-4xl text-stone-50 mb-10">Privacy Settings</h1>

        <div class="panel-surface rounded-2xl p-6">
            <p class="text-stone-300">Marketing emails: {{ $customer->marketingConsent ? 'Subscribed' : 'Not subscribed' }}</p>
            <p class="mt-4 text-sm text-stone-400">
                To request deletion of your personal data, contact
                <a href="mailto:contact@errant-arts.co.uk" class="underline hover:text-accent">contact@errant-arts.co.uk</a>.
            </p>
        </div>
    </div>
</x-app-layout>
