import { describe, expect, it } from 'vitest';

import { BOOKING_COMMISSION_PER_TICKET } from '../models/booking.model';
import { SeatCategory } from '../models/catalog.model';
import { MockStore } from './mock-store';

function store(): MockStore {
  return new MockStore();
}

/** One price per category for every open seat of a booking, at a fraction of what each seat cost. */
function priceEachSeat(s: MockStore, bookingId: number, fraction = 0.8, seatIds?: string[]) {
  const detail = s.getBookings(1, {}).bookings.find((item) => item.id === bookingId)!;
  const prices: Partial<Record<SeatCategory, number>> = {};
  for (const seat of detail.unlistedSeatDetails) {
    if (!seatIds || seatIds.includes(seat.id)) {
      prices[seat.category] = Math.floor(seat.paid * fraction);
    }
  }
  return prices;
}

describe('MockStore demo flows', () => {
  it('signs in the demo user with the fixed OTP', () => {
    const s = store();
    s.sendOtp('9876543210');
    const auth = s.verifyOtp('9876543210', '123456');
    expect(auth.token).toBeTruthy();
    expect(auth.user?.fullName).toBe('Mad Monkey');
    expect(s.userIdFromToken(auth.token)).toBe(1);
  });

  it('serves catalog data for the seeded showtimes', () => {
    const s = store();
    const movies = s.getMovies({});
    expect(movies.movies.length).toBeGreaterThan(5);
    const showtimes = s.getShowtimes(movies.movies[0].id, {});
    expect(showtimes.showtimes.length).toBeGreaterThan(0);
    const seats = s.getSeats(showtimes.showtimes[0].id);
    expect(seats.seatMap.rows.length).toBeGreaterThan(3);
  });

  it('creates and cancels a booking within the rules', () => {
    const s = store();
    const showtime = s.showtimes.find((item) => new Date(item.showDateTime) > new Date())!;
    showtime.showDateTime = new Date(Date.now() + 3 * 24 * 3600_000).toISOString();
    const seats = s.getSeats(showtime.id);
    const available = seats.seatMap.rows
      .flatMap((row) => row.seats)
      .filter((seat) => seat.status === 'Available')
      .slice(0, 2)
      .map((seat) => seat.id);

    const booking = s.createBooking(1, {
      showtimeId: showtime.id,
      seatNumbers: available,
    });
    expect(booking.confirmationCode).toBeTruthy();
    // Each ticket carries the ThiraiHub service fee.
    expect(booking.commissionFee).toBe(2 * BOOKING_COMMISSION_PER_TICKET);
    const cancelled = s.cancelBooking(1, booking.bookingId);
    expect(cancelled.success).toBe(true);
  });

  it('blocks cancelling while the tickets are listed for resale', () => {
    const s = store();
    const booking = s.bookings.find((b) => b.userId === 1 && b.status === 'Completed' && !s.resaleTickets.some((t) => t.bookingId === b.id))!;
    const showtime = s.showtimes.find((st) => st.id === booking.showtimeId)!;
    showtime.showDateTime = new Date(Date.now() + 3 * 24 * 3600_000).toISOString();
    const listing = s.createResaleTicket(1, { bookingId: booking.id, categoryPrices: priceEachSeat(s, booking.id) });
    expect(() => s.cancelBooking(1, booking.id)).toThrowError(/Delist/);
    s.delistResaleTicket(1, listing.resaleTicketId);
    expect(s.cancelBooking(1, booking.id).success).toBe(true);
  });

  it('only allows cancelling a booking up to 2 hours before the show', () => {
    const s = store();
    const showtime = s.showtimes.find((item) => new Date(item.showDateTime) > new Date())!;
    const pick = (count: number) =>
      s
        .getSeats(showtime.id)
        .seatMap.rows.flatMap((row) => row.seats)
        .filter((seat) => seat.status === 'Available')
        .slice(0, count)
        .map((seat) => seat.id);

    showtime.showDateTime = new Date(Date.now() + 3 * 3600_000).toISOString();
    const early = s.createBooking(1, { showtimeId: showtime.id, seatNumbers: pick(1) });
    showtime.showDateTime = new Date(Date.now() + 90 * 60_000).toISOString();
    expect(() => s.cancelBooking(1, early.bookingId)).toThrowError(/2 hours/);
    showtime.showDateTime = new Date(Date.now() + 150 * 60_000).toISOString();
    expect(s.cancelBooking(1, early.bookingId).success).toBe(true);
  });

  it('runs a listing -> instant purchase flow', () => {
    const s = store();
    const mine = s.bookings.find(
      (booking) =>
        booking.userId === 1 &&
        booking.status === 'Completed' &&
        !s.resaleTickets.some(
          (ticket) => ticket.bookingId === booking.id && ticket.status === 'Available',
        ),
    )!;

    const listing = s.createResaleTicket(1, { bookingId: mine.id, categoryPrices: priceEachSeat(s, mine.id) });
    expect(listing.resaleTicketId).toBeGreaterThan(0);
    const listed = s.resaleTickets.find((ticket) => ticket.id === listing.resaleTicketId)!;

    const balanceBefore = s.getUser(1).walletBalance;
    const purchase = s.createTransaction(2, listing.resaleTicketId);
    expect(purchase.totalBuyerPays).toBeCloseTo(listed.resalePrice + listed.buyerFee, 2);
    const stored = s.resaleTransactions.find((t) => t.id === purchase.transactionId)!;
    expect(stored.status).toBe('Completed');
    expect(stored.completedAt).toBeTruthy();
    expect(s.getUser(1).walletBalance).toBeCloseTo(balanceBefore + listed.sellerReceives, 2);
  });

  it('links the two halves of a split listing and records the original seat count', () => {
    const s = store();
    const listing = s.resaleTickets.find(
      (ticket) => ticket.status === 'Available' && ticket.allowPartial && ticket.seatNumbers.length > 1,
    )!;
    const count = listing.seatNumbers.length;
    const sold = s.createTransaction(listing.sellerId === 2 ? 1 : 2, listing.id, [listing.seatNumbers[0]]);
    const soldListing = s.resaleTickets.find(
      (ticket) => s.resaleTransactions.find((t) => t.id === sold.transactionId)?.resaleTicketId === ticket.id,
    )!;
    expect(soldListing.id).not.toBe(listing.id);
    expect(soldListing.splitGroup).toBe(listing.id);
    expect(listing.splitGroup).toBe(listing.id);
    expect(soldListing.listedSeatCount).toBe(count);
    expect(listing.listedSeatCount).toBe(count);
  });

  it('lets a buyer take one seat of a multi-seat listing and keeps the rest listed', () => {
    const s = store();
    const listing = s.resaleTickets.find(
      (ticket) => ticket.status === 'Available' && ticket.allowPartial && ticket.seatNumbers.length > 1,
    )!;
    const seats = [...listing.seatNumbers];
    const totalBefore = listing.resalePrice;
    const firstSeatPrice = listing.seatPrices[seats[0]];
    const buyer = listing.sellerId === 1 ? 2 : 1;

    const purchase = s.createTransaction(buyer, listing.id, [seats[0]]);
    expect(purchase.resalePrice).toBeCloseTo(firstSeatPrice, 2);

    // the rest stays on the market, repriced
    expect(listing.status).toBe('Available');
    expect(listing.seatNumbers).toEqual(seats.slice(1));
    expect(listing.resalePrice + purchase.resalePrice).toBeCloseTo(totalBefore, 1);

    // the bought seat is its own sold listing
    const bought = s.resaleTickets.find((ticket) => ticket.seatNumbers.join() === seats[0] && ticket.buyerId === buyer)!;
    expect(bought.status).toBe('Sold');
  });

  it('refuses individual seats when the seller sells them together', () => {
    const s = store();
    const listing = s.resaleTickets.find((ticket) => ticket.status === 'Available' && ticket.seatNumbers.length > 1)!;
    listing.allowPartial = false;
    const buyer = listing.sellerId === 1 ? 2 : 1;
    expect(() => s.createTransaction(buyer, listing.id, [listing.seatNumbers[0]])).toThrowError(/together/);
    expect(() => s.createTransaction(buyer, listing.id, ['Z99'])).toThrowError(/Pick seats/);
  });

  it('lets a seller list only some seats of a booking and the rest later', () => {
    const s = store();
    const booking = s.bookings.find(
      (item) => item.userId === 1 && item.status === 'Completed' && item.seatNumbers.length > 1,
    )!;
    const [first, ...others] = s.getBookings(1, {}).bookings.find((item) => item.id === booking.id)!
      .unlistedSeatDetails;

    const guidance = s.getPricingGuidance(booking.id, 1, 1);
    expect(guidance.categoryMarket.Premium).toBeGreaterThan(0);
    expect(guidance.categoryMarket.Regular).toBeGreaterThan(0);

    const one = s.createResaleTicket(1, {
      bookingId: booking.id,
      categoryPrices: { [first.category]: Math.floor(first.paid) },
      seatNumbers: [first.id],
    });
    expect(one.ticket.seatNumbers).toEqual([first.id]);
    expect(one.ticket.originalPrice).toBeCloseTo(first.paid, 1);
    expect(one.ticket.resalePrice).toBe(Math.floor(first.paid));

    const detail = s.getBookings(1, {}).bookings.find((item) => item.id === booking.id)!;
    expect(detail.unlistedSeats).toEqual(others.map((seat) => seat.id));

    expect(() =>
      s.createResaleTicket(1, {
        bookingId: booking.id,
        categoryPrices: { [first.category]: 50 },
        seatNumbers: [first.id],
      }),
    ).toThrowError(/not already listed/);

    const rest = s.createResaleTicket(1, {
      bookingId: booking.id,
      categoryPrices: priceEachSeat(s, booking.id, 0.8, others.map((seat) => seat.id)),
    });
    expect(rest.ticket.seatNumbers).toEqual(others.map((seat) => seat.id));
    expect(() =>
      s.createResaleTicket(1, { bookingId: booking.id, categoryPrices: { Regular: 50, Premium: 50 } }),
    ).toThrowError(/already listed/);
  });

  it('refuses a category price above what one seat of that category cost', () => {
    const s = store();
    const booking = s.bookings.find((item) => item.userId === 1 && item.status === 'Completed')!;
    const detail = s.getBookings(1, {}).bookings.find((item) => item.id === booking.id)!;
    const seat = detail.unlistedSeatDetails[0];
    expect(() =>
      s.createResaleTicket(1, {
        bookingId: booking.id,
        categoryPrices: { [seat.category]: Math.ceil(seat.paid) + 1 },
      }),
    ).toThrowError(/priced higher/);
  });

  it('prices a mixed booking per category and sells one category on its own', () => {
    const s = store();
    const showtime = s.showtimes.find((item) => new Date(item.showDateTime) > new Date())!;
    // Keep the show well clear of the listing cut-off, whatever time of day the suite runs.
    showtime.showDateTime = new Date(Date.now() + 3 * 24 * 3600_000).toISOString();
    const seats = s.getSeats(showtime.id).seatMap.rows.flatMap((row) => row.seats);
    const premiumSeat = seats.find((seat) => seat.category === 'Premium' && seat.status === 'Available')!;
    const regularSeat = seats.find((seat) => seat.category === 'Regular' && seat.status === 'Available')!;

    const booking = s.createBooking(1, { showtimeId: showtime.id, seatNumbers: [premiumSeat.id, regularSeat.id] });
    const detail = s.getBookings(1, {}).bookings.find((item) => item.id === booking.bookingId)!;
    const premium = detail.unlistedSeatDetails.find((seat) => seat.id === premiumSeat.id)!;
    const regular = detail.unlistedSeatDetails.find((seat) => seat.id === regularSeat.id)!;
    expect(premium.paid + regular.paid).toBeCloseTo(detail.bookingPrice, 2);
    expect(premium.paid).toBeGreaterThan(regular.paid);

    const listing = s.createResaleTicket(1, {
      bookingId: booking.bookingId,
      categoryPrices: { Premium: Math.floor(premium.paid), Regular: Math.floor(regular.paid) },
      allowPartial: true,
    });
    const listed = s.resaleTickets.find((ticket) => ticket.id === listing.resaleTicketId)!;
    expect(listed.seatPrices[premiumSeat.id]).toBe(Math.floor(premium.paid));
    expect(listed.resalePrice).toBe(Math.floor(premium.paid) + Math.floor(regular.paid));

    const premiumOnly = s.createTransaction(2, listing.resaleTicketId, [premiumSeat.id]);
    expect(premiumOnly.resalePrice).toBe(Math.floor(premium.paid));
    expect(listed.resalePrice).toBe(Math.floor(regular.paid));
  });

  it('lists a ticket that spans four categories and a Premium plus Regular ticket', () => {
    const s = store();
    const bookings = s.getBookings(1, {}).bookings;
    const four = bookings.find((b) => new Set(b.unlistedSeatDetails.map((x) => x.category)).size === 4)!;
    expect(four.unlistedSeatDetails.map((x) => x.category).sort()).toEqual(['Couple', 'Premium', 'Recliner', 'Regular']);
    const pair = bookings.find((b) => {
      const categories = b.unlistedSeatDetails.map((x) => x.category).sort().join();
      return categories === 'Premium,Regular';
    });
    expect(pair).toBeDefined();

    expect(Object.keys(s.getPricingGuidance(four.id, 1).categoryMarket).sort()).toEqual([
      'Couple',
      'Premium',
      'Recliner',
      'Regular',
    ]);
    const listing = s.createResaleTicket(1, {
      bookingId: four.id,
      categoryPrices: priceEachSeat(s, four.id, 0.8),
      allowPartial: true,
    });
    expect(listing.ticket.seatNumbers.length).toBe(4);
    expect(Object.keys(listing.ticket.seatPrices).length).toBe(4);
  });

  it('exposes notifications and transactions for the demo user', () => {
    const s = store();
    expect(s.getNotifications(1).notifications.length).toBeGreaterThan(0);
    expect(s.getTransactions(1).transactions.length).toBeGreaterThan(0);
  });

  it('keeps the seeded purchase consistent and out of the marketplace', () => {
    const s = store();
    const transaction = s.getTransactions(1).transactions.find((item) => item.role === 'buyer')!;
    expect(transaction.ticket).not.toBeNull();
    expect(transaction.counterpart).not.toBeNull();
    expect(transaction.role).toBe('buyer');
    expect(
      s.getResaleTickets({}).tickets.some((ticket) => ticket.id === transaction.resaleTicketId),
    ).toBe(false);
  });

  it('recommends a price within the paid amount and supports edit/delist', () => {
    const s = store();
    const booking = s.bookings.find(
      (candidate) =>
        candidate.userId === 1 &&
        !s.resaleTickets.some(
          (ticket) => ticket.bookingId === candidate.id && ticket.status === 'Available',
        ),
    )!;

    const guidance = s.getPricingGuidance(booking.id, 1);
    expect(guidance.recommendedPrice).toBeGreaterThan(0);
    expect(guidance.recommendedPrice).toBeLessThanOrEqual(booking.bookingPrice);
    expect(guidance.recommendedMax).toBeLessThanOrEqual(booking.bookingPrice);

    const listing = s.createResaleTicket(1, {
      bookingId: booking.id,
      categoryPrices: priceEachSeat(s, booking.id, 0.5),
    });
    const updated = s.updateResaleTicket(1, listing.resaleTicketId, { price: 100 });
    expect(updated.ticket.resalePrice).toBe(100);
    expect(updated.ticket.sellerReceives).toBe(95);

    s.delistResaleTicket(1, listing.resaleTicketId);
    expect(
      s.getMyListings(1).listings.find((ticket) => ticket.id === listing.resaleTicketId)?.status,
    ).toBe('Delisted');
  });

  describe('resale listing rules', () => {
    function freshListing(s: MockStore, fraction = 0.8) {
      const booking = s.bookings.find(
        (b) =>
          b.userId === 1 &&
          b.status === 'Completed' &&
          new Date(s.showtimes.find((st) => st.id === b.showtimeId)!.showDateTime).getTime() > Date.now() + 3600_000 &&
          !s.resaleTickets.some((t) => t.bookingId === b.id && t.status === 'Available'),
      )!;
      const created = s.createResaleTicket(1, {
        bookingId: booking.id,
        categoryPrices: priceEachSeat(s, booking.id, fraction),
      });
      return s.resaleTickets.find((t) => t.id === created.resaleTicketId)!;
    }

    it('cannot edit or delist a Sold listing', () => {
      const s = store();
      const listing = freshListing(s);
      s.createTransaction(2, listing.id);
      expect(listing.status).toBe('Sold');
      expect(() => s.updateResaleTicket(1, listing.id, { price: 100 })).toThrowError();
      expect(() => s.delistResaleTicket(1, listing.id)).toThrowError();
      expect(s.getMyListings(1).stats.sold).toBeGreaterThan(0);
    });

    it('enforces a 10% price floor and the original-price cap', () => {
      const s = store();
      const listing = freshListing(s);
      const floor = listing.originalPrice * 0.1;
      expect(() => s.updateResaleTicket(1, listing.id, { price: Math.floor(floor) - 1 })).toThrowError(/too low/);
      expect(() => s.updateResaleTicket(1, listing.id, { price: listing.originalPrice + 1 })).toThrowError(/higher/);
      expect(s.updateResaleTicket(1, listing.id, { price: Math.ceil(floor) }).success).toBe(true);
    });

    it('edits prices per category and the buyer option without touching the seats', () => {
      const s = store();
      const listing = freshListing(s);
      const seats = [...listing.seatNumbers];
      const mine = () => s.getMyListings(1).listings.find((l) => l.id === listing.id)!;
      const detail = mine().seatDetails!;
      const category = detail[0].category;
      const lower = Math.ceil(detail[0].paid * 0.5);

      const categoryPrices = Object.fromEntries(detail.map((seat) => [seat.category, Math.ceil(seat.paid * 0.5)]));
      const result = s.updateResaleTicket(1, listing.id, { categoryPrices, allowPartial: false });
      expect(result.success).toBe(true);
      expect(mine().allowPartial).toBe(false);
      expect(mine().seatNumbers).toEqual(seats);
      expect(mine().seatDetails!.find((seat) => seat.category === category)!.price).toBe(lower);
      expect(mine().resalePrice).toBe(mine().seatDetails!.reduce((sum, seat) => sum + seat.price, 0));

      expect(() =>
        s.updateResaleTicket(1, listing.id, { categoryPrices: { ...categoryPrices, [category]: detail[0].paid + 1 } }),
      ).toThrowError(/can't be priced higher/);
    });

    function showtimeOf(s: MockStore, listingId: number) {
      const listing = s.resaleTickets.find((t) => t.id === listingId)!;
      const booking = s.bookings.find((b) => b.id === listing.bookingId)!;
      return s.showtimes.find((st) => st.id === booking.showtimeId)!;
    }

    it('lets a seller delist at any time before the show starts', () => {
      const s = store();
      const listing = freshListing(s);
      showtimeOf(s, listing.id).showDateTime = new Date(Date.now() + 10 * 60_000).toISOString();
      expect(s.delistResaleTicket(1, listing.id).success).toBe(true);
      expect(s.getMyListings(1).listings.find((l) => l.id === listing.id)?.status).toBe('Delisted');
    });

    it('turns an unsold listing into Expired when the show starts and returns the seats', () => {
      const s = store();
      const listing = freshListing(s);
      showtimeOf(s, listing.id).showDateTime = new Date(Date.now() - 60_000).toISOString();
      const mine = s.getMyListings(1).listings.find((l) => l.id === listing.id)!;
      expect(mine.status).toBe('Expired');
      const booking = s.getBookings(1, {}).bookings.find((b) => b.id === listing.bookingId)!;
      expect(booking.unlistedSeats).toEqual(expect.arrayContaining(listing.seatNumbers));
      expect(() => s.createTransaction(2, listing.id)).toThrowError(/already started/);
    });

    it('refuses new listings within 30 minutes of the show', () => {
      const s = store();
      const booking = s.bookings.find((b) => b.userId === 1 && b.status === 'Completed')!;
      const showtime = s.showtimes.find((st) => st.id === booking.showtimeId)!;
      showtime.showDateTime = new Date(Date.now() + 10 * 60_000).toISOString();
      expect(() =>
        s.createResaleTicket(1, { bookingId: booking.id, categoryPrices: priceEachSeat(s, booking.id) }),
      ).toThrowError(/30 minutes/);
    });

    it('caps the remaining listing at the paid total of its remaining seats after a partial sale', () => {
      const s = store();
      const listing = s.resaleTickets.find(
        (t) => t.status === 'Available' && t.allowPartial && t.seatNumbers.length > 1,
      )!;
      const booking = s.bookings.find((b) => b.id === listing.bookingId)!;
      const info = (s as unknown as { seatInfoFor(b: unknown): Record<string, { paid: number }> }).seatInfoFor(booking);
      const seats = [...listing.seatNumbers];
      const buyer = listing.sellerId === 1 ? 2 : 1;
      s.createTransaction(buyer, listing.id, [seats[0]]);
      const paidRest = seats.slice(1).reduce((total, seat) => total + info[seat].paid, 0);
      expect(listing.originalPrice).toBeCloseTo(paidRest, 2);
    });
  });

  it('updates the profile, wallet and notification read state', () => {
    const s = store();
    const user = s.updateUser(1, { fullName: 'Aarav S', city: 'Mumbai', bio: 'Hi' });
    expect(user.fullName).toBe('Aarav S');
    expect(user.city).toBe('Mumbai');
    expect(s.getWallet(1).balance).toBe(user.walletBalance);

    const { notifications } = s.getNotifications(1);
    const unread = notifications.find((item) => !item.isRead) ?? notifications[0];
    s.markNotificationRead(1, unread.id);
    expect(s.getNotifications(1).notifications.find((item) => item.id === unread.id)?.isRead).toBe(
      true,
    );
    s.markAllNotificationsRead(1);
    expect(s.getNotifications(1).unreadCount).toBe(0);
  });

  describe('wallet ledger and payments', () => {
    type WalletInternals = { applyWallet(u: number, t: string, a: number, r: string, ref: null): number };
    const fund = (s: MockStore, userId: number, amount: number) =>
      (s as unknown as WalletInternals).applyWallet(userId, 'credit', amount, 'Top up', null);
    const r2 = (n: number) => Math.round(n * 100) / 100;

    /** Open seats (3+ days out so cancellations are refundable) of one showtime. */
    function openSeats(s: MockStore, count: number) {
      const showtime = s.showtimes.find((t) => new Date(t.showDateTime).getTime() - Date.now() > 3 * 86400000)!;
      const seats = s
        .getSeats(showtime.id)
        .seatMap.rows.flatMap((row) => row.seats)
        .filter((seat) => seat.status === 'Available')
        .slice(0, count)
        .map((seat) => seat.id);
      return { showtimeId: showtime.id, seatNumbers: seats };
    }

    it('seeds a ledger that sums to each balance', () => {
      const s = store();
      for (const user of s.users.filter((u) => u.walletBalance > 0)) {
        const entries = s.getWalletTransactions(user.id).entries;
        const sum = entries.reduce((t, e) => t + (e.type === 'debit' ? -e.amount : e.amount), 0);
        expect(r2(sum)).toBe(user.walletBalance);
        expect(entries.some((e) => e.reason === 'Opening balance')).toBe(true);
        expect(entries[0].balanceAfter).toBe(user.walletBalance);
      }
      expect(s.getWalletTransactions(1).entries.some((e) => e.reason.startsWith('Resale sale:'))).toBe(true);
    });

    it('debits the wallet for a booking and reports amountDue', () => {
      const s = store();
      const before = s.getUser(2).walletBalance;
      const res = s.createBooking(2, { ...openSeats(s, 1), useWallet: true });
      expect(res.walletUsed).toBe(res.totalAmount);
      expect(res.amountDue).toBe(0);
      expect(s.getUser(2).walletBalance).toBe(r2(before - res.totalAmount));
      const entry = s.getWalletTransactions(2).entries[0];
      expect(entry.type).toBe('debit');
      expect(entry.reference).toEqual({ kind: 'booking', id: res.bookingId });
      expect(entry.reason).toBe(`Booking ${res.confirmationCode}`);
      expect(s.bookings.find((b) => b.id === res.bookingId)?.walletPaid).toBe(res.walletUsed);
    });

    it('uses only what is in the wallet when the balance is below the total', () => {
      const s = store();
      fund(s, 4, 100);
      const res = s.createBooking(4, { ...openSeats(s, 2), useWallet: true });
      expect(res.walletUsed).toBe(100);
      expect(res.amountDue).toBe(r2(res.totalAmount - 100));
      expect(s.getUser(4).walletBalance).toBe(0);
    });

    it('does not touch the wallet unless useWallet is set', () => {
      const s = store();
      const before = s.getUser(2).walletBalance;
      const res = s.createBooking(2, openSeats(s, 1));
      expect(res.walletUsed).toBe(0);
      expect(res.amountDue).toBe(res.totalAmount);
      expect(s.getUser(2).walletBalance).toBe(before);
      expect(s.bookings.find((b) => b.id === res.bookingId)?.walletPaid).toBeUndefined();
    });

    it('rejects buying your own listing', () => {
      const s = store();
      const listing = s.resaleTickets.find((t) => t.status === 'Available')!;
      expect(() => s.createTransaction(listing.sellerId, listing.id, undefined, true)).toThrowError(
        "You can't buy your own listing.",
      );
    });

    it('pays a resale purchase from the wallet and reports amountDue', () => {
      const s = store();
      const listing = s.resaleTickets.find((t) => t.status === 'Available' && t.sellerId !== 2)!;
      const before = s.getUser(2).walletBalance;
      const res = s.createTransaction(2, listing.id, undefined, true);
      expect(res.walletUsed).toBe(Math.min(before, res.totalBuyerPays));
      expect(res.amountDue).toBe(r2(res.totalBuyerPays - res.walletUsed));
      expect(s.resaleTransactions.find((t) => t.id === res.transactionId)?.walletPaid).toBe(res.walletUsed);
      expect(s.getUser(2).walletBalance).toBeGreaterThanOrEqual(0);
    });

    it('splits a cancellation refund between wallet and card', () => {
      const s = store();
      fund(s, 4, 100);
      const res = s.createBooking(4, { ...openSeats(s, 2), useWallet: true });
      const cancel = s.cancelBooking(4, res.bookingId);
      expect(cancel.refundAmount).toBe(r2(res.totalAmount * 0.5));
      expect(cancel.refundToWallet).toBe(Math.min(cancel.refundAmount, 100));
      expect(cancel.refundToCard).toBe(r2(cancel.refundAmount - cancel.refundToWallet));
      expect(s.getUser(4).walletBalance).toBe(cancel.refundToWallet);
      const entry = s.getWalletTransactions(4).entries[0];
      expect(entry.type).toBe('refund');
      expect(entry.amount).toBe(cancel.refundToWallet);
    });

    it('refunds nothing to the wallet for a card-only booking', () => {
      const s = store();
      const res = s.createBooking(4, openSeats(s, 1));
      const cancel = s.cancelBooking(4, res.bookingId);
      expect(cancel.refundToWallet).toBe(0);
      expect(cancel.refundToCard).toBe(cancel.refundAmount);
      expect(s.getWalletTransactions(4).entries.length).toBe(0);
    });

    it('credits the seller wallet immediately on purchase with a ledger entry', () => {
      const s = store();
      const listing = s.resaleTickets.find((t) => t.status === 'Available' && t.sellerId !== 2)!;
      const seller = listing.sellerId;
      const before = s.getUser(seller).walletBalance;
      const earnedBefore = s.getUser(seller).totalEarned;
      const entriesBefore = s.getWalletTransactions(seller).entries.length;
      const receives = listing.sellerReceives;

      const tx = s.createTransaction(2, listing.id);
      const stored = s.resaleTransactions.find((t) => t.id === tx.transactionId)!;
      expect(stored.status).toBe('Completed');
      expect(stored.completedAt).toBeTruthy();
      const entries = s.getWalletTransactions(seller).entries;
      expect(entries.length).toBe(entriesBefore + 1);
      expect(entries[0].type).toBe('credit');
      expect(entries[0].amount).toBe(receives);
      expect(entries[0].reason.startsWith('Resale sale: ')).toBe(true);
      expect(entries[0].reference).toEqual({ kind: 'resale', id: listing.id });
      expect(s.getUser(seller).walletBalance).toBe(r2(before + receives));
      expect(s.getUser(seller).totalEarned).toBe(r2(earnedBefore + receives));
      expect(s.getWallet(seller).balance).toBe(r2(before + receives));
    });

    it('gives the buyer a Completed booking marked fromResale with the bought seats', () => {
      const s = store();
      const listing = s.resaleTickets.find((t) => t.status === 'Available' && t.sellerId !== 2)!;
      const seats = [...listing.seatNumbers];
      const source = s.bookings.find((b) => b.id === listing.bookingId)!;
      const tx = s.createTransaction(2, listing.id);
      const booking = s.bookings.find((b) => b.id === tx.bookingId)!;
      expect(booking.userId).toBe(2);
      expect(booking.status).toBe('Completed');
      expect(booking.fromResale).toBe(true);
      expect(booking.showtimeId).toBe(source.showtimeId);
      expect(booking.seatNumbers).toEqual(seats);
      expect(booking.bookingPrice).toBe(tx.resalePrice);
      expect(booking.commissionFee).toBe(tx.buyerFee);
      expect(booking.totalAmount).toBe(tx.totalBuyerPays);
      expect(booking.confirmationCode).toBeTruthy();
      expect(booking.qrCode).toBe(`THIRAIHUB:${booking.confirmationCode}`);
      expect(s.getBookings(2, {}).bookings.some((b) => b.id === tx.bookingId)).toBe(true);
      expect(() => s.getSeats(booking.showtimeId)).not.toThrow();
      // the sold seats can no longer be listed from the seller's booking
      const sellerDetail = s.getBookings(source.userId, {}).bookings.find((b) => b.id === source.id)!;
      expect(sellerDetail.unlistedSeats.some((seat) => seats.includes(seat))).toBe(false);
    });

    it('credits only the bought seats on a partial purchase', () => {
      const s = store();
      const listing = s.resaleTickets.find(
        (t) => t.status === 'Available' && t.allowPartial && t.seatNumbers.length > 1 && t.sellerId !== 2,
      )!;
      const seller = listing.sellerId;
      const seat = listing.seatNumbers[0];
      const before = s.getUser(seller).walletBalance;
      const tx = s.createTransaction(2, listing.id, [seat]);
      const stored = s.resaleTransactions.find((t) => t.id === tx.transactionId)!;
      expect(s.getUser(seller).walletBalance).toBe(r2(before + stored.sellerReceives));
      expect(stored.sellerReceives).toBeLessThan(listing.sellerReceives + stored.sellerReceives);
      const booking = s.bookings.find((b) => b.id === tx.bookingId)!;
      expect(booking.seatNumbers).toEqual([seat]);
      expect(listing.status).toBe('Available');
    });

    it('still rejects buying your own listing', () => {
      const s = store();
      const listing = s.resaleTickets.find((t) => t.status === 'Available')!;
      expect(() => s.createTransaction(listing.sellerId, listing.id)).toThrowError(/own listing/);
    });

    it('keeps the demo ledger summing to the wallet balance with every seeded sale credited', () => {
      const s = store();
      const entries = s.getWalletTransactions(1).entries;
      expect(entries.filter((e) => e.reason.startsWith('Resale sale')).length).toBe(3);
      const sum = r2(entries.reduce((t, e) => t + (e.type === 'debit' ? -e.amount : e.amount), 0));
      expect(sum).toBe(s.getUser(1).walletBalance);
      expect(s.getUser(1).walletBalance).toBe(1240);
      expect(s.resaleTransactions.every((t) => t.status === 'Completed')).toBe(true);
    });

    it('keeps balanceAfter consistent across a sequence of movements', () => {
      const s = store();
      fund(s, 4, 500);
      const b = s.createBooking(4, { ...openSeats(s, 1), useWallet: true });
      s.cancelBooking(4, b.bookingId);
      const entries = [...s.getWalletTransactions(4).entries].reverse();
      let running = 0;
      for (const e of entries) {
        running = r2(running + (e.type === 'debit' ? -e.amount : e.amount));
        expect(e.balanceAfter).toBe(running);
      }
      expect(running).toBe(s.getUser(4).walletBalance);
      expect(s.getWallet(4).balance).toBe(running);
    });
  });

  it('filters bookings by status for the demo user', () => {
    const s = store();
    const all = s.getBookings(1, {});
    expect(all.bookings.length).toBeGreaterThan(0);
    expect(all.bookings.every((booking) => booking.userId === 1)).toBe(true);
    expect(s.getBookings(1, { status: 'Cancelled' }).bookings.every((b) => b.status === 'Cancelled')).toBe(
      true,
    );
  });
});
