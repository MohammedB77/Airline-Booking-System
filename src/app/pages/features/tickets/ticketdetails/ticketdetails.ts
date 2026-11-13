import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { Ticket, TicketService } from '../../../../core/services/ticket.service';

@Component({
  selector: 'app-ticketdetails',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ticketdetails.html'
})
export class TicketdetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ticketService = inject(TicketService);
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

        const id = Number(params.get('ticketNumber'));

        if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
          this.errorMessage = 'معرّف التذكرة غير صالح.';
          return of(null);
        }

        return this.ticketService.getById(id).pipe(
          map(ticket => this.toDetails(ticket)),
          catchError(error => {
            this.errorMessage = error.status === 404
              ? 'لم يتم العثور على التذكرة.'
              : 'تعذّر تحميل تفاصيل التذكرة.';

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

  private toDetails(ticket: Ticket) {
    const unavailable = '—';
    const status = 'الحالة غير متوفرة';

    return {
      ticketNumber: String(ticket.id),
      name: ticket.ticketName,
      flightNumber: String(ticket.flightId),
      airline: unavailable,
      airlineCode: unavailable,
      status,
      statusClass: 'unknown' as 'unknown' | 'cancelled',
      originCode: unavailable,
      originCity: unavailable,
      originAirport: unavailable,
      departureTime: unavailable,
      destinationCode: unavailable,
      destinationCity: unavailable,
      destinationAirport: unavailable,
      arrivalTime: unavailable,
      aircraft: unavailable,
      aircraftModel: unavailable,
      registration: unavailable,
      checkInTime: ticket.checkInTime || unavailable,
      boardingTime: ticket.boardingTime || unavailable,
      gate: ticket.gateNumber || unavailable,
      terminal: unavailable,
      firstName: unavailable,
      familyName: unavailable,
      nationality: unavailable,
      birthDate: unavailable,
      gender: unavailable,
      passportNumber: unavailable,
      phone: unavailable,
      bookingDate: unavailable,
      ticketStatus: status,
      travelClass: ticket.flightClass,
      seat: unavailable,
      seatType: unavailable,
      price: ticket.ticketPrice,
      currency: 'USD'
    };
  }
}