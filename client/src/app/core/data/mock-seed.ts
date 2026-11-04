import { Movie, SeatCategory, Showtime, Theater, languagesOf } from '../models/catalog.model';
import { User, WalletEntry } from '../models/user.model';
import { Booking, BOOKING_COMMISSION_PER_TICKET } from '../models/booking.model';
import { ResaleTicket, ResaleTransaction } from '../models/resale.model';
import { Review } from '../models/social.model';
import { AppNotification } from '../models/social.model';
import { hashCode, isoDaysAgo, isoDaysAhead, isoDaysAgo as ago } from './mock-utils';

export const CITIES = ['Chennai'];

export const MOVIES: Movie[] = [
  {
    id: 1,
    tmdbId: 101,
    title: 'Couple Friendly',
    genre: 'Romance, Drama',
    posterUrl: '/posters/couple-friendly.jpg',
    description:
      'A romantic drama from writer-director Ashwin Chandrasekar, with Santosh Sobhan and Manasa Varanasi.',
    durationMinutes: 121,
    tmdbRating: 7.8,
    releaseDate: '2026-02-14T00:00:00.000Z',
    language: 'Telugu, Tamil',
    certificate: 'UA',
    tags: ['2D'],
  },
  {
    id: 2,
    tmdbId: 102,
    title: 'With Love',
    genre: 'Romance, Comedy',
    posterUrl: '/posters/with-love.jpg',
    description:
      'A teen romantic comedy written and directed by Madhan, with Abishan Jeevinth and Anaswara Rajan.',
    durationMinutes: 140,
    tmdbRating: 7.4,
    releaseDate: '2026-02-06T00:00:00.000Z',
    language: 'Tamil',
    certificate: 'U',
    tags: ['2D'],
  },
  {
    id: 3,
    tmdbId: 103,
    title: '29',
    genre: 'Romance, Drama',
    posterUrl: '/posters/29.jpg',
    description:
      'A romantic drama written and directed by Rathna Kumar, with Vidhu and Preethi Asrani in the lead.',
    durationMinutes: 137,
    tmdbRating: 7.2,
    releaseDate: '2026-05-08T00:00:00.000Z',
    language: 'Tamil',
    certificate: 'UA',
    tags: ['2D'],
  },
  {
    id: 4,
    tmdbId: 104,
    title: 'Karuppu',
    genre: 'Fantasy, Action',
    posterUrl: '/posters/karuppu.jpg',
    description:
      'A fantasy action drama directed by RJ Balaji and rooted in the folk deity Karuppu, with Suriya in the lead.',
    durationMinutes: 152,
    tmdbRating: 8.1,
    releaseDate: '2026-05-15T00:00:00.000Z',
    language: 'Tamil, Telugu',
    certificate: 'UA',
    tags: ['IMAX'],
  },
  {
    id: 5,
    tmdbId: 105,
    title: 'Jana Nayagan',
    genre: 'Action, Drama',
    posterUrl: '/posters/jana-nayagan.jpg',
    description:
      'A political action film directed by H. Vinoth, billed as Vijay\'s final film as an actor.',
    durationMinutes: 183,
    tmdbRating: 8.3,
    releaseDate: '2026-07-23T00:00:00.000Z',
    language: 'Tamil, Telugu, Hindi',
    certificate: 'UA',
    tags: ['IMAX', 'Dolby Atmos'],
  },
  {
    id: 6,
    tmdbId: 106,
    title: 'DC',
    genre: 'Action, Thriller',
    posterUrl: '/posters/dc.jpg',
    description:
      'An action thriller directed by Arun Matheswaran, with Lokesh Kanagaraj in the lead.',
    durationMinutes: 142,
    tmdbRating: 7.6,
    releaseDate: '2026-08-07T00:00:00.000Z',
    language: 'Tamil',
    certificate: 'UA',
    tags: ['Dolby Atmos'],
  },
  {
    id: 7,
    tmdbId: 107,
    title: 'Modha Rathiri',
    genre: 'Comedy, Drama',
    posterUrl: '/posters/modha-rathiri.jpg',
    description:
      'A comedy drama from debut director Raja Karuppasamy.',
    durationMinutes: 143,
    tmdbRating: 7.1,
    releaseDate: '2026-08-21T00:00:00.000Z',
    language: 'Tamil',
    certificate: 'UA',
    tags: ['2D'],
  },
  {
    id: 8,
    tmdbId: 108,
    title: 'Dorothy',
    genre: 'Crime, Drama',
    posterUrl: '/posters/dorothy.jpg',
    description:
      'A crime drama written and directed by Karthik Subbaraj, with Keerthy Suresh.',
    durationMinutes: 146,
    tmdbRating: 7.9,
    releaseDate: '2026-09-25T00:00:00.000Z',
    language: 'Tamil',
    certificate: 'UA',
    tags: ['2D', 'Dolby Atmos'],
  },
  {
    id: 9,
    tmdbId: 109,
    title: 'Baththa',
    genre: 'Comedy, Drama',
    posterUrl: '/posters/baththa.jpg',
    description:
      'A comedy drama written and directed by Balaji Tharaneetharan, with Vijay Sethupathi in the title role.',
    durationMinutes: 158,
    tmdbRating: 7.5,
    releaseDate: '2026-10-01T00:00:00.000Z',
    language: 'Tamil',
    certificate: 'UA',
    tags: ['2D'],
  },
  {
    id: 10,
    tmdbId: 110,
    title: 'Jailer 2',
    genre: 'Action, Comedy',
    posterUrl: '/posters/jailer-2.jpg',
    description:
      'Rajinikanth returns in the sequel to Jailer, directed by Nelson Dilipkumar.',
    durationMinutes: 165,
    tmdbRating: 8.6,
    releaseDate: '2026-10-15T00:00:00.000Z',
    language: 'Tamil, Telugu, Hindi',
    certificate: 'UA',
    tags: ['IMAX', 'Dolby Atmos'],
  },
  {
    id: 11,
    tmdbId: 111,
    title: 'Scene',
    genre: 'Action, Comedy',
    posterUrl: '/posters/scene.jpg',
    description:
      'An action comedy directed by Jithu Madhavan, with Suriya, Naslen and Nazriya Nazim.',
    durationMinutes: 149,
    tmdbRating: 7.7,
    releaseDate: '2026-11-06T00:00:00.000Z',
    language: 'Tamil',
    certificate: 'UA',
    tags: ['IMAX'],
  },
  {
    id: 12,
    tmdbId: 112,
    title: 'Thaai Kizhavi',
    genre: 'Comedy, Drama',
    posterUrl: '/posters/thaai-kizhavi.jpg',
    description:
      'A comedy drama about a godmother figure, from debut director Sivakumar Murugesan.',
    durationMinutes: 142,
    tmdbRating: 6.9,
    releaseDate: '2026-04-10T00:00:00.000Z',
    language: 'Tamil',
    certificate: 'U',
    tags: ['2D'],
  },
];

