import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

// شكل بيانات التذكرة المعروضة في الصفحة
interface TicketDetails {
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

// مكوّن صفحة تفاصيل التذكرة
@Component({
  selector: 'app-ticketdetails',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ticketdetails.html'
})
export class TicketdetailsComponent implements OnInit {

  // بيانات التذكرة الحالية
  ticket: TicketDetails | null = null;

  // بيانات تجريبية للتذاكر
  private ticketsData: TicketDetails[] = [
    {
      ticketNumber: 'TKT-10492',
      flightNumber: 'MDR-101',
      airline: 'طيران مَدار',
      airlineCode: 'MDR',
      status: 'مؤكدة',
      statusClass: 'confirmed',

      originCode: 'SAH',
      originCity: 'صنعاء',
      originAirport: 'مطار صنعاء الدولي',
      departureTime: '08:00 ص',

      destinationCode: 'CAI',
      destinationCity: 'القاهرة',
      destinationAirport: 'مطار القاهرة الدولي',
      arrivalTime: '11:30 ص',

      aircraft: 'Airbus A320neo',
      aircraftModel: 'Airbus A320neo',
      registration: '7O-MDR',

      checkInTime: '06:30 ص',
      boardingTime: '07:15 ص',
      gate: 'بوابة G04',
      terminal: 'الصالة الدولية 1',

      firstName: 'أحمد',
      familyName: 'الزبيدي',
      nationality: 'يمني',
      birthDate: '1990/03/15',
      gender: 'ذكر',
      passportNumber: 'YEM789456',
      phone: '+967 771 234 567',

      bookingDate: '2025/05/10',
      ticketStatus: 'مؤكدة ومدفوعة بالكامل',
      travelClass: 'الدرجة الاقتصادية',
      seat: '14B',
      seatType: 'ممر طائرة (Aisle)',
      price: 280,
      currency: 'USD'
    },
    {
      ticketNumber: 'TKT-10884',
      flightNumber: 'MDR-204',
      airline: 'طيران مَدار',
      airlineCode: 'MDR',
      status: 'مؤكدة',
      statusClass: 'confirmed',

      originCode: 'ADE',
      originCity: 'عدن',
      originAirport: 'مطار عدن الدولي',
      departureTime: '02:15 م',

      destinationCode: 'DXB',
      destinationCity: 'دبي',
      destinationAirport: 'مطار دبي الدولي',
      arrivalTime: '06:30 م',

      aircraft: 'Airbus A321neo',
      aircraftModel: 'Airbus A321neo',
      registration: '7O-MDB',

      checkInTime: '12:45 م',
      boardingTime: '01:30 م',
      gate: 'غير محددة',
      terminal: 'غير محددة',

      firstName: '—',
      familyName: '—',
      nationality: '—',
      birthDate: '—',
      gender: '—',
      passportNumber: '—',
      phone: '—',

      bookingDate: '—',
      ticketStatus: 'مؤكدة',
      travelClass: 'درجة رجال الأعمال',
      seat: '02A',
      seatType: 'غير محدد',
      price: 640,
      currency: 'USD'
    },
    {
      ticketNumber: 'TKT-09311',
      flightNumber: 'MDR-305',
      airline: 'طيران مَدار',
      airlineCode: 'MDR',
      status: 'ملغاة',
      statusClass: 'cancelled',

      originCode: 'SAH',
      originCity: 'صنعاء',
      originAirport: 'مطار صنعاء الدولي',
      departureTime: '10:00 ص',

      destinationCode: 'AMM',
      destinationCity: 'عمّان',
      destinationAirport: 'مطار الملكة علياء الدولي',
      arrivalTime: '01:45 م',

      aircraft: '—',
      aircraftModel: '—',
      registration: '—',

      checkInTime: '—',
      boardingTime: '—',
      gate: '—',
      terminal: '—',

      firstName: '—',
      familyName: '—',
      nationality: '—',
      birthDate: '—',
      gender: '—',
      passportNumber: '—',
      phone: '—',

      bookingDate: '—',
      ticketStatus: 'تم إلغاء التذكرة',
      travelClass: 'الدرجة الاقتصادية',
      seat: '21C',
      seatType: '—',
      price: 310,
      currency: 'USD'
    }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // قراءة رقم التذكرة من الرابط
    this.route.paramMap.subscribe(params => {
      const ticketNumber = params.get('ticketNumber');

      // البحث عن التذكرة المطلوبة
      this.ticket =
        this.ticketsData.find(
          item => item.ticketNumber === ticketNumber
        ) ?? null;
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
          title: 'تفاصيل التذكرة',
          text: `تذكرة رقم ${this.ticket.ticketNumber}`,
          url: ticketUrl
        });
      } catch (error) {
        // تجاهل إلغاء المستخدم لعملية المشاركة
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(ticketUrl);
      alert('تم نسخ رابط التذكرة');
    } else {
      alert('المشاركة غير مدعومة في هذا المتصفح');
    }
  }

  // تنزيل تفاصيل التذكرة كملف نصي مؤقت
  downloadTicket(): void {
    if (!this.ticket) return;

    const content = `
تفاصيل التذكرة الإلكترونية
رقم التذكرة: ${this.ticket.ticketNumber}
رقم الرحلة: ${this.ticket.flightNumber}
شركة الطيران: ${this.ticket.airline}
الحالة: ${this.ticket.status}
من: ${this.ticket.originCity} (${this.ticket.originCode})
إلى: ${this.ticket.destinationCity} (${this.ticket.destinationCode})
وقت المغادرة: ${this.ticket.departureTime}
وقت الوصول: ${this.ticket.arrivalTime}
درجة السفر: ${this.ticket.travelClass}
رقم المقعد: ${this.ticket.seat}
السعر: ${this.ticket.price} ${this.ticket.currency}
    `;

    const file = new Blob([content], {
      type: 'text/plain;charset=utf-8'
    });

    const url = URL.createObjectURL(file);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${this.ticket.ticketNumber}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }
}