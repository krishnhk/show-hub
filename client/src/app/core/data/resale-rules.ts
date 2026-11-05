import { BOOKING_COMMISSION_PER_TICKET } from '../models/booking.model';

export const LISTING_CUTOFF_MINUTES = 30;
export const MIN_PRICE_SHARE = 0.1;
export const SELLER_KEEPS = 0.95;
export const SOON_HOURS = 24;

/** ThiraiHub's fee for a purchase: the same per ticket whether it is bought from the theatre or from a seller. */
export function resaleBuyerFee(seatCount: number): number {
  return BOOKING_COMMISSION_PER_TICKET * seatCount;
}
