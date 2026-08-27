@props([
    'variant' => 'primary',
    'type' => 'button',
])

@php
$baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
$variants = [
    'primary' => 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 px-4 py-2 text-sm',
    'secondary' => 'bg-stone-800 hover:bg-stone-700 text-stone-200 focus:ring-stone-500 px-4 py-2 text-sm',
    'outline' => 'border border-stone-700 hover:bg-stone-800 text-stone-300 focus:ring-stone-500 px-4 py-2 text-sm',
];
$classes = $baseClasses . ' ' . ($variants[$variant] ?? $variants['primary']);
@endphp

<button type="{{ $type }}" {{ $attributes->merge(['class' => $classes]) }}>
    {{ $slot }}
</button>
