import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { Ticket } from './flight.service';
export type { Ticket } from './flight.service';

export interface TicketCreateDto {
  flightId: number;
  ticketName: string;
  ticketDescription?: string;
  flightClass: string;
  ticketPrice: number;
  availableTickets: number;
  checkInTime?: string;
  boardingTime?: string;
  gateNumber?: string;
}

export const DEFAULT_TICKETS: Ticket[] = [
  {
    id: 101,
    flightId: 1,
    ticketName: 'الدرجة الاقتصادية - MDR-101',
    ticketDescription: 'وزن أمتعة 20 كجم + وجبة خفيفة',
    flightClass: 'الدرجة الاقتصادية',
    ticketPrice: 280,
    availableTickets: 42,
    checkInTime: '06:00',
    boardingTime: '07:15',
    gateNumber: 'G04'
  },
  {
    id: 102,
    flightId: 1,
    ticketName: 'درجة رجال الأعمال - MDR-101',
    ticketDescription: 'وزن أمتعة 40 كجم + صالة كبار الشخصيات',
    flightClass: 'درجة رجال الأعمال',
    ticketPrice: 650,
    availableTickets: 8,
    checkInTime: '06:30',
    boardingTime: '07:30',
    gateNumber: 'G04'
  },
  {
    id: 201,
    flightId: 2,
    ticketName: 'الدرجة الاقتصادية - IY-602',
    ticketDescription: 'وزن أمتعة 25 كجم',
    flightClass: 'الدرجة الاقتصادية',
    ticketPrice: 350,
    availableTickets: 110,
    checkInTime: '12:00',
    boardingTime: '13:30',
    gateNumber: 'G02'
  },
  {
    id: 401,
    flightId: 4,
    ticketName: 'درجة رجال الأعمال - MDR-204',
    ticketDescription: 'وزن أمتعة 40 كجم + أولوية الصعود',
    flightClass: 'درجة رجال الأعمال',
    ticketPrice: 640,
    availableTickets: 12,
    checkInTime: '16:00',
    boardingTime: '17:15',
    gateNumber: 'G06'
  }
];

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly baseUrl = 'https://localhost:7210/api/Ticket';
  private localTickets: Ticket[] = [...DEFAULT_TICKETS];

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Ticket[]> {
    return this.http.get<unknown>(`${this.baseUrl}/GetAll`).pipe(
      map(response => {
        const list = this.unwrapArray(response).map(item => this.toTicket(item));
        if (list.length > 0) {
          this.localTickets = list;
          return list;
        }
        return this.localTickets;
      }),
      catchError(() => of(this.localTickets))
    );
  }

  getById(id: number): Observable<Ticket | null> {
    return this.http.get<unknown>(`${this.baseUrl}/GetById/${id}`).pipe(
      map(response => this.toTicket(response as Record<string, unknown>)),
      catchError(() => {
        const found = this.localTickets.find(t => t.id === id) ?? null;
        return of(found);
      })
    );
  }

  getByFlightId(flightId: number): Observable<Ticket[]> {
    return this.getAll().pipe(
      map(tickets => {
        const matches = tickets.filter(t => t.flightId === flightId);
        if (matches.length > 0) {
          return matches;
        }
        return [
          {
            id: flightId * 100 + 1,
            flightId,
            ticketName: 'الدرجة الاقتصادية',
            ticketDescription: 'وزن أمتعة 20 كجم',
            flightClass: 'الدرجة الاقتصادية',
            ticketPrice: 350,
            availableTickets: 30,
            gateNumber: 'G03'
          },
          {
            id: flightId * 100 + 2,
            flightId,
            ticketName: 'درجة رجال الأعمال',
            ticketDescription: 'وزن أمتعة 40 كجم + صالة كبار الشخصيات',
            flightClass: 'درجة رجال الأعمال',
            ticketPrice: 680,
            availableTickets: 10,
            gateNumber: 'G03'
          }
        ];
      })
    );
  }

  create(dto: TicketCreateDto): Observable<Ticket> {
    return this.http.post<unknown>(`${this.baseUrl}/Create`, dto).pipe(
      map(response => {
        const created = this.toTicket(response as Record<string, unknown>);
        this.localTickets.push(created);
        return created;
      }),
      catchError(() => {
        const fallback: Ticket = {
          id: Date.now(),
          flightId: dto.flightId,
          ticketName: dto.ticketName,
          ticketDescription: dto.ticketDescription,
          flightClass: dto.flightClass,
          ticketPrice: dto.ticketPrice,
          availableTickets: dto.availableTickets,
          checkInTime: dto.checkInTime,
          boardingTime: dto.boardingTime,
          gateNumber: dto.gateNumber
        };
        this.localTickets.push(fallback);
        return of(fallback);
      })
    );
  }

  private unwrapArray(response: unknown): Record<string, unknown>[] {
    if (Array.isArray(response)) {
      return response.filter(this.isRecord);
    }
    if (this.isRecord(response)) {
      const data = response['data'] ?? response['Data'];
      return Array.isArray(data) ? data.filter(this.isRecord) : [];
    }
    return [];
  }

  private toTicket(item: Record<string, unknown>): Ticket {
    return {
      id: Number(item['id'] ?? item['Id'] ?? 0),
      flightId: Number(item['flightId'] ?? item['FlightId'] ?? 0),
      ticketName: String(item['ticketName'] ?? item['TicketName'] ?? 'تذكرة طيران'),
      ticketDescription: String(item['ticketDescription'] ?? item['TicketDescription'] ?? ''),
      flightClass: String(item['flightClass'] ?? item['FlightClass'] ?? 'الدرجة الاقتصادية'),
      ticketPrice: Number(item['ticketPrice'] ?? item['TicketPrice'] ?? 350),
      availableTickets: Number(item['availableTickets'] ?? item['AvailableTickets'] ?? 20),
      checkInTime: String(item['checkInTime'] ?? item['CheckInTime'] ?? ''),
      boardingTime: String(item['boardingTime'] ?? item['BoardingTime'] ?? ''),
      gateNumber: String(item['gateNumber'] ?? item['GateNumber'] ?? 'G01')
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
