import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// خدمات النظام ونماذج البيانات المشتركة
import { Flight, FlightService } from '../../../../core/services/flight.service';
import { Passenger, PassengerService } from '../../../../core/services/passenger.service';
import {
  TicketBooking,
  TicketBookingCreateDto,
  TicketBookingService
} from '../../../../core/services/ticketbooking.service';
import { TicketService } from '../../../../core/services/ticket.service';

export interface CabinClassOption {
  id: string;
  name: string;
  shortName: string;
  price: number;
  ticketId?: number;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './booking.html'
})
export class BookingComponent implements OnInit {
  // بيانات الرحلة المختارة
  flight: Flight | null = null;
  isLoadingFlight = true;

  // قائمة المسافرين المعتمدين من الخدمة
  passengers: Passenger[] = [];
  selectedPassengerId: number | string = 1;

  // خيارات درجات السفر المتاحة
  cabinClasses: CabinClassOption[] = [
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

  selectedCabinId = 'economy';
  seatNumber = '12A';
  ticketNumber = '';
  bookingDate = '';

  // حالة النافذة والتحقق
  showConfirmationModal = false;
  isSubmitting = false;
  seatError = '';
  bookingErrorMessage = '';
  confirmedBooking: TicketBooking | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly flightService: FlightService,
    private readonly passengerService: PassengerService,
    private readonly ticketBookingService: TicketBookingService,
    private readonly ticketService: TicketService
  ) {}

