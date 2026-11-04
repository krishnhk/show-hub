import { SeatCategory, ShowtimeWithRefs } from './catalog.model';

export type BookingStatus = 'Completed' | 'Cancelled' | 'Pending';

export interface Booking {
  id: number;
  showtimeId: number;
  userId: number;
  quantity: number;
  seatNumbers: string[];
  bookingPrice: number;
  commissionFee: number;
  totalAmount: number;
  paymentId: string;
  status: BookingStatus;
  qrCode: string | null;
  confirmationCode: string | null;
  bookedAt: string;
  cancelledAt: string | null;
  /** Part of totalAmount paid from the wallet at booking time. Absent means 0. */
  walletPaid?: number;
  /** True when this booking was bought on the resale market. */
  fromResale?: boolean;
}

/** A seat of a booking that is not yet listed, with its category and what the buyer paid for it. */
export interface ListableSeat {
  id: string;
  category: SeatCategory;
  paid: number;
}

export interface BookingDetail extends Booking {
  showtime: ShowtimeWithRefs;
  resaleListingId: number | null;
  /** True when the seats of this booking are currently listed on the resale market. */
  isListed: boolean;
  /** Seats of this booking not yet listed or sold on the resale market. */
  unlistedSeats: string[];
  /** The same seats as `unlistedSeats`, with category and paid price for pricing a listing. */
  unlistedSeatDetails: ListableSeat[];
}

export interface BookingListResponse {
  bookings: BookingDetail[];
  total: number;
}

export interface CreateBookingRequest {
  showtimeId: number;
  seatNumbers: string[];
  quantity: number;
  /** Spend wallet balance first; the rest (amountDue) is paid by card. */
  useWallet?: boolean;
}

export interface CreateBookingResponse {
  bookingId: number;
  confirmationCode: string;
  qrCode: string;
  bookingPrice: number;
  commissionFee: number;
  totalAmount: number;
  /** Taken from the wallet. 0 when useWallet is off. */
  walletUsed: number;
  /** totalAmount - walletUsed: the card portion. */
  amountDue: number;
}

export interface CancelBookingResponse {
  success: boolean;
  refundAmount: number;
  refundPercent: number;
  /** Part of refundAmount returned to the wallet (up to what was paid from it). */
  refundToWallet: number;
  /** The rest of refundAmount, returned to the original card. */
  refundToCard: number;
  message: string;
}

/** ThiraiHub adds a per-ticket commission on top of the theatre price. */
export const BOOKING_COMMISSION_PER_TICKET = 30;
