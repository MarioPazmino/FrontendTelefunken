import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { GameService } from '../services/game.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-game-interface',
  standalone: true,
  templateUrl: './game-interface.component.html',
  styleUrls: ['./game-interface.component.css'],
  imports: [
    FormsModule,
    NgIf
  ]
})
export class GameInterfaceComponent implements OnInit {
  gameCode: string = '';
  isModalOpen: boolean = false;
  isLoading: boolean = false;
  codeInput: string = '';
  showGameCode: boolean = false;

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Generar código al inicializar el componente
    this.generateGameCode();
    console.log('Código de juego generado:', this.gameCode);
  }

  // Genera un código aleatorio usando el método del servicio
  generateGameCode(): void {
    this.gameCode = this.gameService.generateRandomGameCode();
  }

  // Verifica si el usuario está autenticado
  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  // Obtiene el nombre de usuario actual
  get username(): string {
    return this.authService.getUsername() || '';
  }

  // Crea una nueva partida
  createGame(): void {
    this.isLoading = true;
    console.log('Iniciando creación de partida con código:', this.gameCode);

    // Determina el tipo de usuario (registrado o invitado)
    const creatorType = this.isLoggedIn ? 'registered' : 'guest';
    const isTemporary = !this.isLoggedIn;

    this.gameService.createGame(creatorType, isTemporary, this.gameCode).subscribe({
      next: (response) => {
        console.log('Partida creada exitosamente:', response);

        // Guarda el código de la partida (si el backend lo cambia)
        this.gameCode = response.game.code;
        this.showGameCode = true;

        // Navega directamente a la sala de espera sin mostrar alertas
        this.router.navigate(['/sala-espera', response.game.gameId]);
      },
      error: (error) => {
        console.error('Error al crear la partida:', error);
        Swal.fire({
          title: 'Error',
          text: error.error?.message || 'No se pudo crear la partida',
          icon: 'error'
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Abre el modal para unirse a una partida
  openModal(): void {
    this.isModalOpen = true;
    this.codeInput = '';
  }

  // Cierra el modal
  closeModal(): void {
    this.isModalOpen = false;
  }

  // Envía el código para unirse a una partida
  submitCode(): void {
    if (!this.codeInput.trim()) {
      Swal.fire('Error', 'Ingresa un código válido', 'error');
      return;
    }

    const formattedCode = this.codeInput.trim().toUpperCase();
    this.isLoading = true;

    console.log('Intentando unirse a la partida:', {
      gameCode: formattedCode
    });

    this.gameService.joinGame(formattedCode).subscribe({
      next: (gameData) => {
        console.log('Unido a la partida exitosamente:', gameData);

        Swal.fire({
          title: 'Unido a la partida',
          text: `Bienvenido a la partida ${formattedCode}`,
          icon: 'success',
          timer: 1500
        });

        this.closeModal();
        this.router.navigate(['/sala-espera', gameData.gameId]);
      },
      error: (error) => {
        console.error('Error al unirse a la partida:', error);

        Swal.fire({
          title: 'Error',
          text: error.error?.message || 'No se pudo unir a la partida',
          icon: 'error'
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Abandona la partida actual
  leaveGame(gameId: string): void {
    if (!gameId) {
      Swal.fire('Error', 'No hay una partida activa para abandonar', 'error');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Abandonarás la partida actual',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;

        this.gameService.leaveGame(gameId).subscribe({
          next: (response) => {
            console.log('Partida abandonada:', response);

            Swal.fire({
              title: 'Has salido de la partida',
              text: 'Has abandonado la partida exitosamente',
              icon: 'success',
              timer: 1500
            });

            this.router.navigate(['/']);
          },
          error: (error) => {
            console.error('Error al abandonar la partida:', error);

            Swal.fire({
              title: 'Error',
              text: error.error?.message || 'No se pudo abandonar la partida',
              icon: 'error'
            });
          },
          complete: () => {
            this.isLoading = false;
          }
        });
      }
    });
  }

  // Copia el código de la partida al portapapeles
  copyCode(): void {
    if (!this.gameCode) return;

    navigator.clipboard.writeText(this.gameCode).then(() => {
      Swal.fire({
        title: 'Código copiado',
        text: 'El código se ha copiado al portapapeles',
        icon: 'success',
        timer: 1500,
        position: 'top-end',
        toast: true,
        showConfirmButton: false
      });
    }).catch((error) => {
      console.error('Error al copiar al portapapeles:', error);
      Swal.fire('Error', 'No se pudo copiar el código', 'error');
    });
  }

  // Inicia la sesión de juego y redirige a la sala de espera
  startGameSession(gameCode: string): void {
    if (!gameCode) {
      Swal.fire('Error', 'Código de partida no válido', 'error');
      return;
    }

    this.isLoading = true;
    this.gameService.startGameSession(gameCode).subscribe({
      next: (gameData) => {
        console.log('Sesión de juego iniciada:', gameData);
        this.router.navigate(['/sala-espera', gameData.gameId]);
      },
      error: (error) => {
        console.error('Error al iniciar sesión de juego:', error);
        Swal.fire('Error', error.error?.message || 'No se pudo iniciar la sesión de juego', 'error');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
