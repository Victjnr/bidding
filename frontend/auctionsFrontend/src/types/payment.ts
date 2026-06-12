export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'disputed' | 'refunded';

export interface PaymentMethodResource {
  id: number;
  type: 'ecocash' | 'onemoney' | 'card' | 'bank_transfer';
  provider: string; // e.g., 'paynow'
  mobileNumber?: string; // For EcoCash/OneMoney
  lastFour?: string; // For cards if Paynow provides a tokenized version in future
  isDefault: boolean;
}

export interface TransactionResource {
  id: number;
  uuid: string;
  auctionId: string;
  buyerId: string;
  sellerId: string;
  type: 'payment' | 'payout' | 'refund' | 'fee';
  status: TransactionStatus;
  amount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  providerTxnId: string;
  createdAt: string;
}

export interface WalletEntry {
  id: number;
  type: 'credit' | 'debit' | 'hold' | 'release';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface DisputeResource {
  id: number;
  uuid: string;
  transactionId: number;
  reason: 'not_received' | 'not_as_described' | 'fraud' | 'other';
  status: 'opened' | 'under_review' | 'resolved' | 'closed';
  description: string;
  raisedBy: string;
  resolution?: 'buyer_favoured' | 'seller_favoured';
  moderatorNotes?: string;
  createdAt: string;
}

// Paynow Specific
export interface PaynowInitPayload {
  auctionUuid: string;
  paymentMethod: 'ecocash' | 'onemoney' | 'paynow_web'; // paynow_web redirects to Paynow site for card/other
  mobileNumber?: string; // Required for ecocash/onemoney express checkout
  email: string;
}

export interface PaynowInitResponse {
  success: boolean;
  pollUrl: string;
  redirectUrl?: string; // Redirect here if using web integration
  instructions?: string; // e.g., "Check your phone for the USSD prompt"
  transactionUuid: string;
}

export interface PaynowStatusResponse {
  status: TransactionStatus;
  isPaid: boolean;
}
