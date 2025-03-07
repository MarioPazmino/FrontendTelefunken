import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InicioComponent } from './inicio.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('InicioComponent', () => {
  let component: InicioComponent;
  let fixture: ComponentFixture<InicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // Para manejar elementos personalizados
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe abrir el modal de invitado al hacer clic en "Iniciar Nuevo Juego"', () => {
    // Arrange
    spyOn(component, 'openGuestModal');
    const button = fixture.nativeElement.querySelector('.hero button');
    
    // Act
    button.click();
    
    // Assert
    expect(component.openGuestModal).toHaveBeenCalled();
  });

  it('debe abrir el modal de inicio de sesión al hacer clic en "Iniciar Sesión"', () => {
    // Arrange
    spyOn(component, 'openModal');
    const loginLink = fixture.nativeElement.querySelector('nav ul li:nth-child(2) a');
    
    // Act
    loginLink.click();
    
    // Assert
    expect(component.openModal).toHaveBeenCalled();
  });

  it('debe mostrar el título correcto en la sección hero', () => {
    // Arrange
    component.title = 'Telefunken Online';
    fixture.detectChanges();
    
    // Act
    const titleElement = fixture.nativeElement.querySelector('.hero h1');
    
    // Assert
    expect(titleElement.textContent).toContain(component.title);
  });

  it('debe tener un título definido', () => {
    expect(component.title).toBeDefined();
  });

  it('debe renderizar las reglas del juego correctamente', () => {
    // Arrange
    component.rules = [
      { title: 'Regla 1', description: 'Descripción 1', image: 'imagen1.jpg' }
    ];
    fixture.detectChanges();
    
    // Act
    const ruleCards = fixture.nativeElement.querySelectorAll('.rule-card');
    
    // Assert
    expect(ruleCards.length).toBe(component.rules.length);
  });

  it('debe inicializar modales como no visibles', () => {
    expect(component.isModalVisible).toBeFalsy();
    expect(component.isGuestModalVisible).toBeFalsy();
  });

  it('debe abrir el modal de inicio de sesión al llamar openModal()', () => {
    // Act
    component.openModal();
    
    // Assert
    expect(component.isModalVisible).toBeTruthy();
  });

  it('debe cerrar el modal de inicio de sesión al llamar closeModal()', () => {
    // Arrange
    component.isModalVisible = true;
    
    // Act
    component.closeModal();
    
    // Assert
    expect(component.isModalVisible).toBeFalsy();
  });

  it('debe abrir el modal de invitado al llamar openGuestModal()', () => {
    // Act
    component.openGuestModal();
    
    // Assert
    expect(component.isGuestModalVisible).toBeTruthy();
  });

  it('debe cerrar el modal de invitado al llamar closeGuestModal()', () => {
    // Arrange
    component.isGuestModalVisible = true;
    
    // Act
    component.closeGuestModal();
    
    // Assert
    expect(component.isGuestModalVisible).toBeFalsy();
  });
});