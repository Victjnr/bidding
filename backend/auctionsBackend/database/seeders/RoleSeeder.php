<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (['buyer', 'seller', 'admin', 'super_admin', 'bidder'] as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        // Ensure default platform admin account exists
        $admin = User::firstOrCreate(
            ['email' => 'admin@uploadauctions.com'],
            [
                'uuid' => (string) Str::uuid(),
                'first_name' => 'Platform',
                'last_name' => 'Admin',
                'display_name' => 'Platform Admin',
                'password' => Hash::make('Password123!'),
                'email_verified_at' => now(),
                'kyc_tier' => 'tier_3',
                'trust_score' => 100.0,
                'status' => 'active',
                'member_since' => now(),
            ]
        );
        $admin->syncRoles(['admin', 'super_admin', 'seller', 'buyer']);

        // Also ensure the first created user in the system has admin + seller roles so the developer can access /app/admin
        $firstUser = User::orderBy('id')->first();
        if ($firstUser) {
            foreach (['buyer', 'seller', 'admin', 'super_admin'] as $r) {
                if (!$firstUser->hasRole($r)) {
                    $firstUser->assignRole($r);
                }
            }
        }
    }
}