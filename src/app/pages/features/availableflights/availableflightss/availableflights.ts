import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// استيراد نوع الرحلة والبيانات المشتركة والخدمة.
import {
  Airport,
  Flight,
  FlightFilters,
  FlightStatus,
  FlightService
} from '../../../../core/services/flight.service';

@Component({
  selector: 'app-available-flights',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './availableflights.html'
})
export class AvailableFlightsComponent implements OnInit {
  // قيم البحث الافتراضية
  departureAirport = '';
  arrivalAirport = '';
  departureDate = '';
  airports: Airport[] = [];
  isLoading = false;
  errorMessage = '';

  // حالة الفلتر المحدد
  selectedStatus = 'all';

  // حالات الرحلات المستخدمة في أزرار التصفية
  readonly statuses = [
    {
      label: 'الكل',
      value: 'all',
      dotClass: ''
    },
    {
      label: 'مجدولة',
      value: 'Scheduled',
      dotClass: 'bg-primary-container'
    },
    {
      label: 'متأخرة',
      value: 'Delayed',
      dotClass: 'bg-amber-500'
    },
    {
      label: 'ملغاة',
      value: 'Cancelled',
      dotClass: 'bg-error'
    },
    {
      label: 'غادرت',
      value: 'Departed',
      dotClass: 'bg-emerald-600'
    },
    {
      label: 'وصلت',
      value: 'Arrived',
      dotClass: 'bg-emerald-600'
    }
  ];

  flights: Flight[] = [];
  filteredFlights: Flight[] = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly flightService: FlightService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const departure = params.get('departure') || params.get('departureAirport');
      const arrival = params.get('arrival') || params.get('arrivalAirport');
      const date = params.get('date') || params.get('departureDate');

      if (departure) this.departureAirport = departure;
      if (arrival) this.arrivalAirport = arrival;
      if (date) this.departureDate = date;
    });

    this.isLoading = true;
    this.flightService.getAllAirports().subscribe({
      next: airports => {
        this.airports = airports;
      },
      error: error => this.showError(error)
    });

    this.loadFlights();
  }

  // تبديل مطار المغادرة مع مطار الوصول
  swapAirports(): void {
    const currentDeparture = this.departureAirport;
    this.departureAirport = this.arrivalAirport;
    this.arrivalAirport = currentDeparture;
    this.applyFilters();
  }

  // البحث عن الرحلات حسب المطارات وحالة الرحلة
  applyFilters(): void {
    this.loadFlights();
  }

  // تصفية الرحلات حسب الحالة المختارة
  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  // إعادة البحث والفلاتر إلى الوضع الافتراضي
  resetFilters(): void {
    this.departureAirport = '';
    this.arrivalAirport = '';
    this.selectedStatus = 'all';
    this.departureDate = '';
    this.loadFlights();
  }

  // الانتقال إلى صفحة حجز الرحلة
  bookFlight(flight: Flight): void {
    if (flight.status === 'Cancelled' || flight.status === 'ملغاة') {
      return;
    }

    this.router.navigate(['/booking'], {
      queryParams: {
        flightId: flight.id,
        flightNumber: flight.number,
        date: this.departureDate || flight.departureDate
      }
    });
  }

  private loadFlights(): void {
    const filters: FlightFilters = {
      departureAirportId: this.departureAirport || undefined,
      arrivalAirportId: this.arrivalAirport || undefined,
      flightStatus: this.selectedStatus === 'all'
        ? undefined
        : (this.selectedStatus as FlightStatus),
      departureDate: this.departureDate || undefined
    };

    this.isLoading = true;
    this.errorMessage = '';

    this.flightService.getFlights(filters).subscribe({
      next: flights => {
        this.flights = flights;
        this.filteredFlights = flights;
        this.isLoading = false;
      },
      error: error => this.showError(error)
    });
  }

  private showError(error: { error?: { message?: string }; message?: string }): void {
    this.isLoading = false;
    this.errorMessage =
      error.error?.message || error.message || 'تعذر تحميل بيانات الرحلات.';
  }
}
