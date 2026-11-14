import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { PassengerService } from '../../../../core/services/passenger.service';
import { Ticket, TicketService } from '../../../../core/services/ticket.service';
import { TicketBookingService } from '../../../../core/services/ticketbooking.service';
import { UserService } from '../../../../core/services/user.service';

type TicketStatus = 'confirmed' | 'cancelled' | 'unknown';
type TicketFilter = 'all' | 'confirmed' | 'cancelled';

interface TicketCard extends Ticket {
  bookingId: number;
  status: string;
  statusKey: TicketStatus;
}

@Component({
  selector: 'app-mytickets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mytickets.html'
})
export class MyticketsComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly ticketBookingService = inject(TicketBookingService);
  private readonly passengerService = inject(PassengerService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly tickets = signal<TicketCard[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  selectedFilter: TicketFilter = 'all';
  selectedTicket: TicketCard | null = null;

  ngOnInit(): void {
    const userId = this.userService.currentUser()?.id;

    if (!userId) {
      this.errorMessage.set('سجّل الدخول لعرض تذاكرك.');
      this.isLoading.set(false);
      return;
    }

    this.passengerService.getAll().pipe(
      switchMap(passengers => {
        const passengerIds = new Set(
          passengers
            .filter(passenger => passenger.userId === userId)
            .map(passenger => passenger.id)
        );

        if (passengerIds.size === 0) {
          return of([]);
        }

        return this.ticketBookingService.getAll().pipe(
          map(bookings =>
            bookings.filter(booking => passengerIds.has(booking.passengerId))
          )
        );
      }),
      switchMap(bookings => {
        if (bookings.length === 0) {
          return of([]);
        }

        const ticketRequests = bookings.map(booking =>
          this.ticketService.getById(booking.ticketId).pipe(
            map((ticket): TicketCard => ({
              ...ticket,
              bookingId: booking.id,
              status: booking.status,
              statusKey: this.getStatusKey(booking.status)
            }))
          )
        );

        return forkJoin(ticketRequests);
      })
    ).subscribe({
      next: tickets => {
        this.tickets.set(tickets);
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Could not load passenger bookings:', error);
        this.errorMessage.set('تعذّر تحميل تذاكرك. حاول مرة ثانية.');
        this.isLoading.set(false);
      }
    });
  }

  get confirmedCount(): number {
    return this.tickets().filter(ticket => ticket.statusKey === 'confirmed').length;
  }

  get cancelledCount(): number {
    return this.tickets().filter(ticket => ticket.statusKey === 'cancelled').length;
  }

  get filteredTickets(): TicketCard[] {
    if (this.selectedFilter === 'all') {
      return this.tickets();
    }

    return this.tickets().filter(ticket => ticket.statusKey === this.selectedFilter);
  }

  filterTickets(filter: TicketFilter): void {
    this.selectedFilter = filter;
  }

  openTicketModal(ticket: TicketCard): void {
    void this.router.navigate(['/ticket-details', ticket.bookingId]);
  }

  closeTicketModal(): void {
    this.selectedTicket = null;
  }

  private getStatusKey(status: string): TicketStatus {
    switch (status) {
      case 'محجوز':
      case 'Booked':
        return 'confirmed';

      case 'ملغي':
      case 'Cancelled':
        return 'cancelled';

      default:
        return 'unknown';
    }
  }
}