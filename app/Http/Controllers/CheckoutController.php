<?php

namespace App\Http\Controllers;

use App\Support\Cart;
use App\Support\Checkout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

class CheckoutController extends Controller
{
    public function show()
    {
        if (Cart::isEmpty()) {
            return redirect()->route('cart')->with('error', 'Your cart is empty.');
        }

        return view('checkout.show', [
            'lines' => Cart::lines(),
            'totalPence' => Cart::totalPence(),
            'user' => Auth::user(),
        ]);
    }

    public function createSession(Request $request)
    {
        if (Cart::isEmpty()) {
            return redirect()->route('cart')->with('error', 'Your cart is empty.');
        }

        $data = $request->validate([
            'email' => ['nullable', 'email'],
            'accepted_licence' => ['required', 'accepted'],
        ], [
            'accepted_licence.accepted' => 'You must accept the digital download licence to continue.',
        ]);

        try {
            $customer = Checkout::resolveCustomer(Auth::user(), $data['email'] ?? null);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['email' => $e->getMessage()])->withInput();
        }

        $lines = Cart::lines();
        $artworkIds = array_values(array_unique(array_map(fn ($l) => $l['artwork']->id, $lines)));

        if (empty($artworkIds)) {
            return redirect()->route('cart')->with('error', 'Your cart items are no longer available.');
        }

        try {
            $order = Checkout::createPendingOrder($customer->id, $artworkIds);
        } catch (\RuntimeException $e) {
            return redirect()->route('cart')->with('error', $e->getMessage());
        }

        $secret = config('services.stripe.secret');

        if (! $secret) {
            Log::warning('Stripe secret key is not configured; cannot create checkout session.');

            return back()->withErrors(['email' => 'Checkout is not configured yet. Please contact us directly.']);
        }

        $stripe = new StripeClient($secret);

        try {
            $session = $stripe->checkout->sessions->create([
                'mode' => 'payment',
                'success_url' => route('checkout.complete').'?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('cart'),
                'expires_at' => now()->addMinutes(30)->timestamp,
                'customer_email' => $customer->user->email,
                'line_items' => collect($order->items)->map(function ($item) {
                    return [
                        'quantity' => 1,
                        'price_data' => [
                            'currency' => strtolower(config('cashier.currency', 'gbp')),
                            'unit_amount' => $item->unitPence,
                            'product_data' => [
                                'name' => $item->artwork->title,
                                'metadata' => ['artworkId' => $item->artworkId],
                            ],
                        ],
                    ];
                })->all(),
                'metadata' => [
                    'orderId' => $order->id,
                    'customerId' => $customer->id,
                ],
            ]);

            $order->stripeCheckoutId = $session->id;
            $order->save();
        } catch (\Throwable $e) {
            \App\Support\Checkout::releasePendingOrder($order->id);
            Log::error('Stripe checkout session creation failed: '.$e->getMessage());

            return back()->withErrors(['email' => 'Unable to start checkout. Please try again.']);
        }

        return redirect($session->url);
    }

    public function complete(Request $request)
    {
        $sessionId = $request->query('session_id');

        if (! $sessionId) {
            return redirect()->route('shop');
        }

        $secret = config('services.stripe.secret');
        $order = null;

        if ($secret) {
            try {
                $stripe = new StripeClient($secret);
                $session = $stripe->checkout->sessions->retrieve($sessionId);

                if ($session->payment_status === 'paid' && $session->metadata['orderId'] ?? null) {
                    $order = Checkout::markOrderPaid(
                        $session->metadata['orderId'],
                        is_string($session->payment_intent) ? $session->payment_intent : $session->payment_intent?->id,
                        $session->id
                    );
                    Cart::clear();
                }
            } catch (\Throwable $e) {
                Log::error('Checkout complete lookup failed: '.$e->getMessage());
            }
        }

        return view('checkout.complete', ['order' => $order]);
    }
}
