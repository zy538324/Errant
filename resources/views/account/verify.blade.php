<x-app-layout>
    <x-slot name="title">Enter Your Code - Errant Arts</x-slot>

    <div class="content-shell py-20 max-w-md mx-auto">
        <h1 class="font-serif text-4xl text-stone-50 mb-2">Check your email</h1>
        <p class="text-stone-400 mb-8">We sent a 6-digit code to <strong class="text-stone-200">{{ $email }}</strong>.</p>

        @if ($errors->any())
            <div class="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                @foreach ($errors->all() as $error)
                    <p>{{ $error }}</p>
                @endforeach
            </div>
        @endif

        <form method="POST" action="{{ route('account.login.verify') }}" class="space-y-4">
            @csrf
            <input type="hidden" name="email" value="{{ $email }}">
            <div>
                <label class="block text-sm font-medium text-stone-300 mb-1">6-digit code</label>
                <input type="text" name="code" inputmode="numeric" pattern="[0-9]*" maxlength="6" required autofocus
                    class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 tracking-[0.5em] text-center text-lg focus:border-accent focus:outline-none">
            </div>
            <button type="submit" class="w-full bg-accent hover:bg-accent-strong text-black font-semibold py-3 rounded transition-colors">
                Sign in
            </button>
        </form>

        <form method="POST" action="{{ route('account.login.request') }}" class="mt-4">
            @csrf
            <input type="hidden" name="email" value="{{ $email }}">
            <button type="submit" class="text-sm text-stone-400 hover:text-accent">Resend code</button>
        </form>
    </div>
</x-app-layout>
