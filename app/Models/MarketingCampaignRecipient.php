<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketingCampaignRecipient extends Model
{
    protected $table = 'MarketingCampaignRecipient';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'campaignId', 'subscriberId', 'email', 'status', 'messageId', 'error', 'sentAt',
    ];

    public function campaign()
    {
        return $this->belongsTo(MarketingCampaign::class, 'campaignId', 'id');
    }

    public function subscriber()
    {
        return $this->belongsTo(EmailSubscriber::class, 'subscriberId', 'id');
    }
}
