import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  Airport,
  Flight,
  FlightFilters,
  FlightStatus,
  FlightService
} from '../../../../core/services/flight.service';

//import { FlightService } from '../../../../core/services/flight.service';

@Component({
  selector: 'app-available-flights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './availableflights.html'
})
export class AvailableFlightsComponent implements OnInit {
  // قيم البحث الحالية
  departureAirport: number | string = '';
  arrivalAirport: number | string = '';
  departureDate = '';
  selectedStatus = 'all';

  airports: Airport[] = [];
  isLoading = false;
  errorMessage = '';

  // القائمتان: قائمة البيانات الحقيقية من السيرفر، وقائمة العرض السريع والمسح
  allFlights: Flight[] = [];
  displayedFlights: Flight[] = [];

  // حالات الرحلات المستخدمة في أزرار التصفية
  readonly statuses = [
    { label: 'الكل', value: 'all', dotClass: '' },
    { label: 'مجدولة', value: 'Scheduled', dotClass: 'bg-primary-container' },
    { label: 'متأخرة', value: 'Delayed', dotClass: 'bg-amber-500' },
    { label: 'ملغاة', value: 'Cancelled', dotClass: 'bg-error' },
    { label: 'غادرت', value: 'Departed', dotClass: 'bg-emerald-600' },
    { label: 'وصلت', value: 'Arrived', dotClass: 'bg-emerald-600' }
  ];
  private readonly cdr = inject(ChangeDetectorRef);
  // Flights initially loaded from shared mock data.
  flights: Flight[] = [];

  // Flights displayed to the user.
  filteredFlights: Flight[] = [];

  // API loading state.
  // isLoading = true;

  // API error message.
  loadError = '';

  // constructor(
  //   private router: Router,
  //   private flightService: FlightService
  // ) { }

  // Load actual flights from the database.
  ngOnInit(): void {
    this.isLoading = true;
    this.loadError = '';

    this.flightService.getFlights().subscribe({
      next: flights => {
        this.flights = flights;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error loading flights:', error);

        // Keep the existing mock data if the API fails.
        this.flights = [];
        this.applyFilters();

        this.loadError = 'تعذر تحميل الرحلات من الخادم. يتم عرض البيانات التجريبية.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
    // 1. جلب المطارات المعتمدة

    this.flightService.getAllAirports().subscribe({
      next: airports => {
        this.airports = airports;
        this.resolveQueryParams();
      },
      error: () => {
        this.resolveQueryParams();
      }
    });

    this.loadFlights();

    // // 2. تحميل الرحلات الحقيقية
    // this.loadFlights();
    // }
  }

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly flightService: FlightService
  ) { }

  // ngOnInit(): void {
  //   // 1. جلب المطارات المعتمدة
  //   this.flightService.getAllAirports().subscribe({
  //     next: airports => {
  //       this.airports = airports;
  //       this.resolveQueryParams();
  //     },
  //     error: () => {
  //       this.resolveQueryParams();
  //     }
  //   });

  //   // 2. تحميل الرحلات الحقيقية
  //   this.loadFlights();
  // }

  // تبديل مطار المغادرة مع مطار الوصول
  swapAirports(): void {
    const temp = this.departureAirport;
    this.departureAirport = this.arrivalAirport;
    this.arrivalAirport = temp;
    this.applyFilters();
  }

  // البحث عن الرحلات حسب المدخلات (طلب إلى السيرفر)
  applyFilters(): void {
    this.loadFlights();
  }

  // تصفية الرحلات فورياً وسريعاً في الذاكرة دون طلب شبكة جديد
  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.applyLocalFilter();
  }

  // إعادة البحث والفلاتر إلى الوضع الافتراضي ومسح التصفية فورياً
  resetFilters(): void {
    this.departureAirport = '';
    this.arrivalAirport = '';
    this.departureDate = '';
    this.selectedStatus = 'all';
    this.displayedFlights = [...this.allFlights];
  }

  // الانتقال إلى صفحة تفاصيل الرحلة
  viewFlightDetails(flight: Flight): void {
    // التأكد من حفظ الرحلة في الكاش للعرض الفوري (0ms)
    this.flightService.cacheFlight(flight);
    void this.router.navigate(['/flight-details', flight.id]);
  }

  // الانتقال إلى صفحة حجز الرحلة
  bookFlight(flight: Flight): void {
    if (flight.status === 'Cancelled' || flight.status === 'ملغاة') {
      return;
    }

    this.flightService.cacheFlight(flight);
    void this.router.navigate(['/booking'], {
      queryParams: {
        flightId: flight.id,
        flightNumber: flight.number,
        date: this.departureDate || flight.departureDate
      }
    });
  }

  // جلب الرحلات الحقيقية من API
  loadFlights(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filters: FlightFilters = {
      departureAirportId: this.departureAirport || undefined,
      arrivalAirportId: this.arrivalAirport || undefined,
      departureDate: this.departureDate || undefined
    };

    this.flightService.getFlights(filters).subscribe({
      next: flights => {
        // تحديث القائمة الأساسية
        this.allFlights = flights;
        // تحديث قائمة العرض السريع وفق الفلاتر المحلية
        this.applyLocalFilter();
        this.isLoading = false;
      },
      error: error => {
        this.isLoading = false;
        this.allFlights = [];
        this.displayedFlights = [];
        this.errorMessage =
          error.error?.message ||
          error.message ||
          'تعذر تحميل بيانات الرحلات من الخادم. يرجى التحقق من اتصال الـ API وحاول مرة أخرى.';
      }
    });
  }

  // تصفية سريعة في الذاكرة على القائمة الحقيقية allFlights
  private applyLocalFilter(): void {
    let result = [...this.allFlights];

    // تصفية حسب الحالة إن تم تحديدها
    if (this.selectedStatus && this.selectedStatus !== 'all') {
      const target = this.selectedStatus.toLowerCase();
      const statusMap: Record<string, string> = {
        scheduled: 'مجدولة',
        delayed: 'متأخرة',
        cancelled: 'ملغاة',
        departed: 'غادرت',
        arrived: 'وصلت'
      };
      const arabicTarget = statusMap[target] || target;

      result = result.filter(f => {
        const s = (f.status || '').toLowerCase();
        return s === target || s === arabicTarget.toLowerCase();
      });
    }

    this.displayedFlights = result;
  }

  private resolveQueryParams(): void {
    this.route.queryParamMap.subscribe(params => {
      const dep = params.get('departure') || params.get('departureAirport');
      const arr = params.get('arrival') || params.get('arrivalAirport');
      const date = params.get('date') || params.get('departureDate');

      if (dep) {
        this.departureAirport = this.findAirportId(dep);
      }
      if (arr) {
        this.arrivalAirport = this.findAirportId(arr);
      }
      if (date) {
        this.departureDate = date;
      }

      if (dep || arr || date) {
        this.applyLocalFilter();
      }
    });
  }

  private findAirportId(value: string): number | string {
    const num = Number(value);
    if (Number.isInteger(num) && num > 0) return num;

    const code = value.trim().toUpperCase();
    const found = this.airports.find(
      a => a.code.toUpperCase() === code || String(a.id) === code
    );
    return found ? found.id : value;
  }
}
