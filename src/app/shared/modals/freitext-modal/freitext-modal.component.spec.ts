import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreitextModalComponent } from './freitext-modal.component';

describe('FreitextModalComponent', () => {
  let component: FreitextModalComponent;
  let fixture: ComponentFixture<FreitextModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreitextModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreitextModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