export const THEATERS: Theater[] = [
  {
    id: 1,
    name: 'Sathyam Cinemas',
    city: 'Chennai',
    address: '8 Thiru Vi Ka Road, Royapettah',
    latitude: 13.0545,
    longitude: 80.2578,
    phoneNumber: null,
  },
  {
    id: 2,
    name: 'Escape Cinemas',
    city: 'Chennai',
    address: 'Express Avenue Mall, Whites Road, Royapettah',
    latitude: 13.0587,
    longitude: 80.264,
    phoneNumber: null,
  },
  {
    id: 3,
    name: 'Luxe Cinemas',
    city: 'Chennai',
    address: 'Phoenix MarketCity, Velachery Main Road, Velachery',
    latitude: 12.9913,
    longitude: 80.2185,
    phoneNumber: null,
  },
  {
    id: 4,
    name: 'PVR VR Chennai',
    city: 'Chennai',
    address: 'VR Chennai Mall, Anna Nagar West',
    latitude: 13.0872,
    longitude: 80.201,
    phoneNumber: null,
  },
  {
    id: 5,
    name: 'PVR INOX Chennai Citi Centre',
    city: 'Chennai',
    address: 'Dr. Radhakrishnan Salai, Mylapore',
    latitude: 13.041,
    longitude: 80.257,
    phoneNumber: null,
  },
  {
    id: 6,
    name: 'Rohini Silver Screens',
    city: 'Chennai',
    address: 'Poonamallee High Road, Koyambedu',
    latitude: 13.0511,
    longitude: 80.1953,
    phoneNumber: null,
  },
  {
    id: 7,
    name: 'AGS Cinemas OMR',
    city: 'Chennai',
    address: 'Old Mahabalipuram Road, Navlur',
    latitude: 12.8486,
    longitude: 80.2273,
    phoneNumber: null,
  },
  {
    id: 8,
    name: 'Ega Multiplex',
    city: 'Chennai',
    address: '810 Poonamallee High Road, Kilpauk',
    latitude: 13.0841,
    longitude: 80.2411,
    phoneNumber: null,
  },
];

const SHOW_TIMES = ['09:30', '13:00', '16:30', '19:45', '22:30'];
const FORMATS = ['2D', '3D', 'IMAX', 'PXL'];

/** What a seat costs before fees, by show format. */
function basePriceFor(format: string): number {
  switch (format) {
    case 'IMAX':
      return 340;
    case 'PXL':
      return 300;
    case '3D':
      return 250;
    default:
      return 210;
  }
}

/** The language of a show: one of the movie's languages, picked from a key so it stays the same. */
function languageFor(movie: Pick<Movie, 'language'>, key: string): string {
  const languages = languagesOf(movie);
  return languages[hashCode(key) % languages.length] ?? movie.language;
}

/**
 * Showtimes screened in a large hall: 25 rows of 40 seats (1,000 seats), the first 5 rows Premium.
 * Declared before the showtimes are built because that code reads it.
 */
export const LARGE_HALL_SHOWTIME_IDS = new Set<number>([436]);

function buildShowtimes(): Showtime[] {
  const showtimes: Showtime[] = [];
  let id = 100;

  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + day);

    for (const movie of MOVIES) {
      // Not every movie plays in every city on every day.
      const cityPool = CITIES.filter((city) => hashCode(`${movie.id}-${city}-${day}`) % 5 !== 0);
      const theaterPool = THEATERS.filter((theater) => cityPool.includes(theater.city));
      if (!theaterPool.length) {
        continue;
      }

      const theaterCount = 1 + (hashCode(`${movie.id}-${day}`) % 2);
      for (let t = 0; t < theaterCount; t++) {
        const theater = theaterPool[hashCode(`${movie.id}-${day}-${t}`) % theaterPool.length];
        const slotCount = 3 + (hashCode(`${movie.id}-${day}-${t}-s`) % 3);
        for (let s = 0; s < slotCount; s++) {
          const time = SHOW_TIMES[(hashCode(`${movie.id}-${day}-${t}-${s}`) + s) % SHOW_TIMES.length];
          const format = FORMATS[hashCode(`${movie.id}-${day}-${t}-${s}-f`) % FORMATS.length];
          const basePrice = basePriceFor(format);
          const dateTime = new Date(date);
          const [hours, minutes] = time.split(':').map(Number);
          dateTime.setHours(hours, minutes, 0, 0);
          if (dateTime.getTime() < Date.now()) {
            continue;
          }
          const totalSeats = 96;
          showtimes.push({
            id: id++,
            movieId: movie.id,
            theaterId: theater.id,
            showDateTime: dateTime.toISOString(),
            language: languageFor(movie, `${movie.id}-${day}-${t}-${s}-l`),
            format,
            totalSeats,
            availableSeats: 30 + (hashCode(`${id}-${movie.id}-${theater.id}`) % 60),
            basePrice,
          });

          const created = showtimes[showtimes.length - 1];
          if (LARGE_HALL_SHOWTIME_IDS.has(created.id)) {
            created.totalSeats = 1000;
            created.availableSeats = 840;
          }
        }
      }
    }
  }

  return showtimes;
}

