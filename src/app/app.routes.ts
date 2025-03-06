import { Routes } from '@angular/router';
import { InicioComponent } from './inicio/inicio.component';
import { GameInterfaceComponent } from './game-interface/game-interface.component';
import { SalaEsperaComponent } from './sala-espera/sala-espera.component';
import { GameTableComponent } from './game-table/game-table.component';


export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'game-interface', component: GameInterfaceComponent },
  { path: 'sala-espera/:gameId', component: SalaEsperaComponent },
  { path: 'game-table/:gameId/:gameCode', component: GameTableComponent }, // Agregar gameCode como parámetro
];
