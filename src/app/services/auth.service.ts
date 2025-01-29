import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://ec2-3-145-55-21.us-east-2.compute.amazonaws.com:3000/api/v1';
  private tokenKey = 'token';
  private userKey = 'user';

  constructor(private http: HttpClient) {}

  // Registrar un nuevo usuario
  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, user);
  }

  // Iniciar sesión
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login`, credentials).pipe(
      tap((response: any) => {
        this.setToken(response.token);
        this.setUserData(response.user);
      })
    );
  }

  // Verificar si el email ya está registrado
  checkEmailExists(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/check-email`, { params: { email } });
  }

  // Configuración del token
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Configuración de los datos del usuario
  setUserData(user: any): void {
    const userData = {
      id: user.id || user.userId,
      username: user.username,
      name: user.name,
      email: user.email
    };
    console.log('Guardando datos de usuario:', userData);
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  getUserData(): any {
    const userData = localStorage.getItem(this.userKey);
    if (userData) {
      const parsedData = JSON.parse(userData);
      console.log('Datos recuperados del localStorage:', parsedData);
      if (parsedData.id) {
        return parsedData;
      }
    }

    const token = this.getToken();
    if (token) {
      const decodedToken = this.decodeToken(token);
      console.log('Token decodificado:', decodedToken);
      if (decodedToken && decodedToken.userId) {
        return {
          id: decodedToken.userId,
          username: decodedToken.username,
          type: 'registered'
        };
      }
    }

    return null;
  }

  // Verificar si el usuario está logueado
// Cambiar isUserLoggedIn para devolver un Observable<boolean>
  isUserLoggedIn(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return of(false); // Usamos 'of' para devolver un Observable con valor false

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expired = Date.now() >= payload.exp * 1000;
      if (expired) {
        this.logout();
        return of(false); // Usamos 'of' para devolver un Observable con valor false
      }
      return of(true); // Devuelve 'true' como Observable
    } catch {
      this.logout();
      return of(false); // Devuelve 'false' como Observable
    }
  }


  // Cerrar sesión
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('guestId');
  }

  // Obtener los encabezados con autorización
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  // Decodificar el token JWT
  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  // Obtener la información actual del usuario
  // Cambia 'private' por 'public' en el método 'getCurrentUserInfo'
  public getCurrentUserInfo() {
    const userData = this.getUserData();
    if (userData && userData.id) {
      return {
        id: userData.id,
        type: 'registered',
        name: userData.username || userData.name
      };
    }

    const token = this.getToken();
    if (token) {
      const decodedToken = this.decodeToken(token);
      if (decodedToken && decodedToken.userId) {
        return {
          id: decodedToken.userId,
          type: 'registered',
          name: decodedToken.username
        };
      }
    }

    const guestId = this.getGuestId();
    return {
      id: guestId,
      type: 'guest',
      name: `Invitado ${Math.floor(Math.random() * 1000)}`
    };
  }


  // Obtener el ID del invitado
  private getGuestId(): string {
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = `guest-${Date.now()}`;
      localStorage.setItem('guestId', guestId);
    }
    return guestId;
  }
}
