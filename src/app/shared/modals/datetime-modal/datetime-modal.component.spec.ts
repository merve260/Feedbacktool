import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatetimeModalComponent } from './datetime-modal.component';

describe('DatetimeModalComponent', () => {
  let component: DatetimeModalComponent;
  let fixture: ComponentFixture<DatetimeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatetimeModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatetimeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
