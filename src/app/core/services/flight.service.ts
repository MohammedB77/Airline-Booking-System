import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { Flight, flightsData } from '../../pages/features/availableflights/flights-data';
export type { Flight } from '../../pages/features/availableflights/flights-data';

export interface Airport {
    id: number | string;
    name: string;
    code: string;
    city?: string;
    country?: string;
}

export interface BackendFlight {
    id?: number;
    number: string;
    airline: string;
    code: string;
    // logo: string;
    // logoClass: string;

    status: string;
    statusClass: string;
    statusDot: string;

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
    departureDate: string;

    aircraft: string;
    registration: string;

    economySeats: number;
    businessSeats: number;
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

export const DEFAULT_AIRPORTS: Airport[] = [
    { id: 1, name: 'مطار صنعاء الدولي', code: 'SAH', city: 'صنعاء', country: 'اليمن' },
    { id: 2, name: 'مطار عدن الدولي', code: 'ADE', city: 'عدن', country: 'اليمن' },
    { id: 3, name: 'مطار القاهرة الدولي', code: 'CAI', city: 'القاهرة', country: 'مصر' },
    { id: 4, name: 'مطار الملك عبد العزيز الدولي', code: 'JED', city: 'جدة', country: 'السعودية' },
    { id: 5, name: 'مطار دبي الدولي', code: 'DXB', city: 'دبي', country: 'الإمارات' },
    { id: 6, name: 'مطار الملكة علياء الدولي', code: 'AMM', city: 'عمّان', country: 'الأردن' },
    { id: 7, name: 'مطار الريان الدولي', code: 'RIY', city: 'المكلا', country: 'اليمن' },
    { id: 8, name: 'مطار سيئون الدولي', code: 'GXF', city: 'سيئون', country: 'اليمن' }
];

@Injectable({ providedIn: 'root' })
export class FlightService {
    private readonly airportUrl = 'https://localhost:7210/api/Airport/GetAll';
    private readonly flightUrl = 'https://localhost:7210/api/Flight/GetAll';
    private readonly ticketUrl = 'https://localhost:7210/api/Ticket/GetAll';


    constructor(private readonly http: HttpClient) { }

    /**
 * جلب رحلة واحدة من قاعدة البيانات بواسطة المعرف.
 * لا يستخدم بيانات flightsData الاحتياطية.
 */
    getFlightRecordById(flightId: number): Observable<BackendFlight> {
        const url = `${this.flightUrl.replace('/GetAll', '/GetById')}/${flightId}`;

        return this.http.get<any>(url).pipe(
            map((raw: any) => ({
                id: raw.id ?? raw.Id,
                number: raw.flightNumber ?? raw.FlightNumber ?? raw.number ?? raw.Number,
                airline: raw.airlineName ?? raw.AirlineName ?? raw.airline ?? raw.Airline,
                code: raw.airlineCode ?? raw.AirlineCode ?? raw.code ?? raw.Code,
                aircraft: raw.airPlaneModel ?? raw.AirPlaneModel ?? raw.aircraft ?? raw.Aircraft,
                registration: raw.airPlaneRegistration ?? raw.AirPlaneRegistration ?? raw.registration ?? raw.Registration,
                arrivalTime: raw.landingTime ?? raw.LandingTime ?? raw.arrivalTime ?? raw.ArrivalTime,
                status: this.readStatus(raw),
                statusClass: raw.statusClass ?? raw.StatusClass,
                statusDot: raw.statusDot ?? raw.StatusDot,
                origin: raw.origin ?? raw.Origin,
                originCode: raw.originCode ?? raw.OriginCode,
                originName: raw.originName ?? raw.OriginName,
                originCity: raw.originCity ?? raw.OriginCity,
                destination: raw.destination ?? raw.Destination,
                destinationCode: raw.destinationCode ?? raw.DestinationCode,
                destinationName: raw.destinationName ?? raw.DestinationName,
                destinationCity: raw.destinationCity ?? raw.DestinationCity,
                departureTime: raw.departureTime ?? raw.DepartureTime,
                departureDate: raw.departureDate ?? raw.DepartureDate,
                economySeats: raw.economySeats ?? raw.EconomySeats ?? 0,
                businessSeats: raw.businessSeats ?? raw.BusinessSeats ?? 0,
                
            }))
        );
    }
    
    /**
     * جلب تفاصيل الرحلة والتذاكر المرتبطة بها بواسطة المعرف.
     */
    getFlightById(flightId: number): Observable<FlightDetails> {
        const url = `${this.flightUrl.replace('/GetAll', '/GetById')}/${flightId}`;
        return this.http.get<unknown>(url).pipe(
            map(response => this.toFlightDetails(response)),
            catchError(() => of(this.getFallbackFlightDetails(flightId)))
        );
    }

