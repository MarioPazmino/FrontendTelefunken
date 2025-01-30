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
    {
      title: 'Jugador con menos puntos gana',
      description: 'Al final de las rondas, el jugador con menos puntos acumulados será el ganador. ¡La estrategia es clave! Esto significa que los jugadores deben tratar de minimizar sus puntos descartando cartas de alto valor o utilizando estrategias para desviar la atención de los oponentes. Cada decisión cuenta.',
      image: 'assets/img/img2.jpg'
    },
    {
      title: 'No se puede repetir jugada',
      description: 'Cada jugada debe ser única. No puedes repetir la misma jugada en rondas sucesivas. Esto asegura que los jugadores mantengan la creatividad y diversifiquen sus estrategias. Las jugadas repetidas están sujetas a penalizaciones que incrementan los puntos en contra.',
      image: 'assets/img/img3.jpg'
    },
    {
      title: 'Turnos de juego',
      description: 'Los jugadores deben esperar su turno para jugar. El juego continúa de manera ordenada para garantizar la equidad. Durante cada turno, los jugadores pueden realizar una acción específica, como robar cartas, jugar combinaciones o pasar. Respetar el turno es esencial para evitar sanciones.',
      image: 'assets/img/img4.jpg'
    },
    {
      title: 'Final del juego',
      description: 'El juego termina después de un número predeterminado de rondas o cuando se cumple una condición especial. El jugador con menos puntos al final será el ganador. Además, las condiciones especiales pueden incluir el uso de cartas clave o el cumplimiento de reglas específicas que añaden un elemento sorpresa.',
      image: 'assets/img/img5.jpg'
    }
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
