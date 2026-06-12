<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogSecurityEvents
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Define security sensitive routes
        $securityRoutes = [
            'login', 'register', 'password.email', 'password.reset', 'password.update', '2fa.verify'
        ];

        if ($request->route() && in_array($request->route()->getName(), $securityRoutes)) {
            Log::channel('security')->info('Security Event', [
                'route' => $request->route()->getName(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'status' => $response->getStatusCode(),
                'user_id' => $request->user()?->id ?? 'guest',
            ]);
        }

        return $response;
    }
}
