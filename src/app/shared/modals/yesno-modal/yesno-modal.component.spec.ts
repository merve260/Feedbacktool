import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YesnoModalComponent } from './yesno-modal.component';

describe('YesnoModalComponent', () => {
  let component: YesnoModalComponent;
  let fixture: ComponentFixture<YesnoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YesnoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YesnoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
