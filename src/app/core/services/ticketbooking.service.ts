
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TicketBooking {
    id: number;
    ticketId: number;
    passengerId: number;
    ticketNumber: string;
    seatNumber: string;
    bookingDate: string;
    status: string;
}

export interface TicketBookingCreateRequest {
    ticketId: number;
    passengerId: number;
    ticketNumber: string;
    seatNumber: string;
}

export interface TicketBookingUpdateRequest
    extends TicketBookingCreateRequest { }

@Injectable({ providedIn: 'root' })
export class TicketBookingService {
    private readonly apiUrl =
        'https://localhost:7210/api/TicketBooking';

    constructor(private readonly http: HttpClient) { }

    getAll(): Observable<TicketBooking[]> {
        return this.http.get<TicketBooking[]>(
            `${this.apiUrl}/GetAll`
        );
    }

    getById(id: number): Observable<TicketBooking> {
        return this.http.get<TicketBooking>(
            `${this.apiUrl}/GetById/${id}`
        );
    }

    create(
        booking: TicketBookingCreateRequest
    ): Observable<TicketBooking> {
        return this.http.post<TicketBooking>(
            `${this.apiUrl}/Create`,
            booking
        );
    }

    update(
        id: number,
        booking: TicketBookingUpdateRequest
    ): Observable<TicketBooking> {
        return this.http.put<TicketBooking>(
            `${this.apiUrl}/Update/${id}`,
            booking
        );
    }

    delete(id: number): Observable<string> {
        return this.http.delete(
            `${this.apiUrl}/Delete/${id}`,
            { responseType: 'text' }
        );
    }
}
