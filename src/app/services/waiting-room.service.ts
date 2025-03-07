import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface Player {
  id: string; // Username
  username: string; // Username
  type: string; // 'registered' or 'guest'
  status: string; // 'active', 'inactive', etc.
  joinedAt: string;
  rejoinedAt?: string;
  leftAt?: string;
}

export interface WaitingRoomStatus {
  roomId: string;
  gameId: string;
  gameCode: string;
  status: 'waiting' | 'ready' | 'started';
  minPlayers: number;
  maxPlayers: number;
  players: Player[];
  activePlayers: number;
  createdAt: string;
  updatedAt: string;
  matchId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WaitingRoomService {
  private apiUrl = 'http://34.30.151.163:3000/api/v1/waiting-room';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Creates a new waiting room for a game
   * @param gameId The ID of the game
   * @param gameCode The code of the game
   * @param initialPlayers Optional array of initial players
   */
  createWaitingRoom(gameId: string, gameCode: string, initialPlayers: Player[] = []): Observable<WaitingRoomStatus> {
    return this.http.post<WaitingRoomStatus>(
      `${this.apiUrl}/create`,
      { gameId, gameCode, players: initialPlayers },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Waiting room created:', response)),
      catchError(error => {
        console.error('Error creating waiting room:', error);
        return throwError(() => new Error(`Failed to create waiting room: ${error.message}`));
      })
    );
  }

  /**
   * Joins a waiting room using a game code
   * @param gameCode The code of the game to join
   * @param playerType The type of player ('registered' or 'guest')
   */
  joinWaitingRoom(gameCode: string, playerType: string): Observable<WaitingRoomStatus> {
    const username = this.authService.getUsername();

    if (!username) {
      throw new Error('Usuario no autenticado');
    }

    return this.http.post<WaitingRoomStatus>(
      `${this.apiUrl}/join`,
      { gameCode, username, playerType },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Jugadores en la sala después de unirse:', response.players)),
      catchError(error => {
        console.error('Error al unirse a la sala:', error);
        return throwError(() => new Error(`No se pudo unir a la sala: ${error.message}`));
      })
    );
  }

  /**
   * Leaves a waiting room
   * @param gameCode The code of the game
   */
  leaveWaitingRoom(gameCode: string): Observable<{ success: boolean, activeCount: number, status: string }> {
    const username = this.authService.getUsername();

    if (!username) {
      throw new Error('Usuario no autenticado');
    }

    return this.http.post<{ success: boolean, activeCount: number, status: string }>(
      `${this.apiUrl}/leave`,
      { gameCode, username },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Left waiting room:', response)),
      catchError(error => {
        console.error('Error leaving waiting room:', error);
        return throwError(() => new Error(`Failed to leave waiting room: ${error.message}`));
      })
    );
  }

  /**
   * Gets the current status of a waiting room
   * @param gameCode The code of the game
   */
  getWaitingRoomStatus(gameCode: string): Observable<WaitingRoomStatus> {
    return this.http.get<WaitingRoomStatus>(
      `${this.apiUrl}/status/${gameCode}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Waiting room status recibido:', response)),
      catchError(error => {
        console.error('Error obteniendo el estado de la sala:', error);
        return throwError(() => new Error(`Error al obtener la sala: ${error.message}`));
      })
    );
  }

  /**
   * Starts the game associated with the waiting room
   * @param gameCode The code of the game to start
   */
  startGame(gameCode: string): Observable<WaitingRoomStatus & { gameSession: any, gameId: string }> {
    console.log('Payload enviado en POST /start:', { gameCode });

    return this.http.post<WaitingRoomStatus & { gameSession: any, gameId: string }>(
      `${this.apiUrl}/start`,
      { gameCode },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Game started:', response)),
      catchError(error => {
        console.error('Error starting game:', error);
        return throwError(() => new Error(`Failed to start game: ${error.message}`));
      })
    );
  }

  /**
   * Checks if a waiting room has enough players to start
   * @param waitingRoom The waiting room to check
   * @returns boolean indicating if the game can start
   */
  canStartGame(waitingRoom: WaitingRoomStatus): boolean {
    if (!waitingRoom || !waitingRoom.players) return false;

    const activePlayers = waitingRoom.players.filter(p => p.status === 'active').length;
    return activePlayers >= waitingRoom.minPlayers;
  }
  /**
   * Gets the count of active players in a waiting room
   * @param waitingRoom The waiting room to check
   * @returns number of active players
   */
  getActivePlayerCount(waitingRoom: WaitingRoomStatus): number {
    if (!waitingRoom?.players) return 0;
    return waitingRoom.players.filter(p => p.status === 'active').length;
  }
}
