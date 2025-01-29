import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaAvanzadaComponent } from './tabla-avanzada.component';

describe('TablaAvanzadaComponent', () => {
  let component: TablaAvanzadaComponent;
  let fixture: ComponentFixture<TablaAvanzadaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaAvanzadaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaAvanzadaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
