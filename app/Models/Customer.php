<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;

class Customer extends Model
{
    use GeneratesStringId;
    protected $table = 'Customer';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'userId', 'fullName', 'marketingConsent', 'consentAt', 'retentionLocked',
    ];

    protected $casts = [
        'consentAt' => 'datetime',
        'marketingConsent' => 'boolean',
        'retentionLocked' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'userId', 'id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'customerId', 'id');
    }

    public function entitlements()
    {
        return $this->hasMany(DownloadEntitlement::class, 'customerId', 'id');
    }

    public function printOrders()
    {
        return $this->hasMany(PrintOrder::class, 'customerId', 'id');
    }

    public function emailSubscriber()
    {
        return $this->hasOne(EmailSubscriber::class, 'customerId', 'id');
    }

    public function consentEvents()
    {
        return $this->hasMany(MarketingConsentEvent::class, 'customerId', 'id');
    }

    public function reviews()
    {
        return $this->hasMany(CustomerReview::class, 'customerId', 'id');
    }
}
