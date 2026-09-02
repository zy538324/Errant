<?php

namespace App\Http\Controllers;

use App\Mail\LoginCode;
use App\Models\Customer;
use App\Models\CustomerLoginCode;
use App\Models\DownloadEntitlement;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AccountController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('account.dashboard');
        }

        return view('account.login');
    }

    /**
     * Step 1: email in, one-time code emailed out.
     */
    public function requestCode(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $email = strtolower(trim($data['email']));

        $user = User::firstOrCreate(
            ['email' => $email],
            ['username' => $this->uniqueUsername($email), 'role' => 'CUSTOMER']
        );

        // Throttle: no more than one active code request per minute per email.
        $recent = CustomerLoginCode::where('email', $email)
            ->where('createdAt', '>=', now()->subMinute())
            ->exists();

        if (! $recent) {
            $code = (string) random_int(100000, 999999);

            CustomerLoginCode::create([
                'userId' => $user->id,
                'email' => $email,
                'codeHash' => Hash::make($code),
                'expiresAt' => now()->addMinutes(10),
                'ipAddress' => $request->ip(),
            ]);

            Mail::to($email)->send(new LoginCode($code));
        }

        return view('account.verify', ['email' => $email]);
    }

    /**
     * Step 2: code in, session established.
     */
    public function verifyCode(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
        ]);

        $email = strtolower(trim($data['email']));

        $loginCode = CustomerLoginCode::where('email', $email)
            ->whereNull('consumedAt')
            ->where('expiresAt', '>=', now())
            ->orderByDesc('createdAt')
            ->first();

        if (! $loginCode || $loginCode->attempts >= 5 || ! Hash::check($data['code'], $loginCode->codeHash)) {
            if ($loginCode) {
                $loginCode->increment('attempts');
            }

            return back()->withErrors(['code' => 'That code is invalid or has expired.'])->withInput();
        }

        $loginCode->consumedAt = now();
        $loginCode->save();

        $user = User::findOrFail($loginCode->userId);
        Customer::firstOrCreate(['userId' => $user->id]);

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect()->intended(route('account.dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function dashboard()
    {
        $customer = $this->customer();

        return view('account.dashboard', [
            'customer' => $customer,
            'recentOrders' => Order::where('customerId', $customer->id)
                ->orderByDesc('createdAt')
                ->limit(5)
                ->get(),
        ]);
    }

    public function orders()
    {
        $customer = $this->customer();

        return view('account.orders', [
            'orders' => Order::where('customerId', $customer->id)
                ->with('items.artwork')
                ->orderByDesc('createdAt')
                ->paginate(10),
        ]);
    }

    public function downloads()
    {
        $customer = $this->customer();

        return view('account.downloads', [
            'entitlements' => DownloadEntitlement::where('customerId', $customer->id)
                ->with('artwork')
                ->orderByDesc('createdAt')
                ->get(),
        ]);
    }

    public function privacy()
    {
        return view('account.privacy', ['customer' => $this->customer()]);
    }

    protected function customer(): Customer
    {
        $user = Auth::user();

        return Customer::firstOrCreate(['userId' => $user->id]);
    }

    protected function uniqueUsername(string $email): string
    {
        $base = Str::slug(explode('@', $email)[0]) ?: 'customer';
        $username = $base;
        $suffix = 0;

        while (User::where('username', $username)->exists()) {
            $suffix++;
            $username = $base.'-'.$suffix;
        }

        return $username;
    }
}
