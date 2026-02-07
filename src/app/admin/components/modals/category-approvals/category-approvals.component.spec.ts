import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryApprovalsComponent } from './category-approvals.component';

describe('CategoryApprovalsComponent', () => {
  let component: CategoryApprovalsComponent;
  let fixture: ComponentFixture<CategoryApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoryApprovalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
