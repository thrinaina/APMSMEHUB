import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileApprovalsComponent } from './profile-approvals.component';

describe('ProfileApprovalsComponent', () => {
  let component: ProfileApprovalsComponent;
  let fixture: ComponentFixture<ProfileApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileApprovalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
