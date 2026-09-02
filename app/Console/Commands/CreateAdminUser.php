<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CreateAdminUser extends Command
{
    protected $signature = 'admin:create {email} {--password=} {--username=}';

    protected $description = 'Create (or promote) an admin user.';

    public function handle(): int
    {
        $email = strtolower(trim($this->argument('email')));

        $validator = Validator::make(['email' => $email], ['email' => 'required|email']);

        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }

        $password = $this->option('password') ?: Str::password(16);

        $user = User::firstOrNew(['email' => $email]);
        $isNew = ! $user->exists;

        $user->username = $user->username ?: ($this->option('username') ?: Str::slug(explode('@', $email)[0]));
        $user->passwordHash = Hash::make($password);
        $user->role = 'ADMIN';
        $user->save();

        $this->info(($isNew ? 'Created' : 'Promoted').' admin user: '.$email);

        if (! $this->option('password')) {
            $this->warn('Generated password (save this now, it will not be shown again): '.$password);
        }

        return self::SUCCESS;
    }
}