export const SHOWTIMES = buildShowtimes();

// Older Tamil films whose runs are over. They have no upcoming shows, so browse and search never list them;
// they exist for the demo user's completed tickets. Active and resale tickets use the current films above.
MOVIES.push(
  ...(
    [
      ['Coolie', 'Action, Thriller', 'coolie', 170, 7.9, '2025-08-14'],
      ['Good Bad Ugly', 'Action, Comedy', 'good-bad-ugly', 139, 7.6, '2025-04-10'],
      ['Retro', 'Romance, Action', 'retro', 168, 7.4, '2025-05-01'],
      ['Dragon', 'Comedy, Drama', 'dragon', 155, 8.0, '2025-02-21'],
      ['Thug Life', 'Crime, Action', 'thug-life', 163, 7.1, '2025-06-05'],
      ['Madharaasi', 'Action, Thriller', 'madharaasi', 168, 7.3, '2025-09-05'],
    ] as const
  ).map(
    ([title, genre, poster, durationMinutes, tmdbRating, releaseDate], index): Movie => ({
      id: 13 + index,
      tmdbId: 113 + index,
      title,
      genre,
      posterUrl: `/posters/${poster}.jpg`,
      description: 'A Tamil film that finished its run in theatres.',
      durationMinutes,
      tmdbRating,
      releaseDate: `${releaseDate}T00:00:00.000Z`,
      language: 'Tamil',
      certificate: 'UA',
      tags: ['2D'],
    }),
  ),
);
const TAMIL_MOVIE_IDS = [13, 14, 15, 16, 17, 18];

let nextShowtimeId = Math.max(...SHOWTIMES.map((showtime) => showtime.id)) + 1;

/** A show that started `minutesAgo` minutes ago. It is only reachable through the bookings that point at it. */
function pastShowtime(movieId: number, minutesAgo: number, index: number): Showtime {
  const theater = THEATERS[index % THEATERS.length];
  const format = FORMATS[index % FORMATS.length];
  const showtime: Showtime = {
    id: nextShowtimeId++,
    movieId,
    theaterId: theater.id,
    showDateTime: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    language: languageFor(MOVIES.find((movie) => movie.id === movieId)!, `past-${movieId}-${index}`),
    format,
    totalSeats: 96,
    availableSeats: 40 + index,
    basePrice: basePriceFor(format),
  };
  SHOWTIMES.push(showtime);
  return showtime;
}

// Behind the unsold listing (started 20 minutes ago), the two sold ones and the delisted one.
const startedShowtime = pastShowtime(13, 20, 0);
const SOLD_SHOWS = [pastShowtime(14, 180, 1), pastShowtime(15, 60, 2)];
const DELISTED_SHOW = pastShowtime(16, 300, 3);
// Sixteen plain past tickets, from two days ago back about a month.
const PLAIN_PAST_SHOWS = Array.from({ length: 16 }, (_, index) =>
  pastShowtime(TAMIL_MOVIE_IDS[index % TAMIL_MOVIE_IDS.length], (index + 2) * 24 * 60 + (index % 5) * 90, index + 4),
);

export const USERS: User[] = [
  {
    id: 1,
    phoneNumber: '+919876543210',
    fullName: 'Mad Monkey',
    firstName: 'Mad',
    lastName: 'Monkey',
    email: 'madmonkey@example.com',
    city: 'Chennai',
    bio: 'Action and sci-fi fan. Usually booking last-minute IMAX seats.',
    profileImageUrl: null,
    birthday: '1999-03-14',
    interests: ['Action', 'Sci-Fi', 'IMAX'],
    userType: 'Both',
    isPhoneVerified: true,
    buyerRating: 4.6,
    buyerReviewCount: 12,
    sellerRating: 4.8,
    sellerReviewCount: 9,
    walletBalance: 1240,
    totalEarned: 2860,
    createdAt: isoDaysAgo(120),
    isActive: true,
  },
  {
    id: 2,
    phoneNumber: '+919810001111',
    fullName: 'Priya Nair',
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya.nair@example.com',
    city: 'Chennai',
    bio: 'Booked my seats by mistake, happy to resell at a fair price.',
    profileImageUrl: null,
    birthday: '2002-07-22',
    interests: ['Drama', 'Romance'],
    userType: 'Seller',
    isPhoneVerified: true,
    buyerRating: 4.7,
    buyerReviewCount: 5,
    sellerRating: 4.9,
    sellerReviewCount: 18,
    walletBalance: 4820,
    totalEarned: 11450,
    createdAt: isoDaysAgo(300),
    isActive: true,
  },
  {
    id: 3,
    phoneNumber: '+919810002222',
    fullName: 'Rahul Verma',
    firstName: 'Rahul',
    lastName: 'Verma',
    email: null,
    city: 'Chennai',
    bio: 'Weekend cinema regular, always looking for good company.',
    profileImageUrl: null,
    birthday: '1997-01-09',
    interests: ['Action', 'Thriller', 'Horror'],
    userType: 'Both',
    isPhoneVerified: true,
    buyerRating: 4.5,
    buyerReviewCount: 21,
    sellerRating: 4.6,
    sellerReviewCount: 11,
    walletBalance: 860,
    totalEarned: 2140,
    createdAt: isoDaysAgo(410),
    isActive: true,
  },
  {
    id: 4,
    phoneNumber: '+919810003333',
    fullName: 'Sneha Iyer',
    firstName: 'Sneha',
    lastName: 'Iyer',
    email: 'sneha.iyer@example.com',
    city: 'Chennai',
    bio: 'Tamil film buff and regular at the weekend shows.',
    profileImageUrl: null,
    birthday: '2000-05-30',
    interests: ['Drama', 'Family', 'Tamil'],
    userType: 'Both',
    isPhoneVerified: true,
    buyerRating: 4.9,
    buyerReviewCount: 8,
    sellerRating: 4.4,
    sellerReviewCount: 4,
    walletBalance: 0,
    totalEarned: 640,
    createdAt: isoDaysAgo(260),
    isActive: true,
  },
  {
    id: 5,
    phoneNumber: '+919810004444',
    fullName: 'Imran Khan',
    firstName: 'Imran',
    lastName: 'Khan',
    email: null,
    city: 'Chennai',
    bio: null,
    profileImageUrl: null,
    birthday: '1995-11-18',
    interests: ['Historical', 'Crime'],
    userType: 'Seller',
    isPhoneVerified: true,
    buyerRating: 4.2,
    buyerReviewCount: 7,
    sellerRating: 4.3,
    sellerReviewCount: 6,
    walletBalance: 1720,
    totalEarned: 3980,
    createdAt: isoDaysAgo(150),
    isActive: true,
  },
  {
    id: 6,
    phoneNumber: '+919810005555',
    fullName: 'Divya Menon',
    firstName: 'Divya',
    lastName: 'Menon',
    email: 'divya.menon@example.com',
    city: 'Chennai',
    bio: 'Loves slow movies and long post-credit discussions.',
    profileImageUrl: null,
    birthday: '1998-08-04',
    interests: ['Romance', 'Drama'],
    userType: 'Both',
    isPhoneVerified: true,
    buyerRating: 4.8,
    buyerReviewCount: 14,
    sellerRating: 4.7,
    sellerReviewCount: 5,
    walletBalance: 310,
    totalEarned: 960,
    createdAt: isoDaysAgo(200),
    isActive: true,
  },
  {
    id: 7,
    phoneNumber: '+919810006666',
    fullName: 'Karthik Subramanian',
    firstName: 'Karthik',
    lastName: 'Subramanian',
    email: null,
    city: 'Chennai',
    bio: 'IMAX or nothing.',
    profileImageUrl: null,
    birthday: '1993-02-27',
    interests: ['Sci-Fi', 'IMAX'],
    userType: 'Seller',
    isPhoneVerified: true,
    buyerRating: 4.1,
    buyerReviewCount: 9,
    sellerRating: 4.7,
    sellerReviewCount: 15,
    walletBalance: 940,
    totalEarned: 5220,
    createdAt: isoDaysAgo(330),
    isActive: true,
  },
  {
    id: 8,
    phoneNumber: '+919810007777',
    fullName: 'Ananya Rao',
    firstName: 'Ananya',
    lastName: 'Rao',
    email: 'ananya.rao@example.com',
    city: 'Chennai',
    bio: 'New in town, looking for people to watch movies with.',
    profileImageUrl: null,
    birthday: '2003-10-12',
    interests: ['Comedy', 'Romance'],
    userType: 'Buyer',
    isPhoneVerified: true,
    buyerRating: 4.6,
    buyerReviewCount: 3,
    sellerRating: 0,
    sellerReviewCount: 0,
    walletBalance: 0,
    totalEarned: 0,
    createdAt: isoDaysAgo(45),
    isActive: true,
  },
];

