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
  gameCode: string = '';  // Código generado para la partida
  isModalOpen: boolean = false;  // Controla la visibilidad del modal
  isLoggedIn: boolean = false;  // Indica si el usuario está logueado
  userId: string = '';  // ID del usuario
  playerName: string = '';  // Nombre del jugador
  codeInput: string = '';  // Código ingresado por el usuario
  showGameCode: boolean = false;  // Controla la visibilidad del código de la partida

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkUserAuthentication();  // Verificar si el usuario está autenticado
    this.generateGameCode(); // Generar el código de la partida
    console.log('gameCode (onInit):', this.gameCode); // Verificar el código generado
  }

// Generar un código único para la partida
  generateGameCode(): void {
    this.gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();  // Generación del código en frontend
  }




  // Verifica si el usuario está autenticado y obtiene los datos del usuario
  // Verifica si el usuario está autenticado y obtiene los datos del usuario
  checkUserAuthentication(): void {
    this.authService.isUserLoggedIn().subscribe({
      next: (isLoggedIn: boolean) => {
        this.isLoggedIn = isLoggedIn;
        if (this.isLoggedIn) {
          const userData = this.authService.getUserData();
          this.userId = userData.id;
          this.playerName = userData.username || userData.name || 'Jugador';
        } else {
          this.userId = 'guest';
          this.playerName = 'Invitado';
        }
        console.log('Authentication checked:', { isLoggedIn: this.isLoggedIn, userId: this.userId });
      },
      error: (error) => {
        console.error('Error checking authentication:', error);
        this.isLoggedIn = false;
        this.userId = 'guest';
        this.playerName = 'Invitado';
      }
    });
  }


  // Crear una nueva partida
  createGame(): void {
    console.log('Creando partida...');
    const isTemporary = !this.isLoggedIn;
    const playerType = this.isLoggedIn ? 'registered' : 'guest';

    // Enviar los datos al backend
    this.gameService.createGame(this.userId, playerType, isTemporary, this.gameCode).subscribe({
      next: (response) => {
        console.log('Respuesta de crear juego:', response);

        // Usar el código recibido del backend si lo modifica
        this.gameCode = response.code || this.gameCode;
        this.showGameCode = true;

        setTimeout(() => {
          if (this.gameCode) {
            Swal.fire('Partida creada', `Código: ${this.gameCode}`, 'success');
            if (response.gameId) {
              this.router.navigate(['/sala-espera', response.gameId]);  // Redirigir a la sala de espera
            }
          } else {
            throw new Error('No se recibió un código de juego válido');
          }
        });
      },
      error: (error) => {
        console.error('Error al crear la partida:', error);
        Swal.fire('Error', 'No se pudo crear la partida', 'error');
      }
    });
  }



  // Abrir el modal para unirse a una partida
  openModal(): void {
    this.isModalOpen = true;
  }

  // Cerrar el modal
  closeModal(): void {
    this.isModalOpen = false;
  }

  // Unirse a una partida
  submitCode(): void {
    const trimmedCode = this.codeInput.trim().toUpperCase(); // Asegurarse de que el código esté en mayúsculas
    if (!trimmedCode) {
      Swal.fire('Error', 'Ingresa un código válido', 'error');
      return;
    }

    const playerType = this.isLoggedIn ? 'registered' : 'guest'; // Determina el tipo de jugador basado en si está logueado

    // Verifica los parámetros antes de enviarlos
    console.log('Payload para unirse a la partida:', {
      gameCode: trimmedCode,
      userId: this.userId,
      playerType,
      playerName: this.playerName
    });

    // Llamada al servicio para unirse a la partida
    this.gameService.joinGame(trimmedCode, this.userId, playerType, this.playerName).subscribe({
      next: (response) => {
        Swal.fire('Unido a la partida', `Bienvenido a la partida ${trimmedCode}`, 'success');
        this.router.navigate(['/sala-espera', response.gameId]);
        this.closeModal();
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'No se pudo unir a la partida';
        Swal.fire('Error', errorMessage, 'error');
        console.error('Error al unirse a la partida:', error);
      },
    });
  }


  // Dejar una partida
  leaveGame(): void {
    if (!this.gameCode || !this.userId) {
      Swal.fire('Error', 'No puedes abandonar una partida sin estar en una', 'error');
      return;
    }

    this.gameService.leaveGame(this.gameCode, this.userId).subscribe({
      next: (response) => {
        Swal.fire('Has salido de la partida', 'Esperamos verte pronto', 'success');
        this.router.navigate(['/']); // Redirigir al usuario al inicio
      },
      error: (error) => {
        Swal.fire('Error', 'No se pudo abandonar la partida', 'error');
        console.error(error);
      },
    });
  }


  // Copiar el código de la partida al portapapeles
  copyCode(): void {
    if (this.gameCode) {
      navigator.clipboard.writeText(this.gameCode).then(() => {
        Swal.fire('Copiado', 'El código se ha copiado al portapapeles', 'success');
      });
    }
  }
}