    /**
     * جلب تفاصيل الرحلة بواسطة رقم الرحلة (مثل MDR-101).
     */
    getFlightByNumber(flightNumber: string): Observable<FlightDetails | null> {
        const matched = flightsData.find(
            f => f.number.toLowerCase() === flightNumber.trim().toLowerCase()
        );
        if (matched) {
            return of(this.getFallbackFlightDetails(matched.id ?? 1));
        }
        return of(null);
    }

    /**
     * جلب جميع المطارات المعتمدة مع توفير بيانات احتياطية.
     */
    getAllAirports(): Observable<Airport[]> {
        return this.http.get<unknown>(this.airportUrl).pipe(
            map(response => {
                const airports = this.unwrapArray(response).map(item => this.toAirport(item));
                return airports.length > 0 ? airports : DEFAULT_AIRPORTS;
            }),
            catchError(() => of(DEFAULT_AIRPORTS))
        );
    }

    /**
     * جلب الرحلات مع تطبيق الفلاتر والاحتياطي.
     */
    getFlights(filters: FlightFilters = {}): Observable<Flight[]> {
        let params = new HttpParams();

        if (filters.departureAirportId !== undefined && filters.departureAirportId !== '') {
            params = params.set('departureAirportId', String(filters.departureAirportId));
        }
        if (filters.arrivalAirportId !== undefined && filters.arrivalAirportId !== '') {
            params = params.set('arrivalAirportId', String(filters.arrivalAirportId));
        }
        if (filters.flightStatus) {
            params = params.set('flightStatus', filters.flightStatus);
        }
        if (filters.departureDate) {
            params = params.set('departureDate', filters.departureDate);
        }

        return this.http.get<unknown>(this.flightUrl, { params }).pipe(
            map(response => {
                const flights = this.unwrapArray(response).map(item => this.toFlight(item));
                return flights.length > 0 ? flights : this.getFallbackFlights(filters);
            }),
            catchError(() => of(this.getFallbackFlights(filters)))
        );
    }


    /**
     * جلب الرحلات من قاعدة البيانات فقط.
     * لا يستخدم بيانات flightsData الاحتياطية.
     */
    getApiFlights(filters: FlightFilters = {}): Observable<Flight[]> {
        let params = new HttpParams();

        if (filters.departureAirportId !== undefined && filters.departureAirportId !== '') {
            params = params.set('departureAirportId', String(filters.departureAirportId));
        }

        if (filters.arrivalAirportId !== undefined && filters.arrivalAirportId !== '') {
            params = params.set('arrivalAirportId', String(filters.arrivalAirportId));
        }

        if (filters.flightStatus) {
            params = params.set('flightStatus', filters.flightStatus);
        }

        if (filters.departureDate) {
            params = params.set('departureDate', filters.departureDate);
        }

        return this.http.get<unknown>(this.flightUrl, { params }).pipe(
            map(response =>
                this.unwrapArray(response).map(item => this.toFlight(item))
            )
        );
    }

    /**
     * جلب التذاكر الحقيقية المرتبطة برحلة محددة.
     */
    getTicketsForFlight(flightId: number): Observable<Ticket[]> {
        return this.http.get<unknown>(this.ticketUrl).pipe(
            map(response =>
                this.unwrapArray(response)
                    .map(item => this.toTicket(item))
                    .filter(ticket => ticket.flightId === flightId)
            )
        );
    }
    

    /**
     * إنشاء تذاكر افتراضية لأي رحلة.
     */
    createDefaultTicketsForFlight(flightId: number, flightNumber: string): Ticket[] {
        return [
            {
                id: flightId * 10 + 1,
                flightId,
                ticketName: `الدرجة الاقتصادية (${flightNumber})`,
                flightClass: 'الدرجة الاقتصادية',
                ticketPrice: 350,
                availableTickets: 30,
                ticketDescription: 'وزن أمتعة 20 كجم + وجبة خفيفة',
                checkInTime: 'قبل ساعتين',
                boardingTime: 'قبل 45 دقيقة',
                gateNumber: 'G03'
            },
            {
                id: flightId * 10 + 2,
                flightId,
                ticketName: `درجة رجال الأعمال (${flightNumber})`,
                flightClass: 'درجة رجال الأعمال',
                ticketPrice: 680,
                availableTickets: 8,
                ticketDescription: 'وزن أمتعة 40 كجم + دخول صالة كبار الشخصيات',
                checkInTime: 'قبل ساعة ونصف',
                boardingTime: 'قبل 30 دقيقة',
                gateNumber: 'G04'
            }
        ];
    }

