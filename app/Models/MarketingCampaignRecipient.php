<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;
use App\Models\Concerns\HasCamelTimestamps;

class MarketingCampaignRecipient extends Model
{
    use GeneratesStringId, HasCamelTimestamps;
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
