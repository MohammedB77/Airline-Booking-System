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
  isLoadingTickets = false;
  errorMessage = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly flightService: FlightService
  ) {}

  ngOnInit(): void {
    const param =
      this.route.snapshot.paramMap.get('flightId') ||
      this.route.snapshot.paramMap.get('id') ||
      this.route.snapshot.queryParamMap.get('flightId') ||
      this.route.snapshot.queryParamMap.get('id') ||
      this.route.snapshot.queryParamMap.get('flightNumber') ||
      '';
    const numericId = Number(param);

    if (Number.isInteger(numericId) && numericId > 0) {
      // 1. فحص فوري للذاكرة المؤقتة (عرض فوري في 0ms دون أي انتظار)
      const cached = this.flightService.getCachedFlight(numericId);
      if (cached) {
        this.flight = cached;
        if (cached.tickets && cached.tickets.length > 0) {
          this.tickets = cached.tickets;
        }
        this.isLoading = false;
      }

      // 2. طلب تفاصيل الرحلة وفئات التذاكر من السيرفر
      this.isLoadingTickets = true;
      this.flightService.getFlightById(numericId).subscribe({
        next: response => {
          this.flight = response.flight;
          this.tickets = response.tickets;
          this.isLoading = false;
          this.isLoadingTickets = false;
        },
        error: error => {
          this.isLoadingTickets = false;
          // إذا كانت الرحلة معروضة بالفعل من الكاش لا نظهر شاشة الخطأ
          if (!this.flight) {
            this.handleError(error);
          } else {
            this.isLoading = false;
          }
        }
      });
    } else if (param.trim()) {
      // البحث برقم الرحلة
      const cached = this.flightService.getCachedFlightByNumber(param);
      if (cached) {
        this.flight = cached;
        if (cached.tickets && cached.tickets.length > 0) {
          this.tickets = cached.tickets;
        }
        this.isLoading = false;
      }

      this.isLoadingTickets = true;
      this.flightService.getFlightByNumber(param).subscribe({
        next: response => {
          if (response) {
            this.flight = response.flight;
            this.tickets = response.tickets;
            this.isLoading = false;
          } else if (!this.flight) {
            this.isLoading = false;
            this.errorMessage = 'لم يتم العثور على تفاصيل الرحلة المطلوبة.';
          }
          this.isLoadingTickets = false;
        },
        error: error => {
          this.isLoadingTickets = false;
          if (!this.flight) {
            this.handleError(error);
          } else {
            this.isLoading = false;
          }
        }
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
      (this.tickets.length === 0 || this.tickets.some(ticket => ticket.availableTickets > 0))
    );
  }

  bookFlight(): void {
    if (!this.flight || !this.canBook) {
      return;
    }

    this.flightService.cacheFlight(this.flight);
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
      error.error?.message || error.message || 'تعذر تحميل تفاصيل الرحلة من الخادم.';
  }
}