function seatRows(): string[] {
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
}

export const SEAT_ROWS = seatRows();

export function seatCategoryForRow(row: string): 'Premium' | 'Regular' {
  return row === 'A' || row === 'B' ? 'Premium' : 'Regular';
}

export function seatsInRow(row: string): number {
  return row === 'A' || row === 'B' ? 10 : 12;
}

/** Every seat category a listing can contain, in the order they are shown. */
export const SEAT_CATEGORIES: SeatCategory[] = ['Recliner', 'Premium', 'Couple', 'Regular'];

export interface SeatRowLayout {
  label: string;
  category: SeatCategory;
  seats: number;
}

/** One theatre has a four-category hall: recliners at the back-row, couples in the middle. */
const FOUR_CATEGORY_ROWS: { label: string; category: SeatCategory }[] = [
  { label: 'A', category: 'Recliner' },
  { label: 'B', category: 'Premium' },
  { label: 'C', category: 'Regular' },
  { label: 'D', category: 'Regular' },
  { label: 'E', category: 'Regular' },
  { label: 'F', category: 'Couple' },
  { label: 'G', category: 'Regular' },
  { label: 'H', category: 'Regular' },
];

function fourCategoryTheaterId(): number | undefined {
  return SHOWTIMES[2]?.theaterId;
}

export function seatLayoutFor(showtimeId: number): SeatRowLayout[] {
  const showtime = SHOWTIMES.find((item) => item.id === showtimeId);
  if (showtime && showtime.theaterId === fourCategoryTheaterId()) {
    return FOUR_CATEGORY_ROWS.map(({ label, category }) => ({ label, category, seats: seatsInRow(label) }));
  }
  if (LARGE_HALL_SHOWTIME_IDS.has(showtimeId)) {
    return Array.from({ length: 25 }, (_, index) => ({
      label: String.fromCharCode(65 + index),
      category: index < 5 ? 'Premium' : 'Regular',
      seats: 40,
    }));
  }

  return SEAT_ROWS.map((label) => ({
    label,
    category: seatCategoryForRow(label),
    seats: seatsInRow(label),
  }));
}

/** What one seat of a category costs at a showtime, before any discount. */
export function categoryUnitPrice(basePrice: number, category: SeatCategory): number {
  switch (category) {
    case 'Recliner':
      return basePrice + 200;
    case 'Premium':
      return basePrice + 80;
    case 'Couple':
      return basePrice + 40;
    default:
      return basePrice;
  }
}

/** The category and list price of a seat, by its id such as "C4". */
export function seatUnitPrice(
  showtime: { id: number; basePrice: number },
  seatId: string,
): { category: SeatCategory; price: number } {
  const row = seatId.replace(/[0-9]+$/, '');
  const category: SeatCategory = seatLayoutFor(showtime.id).find((item) => item.label === row)?.category ?? 'Regular';
  return { category, price: categoryUnitPrice(showtime.basePrice, category) };
}

/** Splits a total across seats in proportion to their list prices; the last seat takes any rounding. */
export function splitByListPrice(
  showtime: { id: number; basePrice: number },
  seats: string[],
  total: number,
): Record<string, number> {
  const units = seats.map((seat) => seatUnitPrice(showtime, seat).price);
  const listTotal = units.reduce((sum, price) => sum + price, 0);
  const out: Record<string, number> = {};
  let used = 0;
  seats.forEach((seat, index) => {
    const value =
      index === seats.length - 1
        ? Math.round((total - used) * 100) / 100
        : Math.round(((total * units[index]) / listTotal) * 100) / 100;
    out[seat] = value;
    used += value;
  });
  return out;
}

