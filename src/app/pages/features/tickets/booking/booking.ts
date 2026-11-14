import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Flight, flightsData } from '../../availableflights/flights-data';
import { TicketService } from '../../../../core/services/ticket.service';

// بيانات المسافر المسجل
interface Passenger {
  id: string;
  fullName: string;
  passport: string;
}

// خيارات درجات السفر
interface CabinClass {
  id: string;
  name: string;
  shortName: string;
  price: number;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './booking.html'
})
export class BookingComponent implements OnInit {
  private readonly ticketService = inject(TicketService);

  // بيانات الرحلة المختارة
  flight: Flight | null = null;

  // قائمة المسافرين التجريبية
  passengers: Passenger[] = [
    {
      id: 'p1',
      fullName: 'عمر أحمد باعباد',
      passport: '08492019A'
    },
    {
      id: 'p2',
      fullName: 'فاطمة سالم الكاف',
      passport: '07119430B'
    },
    {
      id: 'p3',
      fullName: 'أحمد علي المقطري',
      passport: '05128490C'
    }
  ];

  // درجات السفر وأسعارها
  cabinClasses: CabinClass[] = [
    {
      id: 'economy',
      name: 'الدرجة الاقتصادية',
      shortName: 'اقتصادية',
      price: 350
    },
    {
      id: 'business',
      name: 'درجة رجال الأعمال',
      shortName: 'رجال أعمال',
      price: 680
    }
  ];

  // المسافر المحدد
  selectedPassengerId = 'p1';

  // درجة السفر المحددة
  selectedCabinId = 'economy';

  // رقم المقعد
  seatNumber = '12A';

  // رقم التذكرة التجريبي
  ticketNumber = 'TKT-2026-98214';

  // تاريخ الحجز
  bookingDate = '2026-11-07';

  // حالة نافذة تأكيد الحجز
  showConfirmationModal = false;

  // رسالة التحقق من رقم المقعد
  seatError = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // قراءة بيانات الرحلة من الرابط
    this.route.queryParamMap.subscribe(params => {
      const flightNumber = params.get('flightNumber');
      const selectedDate = params.get('date');

      if (selectedDate) {
        this.bookingDate = selectedDate;
      }

      // البحث عن الرحلة المختارة
      if (flightNumber) {
        this.flight =
          flightsData.find(flight => flight.number === flightNumber) ?? null;
      }
    });

    // اختبار مؤقت لجلب التذاكر من الـ API
    this.ticketService.getAll().subscribe({
      next: (tickets) => console.log('Tickets:', tickets),
      error: (error) => console.error('Ticket request failed:', error)
    });
  }

  // الحصول على بيانات المسافر المحدد
  get selectedPassenger(): Passenger | undefined {
    return this.passengers.find(
      passenger => passenger.id === this.selectedPassengerId
    );
  }

  // الحصول على درجة السفر المحددة
  get selectedCabin(): CabinClass {
    return this.cabinClasses.find(
      cabin => cabin.id === this.selectedCabinId
    ) ?? this.cabinClasses[0];
  }

  // تحديث درجة السفر والسعر يتم تلقائياً عبر Angular
  selectCabin(cabinId: string): void {
    this.selectedCabinId = cabinId;
  }

  // تأكيد الحجز وعرض نافذة التأكيد
  confirmBooking(): void {
    this.seatError = '';

    if (!this.flight) {
      return;
    }

    if (!this.selectedPassenger) {
      return;
    }

    if (!this.seatNumber.trim()) {
      this.seatError = 'يرجى إدخال رقم المقعد.';
      return;
    }

    this.showConfirmationModal = true;
  }

  // إغلاق نافذة التأكيد
  closeConfirmation(): void {
    this.showConfirmationModal = false;
  }
}
