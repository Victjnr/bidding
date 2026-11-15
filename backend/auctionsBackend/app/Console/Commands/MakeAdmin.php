<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class MakeAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:make-admin {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Make a user an administrator by email and ensure the admin role exists.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        // Check if the user exists
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found!");
            return Command::FAILURE;
        }

        // Ensure the admin role exists
        $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        
        // Ensure other basic roles exist just in case
        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        // Assign the role
        $user->assignRole($role);

        $this->info("User {$user->first_name} ({$email}) has been made an admin successfully!");

        return Command::SUCCESS;
    }
}
