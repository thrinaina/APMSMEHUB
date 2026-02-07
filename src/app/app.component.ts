import { Component, DestroyRef, Injector } from '@angular/core';
import { IconService } from './shared/services/icon/icon.service';
import { IdleService } from './shared/services/idle/idle.service';
import { NavigationBlockerService } from './shared/services/navigation-blocker/navigation-blocker.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TokenStorageService } from '@shared/services/token-storage/token-storage.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: false
})
export class AppComponent {
  injector: Injector | undefined;
  destroyRef: DestroyRef | undefined;

  isLoading = false;

  constructor(
    private iconService: IconService,
    private blocker: NavigationBlockerService,
    private idleService: IdleService,
    private tokenStorageService: TokenStorageService,
  ) {
    this.iconService.registerIcons();
    this.blocker.enable();
    // Use the new Signal property, not the method
    toObservable(this.tokenStorageService.isLoggedInSignal, { injector: this.injector })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loggedIn) => {
        if (loggedIn) {
          this.idleService.startTracking();
        } else {
          this.idleService.stopTracking();
        }
      });
  }

  ngOnInit() {
    
  }

  ngOnDestroy() {
    this.idleService.stopTracking();
    this.blocker.disable();
  }

}
