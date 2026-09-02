<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Concerns\GeneratesStringId;
use App\Models\Concerns\HasCamelTimestamps;

class User extends Authenticatable
{
    use GeneratesStringId, HasCamelTimestamps;
    use HasFactory, Notifiable;

    protected $table = 'User';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'email', 'username', 'passwordHash', 'role', 'mfaEnabled', 'mfaSecret',
    ];

    protected $casts = [
        'mfaEnabled' => 'boolean',
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

    public function sessions()
    {
        return $this->hasMany(Session::class, 'userId', 'id');
    }

    public function loginCodes()
    {
        return $this->hasMany(CustomerLoginCode::class, 'userId', 'id');
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
