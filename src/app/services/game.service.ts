import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private apiUrl = 'http://ec2-18-224-64-120.us-east-2.compute.amazonaws.com:3000/api/v1/games'; // URL de tu backend

  constructor(private http: HttpClient) {}

  // Crear una nueva partida
  createGame(userId: string, creatorType: string, isTemporary: boolean = false, gameCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, { userId, creatorType, isTemporary, gameCode });
  }



  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }
  // Unirse a una partida existente
  joinGame(gameCode: string, userId: string, playerType: string, playerName: string): Observable<any> {
    const payload = {
      gameCode,
      userId,
      playerType,
      playerName
    };

    console.log('Sending join game request:', payload);

    return this.http.post(`${this.apiUrl}/join`, payload, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Dejar una partida
  leaveGame(gameCode: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/leave`, { gameCode, userId });
  }

  // Obtener una partida por su ID
  getGameById(gameId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${gameId}`);
  }

}