/** Seats that look taken because of other people's bookings (deterministic). */
export function pseudoBookedSeat(showtimeId: number, seatId: string): boolean {
  return hashCode(`${showtimeId}-${seatId}`) % 100 < 16;
}

/** Chennai shows that start `daysAhead` days from today (1 to 6), or any show of that day when there are none. */
function showtimesOnDay(daysAhead: number): Showtime[] {
  const target = new Date();
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + daysAhead);
  const onDay = SHOWTIMES.filter((showtime) => {
    const start = new Date(showtime.showDateTime);
    return (
      start.getFullYear() === target.getFullYear() &&
      start.getMonth() === target.getMonth() &&
      start.getDate() === target.getDate()
    );
  });
  const local = onDay.filter(
    (showtime) => THEATERS.find((theater) => theater.id === showtime.theaterId)?.city === 'Chennai',
  );
  return local.length ? local : onDay.length ? onDay : SHOWTIMES;
}

const upcomingShows = new Map<string, Showtime | undefined>();

/** The first show of a film that is at least a day away, so a sample ticket for it stays active. Chosen once. */
function upcomingShow(title: string): Showtime | undefined {
  if (!upcomingShows.has(title)) {
    const movieId = MOVIES.find((movie) => movie.title === title)?.id;
    const dayAway = Date.now() + 24 * 60 * 60 * 1000;
    upcomingShows.set(
      title,
      SHOWTIMES.find((showtime) => showtime.movieId === movieId && new Date(showtime.showDateTime).getTime() > dayAway),
    );
  }
  return upcomingShows.get(title);
}

export function buildBookings(): Booking[] {
  const bookings: Booking[] = [];
  let id = 500;
  const owners = [2, 3, 5, 6, 7, 4];

  for (const [ownerIndex, owner] of owners.entries()) {
    for (let i = 0; i < 2; i++) {
      // Spread the spare tickets over the week so the marketplace has listings on several days.
      const dayPool = showtimesOnDay(((ownerIndex * 2 + i) % 6) + 1);
      const showtime = dayPool[hashCode(`booking-${owner}-${i}`) % dayPool.length];
      if (!showtime) {
        continue;
      }
      const quantity = 1 + (hashCode(`qty-${owner}-${i}`) % 3);
      const seats: string[] = [];
      for (let s = 0; s < quantity; s++) {
        const row = SEAT_ROWS[hashCode(`row-${owner}-${i}-${s}`) % SEAT_ROWS.length];
        const number = 1 + (hashCode(`num-${owner}-${i}-${s}`) % seatsInRow(row));
        const seat = `${row}${number}`;
        if (!seats.includes(seat)) {
          seats.push(seat);
        }
      }
      const count = seats.length;
      const bookingPrice = showtime.basePrice * count;
      const commissionFee = BOOKING_COMMISSION_PER_TICKET * count;
      bookings.push({
        id: id++,
        showtimeId: showtime.id,
        userId: owner,
        quantity: count,
        seatNumbers: seats,
        bookingPrice,
        commissionFee,
        totalAmount: bookingPrice + commissionFee,
        paymentId: `pi_mock_${id}`,
        status: 'Completed',
        qrCode: `THIRAIHUB:SH-${1000 + id}`,
        confirmationCode: `SH${1000 + id}`,
        bookedAt: isoDaysAgo(1 + (hashCode(`when-${owner}-${i}`) % 12)),
        cancelledAt: null,
      });
    }
  }

  // Demo user: a Premium + Regular ticket for Scene, and a ticket that spans all four categories for
  // Jailer 2. Both are active tickets, for shows at least a day away.
  const activeTickets = [
    { show: upcomingShow('Scene'), seats: ['B2', 'D6'] },
    { show: upcomingShow('Jailer 2'), seats: ['A3', 'B5', 'F2', 'G9'] },
  ];
  for (const { show: fourCategory, seats } of activeTickets) {
    if (fourCategory) {
      const bookingPrice = seats.reduce((total, seat) => total + seatUnitPrice(fourCategory, seat).price, 0);
      bookings.push({
        id: id++,
        showtimeId: fourCategory.id,
        userId: 1,
        quantity: seats.length,
        seatNumbers: seats,
        bookingPrice,
        commissionFee: BOOKING_COMMISSION_PER_TICKET * seats.length,
        totalAmount: bookingPrice + BOOKING_COMMISSION_PER_TICKET * seats.length,
        paymentId: `pi_mock_${id}`,
        status: 'Completed',
        qrCode: `THIRAIHUB:SH-${1000 + id}`,
        confirmationCode: `SH${1000 + id}`,
        bookedAt: isoDaysAgo(3),
        cancelledAt: null,
      });
    }
  }

  // The demo user's booking sold seat by seat: D3 went to a buyer, D4 is still listed.
  {
    const showtime = upcomingShow('Baththa');
    if (showtime) {
      const seats = ['D3', 'D4'];
      const bookingPrice = seats.reduce((total, seat) => total + seatUnitPrice(showtime, seat).price, 0);
      bookings.push({
        id: id++,
        showtimeId: showtime.id,
        userId: 1,
        quantity: seats.length,
        seatNumbers: seats,
        bookingPrice,
        commissionFee: BOOKING_COMMISSION_PER_TICKET * seats.length,
        totalAmount: bookingPrice + BOOKING_COMMISSION_PER_TICKET * seats.length,
        paymentId: `pi_mock_${id}`,
        status: 'Completed',
        qrCode: `THIRAIHUB:SH-${1000 + id}`,
        confirmationCode: `SH${1000 + id}`,
        bookedAt: isoDaysAgo(3),
        cancelledAt: null,
      });
    }
  }

  // The demo user's booking for the show that already started; its listing went unsold.
  {
    const seats = ['F4', 'F5'];
    const showtime = startedShowtime;
    const bookingPrice = seats.reduce((total, seat) => total + seatUnitPrice(showtime, seat).price, 0);
    bookings.push({
      id: id++,
      showtimeId: showtime.id,
      userId: 1,
      quantity: seats.length,
      seatNumbers: seats,
      bookingPrice,
      commissionFee: BOOKING_COMMISSION_PER_TICKET * seats.length,
      totalAmount: bookingPrice + BOOKING_COMMISSION_PER_TICKET * seats.length,
      paymentId: `pi_mock_${id}`,
      status: 'Completed',
      qrCode: `THIRAIHUB:SH-${1000 + id}`,
      confirmationCode: `SH${1000 + id}`,
      bookedAt: isoDaysAgo(3),
      cancelledAt: null,
    });
  }

  // Sixteen more past tickets for the demo user, all for Tamil films whose shows are over.
  PLAIN_PAST_SHOWS.forEach((showtime, index) => {
    const row = 'ABCDEFGH'[index % 8];
    const seats = [`${row}${3 + (index % 6)}`, `${row}${4 + (index % 6)}`];
    const bookingPrice = seats.reduce((total, seat) => total + seatUnitPrice(showtime, seat).price, 0);
    bookings.push({
      id: id++,
      showtimeId: showtime.id,
      userId: 1,
      quantity: seats.length,
      seatNumbers: seats,
      bookingPrice,
      commissionFee: BOOKING_COMMISSION_PER_TICKET * seats.length,
      totalAmount: bookingPrice + BOOKING_COMMISSION_PER_TICKET * seats.length,
      paymentId: `pi_mock_${id}`,
      status: 'Completed',
      qrCode: `THIRAIHUB:SH-${1000 + id}`,
      confirmationCode: `SH${1000 + id}`,
      bookedAt: isoDaysAgo(index + 5),
      cancelledAt: null,
    });
  });

  // Two demo-user bookings behind a live listing and a delisted one in "Your listings".
  for (const [showtime, seats] of [
    [upcomingShow('Dorothy'), ['E2', 'E3']],
    [DELISTED_SHOW, ['G2', 'G3']],
  ] as const) {
    if (!showtime) {
      continue;
    }
    const bookingPrice = seats.reduce((total, seat) => total + seatUnitPrice(showtime, seat).price, 0);
    bookings.push({
      id: id++,
      showtimeId: showtime.id,
      userId: 1,
      quantity: seats.length,
      seatNumbers: [...seats],
      bookingPrice,
      commissionFee: BOOKING_COMMISSION_PER_TICKET * seats.length,
      totalAmount: bookingPrice + BOOKING_COMMISSION_PER_TICKET * seats.length,
      paymentId: `pi_mock_${id}`,
      status: 'Completed',
      qrCode: `THIRAIHUB:SH-${1000 + id}`,
      confirmationCode: `SH${1000 + id}`,
      bookedAt: isoDaysAgo(4),
      cancelledAt: null,
    });
  }

  // Two more demo-user bookings whose seats were already resold, for the sold rows in "Your listings".
  for (const [showtime, seats] of [
    [SOLD_SHOWS[0], ['E4', 'E5']],
    [SOLD_SHOWS[1], ['H7', 'H8']],
  ] as const) {
    if (!showtime) {
      continue;
    }
    const bookingPrice = seats.reduce((total, seat) => total + seatUnitPrice(showtime, seat).price, 0);
    bookings.push({
      id: id++,
      showtimeId: showtime.id,
      userId: 1,
      quantity: seats.length,
      seatNumbers: [...seats],
      bookingPrice,
      commissionFee: BOOKING_COMMISSION_PER_TICKET * seats.length,
      totalAmount: bookingPrice + BOOKING_COMMISSION_PER_TICKET * seats.length,
      paymentId: `pi_mock_${id}`,
      status: 'Completed',
      qrCode: `THIRAIHUB:SH-${1000 + id}`,
      confirmationCode: `SH${1000 + id}`,
      bookedAt: isoDaysAgo(6),
      cancelledAt: null,
    });
  }

  return bookings;
}

