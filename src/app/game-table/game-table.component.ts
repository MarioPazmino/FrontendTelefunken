import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameSessionService } from '../services/game-session.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-game-table',
  standalone: true,
  imports: [
    NgIf,
    NgForOf
  ],
  templateUrl: './game-table.component.html',
  styleUrl: './game-table.component.css'
})
export class GameTableComponent implements OnInit, OnDestroy {
  gameId: string = '';
  gameCode: string = '';
  players: any[] = [];
  currentPlayer: any = null;
  scores: { [username: string]: number } = {};
  isMyTurn: boolean = false;
  isLoading: boolean = true;
  error: string | null = null;

  private gameSubscription: Subscription | undefined;

  constructor(
    private gameSessionService: GameSessionService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('gameId') || '';
    this.gameCode = this.route.snapshot.paramMap.get('gameCode') || '';

    if (!this.gameId || !this.gameCode) {
      this.error = 'No se encontró el ID o el código de la partida';
      return;
    }

    this.gameSessionService.joinGame(this.gameId);

    this.gameSessionService.onGameStarted().subscribe((data) => {
      this.players = data.players;
      this.currentPlayer = data.currentPlayer;
      this.checkIfMyTurn();
      this.isLoading = false;
    });

    this.gameSessionService.onActionRecorded().subscribe((data) => {
      this.updateScores(data);
      this.checkIfMyTurn();
    });

    this.gameSessionService.onGameEnded().subscribe((data) => {
      this.showWinner(data.winner);
    });

    this.startGameIfNeeded();
  }

  private startGameIfNeeded(): void {
    const username = this.authService.getUsername();
    if (username && this.gameCode) {
      this.gameSessionService.startGame(this.gameCode).subscribe({
        next: (response) => {
          console.log('Partida iniciada:', response);
        },
        error: (error) => {
          this.error = 'Error al iniciar la partida';
          this.isLoading = false;
        }
      });
    }
  }


  private checkIfMyTurn(): void {
    const username = this.authService.getUsername();
    if (username && this.currentPlayer) {
      this.isMyTurn = this.currentPlayer.username === username; // Usar username en lugar de id
    }
  }

  private updateScores(data: any): void {
    this.scores = data.scores;
  }

  private showWinner(winner: any): void {
    alert(`El ganador es: ${winner.username} con ${this.scores[winner.username]} puntos`); // Usar username en lugar de id
    this.router.navigate(['/']); // Redirigir al inicio
  }

  performAction(action: string): void {
    if (!this.isMyTurn) {
      this.error = 'No es tu turno';
      return;
    }

    const username = this.authService.getUsername();
    if (!username) {
      this.error = 'Usuario no autenticado';
      return;
    }

    this.gameSessionService.recordAction(this.gameId, action).subscribe({
      next: () => {
        this.error = null;
      },
      error: (error) => {
        this.error = 'Error al realizar la acción';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
    }
    this.gameSessionService.ngOnDestroy(); // Desconectar el socket
  }
}
