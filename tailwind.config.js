import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.vue',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
                serif: ['Great Vibes', ...defaultTheme.fontFamily.serif],
            },
            colors: {
                background: 'var(--brand-background)',
                foreground: 'var(--brand-foreground)',
                accent: 'var(--brand-accent)',
                'accent-strong': 'var(--brand-accent-strong)',
                panel: 'var(--brand-panel)',
                'panel-elevated': 'var(--brand-panel-elevated)',
            },
        },
    },
    plugins: [],
};