export const BOOKINGS = buildBookings();

function buildResaleTickets(): ResaleTicket[] {
  const tickets: ResaleTicket[] = [];
  let id = 900;

  for (const booking of BOOKINGS) {
    if (booking.userId === 1 || booking.status !== 'Completed') {
      continue;
    }
    const ticket: ResaleTicket = {
      id: id++,
      bookingId: booking.id,
      sellerId: booking.userId,
      buyerId: null,
      seatNumbers: booking.seatNumbers,
      // Some sellers only sell the seats together.
      allowPartial: booking.seatNumbers.length > 1 && hashCode(`partial-${booking.id}`) % 3 !== 0,
      seatPrices: {},
      originalPrice: booking.bookingPrice,
      resalePrice: 0,
      sellerCommission: 0,
      buyerFee: 0,
      sellerReceives: 0,
      status: 'Available',
      listedAt: isoDaysAgo(1),
      soldAt: null,
      expiresAt:
        SHOWTIMES.find((showtime) => showtime.id === booking.showtimeId)?.showDateTime ??
        isoDaysAhead(2),
    };
    const discount = 0.68 + (hashCode(`disc-${booking.id}`) % 18) / 100;
    ticket.resalePrice = Math.round(ticket.originalPrice * discount);
    ticket.sellerCommission = Math.round(ticket.resalePrice * 0.05 * 100) / 100;
    ticket.sellerReceives = Math.round((ticket.resalePrice - ticket.sellerCommission) * 100) / 100;
    ticket.buyerFee = Math.round((ticket.resalePrice * 0.025 + 0.3) * 100) / 100;
    const listedShowtime = SHOWTIMES.find((item) => item.id === booking.showtimeId);
    if (listedShowtime) {
      ticket.seatPrices = splitByListPrice(listedShowtime, booking.seatNumbers, ticket.resalePrice);
    }
    tickets.push(ticket);
  }

  return tickets;
}

