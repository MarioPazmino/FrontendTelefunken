import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

interface Player {
  id: string; // Este será el username
  username: string;
  type?: string;
  status?: string;
  joinedAt: string;
}

interface WaitingRoom {
  roomId: string;
  gameId: string;
  gameCode: string;
  status: string;
  players: Player[];
  activePlayers: number;
  createdAt: string;
}

export interface Game {
  gameId: string;
  code: string;
  title: string;
  createdBy: string; // Este será el username del creador
  creatorType: string;
  isTemporary: boolean;
  status: string;
  players: Player[];
  waitingRoomId?: string;
  createdAt: string;
  waitingRoom?: WaitingRoom;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = 'http://localhost:3000/api/v1/games';

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
   * Crea una nueva partida
   * @param creatorType 'registered' o 'guest'
   * @param isTemporary si la partida es temporal
   * @param gameCode código personalizado (opcional)
   */
  createGame(creatorType: string, isTemporary: boolean = false, gameCode?: string): Observable<{ game: Game, waitingRoom: WaitingRoom }> {
    const username = this.authService.getUsername();

    if (!username) {
      throw new Error('Usuario no autenticado');
    }

    const payload = {
      username, // Ahora usamos username directamente
      creatorType,
      isTemporary,
      gameCode
    };

    return this.http.post<{ game: Game, waitingRoom: WaitingRoom }>(
      `${this.apiUrl}/create`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Unirse a una partida existente usando su código
   * @param gameCode código de la partida
   */
  joinGame(gameCode: string): Observable<Game> {
    const username = this.authService.getUsername();

    if (!username) {
      throw new Error('Usuario no autenticado');
    }

    const payload = {
      gameCode,
      username // Simplificado para usar solo username
    };

    return this.http.post<Game>(
      `${this.apiUrl}/join`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtiene una partida por su ID
   * @param gameId ID de la partida
   */
  getGameById(gameId: string): Observable<Game> {
    return this.http.get<Game>(
      `${this.apiUrl}/${gameId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Inicia la sesión de juego y asegura que existe una sala de espera
   * @param gameCode código de la partida
   */
  startGameSession(gameCode: string): Observable<Game> {
    return this.http.post<Game>(
      `${this.apiUrl}/start-session`,
      { gameCode },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Abandona una partida
   * @param gameId ID de la partida
   */
  leaveGame(gameId: string): Observable<{ success: boolean }> {
    const username = this.authService.getUsername();

    if (!username) {
      throw new Error('Usuario no autenticado');
    }

    const payload = {
      gameId,
      username // Simplificado para usar solo username
    };

    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/leave`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Genera un código aleatorio para una partida
   * @returns código de partida aleatorio
   */
  generateRandomGameCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}
