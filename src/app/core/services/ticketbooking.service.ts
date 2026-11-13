import { HttpClient } from '@angular/common/http';
import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TicketBooking {
  id: number;
  ticketId: number;
  passengerId: number;
  ticketNumber: string;
  seatNumber: string;
  bookingDate: string;
  status: string;
  statusKey: 'confirmed' | 'cancelled';

  // تفاصيل المسافر للعرض
  passengerName?: string;
  passengerPassport?: string;
  passengerPhone?: string;
  passengerNationality?: string;
  passengerBirthDate?: string;
  passengerGender?: string;

  // تفاصيل الرحلة للعرض
  flightNumber: string;
  airline: string;
  airlineCode?: string;
  origin: string;
  originCode: string;
  originName: string;
  originCity: string;
  destination: string;
  destinationCode: string;
  destinationName: string;
  destinationCity: string;

  departureTime: string;
  arrivalTime: string;
  duration?: string;
  departureDate?: string;

  aircraft?: string;
  aircraftModel?: string;
  registration?: string;
  gate?: string;
  terminal?: string;

  cabin: string;
  price: number;
  currency?: string;
}

export interface TicketBookingCreateDto {
  ticketId: number;
  passengerId: number;
  ticketNumber: string;
  seatNumber: string;
}

export const SEED_BOOKINGS: TicketBooking[] = [
  {
    id: 1,
    ticketId: 101,
    passengerId: 1,
    ticketNumber: 'TKT-10492',
    seatNumber: '14B',
    bookingDate: '2026/05/10',
    status: 'مؤكدة',
    statusKey: 'confirmed',

    passengerName: 'أحمد الزبيدي',
    passengerPassport: 'YEM789456',
    passengerPhone: '+967 771 234 567',
    passengerNationality: 'يمني',
    passengerBirthDate: '1990/03/15',
    passengerGender: 'ذكر',

    flightNumber: 'MDR-101',
    airline: 'طيران مَدار',
    airlineCode: 'MDR',
    origin: 'SAH',
    originCode: 'SAH',
    originName: 'مطار صنعاء الدولي',
    originCity: 'صنعاء',
    destination: 'CAI',
    destinationCode: 'CAI',
    destinationName: 'مطار القاهرة الدولي',
    destinationCity: 'القاهرة',

    departureTime: '08:00 ص',
    arrivalTime: '11:30 ص',
    duration: '3 ساعات و30 دقيقة',
    departureDate: '2026/11/07',

    aircraft: 'Airbus A320neo',
    aircraftModel: 'Airbus A320neo',
    registration: '7O-MDR',
    gate: 'بوابة G04',
    terminal: 'الصالة الدولية 1',

    cabin: 'الدرجة الاقتصادية',
    price: 280,
    currency: 'USD'
  },
  {
    id: 2,
    ticketId: 401,
    passengerId: 2,
    ticketNumber: 'TKT-10884',
    seatNumber: '02A',
    bookingDate: '2026/05/11',
    status: 'مؤكدة',
    statusKey: 'confirmed',

    passengerName: 'فاطمة سالم الكاف',
    passengerPassport: '07119430B',
    passengerPhone: '+967 772 345 678',
    passengerNationality: 'يمنية',
    passengerBirthDate: '1995/09/20',
    passengerGender: 'أنثى',

    flightNumber: 'MDR-204',
    airline: 'طيران مَدار',
    airlineCode: 'MDR',
    origin: 'ADE',
    originCode: 'ADE',
    originName: 'مطار عدن الدولي',
    originCity: 'عدن',
    destination: 'DXB',
    destinationCode: 'DXB',
    destinationName: 'مطار دبي الدولي',
    destinationCity: 'دبي',

    departureTime: '02:15 م',
    arrivalTime: '06:30 م',
    duration: '4 ساعات و15 دقيقة',
    departureDate: '2026/11/07',

    aircraft: 'Airbus A321neo',
    aircraftModel: 'Airbus A321neo',
    registration: '7O-MDB',
    gate: 'بوابة G02',
    terminal: 'الصالة 2',

    cabin: 'رجال الأعمال',
    price: 640,
    currency: 'USD'
  },
  {
    id: 3,
    ticketId: 301,
    passengerId: 3,
    ticketNumber: 'TKT-09311',
    seatNumber: '21C',
    bookingDate: '2026/05/01',
    status: 'ملغاة',
    statusKey: 'cancelled',

    passengerName: 'عمر أحمد باعباد',
    passengerPassport: '08492019A',
    passengerPhone: '+967 771 234 567',
    passengerNationality: 'يمني',
    passengerBirthDate: '1992/06/15',
    passengerGender: 'ذكر',

    flightNumber: 'MDR-305',
    airline: 'طيران مَدار',
    airlineCode: 'MDR',
    origin: 'SAH',
    originCode: 'SAH',
    originName: 'مطار صنعاء الدولي',
    originCity: 'صنعاء',
    destination: 'AMM',
    destinationCode: 'AMM',
    destinationName: 'مطار الملكة علياء (عَمّان)',
    destinationCity: 'عمّان',

    departureTime: '10:00 ص',
    arrivalTime: '01:45 م',
    duration: 'تم إلغاء الرحلة مسبقاً',
    departureDate: '2026/11/07',

    aircraft: 'Boeing 737-800',
    aircraftModel: 'Boeing 737-800',
    registration: '7O-BQA',
    gate: '—',
    terminal: 'الصالة 1',

    cabin: 'الدرجة الاقتصادية',
    price: 310,
    currency: 'USD'
  }
];

