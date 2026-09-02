<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;
use App\Models\Concerns\HasCamelTimestamps;

class MarketingCampaign extends Model
{
    use GeneratesStringId, HasCamelTimestamps;
    protected $table = 'MarketingCampaign';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'subject', 'previewText', 'bodyText', 'status', 'fromEmail',
        'replyToEmail', 'createdById', 'sentAt',
    ];

    protected $casts = [
        'sentAt' => 'datetime',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'createdById', 'id');
    }

    public function recipients()
    {
        return $this->hasMany(MarketingCampaignRecipient::class, 'campaignId', 'id');
    }
}
