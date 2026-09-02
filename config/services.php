<?php

return [

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

    /*
     * Cloudflare R2 (or any S3-compatible store) used for digital download
     * masters and watermarked previews. Mirrors the "r2" disk in
     * config/filesystems.php.
     */
    'r2' => [
        'download_ttl_minutes' => env('R2_DOWNLOAD_TTL_MINUTES', 15),
        'preview_ttl_minutes' => env('R2_PREVIEW_TTL_MINUTES', 60),
    ],

];
