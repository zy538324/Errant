<?php

namespace App\Http\Controllers;

use App\Support\Checkout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $secret = config('services.stripe.webhook_secret');
        $signature = $request->header('Stripe-Signature');

        if (! $secret || ! $signature) {
            return response('Webhook secret not configured.', 500);
        }

        try {
            $event = Webhook::constructEvent($request->getContent(), $signature, $secret);
        } catch (SignatureVerificationException|\UnexpectedValueException $e) {
            Log::warning('Stripe webhook signature verification failed: '.$e->getMessage());

            return response('Invalid signature.', 400);
        }

        $session = $event->data->object ?? null;

        try {
            if (in_array($event->type, ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)) {
                $orderId = $session->metadata->orderId ?? null;

                if ($orderId && $session->payment_status === 'paid') {
                    Checkout::markOrderPaid(
                        $orderId,
                        is_string($session->payment_intent) ? $session->payment_intent : ($session->payment_intent->id ?? null),
                        $session->id
                    );
                }
            }

            if ($event->type === 'checkout.session.expired') {
                $orderId = $session->metadata->orderId ?? null;

                if ($orderId) {
                    Checkout::releasePendingOrder($orderId);
                }
            }
        } catch (\Throwable $e) {
            Log::error('Stripe webhook processing failed: '.$e->getMessage());

            return response('Webhook processing failed.', 400);
        }

        return response('ok');
    }
}
