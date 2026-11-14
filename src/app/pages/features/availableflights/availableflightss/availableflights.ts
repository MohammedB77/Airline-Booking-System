import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  Airport,
  Flight,
  FlightService
} from '../../../../core/services/flight.service';

@Component({
  selector: 'app-available-flights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './availableflights.html'
})
export class AvailableFlightsComponent implements OnInit, OnDestroy {
  // قيم البحث الحالية
  departureAirport: number | string = '';
  arrivalAirport: number | string = '';
  departureDate = '';
  selectedStatus = 'all';

  // المطارات الحقيقية المستلمة حصراً من قاعدة البيانات
  airports: Airport[] = [];
  isLoading = true; // تبدأ بـ true دائماً لضمان شاشة التحميل (Reloading) لبضع ثوانٍ قبل عرض البيانات الحقيقية
  errorMessage = '';

  // القائمتان: قائمة البيانات الحقيقية من السيرفر، وقائمة العرض السريع والمفلترة
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

  private filterTimer: ReturnType<typeof setTimeout> | null = null;
  private loadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly flightService: FlightService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    // 1. جلب المطارات الحقيقية من قاعدة البيانات عبر الـ API
    this.flightService.getAllAirports().subscribe({
      next: airports => {
        this.airports = airports || [];
        this.resolveQueryParams();
      },
      error: () => {
        this.resolveQueryParams();
      }
    });

    // 2. تحميل الرحلات الحقيقية من قاعدة البيانات مع إعادة التحميل لبضع ثوانٍ
    this.loadFlights();
  }

  ngOnDestroy(): void {
    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
    }
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
    }
  }

  // تبديل مطار المغادرة مع مطار الوصول
  swapAirports(): void {
    const temp = this.departureAirport;
    this.departureAirport = this.arrivalAirport;
    this.arrivalAirport = temp;
    this.applyFilters();
  }

  // البحث والتصفية عبر الفورم مع إظهار شاشة إعادة التحميل (Reload) لبضع ثوانٍ ثم عرض الكروت
  applyFilters(): void {
    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
    }

    this.isLoading = true;

    // إظهار شاشة إعادة التحميل لمدة ثانية لتأكيد تنفيذ البحث وعرض الكروت المفلترة
    this.filterTimer = setTimeout(() => {
      this.applyLocalFilter();
      this.isLoading = false;
    }, 850);
  }

  // تصفية سريعة حسب حالة الرحلة مع إعادة تحميل سلسة
  filterByStatus(status: string): void {
    this.selectedStatus = status;

    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
    }

    this.isLoading = true;
    this.filterTimer = setTimeout(() => {
      this.applyLocalFilter();
      this.isLoading = false;
    }, 500);
  }

  // إعادة ضبط حقول البحث واستعادة جميع الرحلات الحقيقية
  resetFilters(): void {
    this.departureAirport = '';
    this.arrivalAirport = '';
    this.departureDate = '';
    this.selectedStatus = 'all';

    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
    }

    this.isLoading = true;
    this.filterTimer = setTimeout(() => {
      this.displayedFlights = [...this.allFlights];
      this.isLoading = false;
    }, 500);
  }

  // الانتقال إلى صفحة تفاصيل الرحلة مع حفظها فوراً في الكاش لتسريع العرض
  viewFlightDetails(flight: Flight): void {
    this.flightService.cacheFlight(flight);
    void this.router.navigate(['/flight-details', flight.id]);
  }

  // الانتقال إلى صفحة حجز الرحلة
  bookFlight(flight: Flight): void {
    if (this.isFlightCancelled(flight)) {
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

  isFlightCancelled(flight: Flight): boolean {
    return flight.status === 'Cancelled' || flight.status === 'ملغاة';
  }

  // جلب الرحلات الحقيقية فقط من قاعدة البيانات عبر الـ API مع إعادة التحميل لبضع ثوانٍ
  loadFlights(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
    }

    const startTime = Date.now();

    this.flightService.getFlights().subscribe({
      next: flights => {
        // تخزين البيانات الحقيقية فقط من قاعدة البيانات
        this.allFlights = flights || [];
        this.flightService.cacheFlights(this.allFlights);

        // إبقاء شاشة إعادة التحميل لبضع ثوانٍ (بحد أدنى 1.2 ثانية) كما طُلب
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 1200 - elapsed);

        this.loadTimer = setTimeout(() => {
          this.applyLocalFilter();
          this.isLoading = false;
        }, remainingDelay);
      },
      error: error => {
        this.allFlights = [];
        this.displayedFlights = [];
        this.errorMessage =
          error.error?.message ||
          error.message ||
          'تعذر تحميل بيانات الرحلات من قاعدة البيانات. يرجى التحقق من اتصال الـ API وتشغيل السيرفر.';

        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 1000 - elapsed);

        this.loadTimer = setTimeout(() => {
          this.isLoading = false;
        }, remainingDelay);
      }
    });
  }

  // تصفية سريعة في الذاكرة على القائمة الحقيقية allFlights لتحديث displayedFlights
  private applyLocalFilter(): void {
    let result = [...this.allFlights];

    // 1. تصفية مطار المغادرة
    const depAirport = this.findAirport(this.departureAirport);
    if (depAirport) {
      result = result.filter(f =>
        this.matchesAirport(f.originCode, f.origin, f.originName, f.originCity, depAirport)
      );
    }

    // 2. تصفية مطار الوصول
    const arrAirport = this.findAirport(this.arrivalAirport);
    if (arrAirport) {
      result = result.filter(f =>
        this.matchesAirport(f.destinationCode, f.destination, f.destinationName, f.destinationCity, arrAirport)
      );
    }

    // 3. تصفية تاريخ المغادرة
    if (this.departureDate) {
      result = result.filter(f => {
        if (!f.departureDate) return false;
        const flightDate = f.departureDate.includes('T')
          ? f.departureDate.split('T')[0]
          : f.departureDate;
        return flightDate === this.departureDate;
      });
    }

    // 4. تصفية حالة الرحلة
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

  private findAirport(value: number | string): Airport | null {
    if (!value) return null;
    const strVal = String(value).trim().toLowerCase();
    const found = this.airports.find(
      a => String(a.id).toLowerCase() === strVal ||
           a.code.toLowerCase() === strVal ||
           a.name.toLowerCase().includes(strVal)
    );
    return found || null;
  }

  private matchesAirport(code: string, origin: string, name: string, city: string, airport: Airport): boolean {
    const targetCode = (airport.code || '').trim().toLowerCase();
    const targetName = (airport.name || '').trim().toLowerCase();
    const targetCity = (airport.city || '').trim().toLowerCase();

    const c = (code || '').trim().toLowerCase();
    const o = (origin || '').trim().toLowerCase();
    const n = (name || '').trim().toLowerCase();
    const ct = (city || '').trim().toLowerCase();

    if (targetCode && (c === targetCode || o === targetCode)) return true;
    if (targetName && (n.includes(targetName) || targetName.includes(n))) return true;
    if (targetCity && (ct.includes(targetCity) || targetCity.includes(ct))) return true;

    return false;
  }
}
