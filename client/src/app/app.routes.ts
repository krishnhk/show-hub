import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

/** Redirects an old URL to its new home, keeping the query string and filling in path params. */
const moveTo =
  (build: (params: Record<string, string>) => string[]): RedirectFunction =>
  ({ params, queryParams }) =>
    inject(Router).createUrlTree(build(params), { queryParams });

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Book & Resell Movie Tickets',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.LandingComponent),
  },
  {
    path: 'sign-in',
    title: 'Sign in',
    loadComponent: () => import('./pages/auth/login').then((m) => m.LoginComponent),
  },

  // ------------------------------------------------------------ booking
  {
    path: 'movies',
    title: 'Movies',
    loadComponent: () => import('./pages/movies/movie-browse').then((m) => m.MovieBrowseComponent),
  },
  {
    path: 'search',
    title: 'Search',
    loadComponent: () => import('./pages/search/search').then((m) => m.SearchComponent),
  },
  {
    path: 'movies/:movieId',
    title: 'Movie details',
    loadComponent: () => import('./pages/movies/movie-detail').then((m) => m.MovieDetailComponent),
  },
  {
    path: 'book/:showtimeId/seats',
    title: 'Choose seats',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/seat-selection').then((m) => m.SeatSelectionComponent),
  },
  {
    path: 'book/:showtimeId/checkout',
    title: 'Checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/checkout').then((m) => m.CheckoutComponent),
  },
  {
    path: 'my-bookings',
    title: 'My Bookings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/my-bookings').then((m) => m.MyBookingsComponent),
  },
  {
    path: 'my-bookings/theatres',
    title: 'My theatres',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/my-theatres').then((m) => m.MyTheatresComponent),
  },
  {
    path: 'my-bookings/theatres/:theatreId',
    title: 'Theatre history',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/theatre-history').then((m) => m.TheatreHistoryComponent),
  },
  {
    path: 'my-bookings/:bookingId',
    title: 'Booking confirmation',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/confirmation').then((m) => m.ConfirmationComponent),
  },
  {
    path: 'my-bookings/:bookingId/share',
    title: 'Share seats',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/share-seats').then((m) => m.ShareSeatsComponent),
  },

  // ------------------------------------------------------------- resale
  {
    path: 'resale',
    title: 'Resale marketplace',
    loadComponent: () => import('./pages/resale/resale-browse').then((m) => m.ResaleBrowseComponent),
  },
  {
    path: 'resale/history',
    title: 'Resale history',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/resale/resale-orders').then((m) => m.ResaleOrdersComponent),
  },
  {
    path: 'resale/listings/:listingId',
    title: 'Resale ticket',
    loadComponent: () => import('./pages/resale/resale-detail').then((m) => m.ResaleDetailComponent),
  },
  {
    path: 'resale/listings/:listingId/checkout',
    title: 'Resale checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/resale/resale-checkout').then((m) => m.ResaleCheckoutComponent),
  },
  {
    path: 'sell/booking/:bookingId',
    title: 'List for resale',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/resale/sell-booking').then((m) => m.SellBookingComponent),
  },
  {
    path: 'sell/listings/:listingId',
    title: 'Your listing',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/resale/sell-listing-detail').then((m) => m.SellListingDetailComponent),
  },
  {
    path: 'sell',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/resale/sell').then((m) => m.SellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Ready to sell',
        loadComponent: () => import('./pages/resale/sell-tickets').then((m) => m.SellTicketsComponent),
      },
      {
        path: 'listings',
        title: 'Your listings',
        loadComponent: () => import('./pages/resale/sell-listings').then((m) => m.SellListingsComponent),
      },
    ],
  },

  // ------------------------------------------------------------- wallet
  {
    path: 'wallet',
    title: 'Wallet',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/wallet/wallet').then((m) => m.WalletComponent),
  },

  // ------------------------------------------------------------ profile
  {
    path: 'profile',
    title: 'My profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/my-profile').then((m) => m.MyProfileComponent),
  },
  {
    path: 'member/:userId',
    title: 'Member',
    loadComponent: () => import('./pages/profile/public-profile').then((m) => m.PublicProfileComponent),
  },
  {
    path: 'settings',
    title: 'Settings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/settings').then((m) => m.SettingsComponent),
  },
  {
    path: 'notifications',
    title: 'Notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/notifications/notifications').then((m) => m.NotificationsComponent),
  },

  // ------------------------------------------------- old URLs still work
  { path: 'login', pathMatch: 'full', redirectTo: moveTo(() => ['/sign-in']) },
  { path: 'sell/new', pathMatch: 'full', redirectTo: moveTo(() => ['/sell']) },
  { path: 'sell/new/:bookingId', redirectTo: moveTo((p) => ['/sell/booking', p['bookingId']]) },
  { path: 'bookings/:bookingId/confirmation', redirectTo: moveTo((p) => ['/my-bookings', p['bookingId']]) },
  { path: 'bookings/:bookingId/share', redirectTo: moveTo((p) => ['/my-bookings', p['bookingId'], 'share']) },
  { path: 'resale/orders', pathMatch: 'full', redirectTo: moveTo(() => ['/resale/history']) },
  { path: 'resale/:listingId/checkout', redirectTo: moveTo((p) => ['/resale/listings', p['listingId'], 'checkout']) },
  { path: 'resale/:listingId', redirectTo: moveTo((p) => ['/resale/listings', p['listingId']]) },
  { path: 'profile/:userId', redirectTo: moveTo((p) => ['/member', p['userId']]) },

  {
    path: '**',
    title: 'Page not found',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
