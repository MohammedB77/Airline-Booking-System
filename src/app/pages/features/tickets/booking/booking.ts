
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';


import {
  FlightService,
  type FlightDetails,
  type Ticket
} from '../../../../core/services/flight.service';

import {
  PassengerService,
  type Passenger
} from '../../../../core/services/passenger.service';

import {
  TicketBookingService,
  type TicketBooking
} from '../../../../core/services/ticketbooking.service';

import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './booking.html'
})
export class BookingComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly flightService = inject(FlightService);
  private readonly passengerService = inject(PassengerService);
  private readonly ticketBookingService = inject(TicketBookingService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  // Data
  flight: FlightDetails | null = null;
  passengers: Passenger[] = [];
  tickets: Ticket[] = [];

  // Selections
  selectedPassengerId: number | null = null;
  selectedTicketId: number | null = null;

  // Booking information
  seatNumber = '';
  ticketNumber = this.generateTicketNumber();
  bookingDate = '';

  // UI states
  isLoading = true;
  isSubmitting = false;

  loadError = '';
  bookingError = '';

  showConfirmationModal = false;
  createdBooking: TicketBooking | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {

      // Read the database flight ID from the URL.
      const flightId = Number(params.get('flightId'));

      if (!Number.isInteger(flightId) || flightId <= 0) {
        this.isLoading = false;
        this.loadError = 'لم يتم تحديد رحلة صحيحة.';
        return;
      }

      this.loadFlight(flightId);
    });
  }

  /**
   * Load one flight directly from the backend using its database ID.
   */
  loadFlight(flightId: number): void {
    console.log('1. Starting flight request. ID:', flightId);

    this.isLoading = true;
    this.loadError = '';

    this.flightService.getFlightById(flightId).subscribe({

      next: (flight) => {
        console.log('2. Flight API response:', flight);

        this.flight = flight;

        console.log('3. Flight assigned:', this.flight);
        console.log('4. Flight number:', this.flight.flight.number);

        this.loadBookingOptions();
      },

      error: (error) => {
        console.error('Flight API request failed:', error);

        this.flight = null;
        this.isLoading = false;
        this.loadError = 'تعذر تحميل بيانات الرحلة من الخادم.';
        this.cdr.markForCheck();
      }

    });
  }

  /**
   * Load passengers and available tickets for the selected flight.
   */
  private loadBookingOptions(): void {

    console.log('3. Entered loadBookingOptions');

    const userId = this.userService.currentUser()?.id;
    const flightId = this.flight?.flight.id;

    console.log('4. Current user ID:', userId);
    console.log('5. Flight ID:', flightId);

    if (!userId) {
      this.isLoading = false;
      this.loadError = 'يرجى تسجيل الدخول أولاً.';
      return;
    }

    if (!flightId) {
      this.isLoading = false;
      this.loadError = 'معرّف الرحلة غير متوفر من الخادم.';
      return;
    }

    console.log('6. Starting passenger and ticket requests');

    forkJoin({
      passengers: this.passengerService.getAll(),
      tickets: this.flightService.getFlightById(flightId)
    }).subscribe({

      next: ({ passengers, tickets }) => {

        console.log('7. Passengers received:', passengers);
        console.log('8. Tickets received:', tickets);

        this.passengers = passengers.filter(
          passenger => passenger.userId === userId
        );

        this.tickets = tickets.tickets.filter(
          ticket => ticket.availableTickets > 0
        );

        this.selectedPassengerId = this.passengers[0]?.id ?? null;
        this.selectedTicketId = this.tickets[0]?.id ?? null;

        this.isLoading = false;

        console.log('9. Booking options loaded successfully');
        console.log(this.isLoading)
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        console.error('Booking options error:', error);

        this.isLoading = false;
        this.loadError = this.getApiErrorMessage(error);
      }
    });
  }

  get selectedPassenger(): Passenger | undefined {
    return this.passengers.find(
      passenger => passenger.id === this.selectedPassengerId
    );
  }

  get selectedTicket(): Ticket | undefined {
    return this.tickets.find(
      ticket => ticket.id === this.selectedTicketId
    );
  }

  getPassengerName(passenger: Passenger): string {
    return `${passenger.firstName} ${passenger.lastName}`;
  }

  getCabinName(flightClass: string): string {

    switch (flightClass.trim().toLowerCase()) {

      case 'economy':
        return 'الدرجة الاقتصادية';

      case 'business':
        return 'درجة رجال الأعمال';

      case 'first':
      case 'first class':
        return 'الدرجة الأولى';

      default:
        return flightClass;
    }
  }

  private generateTicketNumber(): string {

    const randomPart = Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase();

    return `TKT-${Date.now()}-${randomPart}`;
  }

  /**
   * Submit the booking to the backend.
   */
  confirmBooking(): void {

    this.bookingError = '';

    const passenger = this.selectedPassenger;
    const ticket = this.selectedTicket;

    if (!this.flight) {
      this.bookingError = 'بيانات الرحلة غير متوفرة.';
      return;
    }

    if (!passenger) {
      this.bookingError = 'لا توجد بيانات مسافر مرتبطة بحسابك.';
      return;
    }

    if (!ticket) {
      this.bookingError = 'لا توجد تذاكر متاحة لهذه الرحلة.';
      return;
    }

    if (!this.seatNumber.trim()) {
      this.bookingError = 'يرجى إدخال رقم المقعد.';
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    const bookingRequest = {
      ticketId: ticket.id,
      passengerId: passenger.id,
      ticketNumber: this.ticketNumber,
      seatNumber: this.seatNumber.trim()
    };

    this.isSubmitting = true;

    this.ticketBookingService.create(bookingRequest).subscribe({

      next: response => {

        this.createdBooking = response;
        this.ticketNumber = response.ticketNumber;
        this.bookingDate = response.bookingDate;

        // Update the displayed availability.
        this.tickets = this.tickets.map(item =>
          item.id === ticket.id
            ? {
              ...item,
              availableTickets: Math.max(
                0,
                item.availableTickets - 1
              )
            }
            : item
        );

        this.isSubmitting = false;
        this.showConfirmationModal = true;
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.bookingError = this.getApiErrorMessage(error);
        this.cdr.markForCheck();
      }

    });
  }

  private getApiErrorMessage(error: HttpErrorResponse): string {

    if (error.status === 0) {
      this.cdr.markForCheck();
      return 'تعذر الاتصال بالخادم. تأكد من تشغيل Web API.';
    }

    if (typeof error.error === 'string' && error.error.trim()) {
      this.cdr.markForCheck();
      return error.error;
    }

    if (error.status === 400) {
      this.cdr.markForCheck();
      return 'تعذر إتمام الحجز. تحقق من البيانات أو توفر المقاعد.';
    }

    if (error.status === 401) {
      this.cdr.markForCheck();
      return 'يرجى تسجيل الدخول مرة أخرى.';
    }
    this.cdr.markForCheck();
    return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
  }

  closeConfirmation(): void {
    this.showConfirmationModal = false;
    this.router.navigate(['/']);
  }
}
