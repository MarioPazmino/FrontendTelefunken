import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();

  isRegister: boolean = false;
  username: string = '';
  password: string = '';
  email: string = '';
  emailExists: boolean = false;
  isSubmitted: boolean = false;
  errorMessage: string = '';

  emailError: string = '';
  passwordError: string = '';
  usernameError: string = '';
  usernameExists: boolean = false;
  suggestedUsernames: string[] = [];
  showSuggestions: boolean = false;
  private usernameSubject = new Subject<string>();

  constructor(private authService: AuthService, private router: Router) {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/game-interface']);
    }

    this.usernameSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(username => {
      this.checkUsernameExistence(username);
    });
  }

  validateEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailPattern.test(email);
  }

  validatePassword(password: string): boolean {
    return password.length >= 4;
  }

  checkUsernameExistence(username: string) {
    if (this.isRegister && username) {
      this.authService.checkUsernameExists(username).subscribe({
        next: (response) => {
          this.usernameExists = response.exists;
          if (response.exists) {
            this.usernameError = 'Este nombre de usuario ya está en uso';
            this.suggestedUsernames = response.suggestions || [];
            this.showSuggestions = this.suggestedUsernames.length > 0;
          } else {
            this.usernameError = '';
            this.showSuggestions = false;
          }
        },
        error: (err) => console.error('Error al verificar el nombre de usuario:', err)
      });
    }
  }

  selectSuggestedUsername(username: string) {
    this.username = username;
    this.showSuggestions = false;
    this.usernameExists = false;
    this.usernameError = '';
  }

  onEmailChange() {
    if (this.email && !this.validateEmail(this.email)) {
      this.emailError = 'Por favor, introduce un correo electrónico válido';
    } else {
      this.emailError = '';
      this.checkEmailExistence();
    }
  }

  onPasswordChange() {
    this.passwordError = this.password && !this.validatePassword(this.password)
      ? 'La contraseña debe tener al menos 4 caracteres'
      : '';
  }

  onUsernameChange() {
    if (this.username) {
      this.usernameSubject.next(this.username);
    } else {
      this.usernameError = '';
    }
  }

  closeModal() {
    this.resetForm();
    this.close.emit();
  }

  toggleRegister() {
    this.isRegister = !this.isRegister;
    this.resetForm();
  }

  onSubmit() {
    this.isSubmitted = true;
    this.errorMessage = '';

    if (this.isRegister && (!this.validateEmail(this.email) || !this.validatePassword(this.password))) {
      this.errorMessage = 'Verifica tu correo y contraseña';
      return;
    }

    if (this.isRegister) {
      // Primero verificamos si el username ya existe antes de intentar registrar
      this.authService.checkUsernameExists(this.username).subscribe({
        next: (response) => {
          if (response.exists) {
            this.usernameExists = true;
            this.usernameError = 'Este nombre de usuario ya está en uso';
            this.suggestedUsernames = response.suggestions || [];
            this.showSuggestions = this.suggestedUsernames.length > 0;
          } else {
            // Si el username no existe, procedemos con el registro
            const user = { email: this.email, username: this.username, password: this.password };
            this.authService.register(user).subscribe({
              next: () => {
                this.closeModal();
                this.router.navigate(['/game-interface']);
              },
              error: (err) => {
                this.errorMessage = err.error?.error || 'Error al registrar';
                if (err.status === 400) this.emailExists = true;
              },
            });
          }
        },
        error: (err) => console.error('Error al verificar el nombre de usuario:', err),
      });
    } else {
      // Para el login no necesitamos verificar el username, solo enviamos los datos
      const loginData = { username: this.username, password: this.password };
      this.authService.login(loginData).subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token);
          this.closeModal();
          this.router.navigate(['/game-interface']);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Credenciales inválidas';
        },
      });
    }
  }


  isFormValid() {
    if (this.isRegister) {
      return this.email && this.validateEmail(this.email) &&
        this.username && !this.usernameExists &&
        this.password && this.validatePassword(this.password) && !this.emailExists;
    } else {
      return this.username && this.password && this.validatePassword(this.password);
    }
  }

  checkEmailExistence() {
    if (this.isRegister && this.email && this.validateEmail(this.email)) {
      this.authService.checkEmailExists(this.email).subscribe({
        next: (response) => {
          this.emailExists = response.exists;
        },
        error: (err) => console.error('Error al verificar el correo:', err)
      });
    }
  }

  private resetForm() {
    this.username = '';
    this.password = '';
    this.email = '';
    this.emailExists = false;
    this.usernameExists = false;
    this.isSubmitted = false;
    this.errorMessage = '';
    this.emailError = '';
    this.passwordError = '';
    this.usernameError = '';
  }
}
