import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

interface GameAction {
  actionType: string;
  data?: any;
  nextTurn?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameSessionService implements OnDestroy {
  private socket!: Socket;
  private apiUrl = 'http://localhost:3000'; // URL del servidor backend
  private disconnectSubject = new Subject<void>();
  private apiUrl1 = 'http://localhost:3000/api/v1/game-session';
  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.initializeSocketConnection();
  }

  // Iniciar partida
  startGame(gameId: string, gameCode: string, players: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${gameId}/${gameCode}/start`, { players });
  }

// Finalizar partida
  endGame(gameId: string, gameCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${gameId}/${gameCode}/end`, {});
  }

// Registrar acción (si no se usa Socket.IO)
  recordAction(gameId: string, gameCode: string, playerId: string, action: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${gameId}/${gameCode}/action`, { playerId, action });
  }

  private initializeSocketConnection(): void {
    this.socket = io(this.apiUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.registerSocketEvents();
  }

  private registerSocketEvents(): void {
    this.socket.on('connect', () => {
      this.authenticateUser();
      console.log('Conectado al servidor de juego');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Error de conexión:', err);
    });

    this.socket.on('error', (error) => {
      console.error('Error general:', error);
    });
  }

  private authenticateUser(): void {
    const username = this.authService.getUsername();
    if (username) {
      this.socket.emit('authenticate', { username });
    }
  }

  // Métodos principales del juego
  joinGame(gameId: string, gameCode: string): void {
    const username = this.authService.getUsername();
    if (!username) throw new Error('Usuario no autenticado');

    this.socket.emit('joinGame', { gameId, gameCode, username });
  }

  // Corregir método claimRound
  claimRound(gameId: string, gameCode: string, tokenCount: number): void {
    if(tokenCount < 1 || tokenCount > 12) {
      throw new Error('Cantidad de fichas inválida');
    }
    this.sendGameAction(gameId, gameCode, 'claim_round', { tokenCount });
  }
  approveRound(gameId: string, gameCode: string, approved: boolean): void {
    this.sendGameAction(gameId, gameCode, 'approve_round', { approved });
  }

  declareCards(gameId: string, gameCode: string, declarations: any): void {
    this.sendGameAction(gameId, gameCode, 'declare_cards', { declarations });
  }

  leaveGame(gameId: string, gameCode: string): void {
    const username = this.authService.getUsername();
    if (!username) {
      throw new Error('Usuario no autenticado');
    }

    this.socket.emit('leaveGame', { gameId, gameCode, username });
  }

  private sendGameAction(gameId: string, gameCode: string, actionType: string, data: any): void {
    const username = this.authService.getUsername();
    if (!username) throw new Error('Usuario no autenticado');

    this.socket.emit('gameAction', {
      gameId,
      gameCode,
      actionType,
      username,
      data
    });
  }

  // Métodos HTTP
  getRoundHistory(gameId: string, gameCode: string): Observable<any> {
    return this.http.get(`${this.apiUrl1}/${gameId}/${gameCode}/round-history`);
  }
  getGameState(gameId: string): Observable<any> {
    return this.http.get(`${this.apiUrl1}/${gameId}/state`);
  }

  // Observables de eventos
  onGameStarted(): Observable<any> {
    return this.createSocketObservable('gameStarted');
  }

  // Agregar método para obtener estado de ronda actual
  getCurrentRoundState(gameId: string, gameCode: string): Observable<any> {
    return this.http.get(`${this.apiUrl1}/${gameId}/${gameCode}/current-round`);
  }


  onRoundClaimed(): Observable<{
    username: string,
    round: string,
    remainingTokens: number
  }> {
    return this.createSocketObservable('roundClaimed');
  }

  onRoundApproved(): Observable<{
    approved: boolean,
    round: string,
    points: any,
    nextRound: string
  }> {
    return this.createSocketObservable('roundApproved');
  }

  onCardsDeclared(): Observable<{
    username: string,
    declarations: any,
    timestamp: string
  }> {
    return this.createSocketObservable('cardsDeclared');
  }

  onGameUpdate(): Observable<any> {
    return this.createSocketObservable('gameUpdate');
  }

  onGameEnded(): Observable<{
    results: any,
    detailedResults: any
  }> {
    return this.createSocketObservable('gameEnded');
  }

  onPlayerJoined(): Observable<{ username: string }> {
    return this.createSocketObservable('playerJoined');
  }

  onPlayerDisconnected(): Observable<{ username: string }> {
    return this.createSocketObservable('playerDisconnected');
  }

  private createSocketObservable<T>(eventName: string): Observable<T> {
    return new Observable<T>(observer => {
      const listener = (data: T) => observer.next(data);
      this.socket.on(eventName, listener);
      return () => this.socket.off(eventName, listener);
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
    this.disconnectSubject.next();
    this.disconnectSubject.complete();
  }

  // Métodos auxiliares
  isConnected(): boolean {
    return this.socket?.connected;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}
