import { CommonModule, formatDate } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';

import { Flight, FlightService } from '../../../../core/services/flight.service';
import { Passenger, PassengerService } from '../../../../core/services/passenger.service';
import { Ticket, TicketService } from '../../../../core/services/ticket.service';
import {
  TicketBooking,
  TicketBookingService
} from '../../../../core/services/ticketbooking.service';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-ticketdetails',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ticketdetails.html'
})
export class TicketdetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ticketService = inject(TicketService);
  private readonly ticketBookingService = inject(TicketBookingService);
  private readonly passengerService = inject(PassengerService);
  private readonly flightService = inject(FlightService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);

  ticket: ReturnType<TicketdetailsComponent['toDetails']> | null = null;
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.ticket = null;
        this.isLoading = true;
        this.errorMessage = '';

        const bookingId = Number(params.get('ticketNumber'));
        const userId = this.userService.currentUser()?.id;

        if (!userId) {
          this.errorMessage = 'سجّل الدخول لعرض تفاصيل الحجز.';
          return of(null);
        }

        if (!Number.isInteger(bookingId) || bookingId <= 0 || bookingId > 2147483647) {
          this.errorMessage = 'معرّف الحجز غير صالح.';
          return of(null);
        }

        return this.ticketBookingService.getById(bookingId).pipe(
          switchMap(booking =>
            this.passengerService.getById(booking.passengerId).pipe(
              switchMap(passenger => {
                if (passenger.userId !== userId) {
                  this.errorMessage = 'لم يتم العثور على الحجز ضمن حجوزاتك.';
                  return of(null);
                }

                return this.ticketService.getById(booking.ticketId).pipe(
                  switchMap(ticket =>
                    this.flightService.getFlightById(ticket.flightId).pipe(
                      map(details => details.flight),
                      catchError(() => of(null)),
                      map(flight => this.toDetails(booking, ticket, passenger, flight))
                    )
                  )
                );
              })
            )
          ),
          catchError(error => {
            this.errorMessage = error.status === 404
              ? 'لم يتم العثور على الحجز أو بياناته.'
              : 'تعذّر تحميل تفاصيل الحجز. حاول مرة ثانية.';

            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(ticket => {
      this.ticket = ticket;
      this.isLoading = false;
      this.changeDetector.markForCheck();
    });
  }

  printTicket(): void {
    window.print();
  }

  private toDetails(
    booking: TicketBooking,
    ticket: Ticket,
    passenger: Passenger,
    flight: Flight | null
  ) {
    const unavailable = '—';
    const isCancelled = booking.status === 'ملغي' || booking.status === 'Cancelled';
    const isBooked = booking.status === 'محجوز' || booking.status === 'Booked';
    const status = isCancelled ? 'ملغي' : isBooked ? 'محجوز' : booking.status;

    return {
      ticketNumber: booking.ticketNumber,
      name: ticket.ticketName,
      flightNumber: flight?.number || String(ticket.flightId),
      airline: flight?.airline || unavailable,
      airlineCode: flight?.code || unavailable,
      status,
      statusClass: isCancelled ? 'cancelled' : 'default',
      originCode: flight?.originCode || unavailable,
      originCity: flight?.originCity || unavailable,
      originAirport: flight?.originName || unavailable,
      departureTime: flight?.departureTime || unavailable,
      destinationCode: flight?.destinationCode || unavailable,
      destinationCity: flight?.destinationCity || unavailable,
      destinationAirport: flight?.destinationName || unavailable,
      arrivalTime: flight?.arrivalTime || unavailable,
      aircraft: flight?.aircraft || unavailable,
      aircraftModel: flight?.aircraft || unavailable,
      registration: flight?.registration || unavailable,
      checkInTime: ticket.checkInTime || unavailable,
      boardingTime: ticket.boardingTime || unavailable,
      gate: ticket.gateNumber || unavailable,
      terminal: unavailable,
      firstName: passenger.firstName,
      familyName: passenger.lastName,
      nationality: passenger.nationality || unavailable,
      birthDate: this.displayDate(passenger.dateOfBirth),
      gender: passenger.gender || unavailable,
      passportNumber: passenger.passportNumber || unavailable,
      phone: passenger.phoneNumber || unavailable,
      bookingDate: this.displayDate(booking.bookingDate),
      ticketStatus: status,
      travelClass: ticket.flightClass,
      seat: booking.seatNumber,
      seatType: unavailable,
      price: ticket.ticketPrice,
      currency: 'USD'
    };
  }

  private displayDate(value: string): string {
    if (!value || Number.isNaN(Date.parse(value))) {
      return '—';
    }

    return formatDate(value, 'dd/MM/yyyy', 'en-US');
  }
}