export const RESALE_TICKETS = buildResaleTickets();

// The demo buyer already completed one purchase, so keep that listing out of
// the marketplace and make the seeded transaction self-consistent.
const seedSoldTicket = RESALE_TICKETS[0];
if (seedSoldTicket) {
  seedSoldTicket.status = 'Sold';
  seedSoldTicket.buyerId = 1;
  seedSoldTicket.soldAt = isoDaysAgo(2);
}

// Sold listings of the demo user: both sold and paid out at once.
const demoSoldBookings = BOOKINGS.filter((booking) => booking.userId === 1).slice(-2);
const demoSoldTickets: ResaleTicket[] = demoSoldBookings.map((booking, index) => {
  const showtime = SHOWTIMES.find((item) => item.id === booking.showtimeId)!;
  const resalePrice = Math.round(booking.bookingPrice * 0.85);
  const commission = Math.round(resalePrice * 0.05 * 100) / 100;
  return {
    id: 990 + index,
    bookingId: booking.id,
    sellerId: 1,
    buyerId: 3 + index,
    seatNumbers: booking.seatNumbers,
    allowPartial: true,
    seatPrices: splitByListPrice(showtime, booking.seatNumbers, resalePrice),
    originalPrice: booking.bookingPrice,
    resalePrice,
    sellerCommission: commission,
    buyerFee: Math.round((resalePrice * 0.025 + 0.3) * 100) / 100,
    sellerReceives: Math.round((resalePrice - commission) * 100) / 100,
    status: 'Sold',
    listedAt: isoDaysAgo(5 - index),
    soldAt: isoDaysAgo(4 - index * 3),
    expiresAt: showtime.showDateTime,
  };
});
// A live listing and a delisted one for the demo user, from the two bookings just before the sold pair.
const demoOpenBookings = BOOKINGS.filter((booking) => booking.userId === 1).slice(-4, -2);
const demoOpenTickets: ResaleTicket[] = demoOpenBookings.map((booking, index) => {
  const showtime = SHOWTIMES.find((item) => item.id === booking.showtimeId)!;
  const resalePrice = Math.round(booking.bookingPrice * 0.85);
  const commission = Math.round(resalePrice * 0.05 * 100) / 100;
  return {
    id: 992 + index,
    bookingId: booking.id,
    sellerId: 1,
    buyerId: null,
    seatNumbers: booking.seatNumbers,
    allowPartial: true,
    seatPrices: splitByListPrice(showtime, booking.seatNumbers, resalePrice),
    originalPrice: booking.bookingPrice,
    resalePrice,
    sellerCommission: commission,
    buyerFee: Math.round((resalePrice * 0.025 + 0.3) * 100) / 100,
    sellerReceives: Math.round((resalePrice - commission) * 100) / 100,
    status: index === 0 ? 'Available' : 'Delisted',
    listedAt: isoDaysAgo(index === 0 ? 0 : 2, 2),
    soldAt: null,
    expiresAt: showtime.showDateTime,
  };
});
RESALE_TICKETS.push(...demoOpenTickets);

// The seat-by-seat booking above, split in two: D3 sold to a buyer, D4 still listed. Both halves share a group.
const splitShowtime = upcomingShow('Baththa');
const splitBooking = splitShowtime
  ? BOOKINGS.find(
      (booking) =>
        booking.userId === 1 && booking.showtimeId === splitShowtime.id && booking.seatNumbers.join() === 'D3,D4',
    )
  : undefined;
if (splitShowtime && splitBooking) {
  const paidEach = Math.round((splitBooking.bookingPrice / 2) * 100) / 100;
  const askEach = Math.round(paidEach * 0.85);
  const commission = Math.round(askEach * 0.05 * 100) / 100;
  const half = (id: number, seat: string, status: 'Available' | 'Sold'): ResaleTicket => ({
    id,
    bookingId: splitBooking.id,
    sellerId: 1,
    buyerId: status === 'Sold' ? 5 : null,
    seatNumbers: [seat],
    allowPartial: false,
    splitGroup: 995,
    listedSeatCount: 2,
    seatPrices: { [seat]: askEach },
    originalPrice: paidEach,
    resalePrice: askEach,
    sellerCommission: commission,
    buyerFee: Math.round((askEach * 0.025 + 0.3) * 100) / 100,
    sellerReceives: Math.round((askEach - commission) * 100) / 100,
    status,
    listedAt: isoDaysAgo(1, 4),
    soldAt: status === 'Sold' ? isoDaysAgo(0, 20) : null,
    expiresAt: splitShowtime.showDateTime,
  });
  RESALE_TICKETS.push(half(995, 'D4', 'Available'), half(996, 'D3', 'Sold'));
}

// Listed yesterday, still unsold when the show started: Expired, shown as "Unsold".
const unsoldBooking = BOOKINGS.find((booking) => booking.userId === 1 && booking.showtimeId === startedShowtime.id)!;
const unsoldPrice = Math.round(unsoldBooking.bookingPrice * 0.85);
const unsoldCommission = Math.round(unsoldPrice * 0.05 * 100) / 100;
RESALE_TICKETS.push({
  id: 994,
  bookingId: unsoldBooking.id,
  sellerId: 1,
  buyerId: null,
  seatNumbers: unsoldBooking.seatNumbers,
  allowPartial: true,
  seatPrices: splitByListPrice(startedShowtime, unsoldBooking.seatNumbers, unsoldPrice),
  originalPrice: unsoldBooking.bookingPrice,
  resalePrice: unsoldPrice,
  sellerCommission: unsoldCommission,
  buyerFee: Math.round((unsoldPrice * 0.025 + 0.3) * 100) / 100,
  sellerReceives: Math.round((unsoldPrice - unsoldCommission) * 100) / 100,
  status: 'Expired',
  listedAt: isoDaysAgo(1),
  soldAt: null,
  expiresAt: startedShowtime.showDateTime,
});

RESALE_TICKETS.push(...demoSoldTickets);

