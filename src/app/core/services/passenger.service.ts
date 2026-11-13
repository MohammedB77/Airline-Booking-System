import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Passenger {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender?: string;
  nationality?: string;
  passportNumber?: string;
  phoneNumber?: string;
  userId?: number;
}

export interface PassengerCreateDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  nationality?: string;
  passportNumber?: string;
  phoneNumber?: string;
  userId: number;
}

export const INITIAL_PASSENGERS: Passenger[] = [
  {
    id: 1,
    firstName: 'عمر',
    lastName: 'أحمد باعباد',
    fullName: 'عمر أحمد باعباد',
    dateOfBirth: '1992-06-15',
    gender: 'ذكر',
    nationality: 'يمني',
    passportNumber: '08492019A',
    phoneNumber: '+967 771 234 567',
    userId: 1
  },
  {
    id: 2,
    firstName: 'فاطمة',
    lastName: 'سالم الكاف',
    fullName: 'فاطمة سالم الكاف',
    dateOfBirth: '1995-09-20',
    gender: 'أنثى',
    nationality: 'يمنية',
    passportNumber: '07119430B',
    phoneNumber: '+967 772 345 678',
    userId: 1
  },
  {
    id: 3,
    firstName: 'أحمد',
    lastName: 'علي المقطري',
    fullName: 'أحمد علي المقطري',
    dateOfBirth: '1988-12-05',
    gender: 'ذكر',
    nationality: 'يمني',
    passportNumber: '05128490C',
    phoneNumber: '+967 773 456 789',
    userId: 1
  }
];

@Injectable({ providedIn: 'root' })
export class PassengerService {
  private readonly baseUrl = `${environment.apiUrl}/Passenger`;
  private localPassengers: Passenger[] = [...INITIAL_PASSENGERS];

  constructor(private readonly http: HttpClient) { }

  /**
   * جلب جميع المسافرين المعتمدين.
   */
  getAll(): Observable<Passenger[]> {
    return this.http.get<unknown>(`${this.baseUrl}/GetAll`).pipe(
      map(response => {
        const list = this.unwrapArray(response).map(item => this.toPassenger(item));
        if (list.length > 0) {
          this.localPassengers = list;
          return list;
        }
        return this.localPassengers;
      }),
      catchError(() => of(this.localPassengers))
    );
  }

  /**
   * جلب مسافر بواسطة المعرف.
   */
  getById(id: number): Observable<Passenger | null> {
    return this.http.get<unknown>(`${this.baseUrl}/GetById/${id}`).pipe(
      map(response => this.toPassenger(response as Record<string, unknown>)),
      catchError(() => {
        const found = this.localPassengers.find(p => p.id === id) ?? null;
        return of(found);
      })
    );
  }

  /**
   * تسجيل مسافر جديد في النظام.
   */
  create(dto: PassengerCreateDto): Observable<Passenger> {
    return this.http.post<unknown>(`${this.baseUrl}/Create`, dto).pipe(
      map(response => {
        const created = this.toPassenger(response as Record<string, unknown>);
        this.localPassengers.unshift(created);
        return created;
      }),
      catchError(() => {
        const fallback: Passenger = {
          id: Date.now(),
          firstName: dto.firstName,
          lastName: dto.lastName,
          fullName: `${dto.firstName} ${dto.lastName}`.trim(),
          dateOfBirth: dto.dateOfBirth,
          gender: dto.gender,
          nationality: dto.nationality,
          passportNumber: dto.passportNumber,
          phoneNumber: dto.phoneNumber,
          userId: dto.userId
        };
        this.localPassengers.unshift(fallback);
        return of(fallback);
      })
    );
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

  private toPassenger(item: Record<string, unknown>): Passenger {
    const firstName = String(item['firstName'] ?? item['FirstName'] ?? '').trim();
    const lastName = String(item['lastName'] ?? item['LastName'] ?? '').trim();
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: Number(item['id'] ?? item['Id'] ?? 0),
      firstName,
      lastName,
      fullName: fullName || 'مسافر',
      dateOfBirth: String(item['dateOfBirth'] ?? item['DateOfBirth'] ?? ''),
      gender: String(item['gender'] ?? item['Gender'] ?? 'ذكر'),
      nationality: String(item['nationality'] ?? item['Nationality'] ?? 'يمني'),
      passportNumber: String(item['passportNumber'] ?? item['PassportNumber'] ?? ''),
      phoneNumber: String(item['phoneNumber'] ?? item['PhoneNumber'] ?? ''),
      userId: Number(item['userId'] ?? item['UserId'] ?? 1)
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
