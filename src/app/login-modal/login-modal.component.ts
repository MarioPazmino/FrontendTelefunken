import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Importa el AuthService

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
  errorMessage: string = ''; // Manejo de errores

  constructor(private authService: AuthService, private router: Router) {
    // Verifica si el usuario ya está autenticado al cargar el componente
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/dashboard']); // Si ya tiene un token, redirige automáticamente al dashboard
    }
  }

  closeModal() {
    this.resetForm();
    this.close.emit();
  }

  toggleRegister() {
    this.isRegister = !this.isRegister;
    this.errorMessage = ''; // Limpia mensajes de error
  }

  onSubmit() {
    this.isSubmitted = true;
    this.errorMessage = ''; // Reinicia el mensaje de error

    if (this.isRegister) {
      const user = {
        name: this.name,
        email: this.email,
        username: this.username,
        password: this.password,
      };

      // Solicitud para registrar al usuario
      this.authService.register(user).subscribe({
        next: (response) => {
          console.log('Usuario registrado:', response);
          this.closeModal();
          this.router.navigate(['/dashboard']); // Redirige al dashboard
        },
        error: (err) => {
          console.error('Error al registrar usuario:', err);
          this.errorMessage = err.error?.error || 'Error al registrar. Intente nuevamente.';
          if (err.status === 400) {
            this.emailExists = true; // Manejo de correos duplicados
          }
        },
      });
    } else {
      // Validar credenciales de inicio de sesión
      const loginData = {
        username: this.username,
        password: this.password,
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          console.log('Inicio de sesión exitoso:', response);
          localStorage.setItem('token', response.token); // Guarda el token JWT en localStorage
          this.closeModal();
          this.router.navigate(['/dashboard']); // Redirige al dashboard
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
      return this.name && this.email && this.username && this.password && !this.emailExists;
    } else {
      return this.username && this.password;
    }
  }

  checkEmailExistence() {
    if (this.isRegister && this.email) {
      // Aquí deberías implementar la lógica para verificar si el correo ya existe
      // Puedes hacer una solicitud GET a tu API para verificar si el correo ya está registrado
      // Por ejemplo:
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
    this.isSubmitted = false;
    this.errorMessage = '';
  }
}
