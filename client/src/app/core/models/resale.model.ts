import { SeatCategory, ShowtimeWithRefs, Theater } from './catalog.model';
import { User } from './user.model';
import { Review } from './social.model';

export type ResaleStatus = 'Available' | 'Sold' | 'Expired' | 'Delisted';
export type TransactionStatus = 'Completed' | 'Refunded';

export interface ResaleTicket {
  id: number;
  bookingId: number;
  sellerId: number;
  buyerId: number | null;
  seatNumbers: string[];
  /** What each seat sells for, by seat id. The listing's price is the sum of these. */
  seatPrices: Record<string, number>;
  /** Set on both halves when a partial purchase splits a listing, so they can be shown as one listing. */
  splitGroup?: number;
  /** How many seats the seller originally listed together. */
  listedSeatCount?: number;
  /** When true a buyer may take some of the seats; the rest stay listed. */
  allowPartial: boolean;
  originalPrice: number;
  resalePrice: number;
  sellerCommission: number;
  buyerFee: number;
  sellerReceives: number;
  status: ResaleStatus;
  listedAt: string;
  soldAt: string | null;
  expiresAt: string;
}

export interface ResaleTicketDetail extends ResaleTicket {
  showtime: ShowtimeWithRefs;
  seller: User;
  reviews: Review[];
  discountPercent: number;
  daysUntilShow: number;
  /** For the seller's own listings: each seat with its category, what was paid and what it is listed at. */
  seatDetails?: { id: string; category: SeatCategory; paid: number; price: number }[];
}

export interface ResaleListResponse {
  tickets: ResaleTicketDetail[];
  filters: {
    minPrice: number;
    maxPrice: number;
    genres: string[];
    theaters: Theater[];
    cities: string[];
    formats: string[];
  };
  total: number;
}

export interface PricingGuidance {
  /** What other sellers ask for one seat of each category. */
  categoryMarket: Record<SeatCategory, number>;
  originalPrice: number;
  marketAverage: number;
  lowestPrice: number;
  highestPrice: number;
  minPrice: number;
  maxPrice: number;
  recommendedPrice: number;
  recommendedMin: number;
  recommendedMax: number;
  competitionCount: number;
  urgencyFactor: number;
  saleProbability: number;
  demandLabel: string;
  insights: string[];
}

export interface MyListingsResponse {
  listings: ResaleTicketDetail[];
  stats: {
    active: number;
    sold: number;
    expired: number;
    earnings: number;
  };
}

export interface ResaleTransaction {
  id: number;
  resaleTicketId: number;
  buyerId: number;
  sellerId: number;
  resalePrice: number;
  buyerFee: number;
  totalBuyerPays: number;
  sellerReceives: number;
  status: TransactionStatus;
  paymentId: string | null;
  purchasedAt: string;
  completedAt: string | null;
  /** Part of totalBuyerPays paid from the buyer's wallet. Absent means 0. */
  walletPaid?: number;
  role: 'buyer' | 'seller';
  ticket: ResaleTicketDetail | null;
  counterpart: User | null;
}

export interface TransactionListResponse {
  transactions: ResaleTransaction[];
}

export interface CreateTransactionResponse {
  transactionId: number;
  /** The buyer's booking for the bought seats (shows in My Tickets). */
  bookingId: number;
  paymentUrl: string;
  resalePrice: number;
  buyerFee: number;
  totalBuyerPays: number;
  /** Taken from the wallet. 0 when useWallet is off. */
  walletUsed: number;
  /** totalBuyerPays - walletUsed: the card portion. */
  amountDue: number;
}

export const SELLER_COMMISSION_RATE = 0.05;
