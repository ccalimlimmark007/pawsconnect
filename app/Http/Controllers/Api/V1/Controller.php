<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class Controller
{
    protected function ok(mixed $data): JsonResponse
    {
        return response()->json(['data' => $data]);
    }

    protected function created(mixed $data, string $message = 'Created.'): JsonResponse
    {
        return response()->json(['data' => $data, 'message' => $message], 201);
    }

    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    protected function notFound(string $message = 'Resource not found.'): JsonResponse
    {
        return response()->json(['message' => $message], 404);
    }

    protected function forbidden(string $message = 'Forbidden.'): JsonResponse
    {
        return response()->json(['message' => $message], 403);
    }

    /** Paginated list response with standard meta block. */
    protected function paginated(LengthAwarePaginator $paginator, callable $transform): JsonResponse
    {
        return response()->json([
            'data' => collect($paginator->items())->map($transform)->values(),
            'meta' => [
                'total'     => $paginator->total(),
                'page'      => $paginator->currentPage(),
                'per_page'  => $paginator->perPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }
}
