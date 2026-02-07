import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUdyamComponent } from './add-udyam.component';

describe('AddUdyamComponent', () => {
  let component: AddUdyamComponent;
  let fixture: ComponentFixture<AddUdyamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddUdyamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUdyamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
