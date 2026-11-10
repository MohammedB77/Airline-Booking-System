
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// تحديد شكل بيانات التذكرة.
interface Ticket {
  id: string;
  flightNumber: string;
  airline: string;

  origin: string;
  originName: string;
  destination: string;
  destinationName: string;

  departureTime: string;
  arrivalTime: string;
  duration: string;

  cabin: string;
  seat: string;
  price: number;

  status: string;
  statusKey: 'confirmed' | 'cancelled';
}

// تحديد أنواع الفلاتر.
type TicketFilter = 'all' | 'confirmed' | 'cancelled';

@Component({
  selector: 'app-mytickets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mytickets.html'
})
export class MyticketsComponent {

  // الفلتر المحدد حالياً.
  selectedFilter: TicketFilter = 'all';

  // التذكرة المحددة لعرض تفاصيلها.
  selectedTicket: Ticket | null = null;

  // التحكم في ظهور نافذة تفاصيل التذكرة.
  isModalOpen = false;

  // بيانات التذاكر التجريبية.
  tickets: Ticket[] = [
    {
      id: 'TKT-10492',
      flightNumber: 'MDR-101',
      airline: 'طيران مَدار',

      origin: 'SAH',
      originName: 'مطار صنعاء الدولي',
      destination: 'CAI',
      destinationName: 'مطار القاهرة الدولي',

      departureTime: '08:00 ص',
      arrivalTime: '11:30 ص',
      duration: '3 ساعات و30 دقيقة',

      cabin: 'الدرجة الاقتصادية',
      seat: '14B',
      price: 280,

      status: 'مؤكدة',
      statusKey: 'confirmed'
    },
    {
      id: 'TKT-10884',
      flightNumber: 'MDR-204',
      airline: 'طيران مَدار',

      origin: 'ADE',
      originName: 'مطار عدن الدولي',
      destination: 'DXB',
      destinationName: 'مطار دبي الدولي',

      departureTime: '02:15 م',
      arrivalTime: '06:30 م',
      duration: '4 ساعات و15 دقيقة',

      cabin: 'رجال الأعمال',
      seat: '02A',
      price: 640,

      status: 'مؤكدة',
      statusKey: 'confirmed'
    },
    {
      id: 'TKT-09311',
      flightNumber: 'MDR-305',
      airline: 'طيران مَدار',

      origin: 'SAH',
      originName: 'مطار صنعاء الدولي',
      destination: 'AMM',
      destinationName: 'مطار الملكة علياء (عَمّان)',

      departureTime: '10:00 ص',
      arrivalTime: '01:45 م',
      duration: 'تم إلغاء الرحلة مسبقاً',

      cabin: 'الدرجة الاقتصادية',
      seat: '21C',
      price: 310,

      status: 'ملغاة',
      statusKey: 'cancelled'
    }
  ];

  // حساب عدد التذاكر المؤكدة.
  get confirmedCount(): number {
    return this.tickets.filter(
      ticket => ticket.statusKey === 'confirmed'
    ).length;
  }

  // حساب عدد التذاكر الملغاة.
  get cancelledCount(): number {
    return this.tickets.filter(
      ticket => ticket.statusKey === 'cancelled'
    ).length;
  }

  // عرض التذاكر حسب الفلتر المحدد.
  get filteredTickets(): Ticket[] {
    if (this.selectedFilter === 'all') {
      return this.tickets;
    }

    return this.tickets.filter(
      ticket => ticket.statusKey === this.selectedFilter
    );
  }

  // تغيير فلتر التذاكر.
  filterTickets(filter: TicketFilter): void {
    this.selectedFilter = filter;
  }

  // فتح نافذة تفاصيل التذكرة.
  openTicketModal(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.isModalOpen = true;
  }

  // إغلاق نافذة تفاصيل التذكرة.
  closeTicketModal(): void {
    this.isModalOpen = false;
    this.selectedTicket = null;
  }
}
