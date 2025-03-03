import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError, of, tap } from 'rxjs';

interface User {
  username: string;
  email?: string;
  isGuest?: boolean;
}

interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

interface UsernameCheckResponse {
  exists: boolean;
  suggestions?: string[];
}

interface EmailCheckResponse {
  exists: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/v1';
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';

  constructor(private http: HttpClient) {}

  register(user: { email: string; username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users/register`, user).pipe(
      tap((response) => {
        if (response.token) {
          this.setToken(response.token);
          this.setUserData(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users/login`, credentials).pipe(
      tap((response) => {
        if (response.token) {
          this.setToken(response.token);
          this.setUserData(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  checkEmailExists(email: string): Observable<EmailCheckResponse> {
    return this.http.get<EmailCheckResponse>(`${this.apiUrl}/users/check-email`, {
      params: { email }
    }).pipe(
      catchError(this.handleError)
    );
  }

  checkUsernameExists(username: string): Observable<UsernameCheckResponse> {
    return this.http.get<UsernameCheckResponse>(`${this.apiUrl}/users/check-username`, {
      params: { username }
    }).pipe(
      catchError(this.handleError)
    );
  }

  registerGuest(username: string): Observable<{ token: string }> {
    return this.http.post<{ token: string; message: string }>(`${this.apiUrl}/users/guest-register`, { username }).pipe(
      tap((response) => {
        if (response.token) {
          this.setToken(response.token);
          // Guardar el username y el estado de invitado en el localStorage
          this.setUserData({ username, isGuest: true });
        }
      }),
      catchError(this.handleError)
    );
  }

  migrateGuestUser(data: { username: string; email: string; password: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/users/migrate-guest`, data).pipe(
      tap(() => {
        // Actualizar los datos del usuario en localStorage para reflejar que ya no es invitado
        const user = this.getUserData();
        if (user) {
          this.setUserData({
            ...user,
            email: data.email,
            isGuest: false
          });
        }
      }),
      catchError(this.handleError)
    );
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expired = Date.now() >= payload.exp * 1000;
      if (expired) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  isGuestUser(): boolean {
    const user = this.getUserData();
    return !!user?.isGuest;
  }

  getUsername(): string | null {
    const user = this.getUserData();
    return user ? user.username : null;
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Métodos privados
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setUserData(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUserData(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.error && error.error.error) {
      // Error del lado del servidor con mensaje específico
      errorMessage = error.error.error;
    } else {
      // Otro tipo de error del lado del servidor
      errorMessage = `Código de error: ${error.status}, Mensaje: ${error.statusText}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
