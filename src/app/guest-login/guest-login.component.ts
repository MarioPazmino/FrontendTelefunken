import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-guest-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './guest-login.component.html',
  styleUrls: ['./guest-login.component.css']
})
export class GuestLoginComponent {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();

  username: string = '';
  errorMessage: string = '';
  suggestedUsernames: string[] = [];
  showSuggestions: boolean = false;
  usernameExists: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  closeModal() {
    this.username = '';
    this.errorMessage = '';
    this.close.emit();
  }


  checkUsernameExistence() {
    if (this.username.trim()) {
      this.authService.checkUsernameExists(this.username).subscribe({
        next: (response) => {
          this.usernameExists = response.exists;
          if (response.exists) {
            this.errorMessage = 'Este nombre de usuario ya está en uso';
            this.suggestedUsernames = response.suggestions || [];
            this.showSuggestions = this.suggestedUsernames.length > 0;
          } else {
            this.errorMessage = '';
            this.showSuggestions = false;
          }
        },
        error: (err) => console.error('Error al verificar el nombre de usuario:', err)
      });
    }
  }


  loginAsGuest() {
    if (!this.username.trim()) {
      this.errorMessage = 'El nombre de usuario es obligatorio';
      return;
    }

    // Verificar si el nombre de usuario ya existe antes de proceder
    this.authService.checkUsernameExists(this.username).subscribe({
      next: (response) => {
        this.usernameExists = response.exists;
        if (response.exists) {
          this.errorMessage = 'Este nombre de usuario ya está en uso';
          this.suggestedUsernames = response.suggestions || [];
          this.showSuggestions = this.suggestedUsernames.length > 0;
        } else {
          this.errorMessage = '';
          this.showSuggestions = false;

          // Si el username no existe, proceder con el registro
          this.authService.registerGuest(this.username).subscribe({
            next: (response) => {
              localStorage.setItem('token', response.token);
              this.closeModal();
              this.router.navigate(['/game-interface']);
            },
            error: (err) => {
              this.errorMessage = err.error?.error || 'Error al registrar invitado';
            },
          });
        }
      },
      error: (err) => console.error('Error al verificar el nombre de usuario:', err),
    });
  }


  // Añadir método para seleccionar una sugerencia
  selectSuggestedUsername(username: string) {
    this.username = username;
    this.showSuggestions = false;
    this.usernameExists = false;
    this.errorMessage = '';
  }


}
