import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TicketCreateRequest {
  flightId: number;
  ticketName: string;
  ticketDescription?: string | null;
  flightClass: string;
  ticketPrice: number;
  availableTickets: number;
  checkInTime?: string | null;
  boardingTime?: string | null;
  gateNumber?: string | null;
}

export type TicketUpdateRequest = TicketCreateRequest;

export interface Ticket extends TicketCreateRequest {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly apiUrl = 'https://localhost:7210/api/Ticket';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/GetAll`);
  }

  getById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/GetById/${id}`);
  }

  create(ticketInfo: TicketCreateRequest): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/Create`, ticketInfo);
  }

  update(id: number, ticketInfo: TicketUpdateRequest): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/Update/${id}`, ticketInfo);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/Delete/${id}`, {
      responseType: 'text'
    });
  }
}