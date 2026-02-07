import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscoveryLayoutComponent } from './discovery-layout.component';

describe('DiscoveryLayoutComponent', () => {
  let component: DiscoveryLayoutComponent;
  let fixture: ComponentFixture<DiscoveryLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscoveryLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscoveryLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
