import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'flight-details/:flightNumber',
    renderMode: RenderMode.Server
  },
  {
    path: 'ticket-details/:ticketNumber',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
