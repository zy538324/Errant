<x-app-layout>
    <x-slot name="title">Admin Sign In - Errant Arts</x-slot>

    <div class="content-shell py-20 max-w-md mx-auto">
        <h1 class="font-serif text-4xl text-stone-50 mb-8">Admin Sign In</h1>

        @if ($errors->any())
            <div class="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                @foreach ($errors->all() as $error)
                    <p>{{ $error }}</p>
                @endforeach
            </div>
        @endif

        <form method="POST" action="{{ route('admin.login.store') }}" class="space-y-4">
            @csrf
            <div>
                <label class="block text-sm font-medium text-stone-300 mb-1">Email</label>
                <input type="email" name="email" required value="{{ old('email') }}"
                    class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-stone-300 mb-1">Password</label>
                <input type="password" name="password" required
                    class="w-full bg-panel-elevated border border-white/10 text-stone-200 rounded px-3 py-2 focus:border-accent focus:outline-none">
            </div>
            <label class="flex items-center gap-2 text-sm text-stone-400">
                <input type="checkbox" name="remember">
                Remember me
            </label>
            <button type="submit" class="w-full bg-accent hover:bg-accent-strong text-black font-semibold py-3 rounded transition-colors">
                Sign in
            </button>
        </form>
    </div>
</x-app-layout>
