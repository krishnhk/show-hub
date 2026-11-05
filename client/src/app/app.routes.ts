import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login').then((m) => m.LoginComponent),
  },

  // ------------------------------------------------------------ booking
  {
    path: 'movies',
    loadComponent: () => import('./pages/movies/movie-browse').then((m) => m.MovieBrowseComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search').then((m) => m.SearchComponent),
  },
  {
    path: 'movies/:id',
    loadComponent: () => import('./pages/movies/movie-detail').then((m) => m.MovieDetailComponent),
  },
  {
    path: 'book/:showtimeId/seats',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/seat-selection').then((m) => m.SeatSelectionComponent),
  },
  {
    path: 'book/:showtimeId/checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/checkout').then((m) => m.CheckoutComponent),
  },
  {
    path: 'bookings/:id/confirmation',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/confirmation').then((m) => m.ConfirmationComponent),
  },
  {
    path: 'my-bookings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/my-bookings').then((m) => m.MyBookingsComponent),
  },

  // ------------------------------------------------------------- resale
  {
    path: 'resale',
    loadComponent: () => import('./pages/resale/resale-browse').then((m) => m.ResaleBrowseComponent),
  },
  {
    path: 'resale/orders',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/resale/resale-orders').then((m) => m.ResaleOrdersComponent),
  },
  {
    path: 'resale/:id/checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/resale/resale-checkout').then((m) => m.ResaleCheckoutComponent),
  },
  {
    path: 'resale/:id',
    loadComponent: () => import('./pages/resale/resale-detail').then((m) => m.ResaleDetailComponent),
  },
  {
    path: 'sell/new/:bookingId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/resale/sell-booking').then((m) => m.SellBookingComponent),
  },
  {
    path: 'sell/listings/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/resale/sell-listing-detail').then((m) => m.SellListingDetailComponent),
  },
  {
    path: 'sell',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/resale/sell').then((m) => m.SellComponent),
    children: [
      // /sell and /sell?bookingId=7 keep working: they land on the "sell tickets" page with the query intact
      {
        path: '',
        pathMatch: 'full',
        redirectTo: ({ queryParams }) => inject(Router).createUrlTree(['/sell/new'], { queryParams }),
      },
      {
        path: 'new',
        loadComponent: () => import('./pages/resale/sell-tickets').then((m) => m.SellTicketsComponent),
      },
      {
        path: 'listings',
        loadComponent: () => import('./pages/resale/sell-listings').then((m) => m.SellListingsComponent),
      },
    ],
  },

  // ------------------------------------------------------------- social

  // ------------------------------------------------------------- wallet
  {
    path: 'wallet',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/wallet/wallet').then((m) => m.WalletComponent),
  },

  // ------------------------------------------------------------ profile
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/my-profile').then((m) => m.MyProfileComponent),
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./pages/profile/public-profile').then((m) => m.PublicProfileComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/settings').then((m) => m.SettingsComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/notifications/notifications').then((m) => m.NotificationsComponent),
  },

  { path: '**', redirectTo: '' },
];
