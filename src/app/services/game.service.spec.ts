import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GameService } from './game.service';
import { AuthService } from './auth.service';

describe('GameService', () => {
  let service: GameService;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    // Crear un mock del AuthService si tu GameService lo necesita
    authServiceMock = jasmine.createSpyObj('AuthService', ['getToken', 'getUsername']);
    authServiceMock.getToken.and.returnValue('fake-token');
    authServiceMock.getUsername.and.returnValue('testUser');

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule // Importar HttpClientTestingModule para las pruebas
      ],
      providers: [
        GameService,
        { provide: AuthService, useValue: authServiceMock } // Proporcionar el mock de AuthService
      ]
    });
    
    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});