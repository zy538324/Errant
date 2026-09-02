<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;
use App\Models\Concerns\HasCamelTimestamps;

class EmailSubscriber extends Model
{
    use GeneratesStringId, HasCamelTimestamps;
    protected $table = 'EmailSubscriber';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'email', 'customerId', 'status', 'consentSource', 'consentVersion',
        'consentText', 'consentedAt', 'unsubscribedAt',
    ];

    protected $casts = [
        'consentedAt' => 'datetime',
        'unsubscribedAt' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customerId', 'id');
    }

    public function consentEvents()
    {
        return $this->hasMany(MarketingConsentEvent::class, 'subscriberId', 'id');
    }

    public function recipients()
    {
        return $this->hasMany(MarketingCampaignRecipient::class, 'subscriberId', 'id');
    }
}
