import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http'; // Importa el proveedor
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Proveedor de rutas
    provideHttpClient(),  // Proveedor global de HttpClient
  ],
}).catch(err => console.error(err));
