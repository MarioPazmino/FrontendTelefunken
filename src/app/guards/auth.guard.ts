import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Verificamos si el usuario está autenticado
    return this.authService.isUserLoggedIn().pipe(
      map(isLoggedIn => {
        if (isLoggedIn) {
          return true; // Si está autenticado, permite el acceso
        } else {
          // Si no está autenticado, redirige al inicio o alguna otra página
          this.router.navigate(['/inicio']);
          return false; // Deniega el acceso
        }
      })
    );
  }
}
