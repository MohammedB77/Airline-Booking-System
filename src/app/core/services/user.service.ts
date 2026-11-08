import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, signal, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { map, Observable, tap } from 'rxjs';

export interface User {
  id?: number;
  username?: string;
  email?: string;
  role: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'Passenger';
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly storageKey = 'airline-user';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly currentUserSignal = signal<User | null>(this.readStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .post<unknown>('https://localhost:7210/api/User/Login', credentials)
      .pipe(
        map((response) => this.normalizeUser(response)),
        tap((user) => {
          this.currentUserSignal.set(user);
          this.storeUser(user);
        })
      );
  }

  register(userInfo: RegisterRequest): Observable<unknown> {
    return this.http.post<unknown>(
      'https://localhost:7210/api/User/Create',
      userInfo
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.storageKey);
    }
  }

  private normalizeUser(response: unknown): User {
    const data = this.unwrapResponse(response);
    const user = data as Record<string, unknown>;
    const role = String(user['role'] ?? user['Role'] ?? '').trim();

    if (!role) {
      throw new Error('The login response does not contain a user role.');
    }

    return {
      id: this.toNumber(user['id'] ?? user['Id']),
      username: String(
        user['username'] ?? user['Username'] ?? user['userName'] ?? user['UserName'] ?? ''
      ),
      email: String(user['email'] ?? user['Email'] ?? ''),
      role,
      createdAt: String(user['createdAt'] ?? user['CreatedAt'] ?? '')
    };
  }

  private unwrapResponse(response: unknown): Record<string, unknown> {
    if (!response || typeof response !== 'object') {
      throw new Error('The login response is invalid.');
    }

    const value = response as Record<string, unknown>;
    const nested = value['user'] ?? value['User'] ?? value['data'] ?? value['Data'];
    return nested && typeof nested === 'object'
      ? nested as Record<string, unknown>
      : value;
  }

  private toNumber(value: unknown): number | undefined {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  private storeUser(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    }
  }

  private readStoredUser(): User | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const storedUser = localStorage.getItem(this.storageKey);
    if (!storedUser) {
      return null;
    }

    try {
      return this.normalizeUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