@Injectable({ providedIn: 'root' })
export class TicketBookingService {
  private readonly baseUrl = `${environment.apiUrl}/TicketBooking`;
  private readonly storageKey = 'airline-ticket-bookings';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

  private readonly bookingsSignal = signal<TicketBooking[]>(this.readInitialBookings());
  readonly bookings = this.bookingsSignal.asReadonly();

  /**
   * جلب جميع التذاكر المحجوزة.
   */
  getBookings(): Observable<TicketBooking[]> {
    return this.http.get<unknown>(`${this.baseUrl}/GetAll`).pipe(
      map(response => {
        const apiBookings = this.unwrapArray(response);
        if (apiBookings.length > 0) {
          const merged = this.mergeApiBookings(apiBookings);
          this.saveBookings(merged);
          return merged;
        }
        return this.bookingsSignal();
      }),
      catchError(() => of(this.bookingsSignal()))
    );
  }

  /**
   * جلب حجز بواسطة رقم التذكرة (مثل TKT-10492).
   */
  getBookingByTicketNumber(ticketNumber: string): Observable<TicketBooking | null> {
    const cleanNumber = ticketNumber.trim().toUpperCase();
    const current = this.bookingsSignal().find(
      b => b.ticketNumber.toUpperCase() === cleanNumber
    );

    if (current) {
      return of(current);
    }

    return this.getBookings().pipe(
      map(bookings => bookings.find(b => b.ticketNumber.toUpperCase() === cleanNumber) ?? null)
    );
  }

  /**
   * جلب حجز بواسطة المعرف.
   */
  getBookingById(id: number): Observable<TicketBooking | null> {
    return this.http.get<unknown>(`${this.baseUrl}/GetById/${id}`).pipe(
      map(response => {
        const item = response as Record<string, unknown>;
        const matched = this.bookingsSignal().find(b => b.id === id);
        if (matched) return matched;
        return this.createBookingFromRaw(item);
      }),
      catchError(() => {
        const found = this.bookingsSignal().find(b => b.id === id) ?? null;
        return of(found);
      })
    );
  }

