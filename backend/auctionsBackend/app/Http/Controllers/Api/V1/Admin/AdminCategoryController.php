<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCategoryController extends Controller
{
    /**
     * GET /api/v1/admin/categories
     */
    public function index(): JsonResponse
    {
        $categories = Category::withTrashed()->orderBy('sort_order')->get();
        return ApiResponse::success($categories, 'Categories retrieved');
    }

    /**
     * POST /api/v1/admin/categories
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:categories,name',
            'icon'        => 'nullable|string|max:50',
            'description' => 'nullable|string|max:500',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        $category = Category::create([
            'slug'        => Str::slug($validated['name']),
            'name'        => $validated['name'],
            'icon'        => $validated['icon'] ?? null,
            'description' => $validated['description'] ?? null,
            'sort_order'  => $validated['sort_order'] ?? 0,
        ]);

        return ApiResponse::success($category, 'Category created', 201);
    }

    /**
     * PUT /api/v1/admin/categories/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::withTrashed()->findOrFail($id);

        $validated = $request->validate([
            'name'        => "required|string|max:100|unique:categories,name,{$id}",
            'icon'        => 'nullable|string|max:50',
            'description' => 'nullable|string|max:500',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        $category->update([
            'slug'        => Str::slug($validated['name']),
            'name'        => $validated['name'],
            'icon'        => $validated['icon'] ?? $category->icon,
            'description' => $validated['description'] ?? $category->description,
            'sort_order'  => $validated['sort_order'] ?? $category->sort_order,
        ]);

        return ApiResponse::success($category->fresh(), 'Category updated');
    }

    /**
     * DELETE /api/v1/admin/categories/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->delete(); // Soft delete

        return ApiResponse::success(null, 'Category deleted');
    }

    /**
     * POST /api/v1/admin/categories/{id}/restore
     */
    public function restore(int $id): JsonResponse
    {
        $category = Category::withTrashed()->findOrFail($id);
        $category->restore();

        return ApiResponse::success($category, 'Category restored');
    }
}
