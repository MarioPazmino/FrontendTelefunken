import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GameSessionService } from './game-session.service';
import { AuthService } from './auth.service';

describe('GameSessionService', () => {
  let service: GameSessionService;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    // Crear un mock para AuthService
    authServiceMock = jasmine.createSpyObj('AuthService', ['getToken', 'getUsername']);
    authServiceMock.getToken.and.returnValue('fake-token');
    authServiceMock.getUsername.and.returnValue('testUser');

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule // Importar HttpClientTestingModule para las pruebas
      ],
      providers: [
        GameSessionService,
        { provide: AuthService, useValue: authServiceMock } // Proporcionar el mock de AuthService
      ]
    });
    
    service = TestBed.inject(GameSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});