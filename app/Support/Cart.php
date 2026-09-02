<?php

namespace App\Support;

use App\Models\Artwork;
use Illuminate\Support\Facades\Session;

/**
 * Session-backed shopping cart. Prices are never trusted from the session —
 * every read re-resolves against the live Artwork record, and Checkout
 * re-validates again immediately before creating a Stripe session.
 */
class Cart
{
    protected const SESSION_KEY = 'cart';

    public static function items(): array
    {
        return Session::get(self::SESSION_KEY, []);
    }

    public static function add(string $artworkId, string $kind = 'digital', ?string $printSku = null, int $quantity = 1): void
    {
        $items = self::items();
        $key = self::key($artworkId, $kind, $printSku);

        if ($kind === 'digital') {
            // One licence per artwork — adding again just confirms it's in the cart.
            $items[$key] = [
                'artworkId' => $artworkId,
                'kind' => $kind,
                'printSku' => null,
                'quantity' => 1,
            ];
        } elseif (isset($items[$key])) {
            $items[$key]['quantity'] += max(1, $quantity);
        } else {
            $items[$key] = [
                'artworkId' => $artworkId,
                'kind' => $kind,
                'printSku' => $printSku,
                'quantity' => max(1, $quantity),
            ];
        }

        Session::put(self::SESSION_KEY, $items);
    }

    public static function updateQuantity(string $key, int $quantity): void
    {
        $items = self::items();

        if (! isset($items[$key])) {
            return;
        }

        if ($quantity <= 0) {
            unset($items[$key]);
        } else {
            $items[$key]['quantity'] = $quantity;
        }

        Session::put(self::SESSION_KEY, $items);
    }

    public static function remove(string $key): void
    {
        $items = self::items();
        unset($items[$key]);
        Session::put(self::SESSION_KEY, $items);
    }

    public static function clear(): void
    {
        Session::forget(self::SESSION_KEY);
    }

    public static function count(): int
    {
        return (int) array_sum(array_column(self::items(), 'quantity'));
    }

    /**
     * Cart lines resolved against live, published Artwork records.
     * Anything unpublished/deleted/out of stock since it was added is silently dropped.
     *
     * @return array<int, array{key: string, artwork: Artwork, kind: string, printSku: ?string, quantity: int, unitPence: int, subtotalPence: int}>
     */
    public static function lines(): array
    {
        $items = self::items();

        if (empty($items)) {
            return [];
        }

        $artworkIds = array_unique(array_column($items, 'artworkId'));
        $artworks = Artwork::whereIn('id', $artworkIds)
            ->where('status', 'PUBLISHED')
            ->get()
            ->keyBy('id');

        $lines = [];

        foreach ($items as $key => $item) {
            $artwork = $artworks->get($item['artworkId']);

            if (! $artwork) {
                continue;
            }

            if ($item['kind'] === 'print' && $artwork->stockOnHand !== null && $artwork->stockOnHand < $item['quantity']) {
                continue;
            }

            $lines[] = [
                'key' => $key,
                'artwork' => $artwork,
                'kind' => $item['kind'],
                'printSku' => $item['printSku'],
                'quantity' => $item['quantity'],
                'unitPence' => $artwork->pricePence,
                'subtotalPence' => $artwork->pricePence * $item['quantity'],
            ];
        }

        return $lines;
    }

    public static function totalPence(): int
    {
        return (int) array_sum(array_column(self::lines(), 'subtotalPence'));
    }

    public static function isEmpty(): bool
    {
        return empty(self::lines());
    }

    protected static function key(string $artworkId, string $kind, ?string $printSku): string
    {
        return $kind.':'.$artworkId.':'.($printSku ?? '-');
    }
}
