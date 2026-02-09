import { Injectable, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRouteSnapshot, CanActivateFn, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { AlertsComponent } from '@components/alerts/alerts.component';
import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { Observable } from 'rxjs';
import { SecurityService } from '../services/security/security.service';
import { AdminService } from 'src/app/admin/admin.service';
import { CommonService } from '../services/commom/common.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard{

  isLoading:boolean = false;
  loginUserData: any;

  constructor(
    private translate: TranslateService,
    private tokenStorageService: TokenStorageService,
    private router: Router,
    public dialog: MatDialog,
    private securityService: SecurityService,
    private adminService: AdminService,
    private commonService: CommonService
  ) { 
  }

  async getLoginUserDetails() {
    try {
      if (this.loginUserData) {
        return;
      }
      this.isLoading = true;
      const defaultCondition: any = { filters: [] };
      const encryptedData = await this.securityService.encrypt({ defaultCondition }).toPromise();
      const response: any = await this.adminService.loginUser({ payload: encryptedData.encryptedText }).toPromise();
      const decryptResponse = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      if (decryptResponse) this.loginUserData = decryptResponse.data[0];
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'SidebarComponent' });
    } finally {
      this.isLoading = false;
    }
  }

   private checkAccess(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (route.data && route.data['roles']) {
      this.getLoginUserDetails();
      for (const allowedRole of route.data['roles']) {
        if ((this.loginUserData?.userType.toUpperCase() ?? this.tokenStorageService?.getUser()?.userType.toUpperCase())  === allowedRole.toUpperCase()) {
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

