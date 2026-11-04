export type UserType = 'Buyer' | 'Seller' | 'Both';

export interface User {
  id: number;
  phoneNumber: string;
  /** First name and last name together, for places that show one name. */
  fullName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  city: string;
  bio: string | null;
  profileImageUrl: string | null;
  /** Date of birth as yyyy-mm-dd; optional. */
  birthday: string | null;
  interests: string[];
  userType: UserType;
  isPhoneVerified: boolean;
  buyerRating: number;
  buyerReviewCount: number;
  sellerRating: number;
  sellerReviewCount: number;
  walletBalance: number;
  totalEarned: number;
  createdAt: string;
  isActive: boolean;
}

export interface UserStats {
  totalBookings: number;
  totalSales: number;
  totalEarned: number;
  verifiedSeller: boolean;
  memberSince: string;
}

export interface PublicProfile {
  user: User;
  stats: UserStats;
  reviews: import('./social.model').Review[];
}

export interface OtpChallengeResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  /** Only returned by the mock API so the demo can be used without a real SMS gateway. */
  devOtp?: string;
}

export interface VerifyOtpResponse {
  token: string;
  isNewUser: boolean;
  user: User | null;
}

export interface CompleteProfileRequest {
  firstName: string;
  lastName: string;
  /** Date of birth as yyyy-mm-dd; optional. */
  birthday?: string | null;
  email: string | null;
  city: string;
  userType: UserType;
  bio?: string | null;
  interests?: string[];
}

export interface WalletSummary {
  balance: number;
  totalEarned: number;
  lifetimeSales: number;
}

/** One line of a user's wallet history. Credits and refunds add to the balance, debits take from it. */
export interface WalletEntry {
  id: number;
  userId: number;
  type: 'credit' | 'debit' | 'refund';
  amount: number;
  balanceAfter: number;
  /** Short label such as "Resale sale: Interstellar Dawn" or "Booking SH1234". */
  reason: string;
  reference: { kind: 'booking' | 'resale'; id: number } | null;
  createdAt: string;
}

export interface WalletEntriesResponse {
  entries: WalletEntry[];
}
