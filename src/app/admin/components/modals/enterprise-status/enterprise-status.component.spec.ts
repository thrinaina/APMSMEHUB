import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnterpriseStatusComponent } from './enterprise-status.component';

describe('EnterpriseStatusComponent', () => {
  let component: EnterpriseStatusComponent;
  let fixture: ComponentFixture<EnterpriseStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnterpriseStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnterpriseStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
