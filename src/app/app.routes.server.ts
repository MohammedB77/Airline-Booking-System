import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'flight-details/:flightId',
    renderMode: RenderMode.Server
  },
  {
    path: 'ticket-details/:ticketNumber',
    renderMode: RenderMode.Server
  },
   {
    path: 'passenger',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
