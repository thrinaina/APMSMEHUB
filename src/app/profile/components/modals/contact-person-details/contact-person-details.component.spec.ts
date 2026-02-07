import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactPersonDetailsComponent } from './contact-person-details.component';

describe('ContactPersonDetailsComponent', () => {
  let component: ContactPersonDetailsComponent;
  let fixture: ComponentFixture<ContactPersonDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContactPersonDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactPersonDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
