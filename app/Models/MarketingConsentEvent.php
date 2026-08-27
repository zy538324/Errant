<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketingConsentEvent extends Model
{
    protected $table = 'MarketingConsentEvent';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'subscriberId', 'customerId', 'email', 'eventType', 'source',
        'consentVersion', 'consentText', 'ipAddress', 'userAgent', 'metadataJson', 'createdAt',
    ];

    public function subscriber()
    {
        return $this->belongsTo(EmailSubscriber::class, 'subscriberId', 'id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customerId', 'id');
    }
}
