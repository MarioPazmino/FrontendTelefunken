import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameSessionService } from '../services/game-session.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {DatePipe, NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault} from '@angular/common';

@Component({
  selector: 'app-game-table',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    NgClass,
    DatePipe
  ],
  templateUrl: './game-table.component.html',
  styleUrl: './game-table.component.css'
})
export class GameTableComponent implements OnInit, OnDestroy {
  gameId: string = '';
  gameCode: string = '';
  players: any[] = [];
  currentTurn: string = ''; // Cambiado a string para almacenar username
  gameState: any = null;
  isMyTurn: boolean = false;
  isLoading: boolean = true;
  error: string | null = null;
  actions: any[] = [];
  winner: string | null = null;

  // Subscripciones
  private gameStateSubscription: Subscription | null = null;
  private playerJoinedSubscription: Subscription | null = null;
  private playerLeftSubscription: Subscription | null = null;
  private actionUpdateSubscription: Subscription | null = null;
  private turnChangedSubscription: Subscription | null = null;
  private playerDisconnectedSubscription: Subscription | null = null;

  constructor(
    private gameSessionService: GameSessionService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener gameId y gameCode de la URL
    this.gameId = this.route.snapshot.paramMap.get('gameId') || '';
    this.gameCode = this.route.snapshot.paramMap.get('gameCode') || '';

    if (!this.gameId || !this.gameCode) {
      this.error = 'No se encontró el ID o el código de la partida';
      this.isLoading = false;
      return;
    }

    // Suscribirse a eventos antes de unirse al juego
    this.setupEventSubscriptions();

    // Unirse a la partida usando gameId y gameCode
    try {
      this.gameSessionService.joinGame(this.gameId, this.gameCode);
    } catch (error: any) {
      this.error = `Error al unirse a la partida: ${error.message}`;
      this.isLoading = false;
    }
  }

  private setupEventSubscriptions(): void {
    // Escuchar el estado del juego
    this.gameStateSubscription = this.gameSessionService.onGameState().subscribe((gameState) => {
      this.gameState = gameState;
      if (gameState.players && Array.isArray(gameState.players)) {
        this.players = gameState.players;
      } else {
        this.players = [];
      }

      this.currentTurn = gameState.currentTurn;
      this.checkIfMyTurn();
      this.isLoading = false;

      // Verificar si hay resultados (partida finalizada)
      if (gameState.results && gameState.results.winner) {
        this.winner = gameState.results.winner;
      }
    });

    // Escuchar cuando se unen jugadores
    this.playerJoinedSubscription = this.gameSessionService.onPlayerJoined().subscribe((data) => {
      console.log(`Jugador unido: ${data.username}`);
      // Actualizar la lista de jugadores si es necesario
      this.refreshGameState();
    });

    // Escuchar cuando salen jugadores
    this.playerLeftSubscription = this.gameSessionService.onPlayerLeft().subscribe((data) => {
      console.log(`Jugador salió: ${data.username}`);
      // Actualizar la lista de jugadores si es necesario
      this.refreshGameState();
    });

    // Escuchar actualizaciones de acciones
    this.actionUpdateSubscription = this.gameSessionService.onActionUpdate().subscribe((data) => {
      console.log('Acción actualizada:', data);
      this.actions.push(data);
      this.refreshGameState();
    });

    // Escuchar cambios de turno
    this.turnChangedSubscription = this.gameSessionService.onTurnChanged().subscribe((data) => {
      this.currentTurn = data.currentTurn;
      this.checkIfMyTurn();
    });

    // Escuchar desconexiones de jugadores
    this.playerDisconnectedSubscription = this.gameSessionService.onPlayerDisconnected().subscribe((data) => {
      console.log(`Jugador desconectado: ${data.username}`);
      // Actualizar el estado del jugador en la interfaz
      this.refreshGameState();
    });
  }

  private refreshGameState(): void {
    // No es necesario hacer una solicitud explícita ya que el servidor emite el estado actualizado
    // automáticamente después de las acciones
  }

  private checkIfMyTurn(): void {
    const username = this.authService.getUsername();
    if (username && this.currentTurn) {
      this.isMyTurn = this.currentTurn === username;
    }
  }

  // Método para realizar acciones en el juego
  performAction(actionType: string, data: any = {}, nextTurn: string | undefined = undefined): void {
    if (!this.isMyTurn) {
      this.error = 'No es tu turno';
      return;
    }

    try {
      this.gameSessionService.gameAction(
        this.gameId,
        this.gameCode,
        actionType,
        data,
        nextTurn
      );
      this.error = null;
    } catch (error: any) {
      this.error = `Error al realizar la acción: ${error.message}`;
    }
  }

  // Métodos específicos para diferentes tipos de acciones
  purchaseCard(card: any, tokensUsed: number): void {
    this.gameSessionService.purchaseCard(this.gameId, this.gameCode, card, tokensUsed);
  }

  discardCard(card: any): void {
    this.gameSessionService.discardCard(this.gameId, this.gameCode, card);
  }

  playGame(gameType: string, cards: any[]): void {
    this.gameSessionService.playGame(this.gameId, this.gameCode, gameType, cards);
  }

  endTurn(): void {
    if (!Array.isArray(this.players) || this.players.length === 0) {
      console.error('No hay jugadores disponibles');
      return;
    }

    const currentTurn = this.currentTurn;
    let nextPlayerIndex = this.players.findIndex(p => p.username === currentTurn);

    if (nextPlayerIndex === -1) {
      console.error('Jugador actual no encontrado');
      return;
    }

    nextPlayerIndex = (nextPlayerIndex + 1) % this.players.length;
    const nextPlayer = this.players[nextPlayerIndex].username;

    // Actualizar el turno en el backend
    this.performAction('end_turn', {}, nextPlayer);
  }

  leaveGameTable(): void {
    try {
      this.gameSessionService.leaveGame(this.gameId, this.gameCode);
      this.router.navigate(['/']);
    } catch (error: any) {
      this.error = `Error al abandonar la partida: ${error.message}`;
    }
  }

  ngOnDestroy(): void {
    // Desuscribirse de todos los observables
    if (this.gameStateSubscription) this.gameStateSubscription.unsubscribe();
    if (this.playerJoinedSubscription) this.playerJoinedSubscription.unsubscribe();
    if (this.playerLeftSubscription) this.playerLeftSubscription.unsubscribe();
    if (this.actionUpdateSubscription) this.actionUpdateSubscription.unsubscribe();
    if (this.turnChangedSubscription) this.turnChangedSubscription.unsubscribe();
    if (this.playerDisconnectedSubscription) this.playerDisconnectedSubscription.unsubscribe();

    // Abandonar la partida si aún no se ha hecho
    if (this.gameId && this.gameCode) {
      try {
        this.gameSessionService.leaveGame(this.gameId, this.gameCode);
      } catch (error) {
        console.error('Error al abandonar la partida:', error);
      }
    }
  }
}
