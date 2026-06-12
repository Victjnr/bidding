/* ═══════════════════════════════════════════════════
   Admin Back-Office Types
   ═══════════════════════════════════════════════════ */

export interface AdminDashboardStats {
  activeAuctions: number;
  activeAuctionsTrend: number;
  liveBidders: number;
  liveBiddersTrend: number;
  bidsPerMinute: number;
  bidsPerMinuteTrend: number;
  pendingKyc: number;
  pendingKycTrend: number;
  openDisputes: number;
  openDisputesTrend: number;
}

export interface RevenueChartPoint {
  date: string;
  gmv: number;
  commission: number;
}

export interface RegistrationChartPoint {
  date: string;
  count: number;
}

export interface BidVelocityPoint {
  timestamp: string;
  value: number;
}

export type AdminUserStatus = 'active' | 'suspended' | 'banned' | 'pending';
export type KycTier = 'none' | 'basic' | 'verified' | 'enhanced';

export interface AdminUserResource {
  id: number;
  uuid: string;
  name: string;
  email: string;
  avatarPath: string | null;
  roles: string[];
  kycTier: KycTier;
  status: AdminUserStatus;
  joinedAt: string;
}

export interface UserDetail extends AdminUserResource {
  phone: string | null;
  loginHistory: LoginHistoryEntry[];
  activeBids: UserBidSummary[];
  transactionSummary: {
    totalSpent: number;
    totalEarned: number;
    disputeCount: number;
  };
}

export interface LoginHistoryEntry {
  id: number;
  ip: string;
  device: string;
  time: string;
  success: boolean;
}

export interface UserBidSummary {
  auctionUuid: string;
  auctionTitle: string;
  amount: number;
  isWinning: boolean;
}

export interface KycDocument {
  id: number;
  uuid: string;
  userId: number;
  userName: string;
  userEmail: string;
  docType: 'id_card' | 'passport' | 'proof_of_address' | 'selfie';
  fileUrl: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PendingAuction {
  uuid: string;
  title: string;
  sellerName: string;
  sellerUuid: string;
  category: string;
  reservePrice: number | null;
  startPrice: number;
  imageUrl: string | null;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
}

export interface SystemSetting {
  key: string;
  label: string;
  description: string;
  group: string;
  type: 'text' | 'number' | 'toggle' | 'select';
  value: string | number | boolean;
  options?: string[]; // For select type
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  allowedRoles: string[];
  updatedAt: string;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  actorName: string;
  actorUuid: string;
  action: string;
  subjectType: string;
  subjectId: string;
  ip: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}
