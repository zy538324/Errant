<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #222; background: #f5f5f4; padding: 32px;">
    <div style="max-width: 560px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 8px;">
        <p>Thank you for your order, {{ $order->customer->fullName ?? $order->customer->user->email }}.</p>

        <p>Order reference: <strong>{{ $order->id }}</strong></p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
                <tr>
                    <th style="text-align:left;border-bottom:1px solid #ccc;padding:4px 0;">Item</th>
                    <th style="text-align:right;border-bottom:1px solid #ccc;padding:4px 0;">Price</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($order->items as $item)
                    <tr>
                        <td style="padding:4px 0;">{{ $item->artwork->title }}</td>
                        <td style="text-align:right;padding:4px 0;">£{{ number_format($item->unitPence / 100, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <p><strong>Total: £{{ number_format($order->totalPence / 100, 2) }}</strong></p>

        <p>Your digital downloads are ready in your account: <a href="{{ route('account.downloads') }}">{{ route('account.downloads') }}</a></p>
    </div>
</body>
</html>
