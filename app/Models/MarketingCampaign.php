<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketingCampaign extends Model
{
    protected $table = 'MarketingCampaign';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'subject', 'previewText', 'bodyText', 'status', 'fromEmail',
        'replyToEmail', 'createdById', 'sentAt',
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
