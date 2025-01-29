import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';  // Asegúrate de importar RouterModule
import { TablaAvanzadaComponent } from './tabla-avanzada/tabla-avanzada.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,  // Asegúrate de incluir RouterModule aquí
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Grupo1ProyectoU1';
}
