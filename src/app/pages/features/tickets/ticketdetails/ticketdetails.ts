import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  TicketBooking,
  TicketBookingService
} from '../../../../core/services/ticketbooking.service';

// شكل بيانات التذكرة المعروضة في الصفحة
export interface TicketDetails {
  ticketNumber: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  status: string;
  statusClass: string;

  originCode: string;
  originCity: string;
  originAirport: string;
  departureTime: string;

  destinationCode: string;
  destinationCity: string;
  destinationAirport: string;
  arrivalTime: string;

  aircraft: string;
  aircraftModel: string;
  registration: string;

  checkInTime: string;
  boardingTime: string;
  gate: string;
  terminal: string;

  firstName: string;
  familyName: string;
  nationality: string;
  birthDate: string;
  gender: string;
  passportNumber: string;
  phone: string;

  bookingDate: string;
  ticketStatus: string;
  travelClass: string;
  seat: string;
  seatType: string;
  price: number;
  currency: string;
}

@Component({
  selector: 'app-ticketdetails',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ticketdetails.html'
})
export class TicketdetailsComponent implements OnInit {
  ticket: TicketDetails | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly bookingService: TicketBookingService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const ticketNumber = params.get('ticketNumber') || '';

      if (!ticketNumber) {
        this.isLoading = false;
        this.errorMessage = 'رقم التذكرة غير محدد.';
        return;
      }

      this.bookingService.getBookingByTicketNumber(ticketNumber).subscribe({
        next: booking => {
          if (booking) {
            this.ticket = this.mapBookingToTicketDetails(booking);
          } else {
            this.errorMessage = 'لم يتم العثور على التذكرة المطلوبة.';
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'تعذر تحميل بيانات التذكرة.';
        }
      });
    });
  }

  // طباعة تفاصيل التذكرة
  printTicket(): void {
    window.print();
  }

  // مشاركة رابط التذكرة
  async shareTicket(): Promise<void> {
    if (!this.ticket) return;

    const ticketUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تفاصيل التذكرة الإلكترونية',
          text: `تذكرة رقم ${this.ticket.ticketNumber}`,
          url: ticketUrl
        });
      } catch {
        // تم إلغاء المشاركة من قبل المستخدم
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(ticketUrl);
      alert('تم نسخ رابط التذكرة');
    } else {
      alert('المشاركة غير مدعومة في هذا المتصفح');
    }
  }

  // تنزيل تفاصيل التذكرة كملف نصي
  downloadTicket(): void {
    if (!this.ticket) return;

    const content = `
تفاصيل التذكرة الإلكترونية - مَدار
===============================
رقم التذكرة: ${this.ticket.ticketNumber}
رقم الرحلة: ${this.ticket.flightNumber}
شركة الطيران: ${this.ticket.airline}
حالة التذكرة: ${this.ticket.status}
المسافر: ${this.ticket.firstName} ${this.ticket.familyName}
رقم الجواز: ${this.ticket.passportNumber}
الجنسية: ${this.ticket.nationality}

مسار الرحلة:
من: ${this.ticket.originCity} (${this.ticket.originCode}) - ${this.ticket.originAirport}
إلى: ${this.ticket.destinationCity} (${this.ticket.destinationCode}) - ${this.ticket.destinationAirport}
وقت الإقلاع: ${this.ticket.departureTime}
وقت الوصول: ${this.ticket.arrivalTime}

بيانات السفر:
درجة السفر: ${this.ticket.travelClass}
رقم المقعد: ${this.ticket.seat}
البوابة: ${this.ticket.gate}
الصالة: ${this.ticket.terminal}
السعر: ${this.ticket.price} ${this.ticket.currency}
تاريخ الحجز: ${this.ticket.bookingDate}
    `.trim();

    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${this.ticket.ticketNumber}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }

  private mapBookingToTicketDetails(booking: TicketBooking): TicketDetails {
    const isCancelled =
      booking.statusKey === 'cancelled' ||
      booking.status === 'ملغاة' ||
      booking.status === 'Cancelled' ||
      booking.status === 'ملغي';

    const rawName = (booking.passengerName || 'أحمد الزبيدي').trim();
    const parts = rawName.split(' ');
    const firstName = parts[0] || '—';
    const familyName = parts.slice(1).join(' ') || '—';

    return {
      ticketNumber: booking.ticketNumber,
      flightNumber: booking.flightNumber || 'MDR-101',
      airline: booking.airline || 'طيران مَدار',
      airlineCode: booking.airlineCode || 'MDR',
      status: isCancelled ? 'ملغاة' : 'مؤكدة',
      statusClass: isCancelled ? 'cancelled' : 'confirmed',

      originCode: booking.originCode || 'SAH',
      originCity: booking.originCity || 'صنعاء',
      originAirport: booking.originName || 'مطار صنعاء الدولي',
      departureTime: booking.departureTime || '08:00 ص',

      destinationCode: booking.destinationCode || 'CAI',
      destinationCity: booking.destinationCity || 'القاهرة',
      destinationAirport: booking.destinationName || 'مطار القاهرة الدولي',
      arrivalTime: booking.arrivalTime || '11:30 ص',

      aircraft: booking.aircraft || 'Airbus A320neo',
      aircraftModel: booking.aircraftModel || booking.aircraft || 'Airbus A320neo',
      registration: booking.registration || '7O-MDR',

      checkInTime: 'قبل ساعتين',
      boardingTime: 'قبل 45 دقيقة',
      gate: booking.gate || 'بوابة G04',
      terminal: booking.terminal || 'الصالة 1',

      firstName,
      familyName,
      nationality: booking.passengerNationality || 'يمني',
      birthDate: booking.passengerBirthDate || '1990/03/15',
      gender: booking.passengerGender || 'ذكر',
      passportNumber: booking.passengerPassport || 'YEM789456',
      phone: booking.passengerPhone || '+967 771 234 567',

      bookingDate: booking.bookingDate || '2026/11/07',
      ticketStatus: isCancelled ? 'تم إلغاء التذكرة' : 'مؤكدة ومدفوعة بالكامل',
      travelClass: booking.cabin || 'الدرجة الاقتصادية',
      seat: booking.seatNumber || '14B',
      seatType:
        booking.seatNumber &&
        (booking.seatNumber.endsWith('A') || booking.seatNumber.endsWith('F'))
          ? 'نافذة (Window)'
          : 'ممر (Aisle)',
      price: booking.price || 350,
      currency: booking.currency || 'USD'
    };
  }
}
