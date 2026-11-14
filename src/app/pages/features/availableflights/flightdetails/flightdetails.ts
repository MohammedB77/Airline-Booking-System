import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
    private readonly flightService: FlightService,
    private readonly cdr: ChangeDetectorRef
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
    const list = this.tickets.length > 0 ? this.tickets : (this.flight?.tickets || []);
    const matching = list.filter(t => this.isBusinessClass(t.flightClass));

    if (matching.length > 0) {
      return matching.reduce((sum, t) => sum + (t.availableTickets || 0), 0);
    }

    if (this.flight?.businessSeats && this.flight.businessSeats > 0) {
      return this.flight.businessSeats;
    }

    return 0;
  }

  // عدد التذاكر / المقاعد المتاحة للدرجة الاقتصادية
  get economyTicketsCount(): number {
    const list = this.tickets.length > 0 ? this.tickets : (this.flight?.tickets || []);
    const matching = list.filter(t => this.isEconomyClass(t.flightClass));

    if (matching.length > 0) {
      return matching.reduce((sum, t) => sum + (t.availableTickets || 0), 0);
    }

    if (this.flight?.economySeats && this.flight.economySeats > 0) {
      return this.flight.economySeats;
    }

    return 0;
  }

  get businessTicket(): Ticket | undefined {
    const list = this.tickets.length > 0 ? this.tickets : (this.flight?.tickets || []);
    return list.find(t => this.isBusinessClass(t.flightClass));
  }

  get economyTicket(): Ticket | undefined {
    const list = this.tickets.length > 0 ? this.tickets : (this.flight?.tickets || []);
    return list.find(t => this.isEconomyClass(t.flightClass));
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

  // تحديث حالة وتفاصيل التذاكر في الكروت وإعادة رسم المكون مباشرة
  refreshTicketsStatus(): void {
    if (!this.flight || this.isLoadingTickets) {
      return;
    }
    const flightId = this.flight.id;
    this.isLoadingTickets = true;
    this.cdr.detectChanges();

    this.flightService.getFlightById(flightId).subscribe({
      next: response => {
        this.flight = response.flight;
        if (response.tickets && response.tickets.length > 0) {
          this.tickets = response.tickets;
          this.isLoadingTickets = false;
          this.cdr.detectChanges();
        } else {
          // جلب التذاكر من جدول التذاكر مباشرة لضمان الحصول على البيانات الحقيقية من قاعدة البيانات
          this.flightService.getTicketsByFlightId(flightId).subscribe({
            next: directTickets => {
              if (directTickets && directTickets.length > 0) {
                this.tickets = directTickets;
                if (this.flight) {
                  this.flight.tickets = directTickets;
                }
              }
              this.isLoadingTickets = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.isLoadingTickets = false;
              this.cdr.detectChanges();
            }
          });
        }
      },
      error: () => {
        this.flightService.getTicketsByFlightId(flightId).subscribe({
          next: directTickets => {
            if (directTickets && directTickets.length > 0) {
              this.tickets = directTickets;
              if (this.flight) {
                this.flight.tickets = directTickets;
              }
            }
            this.isLoadingTickets = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.isLoadingTickets = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  // متوافق مع الاستدعاء القديم
  refreshTickets(): void {
    this.refreshTicketsStatus();
  }

  loadFlightDetails(numericId: number): void {
    this.isLoadingTickets = true;
    this.flightService.getFlightById(numericId).subscribe({
      next: response => {
        this.flight = response.flight;
        if (response.tickets && response.tickets.length > 0) {
          this.tickets = response.tickets;
          this.isLoading = false;
          this.isLoadingTickets = false;
          this.cdr.detectChanges();
        } else {
          this.flightService.getTicketsByFlightId(numericId).subscribe({
            next: directTickets => {
              if (directTickets && directTickets.length > 0) {
                this.tickets = directTickets;
                if (this.flight) {
                  this.flight.tickets = directTickets;
                }
              }
              this.isLoading = false;
              this.isLoadingTickets = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.isLoading = false;
              this.isLoadingTickets = false;
              this.cdr.detectChanges();
            }
          });
        }
      },
      error: error => {
        this.isLoadingTickets = false;
        if (!this.flight) {
          this.handleError(error);
        } else {
          this.isLoading = false;
        }
        this.cdr.detectChanges();
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
          this.cdr.detectChanges();
        } else if (!this.flight) {
          this.isLoading = false;
          this.errorMessage = 'لم يتم العثور على تفاصيل الرحلة المطلوبة.';
        }
        this.isLoadingTickets = false;
        this.cdr.detectChanges();
      },
      error: error => {
        this.isLoadingTickets = false;
        if (!this.flight) {
          this.handleError(error);
        } else {
          this.isLoading = false;
        }
        this.cdr.detectChanges();
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
