import { describe, expect, it } from 'vitest';

import { BookingDetail } from '../models/booking.model';
import { SeatMap, Theater } from '../models/catalog.model';
import {
  areaOf,
  buildTheatres,
  heatLevel,
  mergeHall,
  searchTheatres,
  seatUse,
  sortTheatres,
  theatreInitials,
} from './theatre-visits';

const NOW = new Date('2026-11-07T12:00:00Z').getTime();

function theater(id: number, name: string, address = 'Some Road, Porur'): Theater {
  return { id, name, city: 'Chennai', address, latitude: 0, longitude: 0, phoneNumber: null };
}

function booking(
  id: number,
  place: Theater,
  show: string,
  seats: string[],
  extra: Partial<BookingDetail> = {},
  movie = 'Scene',
): BookingDetail {
  return {
    id,
    showtimeId: id,
    userId: 1,
    quantity: seats.length,
    seatNumbers: seats,
    bookingPrice: 0,
    commissionFee: 0,
    totalAmount: 0,
    paymentId: '',
    status: 'Completed',
    qrCode: null,
    confirmationCode: null,
    bookedAt: show,
    cancelledAt: null,
    showtime: {
      id,
      movieId: 1,
      theaterId: place.id,
      showDateTime: show,
      format: '2D',
      language: 'Tamil',
      basePrice: 0,
      movie: { id: 1, title: movie, posterUrl: null },
      theater: place,
    },
    resaleListingId: null,
    isListed: false,
    unlistedSeats: seats,
    unlistedSeatDetails: [],
    ...extra,
  } as unknown as BookingDetail;
}

const GK = theater(1, 'GK Cinemas', '12 Mount Poonamallee Road, Porur');
const PALAZZO = theater(2, 'PVR Palazzo', 'Phoenix MarketCity, Velachery');

describe('theatre visits', () => {
  it('groups bookings by theatre and separates watched from upcoming shows', () => {
    const list = buildTheatres(
      [
        booking(1, GK, '2026-10-04T19:45:00Z', ['G5', 'G6']),
        booking(2, GK, '2026-11-01T13:00:00Z', ['G5']),
        booking(3, GK, '2026-11-14T19:45:00Z', ['C6', 'C7']),
        booking(4, PALAZZO, '2026-09-20T13:00:00Z', ['A3']),
      ],
      NOW,
    );
    const gk = list.find((item) => item.theater.id === 1)!;
    expect(list).toHaveLength(2);
    expect(gk.watched).toBe(2);
    expect(gk.upcoming).toBe(1);
    expect(gk.seatsUsed).toBe(2);
    expect(gk.visits.map((visit) => visit.bookingId)).toEqual([3, 2, 1]);
    expect(gk.last.bookingId).toBe(2);
  });

  it('leaves out cancelled bookings and seats that were resold or given away', () => {
    const list = buildTheatres(
      [
        booking(1, GK, '2026-10-04T19:45:00Z', ['G5'], { status: 'Cancelled' }),
        booking(2, GK, '2026-10-05T19:45:00Z', ['G5', 'G6'], { unlistedSeats: ['G6'] }),
        booking(3, PALAZZO, '2026-10-06T19:45:00Z', ['A1'], { unlistedSeats: [] }),
      ],
      NOW,
    );
    expect(list).toHaveLength(1);
    expect(list[0].visits[0].seats).toEqual(['G6']);
  });

  it('shows the next show as the last one for a theatre with nothing watched yet', () => {
    const [only] = buildTheatres([booking(1, GK, '2026-11-14T19:45:00Z', ['C6'])], NOW);
    expect(only.watched).toBe(0);
    expect(only.last.upcoming).toBe(true);
  });

  it('counts how often each seat was used and keeps upcoming bookings apart', () => {
    const [gk] = buildTheatres(
      [
        booking(1, GK, '2026-10-04T19:45:00Z', ['G5', 'G6']),
        booking(2, GK, '2026-10-17T16:30:00Z', ['G5']),
        booking(3, GK, '2026-11-14T19:45:00Z', ['G5']),
      ],
      NOW,
    );
    const use = seatUse(gk.visits);
    expect(use.get('G5')).toEqual({ watched: 2, upcoming: 1 });
    expect(use.get('G6')).toEqual({ watched: 1, upcoming: 0 });
    expect(heatLevel(0)).toBe(0);
    expect(heatLevel(2)).toBe(2);
    expect(heatLevel(7)).toBe(3);
  });

  it('sorts by visits, by name and by the most recent show, and searches name and area', () => {
    const list = buildTheatres(
      [
        booking(1, GK, '2026-10-01T10:00:00Z', ['A1']),
        booking(2, GK, '2026-10-02T10:00:00Z', ['A1']),
        booking(3, PALAZZO, '2026-11-05T10:00:00Z', ['A1']),
      ],
      NOW,
    );
    expect(sortTheatres(list, 'visits').map((item) => item.theater.name)).toEqual(['GK Cinemas', 'PVR Palazzo']);
    expect(sortTheatres(list, 'recent').map((item) => item.theater.name)).toEqual(['PVR Palazzo', 'GK Cinemas']);
    expect(sortTheatres(list, 'name').map((item) => item.theater.name)).toEqual(['GK Cinemas', 'PVR Palazzo']);
    expect(searchTheatres(list, 'pal').map((item) => item.theater.id)).toEqual([2]);
    expect(searchTheatres(list, 'velach').map((item) => item.theater.id)).toEqual([2]);
    expect(searchTheatres(list, '  ')).toHaveLength(2);
    expect(searchTheatres(list, 'zzz')).toHaveLength(0);
  });

  it('draws one hall from several seat maps and adds seats no map has', () => {
    const map = (rows: [string, number][]): SeatMap =>
      ({
        screenLabel: '',
        rows: rows.map(([label, count]) => ({
          label,
          category: 'Regular',
          seats: Array.from({ length: count }, (_, index) => ({ id: `${label}${index + 1}`, number: index + 1 })),
        })),
      }) as unknown as SeatMap;
    const hall = mergeHall([map([['B', 8], ['A', 6]]), map([['A', 10]])], ['A12', 'C3']);
    expect(hall.map((row) => `${row.label}${row.seats.length}`)).toEqual(['A12', 'B8', 'C3']);
  });

  it('works out the area and the initials of a theatre', () => {
    expect(areaOf(GK)).toBe('Porur');
    expect(theatreInitials('GK Cinemas')).toBe('GK');
    expect(theatreInitials('PVR INOX Chennai Citi Centre')).toBe('PVR');
    expect(theatreInitials('Sathyam Cinemas')).toBe('SC');
  });
});
