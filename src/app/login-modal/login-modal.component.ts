import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
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
  name: string = '';
  email: string = '';
  emailExists: boolean = false;
  isSubmitted: boolean = false;
  errorMessage: string = '';
  
  // Propiedades para validaciones
  emailError: string = '';
  passwordError: string = '';
  usernameError: string = '';
  usernameExists: boolean = false;
  suggestedUsernames: string[] = [];
  private usernameSubject = new Subject<string>();

  constructor(private authService: AuthService, private router: Router) {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/dashboard']);
    }

    // Configurar el debounce para la verificación de username
    this.usernameSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(username => {
      this.checkUsernameExistence(username);
    });
  }

  // Validación de email
  validateEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailPattern.test(email);
  }

  // Validación de contraseña
  validatePassword(password: string): boolean {
    return password.length >= 4;
  }

  // Generar sugerencias de username basadas en el nombre
  generateUsernameSuggestions(name: string): string[] {
    const suggestions: string[] = [];
    const baseName = name.toLowerCase().replace(/\s+/g, '');
    
    suggestions.push(baseName);
    suggestions.push(`${baseName}${Math.floor(Math.random() * 100)}`);
    suggestions.push(`${baseName}_${Math.floor(Math.random() * 100)}`);
    suggestions.push(`${baseName}${new Date().getFullYear()}`);
    suggestions.push(`${baseName.charAt(0)}${baseName.slice(-1)}${Math.floor(Math.random() * 1000)}`);
    
    return suggestions;
  }

  // Verificar si el username existe
  checkUsernameExistence(username: string) {
    if (this.isRegister && username) {
      this.authService.checkUsernameExists(username).subscribe({
        next: (response) => {
          this.usernameExists = response.exists;
          if (response.exists) {
            this.usernameError = 'Este nombre de usuario ya está en uso';
            // Solo generar sugerencias si el usuario no fue seleccionado de las sugerencias
            if (this.suggestedUsernames.length === 0) {
              this.suggestedUsernames = this.generateUsernameSuggestions(this.name);
            }
          } else {
            this.usernameError = '';
            this.suggestedUsernames = []; // Limpiar sugerencias si el username es válido
          }
        },
        error: (err) => {
          console.error('Error al verificar el nombre de usuario:', err);
        }
      });
    }
  }

  // Validación de email en tiempo real
  onEmailChange() {
    if (this.email) {
      if (!this.validateEmail(this.email)) {
        this.emailError = 'Por favor, introduce un correo electrónico válido';
      } else {
        this.emailError = '';
        this.checkEmailExistence();
      }
    } else {
      this.emailError = '';
    }
  }

  // Validación de contraseña en tiempo real
  onPasswordChange() {
    if (this.password) {
      if (!this.validatePassword(this.password)) {
        this.passwordError = 'La contraseña debe tener al menos 4 caracteres';
      } else {
        this.passwordError = '';
      }
    } else {
      this.passwordError = '';
    }
  }

  // Actualización cuando cambia el nombre
  onNameChange() {
    if (this.isRegister && this.name) {
      this.suggestedUsernames = this.generateUsernameSuggestions(this.name);
    }
  }

  // Actualización cuando cambia el username
  onUsernameChange() {
    if (this.username) {
      this.usernameSubject.next(this.username);
    } else {
      this.usernameError = '';
      this.suggestedUsernames = [];
    }
  }

  // Seleccionar username sugerido
  selectSuggestedUsername(username: string) {
    this.username = username;
    this.suggestedUsernames = []; // Limpiar las sugerencias al seleccionar una
    this.checkUsernameExistence(username);
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

    // Validaciones antes de enviar
    if (this.isRegister && !this.validateEmail(this.email)) {
      this.errorMessage = 'Por favor, introduce un correo electrónico válido';
      return;
    }

    if (!this.validatePassword(this.password)) {
      this.errorMessage = 'La contraseña debe tener al menos 4 caracteres';
      return;
    }

    if (this.isRegister) {
      const user = {
        name: this.name,
        email: this.email,
        username: this.username,
        password: this.password,
      };

      this.authService.register(user).subscribe({
        next: (response) => {
          console.log('Usuario registrado:', response);
          this.closeModal();
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Error al registrar usuario:', err);
          this.errorMessage = err.error?.error || 'Error al registrar. Intente nuevamente.';
          if (err.status === 400) {
            this.emailExists = true;
          }
        },
      });
    } else {
      const loginData = {
        username: this.username,
        password: this.password,
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          console.log('Inicio de sesión exitoso:', response);
          localStorage.setItem('token', response.token);
          this.closeModal();
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Error al iniciar sesión:', err);
          this.errorMessage = err.error?.error || 'Credenciales inválidas. Intente nuevamente.';
        },
      });
    }
  }

  isFormValid() {
    if (this.isRegister) {
      return this.name && 
             this.email && 
             this.validateEmail(this.email) && 
             this.username && 
             !this.usernameExists &&
             this.password && 
             this.validatePassword(this.password) && 
             !this.emailExists;
    } else {
      return this.username && 
             this.password && 
             this.validatePassword(this.password);
    }
  }

  checkEmailExistence() {
    if (this.isRegister && this.email && this.validateEmail(this.email)) {
      this.authService.checkEmailExists(this.email).subscribe({
        next: (response) => {
          this.emailExists = response.exists;
        },
        error: (err) => {
          console.error('Error al verificar el correo:', err);
        },
      });
    }
  }

  private resetForm() {
    this.username = '';
    this.password = '';
    this.name = '';
    this.email = '';
    this.emailExists = false;
    this.usernameExists = false;
    this.isSubmitted = false;
    this.errorMessage = '';
    this.emailError = '';
    this.passwordError = '';
    this.usernameError = '';
    this.suggestedUsernames = [];
  }
}