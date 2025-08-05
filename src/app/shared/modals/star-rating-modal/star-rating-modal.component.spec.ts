import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StarRatingModalComponent } from './star-rating-modal.component';

describe('StarRatingModalComponent', () => {
  let component: StarRatingModalComponent;
  let fixture: ComponentFixture<StarRatingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StarRatingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
