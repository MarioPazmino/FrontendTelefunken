import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GameInterfaceComponent } from './game-interface.component';

describe('GameInterfaceComponent', () => {
  let component: GameInterfaceComponent;
  let fixture: ComponentFixture<GameInterfaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GameInterfaceComponent,
        HttpClientTestingModule // Añadir el HttpClientTestingModule aquí
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});