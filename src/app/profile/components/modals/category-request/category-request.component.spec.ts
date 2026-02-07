import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryRequestComponent } from './category-request.component';

describe('CategoryRequestComponent', () => {
  let component: CategoryRequestComponent;
  let fixture: ComponentFixture<CategoryRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoryRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
