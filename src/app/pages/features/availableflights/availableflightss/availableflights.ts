import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// استيراد نوع الرحلة والبيانات المشتركة.
import { Flight, flightsData } from '../flights-data';

@Component({
  selector: 'app-available-flights',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './availableflights.html'
})
export class AvailableFlightsComponent {

  // قيم البحث الافتراضية.
  departureAirport = '';
  arrivalAirport = '';
  departureDate = '2026-11-07';

  // حالة الفلتر المحدد.
  selectedStatus = 'all';

  // حالات الرحلات المستخدمة في أزرار التصفية.
  statuses = [
    {
      label: 'الكل',
      value: 'all',
      dotClass: ''
    },
    {
      label: 'مؤكدة',
      value: 'مؤكدة',
      dotClass: 'bg-emerald-600'
    },
    {
      label: 'مجدولة',
      value: 'مجدولة',
      dotClass: 'bg-primary-container'
    },
    {
      label: 'متأخرة',
      value: 'متأخرة',
      dotClass: 'bg-amber-500'
    },
    {
      label: 'ملغاة',
      value: 'ملغاة',
      dotClass: 'bg-error'
    }
  ];

  // قراءة الرحلات من مصدر البيانات المشترك.
  flights: Flight[] = flightsData;

  // قائمة الرحلات التي تظهر للمستخدم.
  filteredFlights: Flight[] = [...this.flights];

  constructor(private router: Router) {}

  // تبديل مطار المغادرة مع مطار الوصول.
  swapAirports(): void {
    const currentDeparture = this.departureAirport;

    this.departureAirport = this.arrivalAirport;
    this.arrivalAirport = currentDeparture;

    this.applyFilters();
  }

  // البحث عن الرحلات حسب المطارات وحالة الرحلة.
  applyFilters(): void {
    this.filteredFlights = this.flights.filter(flight => {

      // التحقق من مطار المغادرة.
      const originMatch =
        !this.departureAirport ||
        flight.origin === this.departureAirport;

      // التحقق من مطار الوصول.
      const destinationMatch =
        !this.arrivalAirport ||
        flight.destination === this.arrivalAirport;

      // التحقق من حالة الرحلة.
      const statusMatch =
        this.selectedStatus === 'all' ||
        flight.status === this.selectedStatus;

      return originMatch && destinationMatch && statusMatch;
    });
  }

  // تصفية الرحلات حسب الحالة المختارة.
  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  // إعادة البحث والفلاتر إلى الوضع الافتراضي.
  resetFilters(): void {
    this.departureAirport = '';
    this.arrivalAirport = '';
    this.selectedStatus = 'all';
    this.departureDate = '2026-11-07';

    this.applyFilters();
  }

  // الانتقال إلى صفحة حجز الرحلة.
  bookFlight(flight: Flight): void {

    // منع حجز الرحلات الملغاة.
    if (flight.status === 'ملغاة') {
      return;
    }

    this.router.navigate(['/booking'], {
      queryParams: {
        flightNumber: flight.number,
        date: this.departureDate
      }
    });
  }
}