export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending_kyc';

export interface AuthUser {
  id: string;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarPath: string | null;
  status: UserStatus;
  kycTier: 0 | 1 | 2 | 3;
  trustScore: number;
  twoFactorEnabled: boolean;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string; // Used if backend doesn't use httpOnly cookie for refresh
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  passwordConfirmation: string;
  firstName: string;
  lastName: string;
  phone?: string;
  termsAccepted: boolean;
}
