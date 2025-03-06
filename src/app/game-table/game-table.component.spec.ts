import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GameTableComponent } from './game-table.component';
import { GameSessionService } from '../services/game-session.service';
import { AuthService } from '../services/auth.service';

describe('GameTableComponent', () => {
  let component: GameTableComponent;
  let fixture: ComponentFixture<GameTableComponent>;
  let gameSessionServiceMock: jasmine.SpyObj<GameSessionService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // Crear mocks para los servicios
    authServiceMock = jasmine.createSpyObj('AuthService', ['getToken', 'getUsername']);
    authServiceMock.getToken.and.returnValue('fake-token');
    authServiceMock.getUsername.and.returnValue('testUser');

    gameSessionServiceMock = jasmine.createSpyObj('GameSessionService', [
      
    ]);

    await TestBed.configureTestingModule({
      imports: [
        GameTableComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: GameSessionService, useValue: gameSessionServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});