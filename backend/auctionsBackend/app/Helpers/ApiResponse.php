<?php

namespace App\Helpers;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * Return a standardized success response.
     */
    public static function success(mixed $data = [], string $message = '', int $status = 200, array $meta = []): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $data,
            'meta' => $meta,
            'message' => $message,
            'errors' => null,
        ], $status);
    }

    /**
     * Return a standardized error response.
     */
    public static function error(string $message, int $status = 400, mixed $errors = null): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'data' => null,
            'meta' => [],
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }

    /**
     * Return a paginated success response.
     */
    public static function paginated(mixed $data, array $meta, string $message = ''): JsonResponse
    {
        $normalizedMeta = array_merge($meta, [
            'currentPage' => $meta['currentPage'] ?? $meta['current_page'] ?? 1,
            'lastPage'    => $meta['lastPage'] ?? $meta['last_page'] ?? 1,
            'perPage'     => $meta['perPage'] ?? $meta['per_page'] ?? 15,
            'total'       => $meta['total'] ?? 0,
            'current_page' => $meta['current_page'] ?? $meta['currentPage'] ?? 1,
            'last_page'    => $meta['last_page'] ?? $meta['lastPage'] ?? 1,
            'per_page'     => $meta['per_page'] ?? $meta['perPage'] ?? 15,
        ]);

        return self::success($data, $message, 200, $normalizedMeta);
    }
}
