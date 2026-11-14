import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Flight {
  id: number;
  number: string;
  airline: string;
  code: string;
  logo: string;
  logoClass: string;

  status: string;
  statusClass: string;
  statusDot: string;

  origin: string;
  originCode: string;
  originName: string;
  originCity: string;
  originCountry?: string;

  destination: string;
  destinationCode: string;
  destinationName: string;
  destinationCity: string;
  destinationCountry?: string;

  departureTime: string;
  arrivalTime: string;
  departureDate: string;

  aircraft: string;
  registration: string;

  economySeats: number;
  businessSeats: number;
  tickets?: Ticket[];
}

export interface Airport {
  id: number | string;
  name: string;
  code: string;
  city?: string;
  country?: string;
}

export type FlightStatus =
  | 'Scheduled'
  | 'Delayed'
  | 'Cancelled'
  | 'Departed'
  | 'Arrived';

export interface FlightFilters {
  departureAirportId?: number | string;
  arrivalAirportId?: number | string;
  flightStatus?: FlightStatus;
  departureDate?: string;
}

export interface Ticket {
  id: number;
  flightId: number;
  ticketName: string;
  availableTickets: number;
  ticketDescription?: string;
  flightClass: string;
  ticketPrice: number;
  checkInTime?: string;
  boardingTime?: string;
  gateNumber?: string;
}

export interface FlightDetails {
  flight: Flight;
  tickets: Ticket[];
}

@Injectable({ providedIn: 'root' })
export class FlightService {
  private readonly airportUrl = `${environment.apiUrl}/Airport/GetAll`;
  private readonly flightUrl = `${environment.apiUrl}/Flight/GetAll`;

  // ذاكرة مؤقتة لتخزين بيانات الرحلات الحقيقية وتسريع العرض الفوري
  private flightsCache: Flight[] = [];
  private airportsCache: Airport[] = [];

  constructor(private readonly http: HttpClient) {}

  /**
   * جلب جميع المطارات من API مع تخزين مؤقت.
   */
  getAllAirports(): Observable<Airport[]> {
    if (this.airportsCache.length > 0) {
      return of(this.airportsCache);
    }

    return this.http.get<unknown>(this.airportUrl).pipe(
      timeout(6000),
      map(response => {
        const airports = this.unwrapArray(response).map(item => this.toAirport(item));
        this.airportsCache = airports;
        return airports;
      }),
      catchError(error => {
        // عند الفشل نعيد مصفوفة فارغة ونبلغ المكون بالخطأ دون استخدام بيانات وهمية
        return throwError(() => error);
      })
    );
  }

