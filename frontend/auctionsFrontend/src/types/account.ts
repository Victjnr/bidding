/* ═══════════════════════════════════════════════════
   User Account Types
   ═══════════════════════════════════════════════════ */

export interface AddressResource {
  id: number;
  uuid: string;
  type: 'billing' | 'shipping';
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export interface SecuritySession {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface LoginHistoryEntry {
  id: number;
  success: boolean;
  time: string;
  ip: string;
  device: string;
}

export interface UserProfileUpdate {
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  phone: string;
}
