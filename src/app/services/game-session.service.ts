import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';

interface GameAction {
  actionType: string;
  data?: any;
  nextTurn?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameSessionService implements OnDestroy {
  private socket: Socket;
  private apiUrl = 'http://localhost:3000'; // URL del servidor backend
  private disconnectSubject = new Subject<void>();

  constructor(private authService: AuthService) {
    // En el constructor del servicio
    this.socket = io(this.apiUrl, {
      withCredentials: true, // ¡Debe coincidir con el backend!
      transports: ['websocket', 'polling'] // Agrega otros transportes si es necesario
    });

    // Manejar errores de conexión
    this.socket.on('connect_error', (err) => {
      console.error('Error de conexión con el servidor de WebSockets:', err);
    });

    // Autenticar al usuario después de conectarse
    this.socket.on('connect', () => {
      console.log('Conectado al servidor de WebSockets');
      this.authenticateUser();
    });

    // Registrar eventos de autenticación
    this.socket.on('authenticated', (data) => {
      console.log('Usuario autenticado en WebSockets:', data);
    });

    // Registrar eventos de error
    this.socket.on('error', (error) => {
      console.error('Error en WebSockets:', error);
    });
  }

  /**
   * Autenticar al usuario con el servidor de WebSockets
   */
  private authenticateUser(): void {
    const username = this.authService.getUsername();
    if (username) {
      this.socket.emit('authenticate', { username });
    } else {
      console.error('No se pudo autenticar: nombre de usuario no disponible');
    }
  }

  /**
   * Unirse a una sala de juego específica
   * @param gameId El ID de la partida a la que se unirá el jugador
   * @param gameCode El código de la partida
   */
  joinGame(gameId: string, gameCode: string): void {
    const username = this.authService.getUsername();
    if (!username) {
      throw new Error('Usuario no autenticado');
    }

    this.socket.emit('joinGame', { gameId, gameCode, username });
  }

  /**
   * Abandonar una sala de juego
   * @param gameId El ID de la partida que se va a abandonar
   * @param gameCode El código de la partida
   */
  leaveGame(gameId: string, gameCode: string): void {
    const username = this.authService.getUsername();
    if (!username) {
      throw new Error('Usuario no autenticado');
    }

    this.socket.emit('leaveGame', { gameId, gameCode, username });
  }

  /**
   * Realizar una acción en el juego
   * @param gameId El ID de la partida
   * @param gameCode El código de la partida
   * @param actionType El tipo de acción (card_purchase, card_discard, game_played, etc.)
   * @param data Datos adicionales de la acción
   * @param nextTurn Opcional: nombre de usuario del siguiente jugador
   */
  gameAction(gameId: string, gameCode: string, actionType: string, data: any, nextTurn?: string): void {
    const username = this.authService.getUsername();
    if (!username) {
      throw new Error('Usuario no autenticado');
    }

    this.socket.emit('gameAction', {
      gameId,
      gameCode,
      actionType,
      username,
      data,
      nextTurn
    });
  }

  /**
   * Comprar una carta
   * @param gameId El ID de la partida
   * @param gameCode El código de la partida
   * @param card La carta comprada
   * @param tokensUsed Los tokens utilizados
   */
  purchaseCard(gameId: string, gameCode: string, card: any, tokensUsed: number): void {
    this.gameAction(gameId, gameCode, 'card_purchase', { card, tokensUsed });
  }

  /**
   * Descartar una carta
   * @param gameId El ID de la partida
   * @param gameCode El código de la partida
   * @param card La carta descartada
   */
  discardCard(gameId: string, gameCode: string, card: any): void {
    this.gameAction(gameId, gameCode, 'card_discard', { card });
  }

  /**
   * Jugar cartas (trío, cuarteto, escalera, etc.)
   * @param gameId El ID de la partida
   * @param gameCode El código de la partida
   * @param gameType El tipo de juego (trío, cuarteto, escalera)
   * @param cards Las cartas jugadas
   */
  playGame(gameId: string, gameCode: string, gameType: string, cards: any[]): void {
    this.gameAction(gameId, gameCode, 'game_played', { gameType, cards });
  }

  /**
   * Escuchar por jugadores que se unen a la partida
   */
  onPlayerJoined(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('playerJoined', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('playerJoined');
      };
    });
  }

  /**
   * Escuchar por jugadores que abandonan la partida
   */
  onPlayerLeft(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('playerLeft', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('playerLeft');
      };
    });
  }

  /**
   * Escuchar por jugadores que se desconectan
   */
  onPlayerDisconnected(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('playerDisconnected', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('playerDisconnected');
      };
    });
  }

  /**
   * Escuchar cambios en el estado del juego
   */
  onGameState(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('gameState', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('gameState');
      };
    });
  }

  /**
   * Escuchar actualizaciones de acciones
   */
  onActionUpdate(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('actionUpdate', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('actionUpdate');
      };
    });
  }

  /**
   * Escuchar cambios de turno
   */
  onTurnChanged(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('turnChanged', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('turnChanged');
      };
    });
  }

  /**
   * Verificar si el socket está conectado
   */
  isConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  /**
   * Desconectar el socket cuando el servicio se destruye
   */
  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.disconnectSubject.next();
    this.disconnectSubject.complete();
  }
}
