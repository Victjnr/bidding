<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['slug' => 'electronics', 'name' => 'Electronics', 'icon' => 'laptop', 'sort_order' => 1],
            ['slug' => 'real-estate', 'name' => 'Real Estate', 'icon' => 'home', 'sort_order' => 2],
            ['slug' => 'vehicles', 'name' => 'Vehicles', 'icon' => 'car', 'sort_order' => 3],
            ['slug' => 'fashion', 'name' => 'Fashion', 'icon' => 'shirt', 'sort_order' => 4],
            ['slug' => 'health-beauty', 'name' => 'Health & Beauty', 'icon' => 'heart', 'sort_order' => 5],
            ['slug' => 'books-media', 'name' => 'Books & Media', 'icon' => 'book', 'sort_order' => 6],
            ['slug' => 'home-garden', 'name' => 'Home & Garden', 'icon' => 'coffee', 'sort_order' => 7],
        ];

        foreach ($categories as $category) {
            \App\Models\Category::updateOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
