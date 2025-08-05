import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DragDropModalComponent } from './drag-drop-modal.component';

describe('DragDropModalComponent', () => {
  let component: DragDropModalComponent;
  let fixture: ComponentFixture<DragDropModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DragDropModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DragDropModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
