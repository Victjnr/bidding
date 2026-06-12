<?php

namespace App\Contracts\Payment;

use App\DTOs\Payment\CaptureEscrowDTO;
use App\DTOs\Payment\ReleaseEscrowDTO;
use App\Models\Transaction;

interface IPaymentService
{
    public function capturePayment(CaptureEscrowDTO $dto): Transaction;
    public function releaseEscrow(ReleaseEscrowDTO $dto): Transaction;
}
