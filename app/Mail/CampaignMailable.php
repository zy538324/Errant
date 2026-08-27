<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\MarketingCampaign;

class CampaignMailable extends Mailable
{
    use Queueable, SerializesModels;

    public $campaign;

    public function __construct(MarketingCampaign $campaign)
    {
        $this->campaign = $campaign;
    }

    public function build()
    {
        return $this->subject($this->campaign->subject)
                    ->view('emails.campaign');
    }
}
