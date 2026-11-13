import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  TicketBooking,
  TicketBookingService
} from '../../../../core/services/ticketbooking.service';

export interface TicketCardView {
  id: string; // يُعرض كرقم التذكرة (TKT-XXXX)
  bookingId: number;
  ticketNumber: string;
  flightNumber: string;
  airline: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cabin: string;
  seat: string;
  price: number;
  status: string;
  statusKey: 'confirmed' | 'cancelled';
}

export type TicketFilter = 'all' | 'confirmed' | 'cancelled';

@Component({
  selector: 'app-mytickets',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mytickets.html'
})
export class MyticketsComponent implements OnInit {
  selectedFilter: TicketFilter = 'all';
  selectedTicket: TicketCardView | null = null;
  isModalOpen = false;
  tickets: TicketCardView[] = [];
  isLoading = true;

  constructor(private readonly bookingService: TicketBookingService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.bookingService.getBookings().subscribe({
      next: bookings => {
        this.tickets = bookings.map(b => this.toCardView(b));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get confirmedCount(): number {
    return this.tickets.filter(t => t.statusKey === 'confirmed').length;
  }

  get cancelledCount(): number {
    return this.tickets.filter(t => t.statusKey === 'cancelled').length;
  }

  get filteredTickets(): TicketCardView[] {
    if (this.selectedFilter === 'all') {
      return this.tickets;
    }
    return this.tickets.filter(t => t.statusKey === this.selectedFilter);
  }

  filterTickets(filter: TicketFilter): void {
    this.selectedFilter = filter;
  }

  openTicketModal(ticket: TicketCardView): void {
    this.selectedTicket = ticket;
    this.isModalOpen = true;
  }

  closeTicketModal(): void {
    this.isModalOpen = false;
    this.selectedTicket = null;
  }

  cancelTicket(ticket: TicketCardView): void {
    if (!confirm(`هل أنت متأكد من رغبتك في إلغاء التذكرة رقم ${ticket.ticketNumber}؟`)) {
      return;
    }

    this.bookingService.cancelBooking(ticket.bookingId).subscribe({
      next: () => {
        ticket.status = 'ملغاة';
        ticket.statusKey = 'cancelled';
        if (this.selectedTicket && this.selectedTicket.bookingId === ticket.bookingId) {
          this.selectedTicket.status = 'ملغاة';
          this.selectedTicket.statusKey = 'cancelled';
        }
      }
    });
  }

  private toCardView(booking: TicketBooking): TicketCardView {
    return {
      id: booking.ticketNumber,
      bookingId: booking.id,
      ticketNumber: booking.ticketNumber,
      flightNumber: booking.flightNumber || 'MDR-101',
      airline: booking.airline || 'طيران مَدار',
      origin: booking.originCode || booking.origin || 'SAH',
      originName: booking.originName || 'مطار صنعاء الدولي',
      destination: booking.destinationCode || booking.destination || 'CAI',
      destinationName: booking.destinationName || 'مطار القاهرة الدولي',
      departureTime: booking.departureTime || '08:00 ص',
      arrivalTime: booking.arrivalTime || '11:30 ص',
      duration: booking.duration || '3 ساعات و30 دقيقة',
      cabin: booking.cabin || 'الدرجة الاقتصادية',
      seat: booking.seatNumber || '12A',
      price: booking.price || 350,
      status: booking.status || 'مؤكدة',
      statusKey: booking.statusKey || 'confirmed'
    };
  }
}
