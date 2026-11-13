import { Routes } from '@angular/router';

import { Register } from './pages/features/auth/register/register';
import { Login } from './pages/features/auth/login/login';
import { HomeComponent } from './pages/features/home/home';
import { AvailableFlightsComponent } from './pages/features/availableflights/availableflightss/availableflights';
import { TicketdetailsComponent } from './pages/features/tickets/ticketdetails/ticketdetails';
import { BookingComponent } from './pages/features/tickets/booking/booking';
import { MainLayoutComponent } from './Layout/main-layout';
import { FlightdetailsComponent } from './pages/features/availableflights/flightdetails/flightdetails';
import { MyticketsComponent } from './pages/features/tickets/mytickets/mytickets';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'register',
        component: Register
      },
      {
        path: 'login',
        component: Login
      },
      {
        path: 'home',
        component: HomeComponent
      },
      {
        path: 'flights',
        component: AvailableFlightsComponent
      },
      {
        path: 'booking',
        component: BookingComponent
      },
      {
        path: 'mytickets',
        component: MyticketsComponent
      },
      {
        path: 'my-tickets',
        redirectTo: 'mytickets',
        pathMatch: 'full'
      },
      {
        path: 'my-bookings',
        redirectTo: 'mytickets',
        pathMatch: 'full'
      },
      {
        path: 'ticket-details/:ticketNumber',
        component: TicketdetailsComponent
      },
      {
        path: 'flight-details/:flightId',
        component: FlightdetailsComponent
      },
      {
        path: 'flight-details',
        redirectTo: 'flights',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
