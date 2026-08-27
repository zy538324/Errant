<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'User';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'email', 'username', 'passwordHash', 'role', 'mfaEnabled', 'mfaSecret',
    ];

    protected $hidden = [
        'passwordHash', 'mfaSecret',
    ];

    public function getAuthPassword()
    {
        return $this->passwordHash;
    }

    public function customer()
    {
        return $this->hasOne(Customer::class, 'userId', 'id');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'userId', 'id');
    }

    public function blogPosts()
    {
        return $this->hasMany(BlogPost::class, 'authorId', 'id');
    }

    public function marketingCampaigns()
    {
        return $this->hasMany(MarketingCampaign::class, 'createdById', 'id');
    }

    public function moderatedReviews()
    {
        return $this->hasMany(CustomerReview::class, 'moderatedById', 'id');
    }
}
