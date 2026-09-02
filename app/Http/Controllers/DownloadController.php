<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\DownloadEntitlement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DownloadController extends Controller
{
    /**
     * Issue a short-lived, signed R2 URL for a purchased download and
     * atomically increment the entitlement's download counter.
     */
    public function issue(string $entitlementId)
    {
        $customer = Customer::where('userId', Auth::id())->first();

        abort_if(! $customer, 403);

        $entitlement = DownloadEntitlement::with('artwork.assets')
            ->where('id', $entitlementId)
            ->where('customerId', $customer->id)
            ->firstOrFail();

        if ($entitlement->expiresAt && $entitlement->expiresAt->isPast()) {
            return back()->withErrors(['download' => 'This download link has expired.']);
        }

        if ($entitlement->downloadCount >= $entitlement->maxDownloads) {
            return back()->withErrors(['download' => 'Download limit reached. Please contact support if you need help accessing your purchase.']);
        }

        $asset = $entitlement->artwork->assets
            ->whereIn('kind', ['DOWNLOAD_MASTER', 'ORIGINAL'])
            ->sortBy(fn ($a) => $a->kind === 'DOWNLOAD_MASTER' ? 0 : 1)
            ->first();

        if (! $asset) {
            return back()->withErrors(['download' => 'This artwork has no download file yet. Please contact us.']);
        }

        $updated = DB::table('DownloadEntitlement')
            ->where('id', $entitlement->id)
            ->where('downloadCount', $entitlement->downloadCount)
            ->update(['downloadCount' => $entitlement->downloadCount + 1]);

        if (! $updated) {
            return back()->withErrors(['download' => 'Please try again.']);
        }

        $ttl = (int) config('services.r2.download_ttl_minutes', 15);

        try {
            $url = Storage::disk('r2')->temporaryUrl($asset->storageKey, now()->addMinutes($ttl));
        } catch (\Throwable $e) {
            // Local/dev fallback when the r2 disk isn't configured with real credentials.
            $url = Storage::disk('r2')->url($asset->storageKey);
        }

        return redirect($url);
    }
}
