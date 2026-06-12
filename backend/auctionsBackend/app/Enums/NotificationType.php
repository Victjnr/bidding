<?php

namespace App\Enums;

enum NotificationType: string
{
    case Outbid = 'outbid';
    case Won = 'won';
    case PaymentDue = 'payment_due';
    case AuctionEndingSoon = 'auction_ending_soon';
    case ReserveMet = 'reserve_met';
    case NoSale = 'no_sale';
    case DisputeOpened = 'dispute_opened';
    case DisputeResolved = 'dispute_resolved';
    case KycApproved = 'kyc_approved';
    case KycRejected = 'kyc_rejected';
    case ProxyExhausted = 'proxy_exhausted';
    case ItemShipped = 'item_shipped';
}
