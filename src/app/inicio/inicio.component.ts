import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';  // Importa HttpClientModule
import Swal from 'sweetalert2';
import { LoginModalComponent } from '../login-modal/login-modal.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, LoginModalComponent, HttpClientModule],  // Agrega HttpClientModule aquí
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent {
  title = 'Telefunken: El Juego de Cartas Definitivo';
  rules = [
    {
      title: 'Formar combinaciones de cartas',
      description: 'Los jugadores deben formar combinaciones específicas de cartas para ganar rondas. Cuanto más estratégica sea la combinación, más puntos obtendrá el jugador. Estas combinaciones pueden incluir tríos, escaleras o patrones especiales definidos al inicio del juego. Planificar movimientos futuros es crucial para el éxito.',
      image: 'assets/img/img1.jpg'
    },
    {
      title: 'Uso de comodines',
      description: 'Los comodines pueden sustituir a cualquier carta en el juego. Utiliza los comodines de manera inteligente para cambiar el rumbo de la partida. Sin embargo, es importante recordar que los comodines tienen reglas específicas de uso y no siempre cuentan como puntos neutros. Aprender a usarlos estratégicamente puede marcar la diferencia.',
      image: 'assets/img/comodin.jpg'
    },
    // ... (más reglas)
  ];

  constructor(private router: Router) {}

  async startNewGame() {
    try {
      Swal.fire({
        title: 'Nueva partida iniciada!',
        text: 'Prepara tus cartas y estrategias para una emocionante partida de Telefunken.',
        icon: 'success',
        confirmButtonText: '¡Entendido!'
      });
      this.router.navigate(['/game-interface']);
    } catch (err) {
      console.error('Error al iniciar una nueva partida:', err);
    }
  }

  isModalVisible: boolean = false;

  openModal() {
    this.isModalVisible = true;
  }

  closeModal() {
    this.isModalVisible = false;
  }
}
