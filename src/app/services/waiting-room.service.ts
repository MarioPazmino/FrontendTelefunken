import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { GameScoreService } from './game-score.service';
import {switchMap} from 'rxjs/operators';

interface WaitingRoomStatus {
  roomId: string;
  gameId: string;
  gameCode: string;
  status: 'waiting' | 'ready' | 'started';
  minPlayers: number;
  maxPlayers: number;
  players: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
    joinedAt: string;
  }>;
  activePlayers: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class WaitingRoomService {
  private apiUrl = 'http://ec2-3-145-55-21.us-east-2.compute.amazonaws.com:3000/api/v1/waiting-room';


  constructor(
    private http: HttpClient,
    private gameScoreService: GameScoreService
  ) {}

  joinWaitingRoom(gameCode: string, userId: string, playerType: string, playerName: string): Observable<WaitingRoomStatus> {
    return this.http.post<WaitingRoomStatus>(`${this.apiUrl}/join`, {
      gameCode,
      userId,
      playerType,
      playerName
    }).pipe(
      catchError(error => {
        console.error('Error joining waiting room:', error);
        return throwError(() => error);
      })
    );
  }

  leaveWaitingRoom(gameCode: string, userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/leave`, {
      gameCode,
      userId
    }).pipe(
      catchError(error => {
        console.error('Error leaving waiting room:', error);
        return throwError(() => error);
      })
    );
  }

  getWaitingRoomStatus(gameCode: string): Observable<WaitingRoomStatus> {
    return this.http.get<WaitingRoomStatus>(`${this.apiUrl}/status/${gameCode}`).pipe(
      catchError(error => {
        console.error('Error getting waiting room status:', error);
        return throwError(() => error);
      })
    );
  }

  startGame(gameCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/start`, { gameCode })
      .pipe(
        switchMap(response => {
          // Después de iniciar el juego, inicializar la tabla de puntuación
          return this.gameScoreService.initializeGame(
            response.gameId,
            response.players
          );
        }),
        catchError(error => {
          console.error('Error starting game:', error);
          return throwError(() => error);
        })
      );
  }

}
