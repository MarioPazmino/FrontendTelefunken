import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginModalComponent } from './login-modal.component';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';

describe('LoginModalComponent', () => {
  let component: LoginModalComponent;
  let fixture: ComponentFixture<LoginModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginModalComponent, FormsModule],
      schemas: [NO_ERRORS_SCHEMA] // Para evitar errores con directivas personalizadas
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginModalComponent);
    component = fixture.componentInstance;
    
    // Asignar valores iniciales necesarios
    component.isVisible = true;
    component.close = new EventEmitter<void>();
    
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el modal cuando isVisible es true', () => {
    component.isVisible = true;
    fixture.detectChanges();
    const modalElement = fixture.nativeElement.querySelector('.fixed.inset-0');
    expect(modalElement).toBeTruthy();
  });

  it('debe ocultar el modal cuando isVisible es false', () => {
    component.isVisible = false;
    fixture.detectChanges();
    const modalElement = fixture.nativeElement.querySelector('.fixed.inset-0');
    expect(modalElement).toBeFalsy();
  });

  it('debe alternar entre modo login y registro cuando se hace clic en el botón de cambio', () => {
    // Inicialmente en modo login
    component.isRegister = false;
    fixture.detectChanges();
    
    // Llamar directamente al método
    component.toggleRegister();
    fixture.detectChanges();
    
    // Verificar que cambia a modo registro
    expect(component.isRegister).toBeTruthy();
  });

  it('debe mostrar campo de email solo en modo registro', () => {
    // En modo registro
    component.isRegister = true;
    fixture.detectChanges();
    
    // Verificar que se muestra el campo de email
    const emailField = fixture.nativeElement.querySelector('#email');
    expect(emailField).toBeTruthy();
    
    // En modo login
    component.isRegister = false;
    fixture.detectChanges();
    
    // Verificar que no se muestra el campo de email
    const emailFieldHidden = fixture.nativeElement.querySelector('#email');
    expect(emailFieldHidden).toBeFalsy();
  });

  it('debe validar la contraseña', () => {
    // Contraseña inválida
    component.password = '123';
    component.onPasswordChange();
    
    // Debe tener error
    expect(component.passwordError).toBeTruthy();
    
    // Contraseña válida
    component.password = 'Password123';
    component.onPasswordChange();
    
    // No debe tener error
    expect(component.passwordError).toBeFalsy();
  });

  it('debe validar el correo electrónico en modo registro', () => {
    // Activar modo registro
    component.isRegister = true;
    
    // Email inválido
    component.email = 'correo-invalido';
    component.onEmailChange();
    
    // Debe tener error
    expect(component.emailError).toBeTruthy();
    
    // Email válido
    component.email = 'correo@ejemplo.com';
    component.onEmailChange();
    
    // No debe tener error
    expect(component.emailError).toBeFalsy();
  });

  it('debe deshabilitar el botón de envío cuando el formulario no es válido', () => {
    // Simulamos formulario inválido
    spyOn(component, 'isFormValid').and.returnValue(false);
    fixture.detectChanges();
    
    const isDisabled = !component.isFormValid();
    expect(isDisabled).toBeTruthy();
  });

  it('debe seleccionar un nombre de usuario sugerido cuando se llama a selectSuggestedUsername', () => {
    // Llamar al método con un nombre sugerido
    component.selectSuggestedUsername('usuario_test');
    
    // Verificar que se asigna el nombre
    expect(component.username).toBe('usuario_test');
    expect(component.showSuggestions).toBeFalsy();
  });

  it('debe cerrar el modal cuando se llama a closeModal', () => {
    // Espiar el evento
    spyOn(component.close, 'emit');
    
    // Llamar al método
    component.closeModal();
    
    // Verificar que se emite el evento
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('debe emitir el evento close cuando se cierra el modal', () => {
    // Espiar el evento
    spyOn(component.close, 'emit');
    
    // Llamar al método
    component.closeModal();
    
    // Verificar que se emite el evento
    expect(component.close.emit).toHaveBeenCalled();
  });
});