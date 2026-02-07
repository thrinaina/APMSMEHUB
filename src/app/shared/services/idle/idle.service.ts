import { Injectable, inject, NgZone, signal } from '@angular/core';
import { fromEvent, merge, Subscription, timer, Subject } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { AuthService } from '@auth/auth.service';
import { TokenStorageService } from '@shared/services/token-storage/token-storage.service';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class IdleService {
  private authService = inject(AuthService);
  private tokenStorageService = inject(TokenStorageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);

  private idleSubscription?: Subscription;

  // Timings in milliseconds
  private readonly IDLE_TIME = 29 * 60 * 1000;    // 29 minutes
  private readonly WARNING_TIME = 60 * 1000;      // 60 seconds

  // UI Signals
  showWarning = signal<boolean>(false);
  countdown = signal<number>(60);

  startTracking() {
    
    // Ensure we don't have multiple listeners if called twice
    this.stopTracking();

    this.ngZone.runOutsideAngular(() => {
      const activityEvents$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'click'),
        fromEvent(document, 'keydown')
      );

      this.idleSubscription = activityEvents$
        .pipe(
          // Restart the 14-minute timer on every activity
          switchMap(() => timer(this.IDLE_TIME)),
          tap(() => {
            this.ngZone.run(() => this.displayWarning());
          })
        )
        .subscribe();
    });
  }

  private displayWarning() {
    if(this.tokenStorageService.isLoggedIn()) {
      this.showWarning.set(true);
      this.countdown.set(60);
    }

    // Start a 60-second countdown for the modal
    const interval = setInterval(async () => {
      this.countdown.update(val => val - 1);

      if (this.countdown() <= 0) {
        clearInterval(interval);
        if (this.showWarning()) {
          await this.authService.inactiveSessions(this.tokenStorageService.getUser(), false, "Logout");
          this.tokenStorageService.signOut();
          this.stayLoggedIn();
          this.router.navigate(["/"], { relativeTo: this.route });
        }
      }
    }, 1000);
  }

  stayLoggedIn() {
    this.showWarning.set(false);
    // The main activityEvents$ pipe will automatically restart
    // because this button click is a 'click' event.
  }

  stopTracking() {
    this.idleSubscription?.unsubscribe();
  }
}