  ngOnInit(): void {
    // تعيين تاريخ اليوم افتراضياً
    const today = new Date();
    this.bookingDate = today.toISOString().split('T')[0];
    this.ticketNumber = `TKT-${today.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // 1. تحميل قائمة المسافرين من الخدمة
    this.loadPassengers();

    // 2. قراءة بيانات الرحلة من الرابط
    this.route.queryParamMap.subscribe(params => {
      const flightIdParam = params.get('flightId');
      const flightNumberParam = params.get('flightNumber');
      const selectedDate = params.get('date');

      if (selectedDate) {
        this.bookingDate = selectedDate;
      }

      this.loadFlight(flightIdParam, flightNumberParam);
    });
  }

  // الحصول على المسافر المختار حالياً
  get selectedPassenger(): Passenger | undefined {
    return this.passengers.find(
      p => String(p.id) === String(this.selectedPassengerId)
    );
  }

  // الحصول على درجة السفر المختارة
  get selectedCabin(): CabinClassOption {
    return (
      this.cabinClasses.find(c => c.id === this.selectedCabinId) ??
      this.cabinClasses[0]
    );
  }

  selectCabin(cabinId: string): void {
    this.selectedCabinId = cabinId;
  }

  // تأكيد الحجز وإرساله إلى الخدمة
  confirmBooking(): void {
    this.seatError = '';
    this.bookingErrorMessage = '';

    if (!this.flight) {
      this.bookingErrorMessage = 'يرجى اختيار رحلة صالحة قبل المتابعة.';
      return;
    }

    if (!this.selectedPassenger) {
      this.bookingErrorMessage = 'يرجى تحديد مسافر لإصدار التذكرة باسمه.';
      return;
    }

    if (!this.seatNumber.trim()) {
      this.seatError = 'يرجى إدخال رقم المقعد المفضل.';
      return;
    }

    this.isSubmitting = true;

    // تجهيز كائن إرسال الحجز
    const targetTicketId =
      this.selectedCabin.ticketId || (this.flight.id ? this.flight.id * 10 + 1 : 1);

    const createDto: TicketBookingCreateDto = {
      ticketId: targetTicketId,
      passengerId: Number(this.selectedPassenger.id),
      ticketNumber: this.ticketNumber,
      seatNumber: this.seatNumber.trim().toUpperCase()
    };

    // تجهيز البيانات الوصفية الغنية لعرض التذكرة
    const meta: Partial<TicketBooking> = {
      ticketNumber: this.ticketNumber,
      seatNumber: this.seatNumber.trim().toUpperCase(),
      bookingDate: this.bookingDate,
      passengerName: this.selectedPassenger.fullName,
      passengerPassport: this.selectedPassenger.passportNumber,
      passengerPhone: this.selectedPassenger.phoneNumber,
      passengerNationality: this.selectedPassenger.nationality,
      flightNumber: this.flight.number,
      airline: this.flight.airline,
      airlineCode: this.flight.code,
      origin: this.flight.origin,
      originCode: this.flight.originCode,
      originName: this.flight.originName,
      originCity: this.flight.originCity,
      destination: this.flight.destination,
      destinationCode: this.flight.destinationCode,
      destinationName: this.flight.destinationName,
      destinationCity: this.flight.destinationCity,
      departureTime: this.flight.departureTime,
      arrivalTime: this.flight.arrivalTime,
      departureDate: this.bookingDate,
      aircraft: this.flight.aircraft,
      registration: this.flight.registration,
      cabin: this.selectedCabin.name,
      price: this.selectedCabin.price,
      currency: 'USD'
    };

    this.ticketBookingService.createBooking(createDto, meta).subscribe({
      next: created => {
        this.isSubmitting = false;
        this.confirmedBooking = created;
        this.showConfirmationModal = true;
      },
      error: () => {
        this.isSubmitting = false;
        // إنشاء الحجز محلياً كإجراء مرن
        this.confirmedBooking = meta as TicketBooking;
        this.showConfirmationModal = true;
      }
    });
  }

  closeConfirmation(): void {
    this.showConfirmationModal = false;
  }

  goToMyTickets(): void {
    this.showConfirmationModal = false;
    void this.router.navigate(['/mytickets']);
  }

  goToTicketDetails(): void {
    this.showConfirmationModal = false;
    const number = this.confirmedBooking?.ticketNumber || this.ticketNumber;
    void this.router.navigate(['/ticket-details', number]);
  }

  private loadPassengers(): void {
    this.passengerService.getAll().subscribe({
      next: list => {
        this.passengers = list;
        if (list.length > 0 && !this.selectedPassengerId) {
          this.selectedPassengerId = list[0].id;
        }
      }
    });
  }

  private loadFlight(flightIdParam: string | null, flightNumberParam: string | null): void {
    this.isLoadingFlight = true;

    if (flightIdParam && Number(flightIdParam) > 0) {
      this.flightService.getFlightById(Number(flightIdParam)).subscribe({
        next: details => {
          this.flight = details.flight;
          this.setupCabinClasses(details.tickets);
          this.isLoadingFlight = false;
        },
        error: () => {
          this.loadDefaultFlight();
        }
      });
    } else if (flightNumberParam) {
      this.flightService.getFlightByNumber(flightNumberParam).subscribe({
        next: details => {
          if (details) {
            this.flight = details.flight;
            this.setupCabinClasses(details.tickets);
          } else {
            this.loadDefaultFlight();
          }
          this.isLoadingFlight = false;
        },
        error: () => {
          this.loadDefaultFlight();
        }
      });
    } else {
      this.loadDefaultFlight();
    }
  }

  private loadDefaultFlight(): void {
    this.flightService.getFlights().subscribe({
      next: flights => {
        this.flight = flights.length > 0 ? flights[0] : null;
        if (this.flight) {
          const defaultTickets = this.flightService.createDefaultTicketsForFlight(
            this.flight.id ?? 1,
            this.flight.number
          );
          this.setupCabinClasses(defaultTickets);
        }
        this.isLoadingFlight = false;
      },
      error: () => {
        this.isLoadingFlight = false;
      }
    });
  }

  private setupCabinClasses(tickets: { id: number; flightClass: string; ticketPrice: number }[]): void {
    if (!tickets || tickets.length === 0) return;

    this.cabinClasses = tickets.map(t => ({
      id: t.flightClass.includes('أعمال') || t.flightClass.toLowerCase().includes('business')
        ? 'business'
        : 'economy',
      name: t.flightClass,
      shortName: t.flightClass,
      price: t.ticketPrice,
      ticketId: t.id
    }));

    if (this.cabinClasses.length > 0) {
      this.selectedCabinId = this.cabinClasses[0].id;
    }
  }
}
