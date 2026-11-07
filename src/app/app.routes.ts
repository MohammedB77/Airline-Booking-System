import { Routes } from '@angular/router';
import { Register } from './pages/features/auth/register/register';
import {Login } from './pages/features/auth/login/login'
import { HomeComponent } from './pages/features/home/home';
import { AvailableFlightsComponent } from './pages/features/availableflights/availableflightss/availableflights';
import { FlightdetailsComponent } from './pages/features/availableflights/flightdetails/flightdetails';
import { MyticketsComponent } from './pages/features/tickets/mytickets/mytickets';
import { TicketdetailsComponent } from './pages/features/tickets/ticketdetails/ticketdetails';
import { BookingComponent } from './pages/features/tickets/booking/booking';


export const routes: Routes = [
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
    component: HomeComponent,
    
  },
   {
  path: 'flights',
  component: AvailableFlightsComponent
},

{
  path: 'flight-details/:flightNumber',
  component: FlightdetailsComponent
},
{
  path: 'mytickets',
  component: MyticketsComponent
},
{
  path: 'ticket-details/:ticketNumber',
  component: TicketdetailsComponent
},
{
  path: 'booking',
  component: BookingComponent
},
];
