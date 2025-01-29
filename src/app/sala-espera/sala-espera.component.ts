import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WaitingRoomService } from '../services/waiting-room.service';
import { GameService } from '../services/game.service';
import { AuthService } from '../services/auth.service';
import { interval, Subscription, catchError } from 'rxjs';
import { switchMap, retryWhen, delay, take } from 'rxjs/operators';
import Swal from 'sweetalert2';
import {NgIf, NgFor, NgClass} from '@angular/common';

@Component({
  selector: 'app-sala-espera',
  standalone: true,
  templateUrl: './sala-espera.component.html',
  styleUrls: ['./sala-espera.component.css'],
  imports: [NgIf, NgFor, NgClass]
})
export class SalaEsperaComponent implements OnInit, OnDestroy {

  gameId: string = '';
  gameCode: string = '';
  userId: string = '';
  playerName: string = '';
  players: any[] = [];
  isHost: boolean = false;
  canStartGame: boolean = false;
  isLoading: boolean = true;
  error: string | null = null;
  minPlayers: number = 3;

  private statusSubscription?: Subscription;
  public gameData: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private waitingRoomService: WaitingRoomService,
    private gameService: GameService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.gameId = params['gameId'];
      this.loadGameData();
    });

    this.authService.isUserLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        const userData = this.authService.getUserData();
        this.userId = userData.id;
        this.playerName = userData.username || userData.name || 'Jugador';
      } else {
        this.userId = `guest_${Math.random().toString(36).substr(2, 9)}`;
        this.playerName = 'Invitado';
      }
    });
  }

  loadGameData(): void {
    this.isLoading = true;
    this.gameService.getGameById(this.gameId).subscribe({
      next: (game) => {
        this.gameData = game;
        this.gameCode = game.code;
        // Actualizar la lógica para determinar si es anfitrión
        this.isHost = game.createdBy === this.userId && game.creatorType !== 'guest';
        this.setupStatusPolling();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'No se pudo cargar la información del juego';
        this.isLoading = false;
        console.error('Error al cargar datos del juego:', error);
        Swal.fire('Error', this.error, 'error');
        this.router.navigate(['/']);
      }
    });
  }


  setupStatusPolling(): void {
    this.statusSubscription = interval(3000)
      .pipe(
        switchMap(() => this.waitingRoomService.getWaitingRoomStatus(this.gameCode)
          .pipe(
            retryWhen(errors =>
              errors.pipe(
                delay(1000),
                take(3)
              )
            )
          )
        )
      )
      .subscribe({
        next: (status) => {
          this.players = status.players;
          // Actualizar la lógica para habilitar el botón de inicio
          const activePlayers = this.players.filter(p => p.status === 'active').length;
          this.canStartGame = activePlayers >= this.minPlayers;

          if (status.status === 'started') {
            // Redirigir a la ruta tabla-avanzada con el ID del juego
            this.router.navigate(['/tabla-avanzada', this.gameId]);
          }
        },
        error: (error) => {
          console.error('Error al actualizar estado:', error);
        }
      });
  }



  startGame(): void {
    if (!this.canStartGame) {
      Swal.fire('Error', `Se necesitan al menos ${this.minPlayers} jugadores para comenzar`, 'warning');
      return;
    }

    if (!this.isHost) {
      Swal.fire('Error', 'Solo el anfitrión puede iniciar el juego', 'warning');
      return;
    }

    this.waitingRoomService.startGame(this.gameCode).subscribe({
      next: () => {
        this.router.navigate(['/tabla-avanzada', this.gameId]);
      },
      error: (error) => {
        console.error('Error al iniciar el juego:', error);
        Swal.fire('Error', 'No se pudo iniciar el juego', 'error');
      }
    });
  }

  leaveRoom(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Abandonarás la sala de espera',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.waitingRoomService.leaveWaitingRoom(this.gameCode, this.userId).subscribe({
          next: () => {
            this.router.navigate(['/']);
          },
          error: (error) => {
            console.error('Error al salir de la sala:', error);
            Swal.fire('Error', 'No se pudo abandonar la sala', 'error');
          }
        });
      }
    });
  }

  copyGameCode(): void {
    navigator.clipboard.writeText(this.gameCode).then(() => {
      Swal.fire({
        title: 'Copiado',
        text: 'Código de juego copiado al portapapeles',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    });
  }

  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
}
