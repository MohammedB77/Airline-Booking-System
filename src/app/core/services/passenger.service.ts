
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Passenger Response
export interface Passenger {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string | null;
  nationality: string | null;
  passportNumber: string | null;
  phoneNumber: string | null;
  userId: number;
}

// Create Passenger Request
export interface PassengerCreateRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  phoneNumber?: string | null;
  userId: number;
}

// Update Passenger Request
export interface PassengerUpdateRequest extends PassengerCreateRequest {}

@Injectable({
  providedIn: 'root'
})
export class PassengerService {

  private readonly apiUrl =
    'https://localhost:7210/api/Passenger';

  constructor(private readonly http: HttpClient) {}

  // Get All Passengers
  getAll(): Observable<Passenger[]> {
    return this.http.get<Passenger[]>(
      `${this.apiUrl}/GetAll`
    );
  }

  // Get Passenger By IDس
  getById(id: number): Observable<Passenger> {
    return this.http.get<Passenger>(
      `${this.apiUrl}/GetById/${id}`
    );
  }

  // Create Passenger
  create(passenger: PassengerCreateRequest): Observable<Passenger> {
    return this.http.post<Passenger>(
      `${this.apiUrl}/Create`,
      passenger
    );
  }

  // Update Passenger
  update(
    id: number,
    passenger: PassengerUpdateRequest
  ): Observable<Passenger> {
    return this.http.put<Passenger>(
      `${this.apiUrl}/Update/${id}`,
      passenger
    );
  }

  // Delete Passenger
  delete(id: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/Delete/${id}`,
      { responseType: 'text' }
    );
  }
}