  /**
   * جلب الرحلات الحقيقية من API وفق الفلاتر مع تخزينها مؤقتاً لتسريع العرض.
   */
  getFlights(filters: FlightFilters = {}): Observable<Flight[]> {
    let params = new HttpParams();

    // تجهيز معرّف مطار المغادرة (التحقق مما إذا كان رقماً أو رمزاً يحتاج تحويلاً إلى معرّف)
    if (filters.departureAirportId !== undefined && filters.departureAirportId !== '') {
      const depId = this.resolveAirportId(filters.departureAirportId);
      if (depId !== undefined) {
        params = params.set('departureAirportId', String(depId));
      }
    }

    // تجهيز معرّف مطار الوصول
    if (filters.arrivalAirportId !== undefined && filters.arrivalAirportId !== '') {
      const arrId = this.resolveAirportId(filters.arrivalAirportId);
      if (arrId !== undefined) {
        params = params.set('arrivalAirportId', String(arrId));
      }
    }

    // تجهيز حالة الرحلة
    if (filters.flightStatus && filters.flightStatus !== ('all' as unknown)) {
      params = params.set('flightStatus', filters.flightStatus);
    }

    // تجهيز تاريخ المغادرة
    if (filters.departureDate) {
      params = params.set('departureDate', filters.departureDate);
    }

    return this.http.get<unknown>(this.flightUrl, { params }).pipe(
      timeout(8000),
      map(response => {
        const flights = this.unwrapArray(response).map(item => this.toFlight(item));
        // تحديث الذاكرة المؤقتة بالرحلات الحقيقية المجلوبة
        this.cacheFlights(flights);
        return flights;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * جلب تفاصيل رحلة بواسطة المعرف مع دعم العرض الفوري من الكاش لتجنب التعليق.
   */
  getFlightById(flightId: number): Observable<FlightDetails> {
    const url = `${this.flightUrl.replace('/GetAll', '/GetById')}/${flightId}`;

    return this.http.get<unknown>(url).pipe(
      timeout(6000),
      map(response => {
        const details = this.toFlightDetails(response);
        this.cacheFlight(details.flight);
        return details;
      }),
      catchError(error => {
        // إذا كان الاتصال بطيئاً أو تعطل ولدينا الرحلة مسبقاً في الذاكرة المؤقتة من قائمة الرحلات، نعرضها فوراً
        const cached = this.getCachedFlight(flightId);
        if (cached) {
          return of({
            flight: cached,
            tickets: cached.tickets ?? []
          });
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * البحث عن رحلة بواسطة رقمها (مثل MDR-101).
   */
  getFlightByNumber(flightNumber: string): Observable<FlightDetails | null> {
    const cached = this.getCachedFlightByNumber(flightNumber);
    if (cached) {
      return of({
        flight: cached,
        tickets: cached.tickets ?? []
      });
    }

    // في حال عدم وجودها في الكاش، نطلب الرحلات ونبحث عنها
    return this.getFlights().pipe(
      map(flights => {
        const match = flights.find(
          f => f.number.trim().toLowerCase() === flightNumber.trim().toLowerCase()
        );
        if (match) {
          return {
            flight: match,
            tickets: match.tickets ?? []
          };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * جلب رحلة مباشرة من الذاكرة المؤقتة دون انتظار طلب شبكة (استجابة فورية 0ms).
   */
  getCachedFlight(flightId: number): Flight | undefined {
    return this.flightsCache.find(f => f.id === flightId);
  }

  /**
   * جلب رحلة بواسطة رقمها من الذاكرة المؤقتة.
   */
  getCachedFlightByNumber(flightNumber: string): Flight | undefined {
    const clean = flightNumber.trim().toLowerCase();
    return this.flightsCache.find(f => f.number.trim().toLowerCase() === clean);
  }

  /**
   * حفظ رحلة في الذاكرة المؤقتة.
   */
  cacheFlight(flight: Flight): void {
    const index = this.flightsCache.findIndex(f => f.id === flight.id);
    if (index >= 0) {
      this.flightsCache[index] = flight;
    } else {
      this.flightsCache.push(flight);
    }
  }

  /**
   * حفظ مجموعة رحلات في الذاكرة المؤقتة.
   */
  cacheFlights(flights: Flight[]): void {
    for (const flight of flights) {
      this.cacheFlight(flight);
    }
  }

  /**
   * تحويل كود المطار أو قيمته إلى معرّف رقمي يفهمه السيرفر.
   */
  private resolveAirportId(value: number | string): number | undefined {
    const num = Number(value);
    if (Number.isInteger(num) && num > 0) {
      return num;
    }

    const codeStr = String(value).trim().toUpperCase();
    const found = this.airportsCache.find(
      a => a.code.toUpperCase() === codeStr || String(a.id) === codeStr
    );

    if (found) {
      const foundId = Number(found.id);
      if (Number.isInteger(foundId) && foundId > 0) {
        return foundId;
      }
    }

    return undefined;
  }

  private unwrapArray(response: unknown): Record<string, unknown>[] {
    if (Array.isArray(response)) {
      return response.filter(this.isRecord);
    }

    if (this.isRecord(response)) {
      const data =
        response['data'] ??
        response['Data'] ??
        response['items'] ??
        response['Items'];
      return Array.isArray(data) ? data.filter(this.isRecord) : [];
    }

    return [];
  }

  private toAirport(item: Record<string, unknown>): Airport {
    return {
      id: this.readAirportId(item),
      name: String(item['name'] ?? item['Name'] ?? item['airportName'] ?? item['AirportName'] ?? ''),
      code: String(item['code'] ?? item['Code'] ?? item['iataCode'] ?? item['IataCode'] ?? ''),
      city: String(item['city'] ?? item['City'] ?? ''),
      country: String(item['country'] ?? item['Country'] ?? '')
    };
  }

  private toFlight(item: Record<string, unknown>): Flight {
    const status = this.readStatus(item);
    const departureAirport = this.readObject(item, [
      'departureAirport',
      'DepartureAirport',
      'originAirport',
      'OriginAirport'
    ]);
    const arrivalAirport = this.readObject(item, [
      'arrivalAirport',
      'ArrivalAirport',
      'destinationAirport',
      'DestinationAirport'
    ]);

    const code = this.readString(item, ['airlineCode', 'AirlineCode', 'code', 'Code']) || 'MDR';
    const number = this.readString(item, ['flightNumber', 'FlightNumber', 'number', 'Number']) || 'MDR-101';
    const flightId = this.readNumber(item, ['id', 'Id']);

    // معالجة التذاكر المرفقة بالرحلة إن وجدت
    const ticketData = item['tickets'] ?? item['Tickets'];
    const tickets: Ticket[] = Array.isArray(ticketData)
      ? ticketData.filter(this.isRecord).map(t => this.toTicket(t))
      : [];

    // استنتاج المقاعد المتاحة من التذاكر إن وجدت
    let economySeats = 0;
    let businessSeats = 0;

    for (const t of tickets) {
      if (t.flightClass.includes('أعمال') || t.flightClass.toLowerCase().includes('business')) {
        businessSeats += t.availableTickets;
      } else {
        economySeats += t.availableTickets;
      }
    }

    if (economySeats === 0) {
      economySeats = this.readNumber(item, ['economySeats', 'EconomySeats', 'availableEconomySeats', 'AvailableEconomySeats']) || 40;
    }
    if (businessSeats === 0) {
      businessSeats = this.readNumber(item, ['businessSeats', 'BusinessSeats', 'availableBusinessSeats', 'AvailableBusinessSeats']) || 8;
    }

    return {
      id: flightId,
      number,
      airline: this.readString(item, ['airlineName', 'AirlineName', 'airline', 'Airline']) || 'طيران مَدار',
      code,
      logo: code ? code.slice(0, 2) : 'مـ',
      logoClass: 'bg-primary-container text-tertiary',
      status,
      statusClass: this.statusClass(status),
      statusDot: this.statusDot(status),
      origin: this.readAirportCode(item, departureAirport, ['departureAirportCode', 'DepartureAirportCode']),
      originCode: this.readAirportCode(item, departureAirport, ['departureAirportCode', 'DepartureAirportCode']),
      originName: this.readAirportName(item, departureAirport, ['departureAirportName', 'DepartureAirportName']),
      originCity: this.readString(departureAirport, ['city', 'City']),
      originCountry: this.readString(departureAirport, ['country', 'Country']),
      destination: this.readAirportCode(item, arrivalAirport, ['arrivalAirportCode', 'ArrivalAirportCode']),
      destinationCode: this.readAirportCode(item, arrivalAirport, ['arrivalAirportCode', 'ArrivalAirportCode']),
      destinationName: this.readAirportName(item, arrivalAirport, ['arrivalAirportName', 'ArrivalAirportName']),
      destinationCity: this.readString(arrivalAirport, ['city', 'City']),
      destinationCountry: this.readString(arrivalAirport, ['country', 'Country']),
      departureTime: this.readTime(item, ['departureTime', 'DepartureTime']),
      arrivalTime: this.readTime(item, ['landingTime', 'LandingTime', 'arrivalTime', 'ArrivalTime']),
      departureDate: this.readDate(item, ['departureDate', 'DepartureDate']),
      aircraft: this.readString(item, ['airPlaneModel', 'AirPlaneModel', 'aircraft', 'Aircraft', 'aircraftType']) || 'طائرة مَدار',
      registration: this.readString(item, ['airPlaneRegistration', 'AirPlaneRegistration', 'registration', 'Registration']) || '7O-MDR',
      economySeats,
      businessSeats,
      tickets
    };
  }

  private toFlightDetails(response: unknown): FlightDetails {
    if (!this.isRecord(response)) {
      throw new Error('The flight details response is invalid.');
    }

    const data = this.isRecord(response['data']) ? response['data'] : response;
    const flight = this.toFlight(data);
    const ticketData =
      data['tickets'] ?? data['Tickets'] ?? response['tickets'] ?? response['Tickets'];
    const tickets = Array.isArray(ticketData)
      ? ticketData.filter(this.isRecord).map(item => this.toTicket(item))
      : [];

    flight.tickets = tickets;
    return { flight, tickets };
  }

  private toTicket(item: Record<string, unknown>): Ticket {
    return {
      id: this.readNumber(item, ['id', 'Id']),
      flightId: this.readNumber(item, ['flightId', 'FlightId']),
      ticketName: this.readString(item, ['ticketName', 'TicketName']) || 'تذكرة طيران',
      availableTickets: this.readNumber(item, ['availableTickets', 'AvailableTickets']),
      ticketDescription: this.readString(item, ['ticketDescription', 'TicketDescription']),
      flightClass: this.readString(item, ['flightClass', 'FlightClass']) || 'الدرجة الاقتصادية',
      ticketPrice: this.readNumber(item, ['ticketPrice', 'TicketPrice']) || 350,
      checkInTime: this.readString(item, ['checkInTime', 'CheckInTime']),
      boardingTime: this.readString(item, ['boardingTime', 'BoardingTime']),
      gateNumber: this.readString(item, ['gateNumber', 'GateNumber'])
    };
  }

  private readStatus(item: Record<string, unknown>): string {
    const raw = this.readString(item, ['flightStatus', 'FlightStatus', 'status', 'Status']);
    const statusMap: Record<string, string> = {
      '0': 'مجدولة',
      '1': 'متأخرة',
      '2': 'ملغاة',
      '3': 'غادرت',
      '4': 'وصلت',
      scheduled: 'مجدولة',
      delayed: 'متأخرة',
      cancelled: 'ملغاة',
      departed: 'غادرت',
      arrived: 'وصلت'
    };
    return statusMap[raw.toLowerCase()] || raw || 'مجدولة';
  }

  private readString(item: Record<string, unknown>, keys: string[]): string {
    const value = keys.map(key => item[key]).find(v => v !== undefined && v !== null);
    return value === undefined ? '' : String(value);
  }

  private readNumber(item: Record<string, unknown>, keys: string[]): number {
    const value = Number(this.readString(item, keys));
    return Number.isFinite(value) ? value : 0;
  }

  private readTime(item: Record<string, unknown>, keys: string[]): string {
    const value = this.readString(item, keys);
    if (!value) return '00:00';
    return value.includes('T') ? value.split('T')[1].slice(0, 5) : value.slice(0, 5);
  }

  private readDate(item: Record<string, unknown>, keys: string[]): string {
    const value = this.readString(item, keys);
    if (!value) return '';
    return value.includes('T') ? value.split('T')[0] : value;
  }

  private readObject(item: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    const value = keys.map(key => item[key]).find(this.isRecord);
    return value ?? {};
  }

  private readAirportCode(
    item: Record<string, unknown>,
    airport: Record<string, unknown>,
    directKeys: string[]
  ): string {
    return (
      this.readString(airport, ['code', 'Code', 'iataCode', 'IataCode']) ||
      this.readString(item, directKeys)
    );
  }

  private readAirportId(item: Record<string, unknown>): number | string {
    const value = item['id'] ?? item['Id'] ?? '';
    return typeof value === 'number' || typeof value === 'string' ? value : '';
  }

  private readAirportName(
    item: Record<string, unknown>,
    airport: Record<string, unknown>,
    directKeys: string[]
  ): string {
    return (
      this.readString(airport, ['name', 'Name', 'airportName', 'AirportName']) ||
      this.readString(item, directKeys)
    );
  }

  statusClass(status: string): string {
    if (status === 'ملغاة' || status === 'Cancelled') {
      return 'bg-red-50 text-error';
    }
    if (status === 'متأخرة' || status === 'Delayed') {
      return 'bg-amber-50 text-amber-900';
    }
    if (status === 'مؤكدة' || status === 'Confirmed' || status === 'غادرت' || status === 'وصلت') {
      return 'bg-emerald-50 text-emerald-800';
    }
    return 'bg-slate-100 text-slate-800';
  }

  statusDot(status: string): string {
    if (status === 'ملغاة' || status === 'Cancelled') {
      return 'bg-error';
    }
    if (status === 'متأخرة' || status === 'Delayed') {
      return 'bg-amber-500';
    }
    if (status === 'مؤكدة' || status === 'Confirmed' || status === 'غادرت' || status === 'وصلت') {
      return 'bg-emerald-600';
    }
    return 'bg-primary-container';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
