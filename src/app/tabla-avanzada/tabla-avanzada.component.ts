import { CommonModule } from '@angular/common';
import {Component, OnDestroy, OnInit} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {GameMatch, GameScoreService} from '../services/game-score.service';
import {interval, Subscription} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import Swal from 'sweetalert2';

export type TablaFila = {
  Fecha: string;
  [key: string]: string | number | null;
};

@Component({
  selector: 'app-tabla-avanzada',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tabla-avanzada.component.html',
  styleUrls: ['./tabla-avanzada.component.css']
})
export class TablaAvanzadaComponent implements OnInit, OnDestroy {
  currentMatch: GameMatch | null = null;
  selectedPlayerId: string = '';
  roundScore = { points: 0, fichasUsadas: 0, telefunken: false };
  private statusSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameScoreService: GameScoreService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const gameId = params['gameId'];
      if (gameId) {
        this.initializeStatusPolling(gameId);
      } else {
        console.error('Error: gameId no encontrado en la URL');
      }
    });
  }

  initializeStatusPolling(gameId: string) {
    this.statusSubscription = interval(5000)
      .pipe(switchMap(() => this.gameScoreService.getMatchStatus(gameId)))
      .subscribe({
        next: (match) => {
          this.currentMatch = match;
          if (match.status === 'completed') {
            this.mostrarGanador();
          }
        },
        error: (error) => {
          console.error('Error actualizando estado:', error);
          Swal.fire('Error', 'Error al actualizar el estado del juego', 'error');
        }
      });
  }

  registrarPuntuacion() {
    if (!this.selectedPlayerId || !this.currentMatch) {
      Swal.fire('Error', 'Selecciona un jugador', 'warning');
      return;
    }

    this.gameScoreService.recordScore(
      this.currentMatch.matchId,
      this.selectedPlayerId,
      this.roundScore
    ).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Puntuación registrada', 'success');
        this.resetForm();
      },
      error: (error) => {
        Swal.fire('Error', error.message, 'error');
      }
    });
  }

  resetForm() {
    this.selectedPlayerId = '';
    this.roundScore = { points: 0, fichasUsadas: 0, telefunken: false };
  }

  mostrarGanador() {
    if (!this.currentMatch) return;

    const ganador = this.currentMatch.players.reduce((prev, current) =>
      (prev.totalScore > current.totalScore) ? prev : current
    );

    Swal.fire({
      title: '¡Juego Terminado!',
      text: `¡${ganador.playerName} ha ganado con ${ganador.totalScore} puntos!`,
      icon: 'success',
      confirmButtonText: 'Volver al inicio'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy() {
    this.statusSubscription?.unsubscribe();
  }
}
