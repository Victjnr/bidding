<?php

namespace App\Exceptions;

use App\Helpers\ApiResponse;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        $this->renderable(function (Throwable $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                $status = $this->getExceptionStatus($e);
                
                return ApiResponse::error(
                    $e->getMessage() ?: 'An error occurred.',
                    $status,
                    method_exists($e, 'errors') ? $e->errors() : null
                );
            }
        });
    }

    /**
     * Get the HTTP status code for a given exception.
     */
    protected function getExceptionStatus(Throwable $e): int
    {
        $map = [
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

        foreach ($map as $class => $status) {
            if ($e instanceof $class) {
                return $status;
            }
        }

        if ($this->isHttpException($e)) {
            return $e->getStatusCode();
        }

        return 500;
    }
}
