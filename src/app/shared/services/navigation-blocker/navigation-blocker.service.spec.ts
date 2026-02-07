import { TestBed } from '@angular/core/testing';

import { NavigationBlockerService } from './navigation-blocker.service';

describe('NavigationBlockerService', () => {
  let service: NavigationBlockerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationBlockerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
