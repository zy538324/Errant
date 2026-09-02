<?php

namespace App\Support;

use App\Models\Artwork;
use App\Models\Customer;
use App\Models\DownloadEntitlement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Order lifecycle: pending order -> Stripe checkout -> paid -> download
 * entitlements. Mirrors src/modules/checkout and src/modules/fulfilment
 * from the reference Next.js app.
 */
class Checkout
{
    /**
     * Find-or-create the Customer to attach an order to. Logged-in users use
     * their own Customer record; guests are resolved (or created) by email,
     * matching the reference app's guest-checkout behaviour.
     */
    public static function resolveCustomer(?User $user, ?string $email): Customer
    {
        if ($user) {
            $customer = Customer::where('userId', $user->id)->first();

            return $customer ?: Customer::create(['userId' => $user->id]);
        }

        $email = strtolower(trim((string) $email));

        if ($email === '' || ! str_contains($email, '@')) {
            throw new RuntimeException('Enter an email address to continue checkout.');
        }

        $guestUser = User::where('email', $email)->first();

        if (! $guestUser) {
            $guestUser = User::create([
                'email' => $email,
                'username' => self::uniqueGuestUsername($email),
                'role' => 'CUSTOMER',
            ]);
        }

        $customer = Customer::where('userId', $guestUser->id)->first();

        return $customer ?: Customer::create(['userId' => $guestUser->id]);
    }

    protected static function uniqueGuestUsername(string $email): string
    {
        $base = Str::slug(explode('@', $email)[0]) ?: 'guest';
        $username = $base;
        $suffix = 0;

        while (User::where('username', $username)->exists()) {
            $suffix++;
            $username = $base.'-'.$suffix;
        }

        return $username;
    }

    /**
     * Create a PENDING order for a set of artworks, decrementing stock for
     * anything with finite stock. Throws if any artwork is unavailable.
     *
     * @param  array<int, string>  $artworkIds
     */
    public static function createPendingOrder(string $customerId, array $artworkIds): Order
    {
        return DB::transaction(function () use ($customerId, $artworkIds) {
            $artworks = Artwork::whereIn('id', $artworkIds)
                ->where('status', 'PUBLISHED')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($artworks->count() !== count(array_unique($artworkIds))) {
                throw new RuntimeException('One or more artworks are unavailable for purchase.');
            }

            foreach ($artworkIds as $artworkId) {
                $artwork = $artworks->get($artworkId);

                if ($artwork->stockOnHand === null) {
                    continue;
                }

                if ($artwork->stockOnHand <= 0) {
                    throw new RuntimeException('One or more artworks are sold out.');
                }

                $decremented = Artwork::where('id', $artworkId)
                    ->where('status', 'PUBLISHED')
                    ->where('stockOnHand', '>=', 1)
                    ->decrement('stockOnHand');

                if (! $decremented) {
                    throw new RuntimeException('One or more artworks are sold out.');
                }
            }

            $totalPence = array_sum(array_map(
                fn (string $id) => $artworks->get($id)->pricePence,
                $artworkIds
            ));

            $order = Order::create([
                'customerId' => $customerId,
                'totalPence' => $totalPence,
                'status' => 'PENDING',
            ]);

            foreach ($artworkIds as $artworkId) {
                OrderItem::create([
                    'orderId' => $order->id,
                    'artworkId' => $artworkId,
                    'unitPence' => $artworks->get($artworkId)->pricePence,
                    'quantity' => 1,
                    'kind' => 'digital',
                ]);
            }

            return $order->load('items');
        });
    }

    /**
     * Transition an order to PAID and grant digital download entitlements.
     * Idempotent: safe to call more than once for the same order (webhook
     * retries, or a customer landing back on the success page).
     */
    public static function markOrderPaid(string $orderId, ?string $paymentIntentId, ?string $checkoutSessionId): Order
    {
        return DB::transaction(function () use ($orderId, $paymentIntentId, $checkoutSessionId) {
            $order = Order::with('items')->lockForUpdate()->findOrFail($orderId);

            if (in_array($order->status, ['PAID', 'FULFILLED'], true)) {
                $order->fill(array_filter([
                    'stripePaymentIntentId' => $paymentIntentId && ! $order->stripePaymentIntentId ? $paymentIntentId : null,
                    'stripeCheckoutId' => $checkoutSessionId && ! $order->stripeCheckoutId ? $checkoutSessionId : null,
                ]))->save();

                self::ensureDigitalEntitlements($order);

                return $order;
            }

            if ($order->status !== 'PENDING') {
                throw new RuntimeException("Order cannot be marked as paid from status {$order->status}.");
            }

            $order->status = 'PAID';
            if ($paymentIntentId) {
                $order->stripePaymentIntentId = $paymentIntentId;
            }
            if ($checkoutSessionId && ! $order->stripeCheckoutId) {
                $order->stripeCheckoutId = $checkoutSessionId;
            }
            $order->save();

            self::ensureDigitalEntitlements($order);
            self::sendOrderConfirmation($order);

            return $order;
        });
    }

    protected static function ensureDigitalEntitlements(Order $order): void
    {
        foreach ($order->items as $item) {
            if ($item->kind !== 'digital') {
                continue;
            }

            DownloadEntitlement::firstOrCreate(
                ['orderId' => $order->id, 'artworkId' => $item->artworkId],
                ['customerId' => $order->customerId, 'maxDownloads' => 5]
            );
        }
    }

    protected static function sendOrderConfirmation(Order $order): void
    {
        try {
            $email = $order->customer->user->email ?? null;

            if ($email) {
                \Illuminate\Support\Facades\Mail::to($email)->send(new \App\Mail\OrderConfirmation($order->load('items.artwork', 'customer.user')));
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Order confirmation email failed: '.$e->getMessage());
        }
    }

    /**
     * Cancel a still-pending order and restore any decremented stock.
     */
    public static function releasePendingOrder(string $orderId): Order
    {
        return DB::transaction(function () use ($orderId) {
            $order = Order::with('items')->lockForUpdate()->findOrFail($orderId);

            if ($order->status !== 'PENDING') {
                return $order;
            }

            foreach ($order->items as $item) {
                $artwork = Artwork::find($item->artworkId);

                if ($artwork && $artwork->stockOnHand !== null) {
                    $artwork->increment('stockOnHand', max(1, $item->quantity));
                }
            }

            $order->status = 'CANCELLED';
            $order->save();

            return $order;
        });
    }
}