export const RESALE_TRANSACTIONS: ResaleTransaction[] = [
  {
    id: 700,
    resaleTicketId: RESALE_TICKETS[0]?.id ?? 900,
    buyerId: 1,
    sellerId: RESALE_TICKETS[0]?.sellerId ?? 2,
    resalePrice: RESALE_TICKETS[0]?.resalePrice ?? 220,
    buyerFee: RESALE_TICKETS[0]?.buyerFee ?? 5.8,
    totalBuyerPays: (RESALE_TICKETS[0]?.resalePrice ?? 220) + (RESALE_TICKETS[0]?.buyerFee ?? 5.8),
    sellerReceives: RESALE_TICKETS[0]?.sellerReceives ?? 209,
    status: 'Completed',
    paymentId: 'pi_mock_txn',
    purchasedAt: isoDaysAgo(3),
    completedAt: isoDaysAgo(2),
    role: 'buyer',
    ticket: null,
    counterpart: null,
  },
  ...demoSoldTickets.map(
    (ticket, index): ResaleTransaction => ({
      id: 710 + index,
      resaleTicketId: ticket.id,
      buyerId: ticket.buyerId ?? 3,
      sellerId: 1,
      resalePrice: ticket.resalePrice,
      buyerFee: ticket.buyerFee,
      totalBuyerPays: Math.round((ticket.resalePrice + ticket.buyerFee) * 100) / 100,
      sellerReceives: ticket.sellerReceives,
      status: 'Completed',
      paymentId: `pi_mock_sold_${index}`,
      purchasedAt: ticket.soldAt ?? isoDaysAgo(1),
      completedAt: ticket.soldAt,
      role: 'seller',
      ticket: null,
      counterpart: null,
    }),
  ),
];

// The sale of D3 behind the split sample.
const splitSold = RESALE_TICKETS.find((ticket) => ticket.id === 996);
if (splitSold) {
  RESALE_TRANSACTIONS.push({
    id: 712,
    resaleTicketId: splitSold.id,
    buyerId: 5,
    sellerId: 1,
    resalePrice: splitSold.resalePrice,
    buyerFee: splitSold.buyerFee,
    totalBuyerPays: Math.round((splitSold.resalePrice + splitSold.buyerFee) * 100) / 100,
    sellerReceives: splitSold.sellerReceives,
    status: 'Completed',
    paymentId: 'pi_mock_sold_split',
    purchasedAt: splitSold.soldAt ?? isoDaysAgo(1),
    completedAt: splitSold.soldAt,
    role: 'seller',
    ticket: null,
    counterpart: null,
  });
}

export const REVIEWS: Review[] = [
  {
    id: 1,
    reviewerId: 1,
    revieweeId: 2,
    type: 'SellerReview',
    rating: 5,
    comment: 'Delivered the tickets within minutes of the payment. Very responsive.',
    createdAt: isoDaysAgo(4),
    reviewerName: 'Mad Monkey',
  },
  {
    id: 2,
    reviewerId: 3,
    revieweeId: 2,
    type: 'SellerReview',
    rating: 4,
    comment: 'Good seller, took a day to forward the booking but seats were as promised.',
    createdAt: isoDaysAgo(9),
    reviewerName: 'Rahul Verma',
  },
  {
    id: 3,
    reviewerId: 1,
    revieweeId: 3,
    type: 'BuyerReview',
    rating: 5,
    comment: 'Paid immediately and confirmed delivery. Would buy again.',
    createdAt: isoDaysAgo(6),
    reviewerName: 'Mad Monkey',
  },
  {
    id: 5,
    reviewerId: 5,
    revieweeId: 7,
    type: 'SellerReview',
    rating: 4,
    comment: 'Reliable. Ticket price was fair for an IMAX show.',
    createdAt: isoDaysAgo(12),
    reviewerName: 'Imran Khan',
  },
];

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 1,
    type: 'booking',
    title: 'Booking confirmed',
    body: 'Your 2 tickets for The Last Monsoon are confirmed. Show the QR at the entrance.',
    isRead: false,
    createdAt: isoDaysAgo(0, 3),
    link: '/my-bookings',
  },
];

export const SEED_CREATED_AT = ago(120);

/**
 * Wallet history. Every user with a balance gets an opening balance entry; the demo user's balance
 * is split into an opening balance plus the payouts of both sold listings (ids 990, 991), so
 * the entries always add up to walletBalance.
 */
function buildWalletLedger(): WalletEntry[] {
  const entries: WalletEntry[] = [];
  let id = 1;
  for (const user of USERS) {
    if (user.walletBalance <= 0) {
      continue;
    }
    const sales = user.id === 1 ? RESALE_TRANSACTIONS.filter((t) => t.sellerId === 1 && t.status === 'Completed') : [];
    const salesTotal = Math.round(sales.reduce((total, t) => total + t.sellerReceives, 0) * 100) / 100;
    const opening = Math.round((user.walletBalance - salesTotal) * 100) / 100;
    entries.push({
      id: id++,
      userId: user.id,
      type: 'credit',
      amount: opening,
      balanceAfter: opening,
      reason: 'Opening balance',
      reference: null,
      createdAt: isoDaysAgo(60),
    });
    let running = opening;
    for (const sale of sales) {
      running = Math.round((running + sale.sellerReceives) * 100) / 100;
      entries.push({
        id: id++,
        userId: user.id,
        type: 'credit',
        amount: sale.sellerReceives,
        balanceAfter: running,
        reason: 'Resale sale: ' + saleMovieTitle(sale.resaleTicketId),
        reference: { kind: 'resale', id: sale.resaleTicketId },
        createdAt: sale.completedAt ?? isoDaysAgo(3),
      });
    }
  }
  return entries;
}

function saleMovieTitle(listingId: number): string {
  const ticket = RESALE_TICKETS.find((t) => t.id === listingId);
  const booking = BOOKINGS.find((b) => b.id === ticket?.bookingId);
  const showtime = SHOWTIMES.find((s) => s.id === booking?.showtimeId);
  return MOVIES.find((m) => m.id === showtime?.movieId)?.title ?? 'ticket';
}

export const WALLET_LEDGER: WalletEntry[] = buildWalletLedger();
