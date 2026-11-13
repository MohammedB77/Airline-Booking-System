import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Flight, FlightService, Ticket } from '../../../../core/services/flight.service';

@Component({
  selector: 'app-flightdetails',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './flightdetails.html'
})
export class FlightdetailsComponent implements OnInit {
  flight: Flight | null = null;
  tickets: Ticket[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly flightService: FlightService
  ) {}

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('flightId') || '';
    const numericId = Number(param);

    if (Number.isInteger(numericId) && numericId > 0) {
      this.flightService.getFlightById(numericId).subscribe({
        next: response => {
          this.flight = response.flight;
          this.tickets = response.tickets;
          this.isLoading = false;
        },
        error: error => this.handleError(error)
      });
    } else if (param.trim()) {
      this.flightService.getFlightByNumber(param).subscribe({
        next: response => {
          if (response) {
            this.flight = response.flight;
            this.tickets = response.tickets;
            this.isLoading = false;
          } else {
            this.isLoading = false;
            this.errorMessage = 'لم يتم العثور على تفاصيل الرحلة المطلوبة.';
          }
        },
        error: error => this.handleError(error)
      });
    } else {
      this.isLoading = false;
      this.errorMessage = 'رقم أو معرّف الرحلة غير صحيح.';
    }
  }

  get canBook(): boolean {
    return (
      !!this.flight &&
      this.flight.status !== 'Cancelled' &&
      this.flight.status !== 'ملغاة' &&
      this.tickets.some(ticket => ticket.availableTickets > 0)
    );
  }

  bookFlight(): void {
    if (!this.flight || !this.canBook) {
      return;
    }

    void this.router.navigate(['/booking'], {
      queryParams: {
        flightId: this.flight.id,
        flightNumber: this.flight.number
      }
    });
  }

  private handleError(error: { error?: { message?: string }; message?: string }): void {
    this.isLoading = false;
    this.errorMessage =
      error.error?.message || error.message || 'تعذر تحميل تفاصيل الرحلة.';
  }
}
