<?php

use App\Exceptions\AuctionAlreadyClosedException;
use App\Exceptions\AuctionNotActiveException;
use App\Exceptions\BidTooLowException;
use App\Exceptions\CannotBidOwnAuctionException;
use App\Exceptions\DisputeWindowExpiredException;
use App\Exceptions\DuplicateBidException;
use App\Exceptions\EscrowNotReleasableException;
use App\Exceptions\InsufficientFundsException;
use App\Exceptions\InvalidStateTransitionException;
use App\Exceptions\KycTierInsufficientException;
use App\Exceptions\PaymentCapturedException;
use App\Exceptions\TooManyBidsException;
use App\Helpers\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\SanitiseInputMiddleware::class);
        $middleware->alias([
            'security.headers' => \App\Http\Middleware\SecurityHeadersMiddleware::class,
            'force.https' => \App\Http\Middleware\ForceHttpsMiddleware::class,
            'security.log' => \App\Http\Middleware\LogSecurityEvents::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (!$request->is('api/*') && !$request->wantsJson()) {
                return null;
            }

            if ($e instanceof ValidationException) {
                return ApiResponse::error(
                    $e->getMessage() ?: 'Validation failed.',
                    422,
                    $e->errors()
                );
            }

            if ($e instanceof AuthenticationException) {
                return ApiResponse::error('Unauthenticated.', 401);
            }

            if ($e instanceof AuthorizationException) {
                return ApiResponse::error($e->getMessage() ?: 'This action is unauthorized.', 403);
            }

            if ($e instanceof ModelNotFoundException) {
                return ApiResponse::error('Resource not found.', 404);
            }

            $domainMap = [
                AuctionNotActiveException::class => 422,
                BidTooLowException::class => 422,
                CannotBidOwnAuctionException::class => 403,
                KycTierInsufficientException::class => 403,
                DuplicateBidException::class => 409,
                InsufficientFundsException::class => 402,
                AuctionAlreadyClosedException::class => 410,
                PaymentCapturedException::class => 409,
                DisputeWindowExpiredException::class => 422,
                EscrowNotReleasableException::class => 422,
                TooManyBidsException::class => 429,
                InvalidStateTransitionException::class => 422,
            ];

            foreach ($domainMap as $class => $status) {
                if ($e instanceof $class) {
                    return ApiResponse::error($e->getMessage() ?: 'Domain validation error.', $status);
                }
            }

            if ($e instanceof HttpExceptionInterface) {
                return ApiResponse::error(
                    $e->getMessage() ?: 'HTTP error.',
                    $e->getStatusCode()
                );
            }

            return ApiResponse::error(
                $e->getMessage() ?: 'An unexpected server error occurred.',
                500
            );
        });
    })->create();