  /**
   * إنشاء حجز جديد وحفظه في النظام والتخزين المحلي.
   */
  createBooking(
    dto: TicketBookingCreateDto,
    metaDetails: Partial<TicketBooking> = {}
  ): Observable<TicketBooking> {
    const newBooking: TicketBooking = {
      id: Date.now(),
      ticketId: dto.ticketId,
      passengerId: dto.passengerId,
      ticketNumber: dto.ticketNumber || `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
      seatNumber: dto.seatNumber || '12A',
      bookingDate: metaDetails.bookingDate || new Date().toISOString().split('T')[0],
      status: 'مؤكدة',
      statusKey: 'confirmed',

      passengerName: metaDetails.passengerName || 'مسافر مَدار',
      passengerPassport: metaDetails.passengerPassport || 'YEM123456',
      passengerPhone: metaDetails.passengerPhone || '+967 770 000 000',
      passengerNationality: metaDetails.passengerNationality || 'يمني',
      passengerBirthDate: metaDetails.passengerBirthDate || '1995/01/01',
      passengerGender: metaDetails.passengerGender || 'ذكر',

      flightNumber: metaDetails.flightNumber || 'MDR-101',
      airline: metaDetails.airline || 'طيران مَدار',
      airlineCode: metaDetails.airlineCode || 'MDR',
      origin: metaDetails.origin || 'SAH',
      originCode: metaDetails.originCode || 'SAH',
      originName: metaDetails.originName || 'مطار صنعاء الدولي',
      originCity: metaDetails.originCity || 'صنعاء',
      destination: metaDetails.destination || 'CAI',
      destinationCode: metaDetails.destinationCode || 'CAI',
      destinationName: metaDetails.destinationName || 'مطار القاهرة الدولي',
      destinationCity: metaDetails.destinationCity || 'القاهرة',

      departureTime: metaDetails.departureTime || '08:00 ص',
      arrivalTime: metaDetails.arrivalTime || '11:30 ص',
      duration: metaDetails.duration || '3 ساعات و30 دقيقة',
      departureDate: metaDetails.departureDate || '2026/11/07',

      aircraft: metaDetails.aircraft || 'Airbus A320neo',
      aircraftModel: metaDetails.aircraftModel || metaDetails.aircraft || 'Airbus A320neo',
      registration: metaDetails.registration || '7O-MDR',
      gate: metaDetails.gate || 'بوابة G04',
      terminal: metaDetails.terminal || 'الصالة الدولية 1',

      cabin: metaDetails.cabin || 'الدرجة الاقتصادية',
      price: metaDetails.price || 350,
      currency: metaDetails.currency || 'USD'
    };

    return this.http.post<unknown>(`${this.baseUrl}/Create`, dto).pipe(
      map(response => {
        const res = response as Record<string, unknown>;
        if (res && res['id']) {
          newBooking.id = Number(res['id']);
        }
        this.addLocalBooking(newBooking);
        return newBooking;
      }),
      catchError(() => {
        this.addLocalBooking(newBooking);
        return of(newBooking);
      })
    );
  }

  /**
   * إلغاء حجز تذكرة.
   */
  cancelBooking(id: number): Observable<boolean> {
    return this.http.delete<unknown>(`${this.baseUrl}/Delete/${id}`).pipe(
      map(() => {
        this.markAsCancelledLocally(id);
        return true;
      }),
      catchError(() => {
        this.markAsCancelledLocally(id);
        return of(true);
      })
    );
  }

  private markAsCancelledLocally(id: number): void {
    const updated = this.bookingsSignal().map(b => {
      if (b.id === id) {
        return {
          ...b,
          status: 'ملغاة',
          statusKey: 'cancelled' as const
        };
      }
      return b;
    });
    this.saveBookings(updated);
  }

  private addLocalBooking(booking: TicketBooking): void {
    const updated = [booking, ...this.bookingsSignal()];
    this.saveBookings(updated);
  }

  private saveBookings(bookings: TicketBooking[]): void {
    this.bookingsSignal.set(bookings);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(bookings));
      } catch {
        // Ignored in storage quota limits
      }
    }
  }

  private readInitialBookings(): TicketBooking[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [...SEED_BOOKINGS];
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as TicketBooking[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback below
    }

    return [...SEED_BOOKINGS];
  }

  private unwrapArray(response: unknown): Record<string, unknown>[] {
    if (Array.isArray(response)) {
      return response.filter(this.isRecord);
    }
    if (this.isRecord(response)) {
      const data = response['data'] ?? response['Data'];
      return Array.isArray(data) ? data.filter(this.isRecord) : [];
    }
    return [];
  }

  private mergeApiBookings(apiItems: Record<string, unknown>[]): TicketBooking[] {
    const current = [...this.bookingsSignal()];
    for (const item of apiItems) {
      const id = Number(item['id'] ?? item['Id'] ?? 0);
      const existing = current.find(b => b.id === id);
      if (existing) {
        const status = String(item['status'] ?? item['Status'] ?? existing.status);
        existing.status = status;
        existing.statusKey = (status === 'ملغي' || status === 'Cancelled' || status === 'ملغاة')
          ? 'cancelled'
          : 'confirmed';
      }
    }
    return current;
  }

  private createBookingFromRaw(item: Record<string, unknown>): TicketBooking {
    const status = String(item['status'] ?? item['Status'] ?? 'مؤكدة');
    return {
      id: Number(item['id'] ?? item['Id'] ?? Date.now()),
      ticketId: Number(item['ticketId'] ?? item['TicketId'] ?? 1),
      passengerId: Number(item['passengerId'] ?? item['PassengerId'] ?? 1),
      ticketNumber: String(item['ticketNumber'] ?? item['TicketNumber'] ?? 'TKT-10492'),
      seatNumber: String(item['seatNumber'] ?? item['SeatNumber'] ?? '12A'),
      bookingDate: String(item['bookingDate'] ?? item['BookingDate'] ?? '2026/11/07'),
      status,
      statusKey: status.includes('ملغ') || status.toLowerCase().includes('cancel')
        ? 'cancelled'
        : 'confirmed',
      flightNumber: 'MDR-101',
      airline: 'طيران مَدار',
      origin: 'SAH',
      originCode: 'SAH',
      originName: 'مطار صنعاء الدولي',
      originCity: 'صنعاء',
      destination: 'CAI',
      destinationCode: 'CAI',
      destinationName: 'مطار القاهرة الدولي',
      destinationCity: 'القاهرة',
      departureTime: '08:00 ص',
      arrivalTime: '11:30 ص',
      cabin: 'الدرجة الاقتصادية',
      price: 280
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
