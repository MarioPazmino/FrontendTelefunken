import { Routes } from '@angular/router';
import { InicioComponent } from './inicio/inicio.component';
import { GameInterfaceComponent } from './game-interface/game-interface.component';
import { SalaEsperaComponent } from './sala-espera/sala-espera.component';
import { TablaAvanzadaComponent } from './tabla-avanzada/tabla-avanzada.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard'; // Asegúrate de que el AuthGuard esté bien configurado

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'game-interface', component: GameInterfaceComponent },
  { path: 'sala-espera/:gameId', component: SalaEsperaComponent },
  { path: 'tabla-avanzada/:matchId', component: TablaAvanzadaComponent },

  // Ruta protegida para el dashboard solo para usuarios registrados
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
];
