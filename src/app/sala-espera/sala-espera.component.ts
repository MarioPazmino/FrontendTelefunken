
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WaitingRoomService, WaitingRoomStatus, Player } from '../services/waiting-room.service';
import { GameService, Game } from '../services/game.service';
import { AuthService } from '../services/auth.service';
import { interval, Subscription, catchError, of } from 'rxjs';
import { switchMap, retryWhen, delay, take, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { NgIf, NgFor, NgClass } from '@angular/common';

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
  players: Player[] = [];
  isHost: boolean = false;
  canStartGame: boolean = false;
  isLoading: boolean = true;
  error: string | null = null;
  minPlayers: number = 2;
  waitingRoomStatus: WaitingRoomStatus | null = null;
  gameData: Game | null = null;

  private statusSubscription!: Subscription; // Usar el operador de aserción no nula
  private readonly POLLING_INTERVAL = 3000;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public waitingRoomService: WaitingRoomService,
    private gameService: GameService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const username = this.authService.getUsername();
    if (!username) {
      this.handleError('Usuario no autenticado');
      return;
    }

    this.route.params.subscribe(params => {
      this.gameId = params['gameId'];
      this.loadGameData();
    });
  }

  private loadGameData(): void {
    this.isLoading = true;
    this.error = null;

    this.gameService.getGameById(this.gameId).pipe(
      tap(game => {
        this.gameData = game;
        this.gameCode = game.code;
        this.isHost = game.createdBy === this.authService.getUsername() && game.creatorType === 'registered';
      }),
      switchMap(game => this.waitingRoomService.getWaitingRoomStatus(game.code))
    ).subscribe({
      next: (status: WaitingRoomStatus) => {
        this.waitingRoomStatus = status;
        this.players = status.players;
        this.setupStatusPolling();
        this.isLoading = false;
      },
      error: (error: any) => this.handleError('Error al cargar la sala de espera')
    });
  }

  private setupStatusPolling(): void {
    this.statusSubscription = interval(this.POLLING_INTERVAL).pipe(
      switchMap(() => this.waitingRoomService.getWaitingRoomStatus(this.gameCode).pipe(
        retryWhen(errors => errors.pipe(delay(1000), take(3)))
      ))
    ).subscribe({
      next: (status: WaitingRoomStatus) => {
        console.log('Estado de la sala actualizado:', status);
        this.waitingRoomStatus = status;
        this.players = status.players;
        this.minPlayers = status.minPlayers;
        this.canStartGame = this.waitingRoomService.canStartGame(status);
        console.log('Estado de la sala:', this.waitingRoomStatus);
        console.log('MinPlayers:', this.minPlayers);
        console.log('Jugadores activos:', this.waitingRoomService.getActivePlayerCount(this.waitingRoomStatus!));
        console.log('Puede iniciar juego:', this.canStartGame);
        console.log('Es anfitrión:', this.isHost);

        // Redirigir si el juego ha comenzado
        if (status.status === 'started') {
          this.router.navigate(['/game-table', this.gameId, this.gameCode]);
        }
      },
      error: (error: any) => console.error('Error en el polling:', error)
    });
  }

  startGame(): void {
    console.log('Intentando iniciar juego', {
      canStartGame: this.canStartGame,
      isHost: this.isHost,
      minPlayers: this.minPlayers,
      activePlayers: this.waitingRoomService.getActivePlayerCount(this.waitingRoomStatus!),
      players: this.players,
      gameCode: this.gameCode
    });

    // Validate minimum players
    if (!this.canStartGame) {
      Swal.fire('Error', `Se necesitan al menos ${this.minPlayers} jugadores para comenzar`, 'warning');
      return;
    }

    // Validate host permissions
    if (!this.isHost) {
      Swal.fire('Error', 'Solo el anfitrión puede iniciar el juego', 'warning');
      return;
    }

    // Additional validation to ensure gameCode exists
    if (!this.gameCode) {
      Swal.fire('Error', 'Código de juego no válido', 'error');
      return;
    }

    // Optional: Add loading state
    this.isLoading = true;

    this.waitingRoomService.startGame(this.gameCode).subscribe({
      next: (response) => {
        console.log('Juego iniciado correctamente:', response);

        // Ensure gameId is available, use from response if not already set
        const gameId = response.gameId || this.gameId;

        if (!gameId) {
          this.handleError('No se pudo obtener el ID del juego');
          return;
        }

        // Navigate to game table with both gameId and gameCode
        this.router.navigate(['/game-table', gameId, this.gameCode]);
      },
      error: (error) => {
        console.error('Error al iniciar el juego:', error);

        // More detailed error handling
        const errorMessage = error.error?.message || error.message || 'Error desconocido';

        Swal.fire({
          icon: 'error',
          title: 'Error al iniciar el juego',
          text: errorMessage,
          confirmButtonText: 'Aceptar'
        });
      },
      complete: () => {
        // Always reset loading state
        this.isLoading = false;
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
        this.waitingRoomService.leaveWaitingRoom(this.gameCode).subscribe({
          next: () => this.router.navigate(['/']),
          error: () => this.handleError('No se pudo abandonar la sala')
        });
      }
    });
  }

  async copyGameCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.gameCode);
      Swal.fire({
        title: 'Copiado',
        text: 'Código de juego copiado al portapapeles',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      this.handleError('No se pudo copiar el código');
    }
  }

  getActivePlayerCount(): number {
    return this.waitingRoomService.getActivePlayerCount(this.waitingRoomStatus!);
  }

  private handleError(message: string): void {
    this.error = message;
    this.isLoading = false;
    Swal.fire('Error', message, 'error');
    if (message === 'Usuario no autenticado') {
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
}