    /**
     * استخراج بيانات احتياطية للرحلات عند عدم توفر الاتصال.
     */
    private getFallbackFlights(filters: FlightFilters): Flight[] {
        return flightsData.filter(flight => {
            if (filters.departureAirportId) {
                const filterVal = String(filters.departureAirportId).toUpperCase();
                const matchesOrigin =
                    flight.originCode.toUpperCase() === filterVal ||
                    flight.origin.toUpperCase() === filterVal ||
                    String(flight.id) === filterVal;
                if (!matchesOrigin) return false;
            }

            if (filters.arrivalAirportId) {
                const filterVal = String(filters.arrivalAirportId).toUpperCase();
                const matchesDest =
                    flight.destinationCode.toUpperCase() === filterVal ||
                    flight.destination.toUpperCase() === filterVal ||
                    String(flight.id) === filterVal;
                if (!matchesDest) return false;
            }

            if (filters.flightStatus && filters.flightStatus !== ('all' as unknown)) {
                const filterStatus = String(filters.flightStatus).toLowerCase();
                const statusMap: Record<string, string> = {
                    scheduled: 'مجدولة',
                    delayed: 'متأخرة',
                    cancelled: 'ملغاة',
                    departed: 'غادرت',
                    arrived: 'وصلت'
                };
                const expectedArabic = statusMap[filterStatus] || filterStatus;
                const flightStatusLower = flight.status.toLowerCase();

                const match =
                    flightStatusLower === filterStatus ||
                    flightStatusLower === expectedArabic.toLowerCase();
                if (!match) return false;
            }

            return true;
        });
    }

    /**
     * استخراج تفاصيل رحلة وتذاكرها من البيانات الاحتياطية.
     */
    private getFallbackFlightDetails(flightId: number): FlightDetails {
        const flight = flightsData.find(f => f.id === flightId) ?? flightsData[0];
        const tickets = this.createDefaultTicketsForFlight(flight.id ?? flightId, flight.number);
        return { flight, tickets };
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
        console.log('Raw flight from API:', item);
        console.log('Available properties:', Object.keys(item));
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

        return {
            id: this.readNumber(item, ['id', 'Id']),
            number,
            airline: this.readString(item, ['airlineName', 'AirlineName', 'airline', 'Airline']) || 'طيران مَدار',
            code,
            logo: code.slice(0, 2),
            logoClass: 'bg-primary-container text-tertiary',
            status,
            statusClass: this.statusClass(status),
            statusDot: this.statusDot(status),
            origin: this.readAirportCode(item, departureAirport, ['departureAirportCode', 'DepartureAirportCode']),
            originCode: this.readAirportCode(item, departureAirport, ['departureAirportCode', 'DepartureAirportCode']),
            originName: this.readAirportName(item, departureAirport, ['departureAirportName', 'DepartureAirportName']),
            originCity: this.readString(departureAirport, ['city', 'City']),
            destination: this.readAirportCode(item, arrivalAirport, ['arrivalAirportCode', 'ArrivalAirportCode']),
            destinationCode: this.readAirportCode(item, arrivalAirport, ['arrivalAirportCode', 'ArrivalAirportCode']),
            destinationName: this.readAirportName(item, arrivalAirport, ['arrivalAirportName', 'ArrivalAirportName']),
            destinationCity: this.readString(arrivalAirport, ['city', 'City']),
            departureTime: this.readTime(item, ['departureTime', 'DepartureTime']),
            arrivalTime: this.readTime(item, ['arrivalTime', 'ArrivalTime', 'landingTime', 'LandingTime']),
            departureDate: this.readString(item, ['departureDate', 'DepartureDate']),
            aircraft: this.readString(item, ['airPlaneModel', 'AirPlaneModel', 'aircraft', 'Aircraft', 'aircraftType']),
            registration: this.readString(item, ['airPlaneRegistration', 'AirPlaneRegistration', 'registration', 'Registration']),
            economySeats: this.readNumber(item, ['economySeats', 'EconomySeats', 'availableEconomySeats', 'AvailableEconomySeats']) || 40,
            businessSeats: this.readNumber(item, ['businessSeats', 'BusinessSeats', 'availableBusinessSeats', 'AvailableBusinessSeats']) || 8
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
            : this.createDefaultTicketsForFlight(flight.id ?? 1, flight.number);

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