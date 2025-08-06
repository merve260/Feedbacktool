import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RadioModalComponent } from './radio-modal.component';

describe('RadioModalComponent', () => {
  let component: RadioModalComponent;
  let fixture: ComponentFixture<RadioModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadioModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RadioModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
