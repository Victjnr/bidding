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
        return self::success($data, $message, 200, $meta);
    }
}
