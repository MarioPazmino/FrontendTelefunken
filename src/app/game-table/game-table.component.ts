import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameSessionService } from '../services/game-session.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {DatePipe, JsonPipe, NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault} from '@angular/common';
import {FormsModule} from '@angular/forms';

interface RoundApprovedEvent {
  approved: boolean;
  round: string;
  points: any;
  nextRound: string;
}

interface CardsDeclaredEvent {
  username: string;
  declarations: any;
  timestamp: string;
}

@Component({
  selector: 'app-game-table',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    FormsModule,
    JsonPipe,
    NgClass
  ],
  templateUrl: './game-table.component.html',
  styleUrl: './game-table.component.css'
})
export class GameTableComponent implements OnInit, OnDestroy {
  gameId: string = '';
  gameCode: string = '';
  players: any[] = [];
  currentTurn: string = '';
  gameState: any = {
    rounds: [],
    currentRound: 0,
  };
  isMyTurn: boolean = false;
  isLoading: boolean = true;
  error: string | null = null;
  actions: any[] = [];
  winner: string | null = null;
  roundClaimed: boolean = false;
  remainingTokens: number = 12;
  claimedTokenCount: number = 0;
  currentDeclarations: Record<string, number> = {};
  roundHistory: any[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private gameSessionService: GameSessionService,
    public authService: AuthService,
  private router: Router,
    private route: ActivatedRoute
  ) {
    const username = this.authService.getUsername();
    if (!username) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('gameId') || '';
    this.gameCode = this.route.snapshot.paramMap.get('gameCode') || '';

    if (!this.gameId || !this.gameCode) {
      this.error = 'No se encontró el ID o el código de la partida';
      this.isLoading = false;
      return;
    }

    this.setupEventSubscriptions();
    this.joinGame();
    this.loadRoundHistory();
  }

  private setupEventSubscriptions(): void {
    this.subscriptions.push(
      this.gameSessionService.onGameStarted().subscribe((gameState: any) => {
        this.gameState = gameState;
        this.updateGameState(gameState);
      }),

      this.gameSessionService.onGameUpdate().subscribe((gameState: any) => {
        this.gameState = gameState;
        this.updateGameState(gameState);
      }),

      this.gameSessionService.onGameEnded().subscribe((results: any) => {
        this.winner = results.detailedResults.winner;
        this.gameState.status = 'ended';
      }),

      this.gameSessionService.onPlayerJoined().subscribe(({ username }: { username: string }) => {
        console.log(`¡${username} se ha unido!`);
      }),

      this.gameSessionService.onPlayerDisconnected().subscribe(({ username }: { username: string }) => {
        console.log(`¡${username} se ha desconectado!`);
      })
    );
  }


  private loadRoundHistory(): void {
    this.gameSessionService.getRoundHistory(this.gameId, this.gameCode)
      .subscribe({
        next: (response) => this.roundHistory = response.rounds,
        error: (err) => this.error = err.message
      });
  }



// Agregar método para finalizar juego
  private endGame(): void {
    this.gameSessionService.endGame(this.gameId, this.gameCode)
      .subscribe({
        next: (results) => {
          this.winner = results.winner;
          this.gameState.status = 'ended';
        },
        error: (err) => this.error = err.message
      });
  }
  private joinGame(): void {
    try {
      this.gameSessionService.joinGame(this.gameId, this.gameCode);
      this.isLoading = false;
      this.gameSessionService.getGameState(this.gameId)
        .subscribe({
          next: (state) => this.updateGameState(state),
          error: (err) => this.error = err.message
        });
    } catch (error: any) {
      this.error = `Error al unirse a la partida: ${error.message}`;
      this.isLoading = false;
    }
  }

  leaveGameTable(): void {
    try {
      this.gameSessionService.leaveGame(this.gameId, this.gameCode);
      this.router.navigate(['/']);
    } catch (error: any) {
      this.error = `Error al abandonar la partida: ${error.message}`;
    }
  }

  private updateGameState(gameState: any): void {
    this.players = gameState.players || [];
    this.currentTurn = gameState.currentTurn;
    this.actions = gameState.actions || [];

    // Actualizar estado de ronda actual
    const currentRound = gameState.rounds[gameState.currentRound];
    this.roundClaimed = !!currentRound?.claimedBy;

    // Calcular fichas restantes para jugador actual
    const username = this.authService.getUsername();
    const safeUsername = username ?? ''; // ← Clave: Evita null/undefined
    this.remainingTokens = 12 - (gameState.tokensUsed?.[safeUsername] || 0);
    this.gameState = gameState;
    this.checkIfMyTurn();
    if (!Array.isArray(this.gameState.rounds)) {
      this.gameState.rounds = []; // Reset to empty array if invalid
    }
    // Verificar si se completaron todas las rondas
    if(gameState.currentRound >= 6 && currentRound?.status !== 'pending') {
      this.endGame();
    }
  }
  private checkIfMyTurn(): void {
    const username = this.authService.getUsername();
    this.isMyTurn = username === this.currentTurn;
  }

  claimRound(): void {
    if (this.claimedTokenCount < 1 || this.claimedTokenCount > this.remainingTokens) {
      this.error = 'Cantidad de fichas inválida';
      return;
    }
    this.gameSessionService.claimRound(this.gameId, this.gameCode, this.claimedTokenCount);
    this.claimedTokenCount = 0;
  }

  approveRound(approved: boolean): void {
    this.gameSessionService.approveRound(this.gameId, this.gameCode, approved);
  }

  declareCards(): void {
    if (!this.isMyTurn) return;

    this.gameSessionService.declareCards(this.gameId, this.gameCode, this.currentDeclarations);
    this.currentDeclarations = {};
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  protected readonly Object = Object;
}
