import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnterpriseCountCardComponent } from './enterprise-count-card.component';

describe('EnterpriseCountCardComponent', () => {
  let component: EnterpriseCountCardComponent;
  let fixture: ComponentFixture<EnterpriseCountCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnterpriseCountCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnterpriseCountCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
