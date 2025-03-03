import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { WaitingRoomService, WaitingRoomStatus } from './waiting-room.service';

@Injectable({
  providedIn: 'root',
})
export class GameSessionService {
  private socket: Socket;
  private apiUrl = 'http://localhost:3000'; // URL del servidor backend

  constructor(
    private authService: AuthService,
    private waitingRoomService: WaitingRoomService
  ) {
    // Inicializar la conexión con el servidor de WebSockets
    this.socket = io(this.apiUrl, {
      auth: {
        token: this.authService.getToken(), // Enviar el token de autenticación
      },
    });

    // Manejar errores de conexión
    this.socket.on('connect_error', (err) => {
      console.error('Error de conexión con el servidor de WebSockets:', err);
    });
  }

  /**
   * Unirse a una sala de juego específica
   * @param gameId El ID de la partida a la que se unirá el jugador
   */
  joinGame(gameId: string): void {
    this.socket.emit('joinGame', gameId);
  }

  /**
   * Iniciar la partida
   * @param gameId El ID de la partida que se va a iniciar
   */
  startGame(gameId: string): Observable<WaitingRoomStatus & { matchId: string }> {
    return this.waitingRoomService.startGame(gameId);
  }

  /**
   * Registrar una acción en la partida (comprar ficha, pasar turno, etc.)
   * @param gameId El ID de la partida
   * @param action La acción que se está registrando
   */
  recordAction(gameId: string, action: string): Observable<any> {
    const username = this.authService.getUsername();

    if (!username) {
      throw new Error('Usuario no autenticado');
    }

    return new Observable((observer) => {
      this.socket.emit('recordAction', { gameId, username, action }, (response: any) => {
        observer.next(response);
        observer.complete();
      });
    });
  }

  /**
   * Finalizar la partida
   * @param gameId El ID de la partida que se va a finalizar
   */
  endGame(gameId: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.emit('endGame', { gameId }, (response: any) => {
        observer.next(response);
        observer.complete();
      });
    });
  }

  /**
   * Escuchar eventos de inicio de partida
   */
  onGameStarted(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('gameStarted', (data: any) => {
        observer.next(data);
      });
    });
  }

  /**
   * Escuchar eventos de acciones registradas
   */
  onActionRecorded(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('actionRecorded', (data: any) => {
        observer.next(data);
      });
    });
  }

  /**
   * Escuchar eventos de finalización de partida
   */
  onGameEnded(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('gameEnded', (data: any) => {
        observer.next(data);
      });
    });
  }

  /**
   * Desconectar el socket cuando el servicio se destruye
   */
  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
