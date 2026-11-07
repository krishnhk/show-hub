import { BookingDetail } from '../models/booking.model';
import { SeatMap, SeatCategory, Theater } from '../models/catalog.model';

/** One show the user booked at a theatre, with the seats that are still theirs. */
export interface TheatreVisit {
  bookingId: number;
  showtimeId: number;
  movieTitle: string;
  posterUrl: string | null;
  showDateTime: string;
  format: string;
  language: string;
  /** Seats of the booking that are still the user's: not sold or listed on resale, not shared away. */
  seats: string[];
  /** True when the show has not started yet. */
  upcoming: boolean;
}

/** Everything the user has done at one theatre. */
export interface TheatreSummary {
  theater: Theater;
  /** Newest show first. */
  visits: TheatreVisit[];
  /** Shows already watched. */
  watched: number;
  /** Shows booked but not started. */
  upcoming: number;
  /** Different seats sat in at watched shows. */
  seatsUsed: number;
  /** The latest watched show, or the next one when nothing has been watched yet. */
  last: TheatreVisit;
}

export interface SeatUse {
  watched: number;
  upcoming: number;
}

export type TheatreSort = 'visits' | 'name' | 'recent';

/** The neighbourhood of a theatre: the last part of its address. */
export function areaOf(theater: Theater): string {
  const parts = theater.address.split(',').map((part) => part.trim()).filter((part) => part.length > 0);
  return parts.length > 0 ? parts[parts.length - 1] : theater.city;
}

/** Groups the user's bookings by theatre. Cancelled bookings, and bookings whose seats were all given up, are left out. */
export function buildTheatres(bookings: BookingDetail[], now = Date.now()): TheatreSummary[] {
  const byTheater = new Map<number, { theater: Theater; visits: TheatreVisit[] }>();

  for (const booking of bookings) {
    if (booking.status !== 'Completed' || booking.unlistedSeats.length === 0) {
      continue;
    }
    const showtime = booking.showtime;
    const visit: TheatreVisit = {
      bookingId: booking.id,
      showtimeId: showtime.id,
      movieTitle: showtime.movie.title,
      posterUrl: showtime.movie.posterUrl,
      showDateTime: showtime.showDateTime,
      format: showtime.format,
      language: showtime.language,
      seats: [...booking.unlistedSeats],
      upcoming: new Date(showtime.showDateTime).getTime() > now,
    };
    const entry = byTheater.get(showtime.theater.id) ?? { theater: showtime.theater, visits: [] };
    entry.visits.push(visit);
    byTheater.set(showtime.theater.id, entry);
  }

  return [...byTheater.values()].map(({ theater, visits }) => {
    visits.sort((a, b) => new Date(b.showDateTime).getTime() - new Date(a.showDateTime).getTime());
    const watchedVisits = visits.filter((visit) => !visit.upcoming);
    const upcomingVisits = visits.filter((visit) => visit.upcoming);
    const seats = new Set(watchedVisits.flatMap((visit) => visit.seats));
    return {
      theater,
      visits,
      watched: watchedVisits.length,
      upcoming: upcomingVisits.length,
      seatsUsed: seats.size,
      // Newest watched show; with none, the soonest upcoming one (the list is newest first, so that is the last).
      last: watchedVisits[0] ?? upcomingVisits[upcomingVisits.length - 1],
    };
  });
}

export function sortTheatres(theatres: TheatreSummary[], sort: TheatreSort): TheatreSummary[] {
  const list = [...theatres];
  switch (sort) {
    case 'name':
      return list.sort((a, b) => a.theater.name.localeCompare(b.theater.name));
    case 'recent':
      return list.sort(
        (a, b) => new Date(b.last.showDateTime).getTime() - new Date(a.last.showDateTime).getTime(),
      );
    default:
      return list.sort((a, b) => b.watched - a.watched || a.theater.name.localeCompare(b.theater.name));
  }
}

/** Keeps the theatres whose name or neighbourhood contains the text; an empty text keeps them all. */
export function searchTheatres(theatres: TheatreSummary[], text: string): TheatreSummary[] {
  const query = text.trim().toLowerCase();
  if (!query) {
    return theatres;
  }
  return theatres.filter((summary) => `${summary.theater.name} ${areaOf(summary.theater)}`.toLowerCase().includes(query));
}

/** How many times each seat was sat in, and how many upcoming bookings hold it. */
export function seatUse(visits: TheatreVisit[]): Map<string, SeatUse> {
  const use = new Map<string, SeatUse>();
  for (const visit of visits) {
    for (const seat of visit.seats) {
      const entry = use.get(seat) ?? { watched: 0, upcoming: 0 };
      if (visit.upcoming) {
        entry.upcoming++;
      } else {
        entry.watched++;
      }
      use.set(seat, entry);
    }
  }
  return use;
}

/** 0 for a seat never sat in, then 1, 2 and 3 for once, twice and three times or more. */
export function heatLevel(watched: number): 0 | 1 | 2 | 3 {
  return watched >= 3 ? 3 : watched === 2 ? 2 : watched === 1 ? 1 : 0;
}

/**
 * One hall drawn from the seat maps of the shows that were visited. Halls can differ from show to show, so each row
 * takes its longest length. Seats used in a show but missing from every map are added to their row.
 */
export interface HallRow {
  label: string;
  category: SeatCategory;
  seats: string[];
}

export function mergeHall(maps: SeatMap[], usedSeats: string[]): HallRow[] {
  const rows = new Map<string, { category: SeatCategory; numbers: Set<number> }>();
  const order: string[] = [];

  const add = (label: string, category: SeatCategory, number: number): void => {
    const row = rows.get(label) ?? { category, numbers: new Set<number>() };
    row.numbers.add(number);
    rows.set(label, row);
    if (!order.includes(label)) {
      order.push(label);
    }
  };

  for (const map of maps) {
    for (const row of map.rows) {
      for (const seat of row.seats) {
        add(row.label, row.category, seat.number);
      }
    }
  }
  for (const id of usedSeats) {
    const match = /^([A-Za-z]+)(\d+)$/.exec(id);
    if (match) {
      add(match[1], rows.get(match[1])?.category ?? 'Regular', Number(match[2]));
    }
  }

  return order
    .sort()
    .map((label) => {
      const row = rows.get(label)!;
      const max = Math.max(...row.numbers);
      return { label, category: row.category, seats: Array.from({ length: max }, (_, index) => `${label}${index + 1}`) };
    });
}

/** Two or three letters standing for a theatre: its own capitals when it has them (GK, PVR), else the first initials. */
export function theatreInitials(name: string): string {
  const words = name.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return '?';
  }
  if (/^[A-Z]{2,4}$/.test(words[0])) {
    return words[0];
  }
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/** A steady hue (0 to 359) for a theatre's logo tile. */
export function theatreHue(id: number): number {
  return (id * 47 + 190) % 360;
}
