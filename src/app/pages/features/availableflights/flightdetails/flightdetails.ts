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
  ) { }

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
      // 1. فحص فوري للذاكرة المؤقتة (عرض فوري في 0ms)
      const cached = this.flightService.getCachedFlight(numericId);
      if (cached) {
        this.flight = cached;
        if (cached.tickets && cached.tickets.length > 0) {
          this.tickets = cached.tickets;
        }
        this.isLoading = false;
      }

      // 2. طلب تفاصيل الرحلة وفئات التذاكر المتاحة من السيرفر
      this.loadFlightDetails(numericId);
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

      this.loadFlightByNumber(param);
    } else {
      this.isLoading = false;
      this.errorMessage = 'رقم أو معرّف الرحلة غير صحيح.';
    }
  }

  // عدد التذاكر / المقاعد المتاحة لدرجة رجال الأعمال
  get businessTicketsCount(): number {
    const ticket = this.tickets.find(t => this.isBusinessClass(t.flightClass)) ||
      this.flight?.tickets?.find(t => this.isBusinessClass(t.flightClass));

    if (ticket && ticket.availableTickets !== undefined && ticket.availableTickets > 0) {
      return ticket.availableTickets;
    }

    if (this.flight?.businessSeats && this.flight.businessSeats > 0) {
      return this.flight.businessSeats;
    }

    return ticket?.availableTickets ?? 0;
  }

  // عدد التذاكر / المقاعد المتاحة للدرجة الاقتصادية
  get economyTicketsCount(): number {
    const ticket = this.tickets.find(t => this.isEconomyClass(t.flightClass)) ||
      this.flight?.tickets?.find(t => this.isEconomyClass(t.flightClass));

    if (ticket && ticket.availableTickets !== undefined && ticket.availableTickets > 0) {
      return ticket.availableTickets;
    }

    if (this.flight?.economySeats && this.flight.economySeats > 0) {
      return this.flight.economySeats;
    }

    return ticket?.availableTickets ?? 0;
  }

  // إجمالي المقاعد أو التذاكر المتاحة للحجز
  get totalAvailableTickets(): number {
    if (this.tickets.length > 0) {
      return this.tickets.reduce((sum, t) => sum + (t.availableTickets || 0), 0);
    }
    return (this.flight?.economySeats || 0) + (this.flight?.businessSeats || 0);
  }

  get canBook(): boolean {
    if (!this.flight || this.flight.status === 'Cancelled' || this.flight.status === 'ملغاة') {
      return false;
    }
    return this.totalAvailableTickets > 0;
  }

  // زر تحديث التذاكر وكروت المقاعد المتاحة (Refresh Button)
  refreshTickets(): void {
    if (!this.flight || this.isLoadingTickets) {
      return;
    }
    this.loadFlightDetails(this.flight.id);
  }

  loadFlightDetails(numericId: number): void {
    this.isLoadingTickets = true;
    this.flightService.getFlightById(numericId).subscribe({
      next: response => {
        this.flight = response.flight;
        this.tickets = response.tickets || [];
        this.isLoading = false;
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
  }

  loadFlightByNumber(flightNumber: string): void {
    this.isLoadingTickets = true;
    this.flightService.getFlightByNumber(flightNumber).subscribe({
      next: response => {
        if (response) {
          this.flight = response.flight;
          this.tickets = response.tickets || [];
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
  }

  isBusinessClass(flightClass?: string): boolean {
    if (!flightClass) return false;
    const clean = flightClass.toLowerCase();
    return clean.includes('business') || clean.includes('أعمال') || clean.includes('first') || clean.includes('ممتازة');
  }

  isEconomyClass(flightClass?: string): boolean {
    if (!flightClass) return false;
    const clean = flightClass.toLowerCase();
    return clean.includes('economy') || clean.includes('اقتصاد') || clean.includes('سياح');
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
