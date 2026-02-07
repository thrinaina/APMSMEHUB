import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRouteSnapshot, CanActivateFn, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { AlertsComponent } from '@components/alerts/alerts.component';
import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(
    private translate: TranslateService,
    private tokenStorageService: TokenStorageService,
    private router: Router,
    public dialog: MatDialog,
  ) { }

  private checkAccess(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (route.data && route.data['roles']) {
      const userType = this.tokenStorageService.getUser()?.userType;
      for (const allowedRole of route.data['roles']) {
        if (userType.toUpperCase() === allowedRole.toUpperCase()) {
          return true;
        }
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        data: {
          type: 'error-type',
          title: this.translate.instant('Common.AccessDenied'),
          message: this.translate.instant('Common.AccessNotAllowed'),
        },
        width: '300px',
      });
      this.router.navigate(['/'])
      this.tokenStorageService.signOut();
    }

    return true;
  }

  public canActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    if (this.tokenStorageService.isLoggedIn() !== true) {
      const dialogRef = this.dialog.open(AlertsComponent, {
        data: {
          type: 'error-type',
          title: this.translate.instant('Common.AccessDenied'),
          message: this.translate.instant('Common.AccessNotAllowed'),
        },
        width: '300px',
      });
      this.router.navigate(['/']);
      return false;
    } else {
      return this.checkAccess(route, state);
    }
  }

  public canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkAccess(childRoute, state);
  }

  canDeactivate(
    component: unknown,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return true;
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return true;
  }
}

