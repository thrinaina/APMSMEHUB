import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Widget } from 'src/app/dashboard/configurable-dashboard/configurable-dashboard.model';
import { signal } from '@angular/core';

// Browser
const BROWSER_KEY = 'Browser Name';
const IPADDRESS_KEY = 'IP Address';
const APP_LANGUAGE = 'Language';

// Auth

// Menu
const MENU_STATUS = 'COLLAPSE';

// Roles
const ROLE_KEY = 'roleName';
const ROLEID_KEY = 'roleId';
const USER_ROLES = 'userRoles';

// Token
const TOKEN_KEY = 'auth-token';
// const REFRESHTOKEN_KEY = 'auth-refreshtoken';

// User
const USER_KEY = 'auth-user';
const USERNAME_KEY = 'User Name';
const LOGO_IMAGE = 'Logo-Image';

// Session
const LASTSESSION_KEY = 'lastSession';

const DASHBOARDWIDGETS = 'dashboardWidgets';
const DASHBOARDWIDGETSORDER = 'dashboardWidgetsOrder';

const UDYAMREGISTRATIONNO_KEY = 'udyamRegistrationNo';


@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  loggedInEvent = new Subject<boolean>();

  private dashboardWidgetsObj = new BehaviorSubject<any>([]);

  private objParamObject = new BehaviorSubject<any>({
    obj: {}
  });

  private udyamChangeSubject = new BehaviorSubject<boolean>(false);
  public udyamChanged: any = this.udyamChangeSubject.asObservable();

  constructor() { }

  // Browser

  public saveBrowserName(browserName: string): void {
    window.sessionStorage.removeItem(BROWSER_KEY);
    window.sessionStorage.setItem(BROWSER_KEY, browserName);
  }

  public getBrowserName(): string | null {
    return window.sessionStorage.getItem(BROWSER_KEY);
  }

  public saveIPAddress(ipAddress: string): void {
    window.sessionStorage.removeItem(IPADDRESS_KEY);
    window.sessionStorage.setItem(IPADDRESS_KEY, ipAddress);
  }

  public getIPAddress(): string | null {
    return window.sessionStorage.getItem(IPADDRESS_KEY);
  }

  public saveAppLanguage(lang: string) {
    window.sessionStorage.removeItem(APP_LANGUAGE);
    window.sessionStorage.setItem(APP_LANGUAGE, lang);
  }

  public getAppLanguage(): string {
    return window.sessionStorage.getItem(APP_LANGUAGE) || 'en';
  }

  // Auth

  private loggedInSignal = signal<boolean>(false);
  public isLoggedInSignal = this.loggedInSignal.asReadonly();

  public updateLoginStatus(status: boolean) {
    this.loggedInSignal.set(status);
  }

  public isLoggedIn(): boolean {
    let authToken = window.sessionStorage.getItem(TOKEN_KEY);
    return (authToken !== null) ? true : false;
  }

  public signOut(): void {
    window.sessionStorage.clear();
    this.loggedInSignal.set(false);
  }

  // Token

  public saveToken(token: string): void {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
    this.loggedInSignal.set(true);

    const user = this.getUser();
    if (user.appUserId) {
      this.saveUser({ ...user, accessToken: token });
    }
  }

  public getToken(): string | null {
    return window.sessionStorage.getItem(TOKEN_KEY);
  }

  // public saveRefreshToken(token: string): void {
  //   window.sessionStorage.removeItem(REFRESHTOKEN_KEY);
  //   window.sessionStorage.setItem(REFRESHTOKEN_KEY, token);
  // }

  // public getRefreshToken(): string | null {
  //   return window.sessionStorage.getItem(REFRESHTOKEN_KEY);
  // }

  // User

  public saveUser(user: any): void {
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));

    window.sessionStorage.removeItem(USERNAME_KEY);
    window.sessionStorage.setItem(USERNAME_KEY, user['userName']);
  }

  public getUserName(): string | null {
    return window.sessionStorage.getItem(USERNAME_KEY);
  }

  public getUser(): any {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user);
    }
    return {};
  }

  // Role

  public saveRoleId(roleId: string): void {
    window.sessionStorage.removeItem(ROLEID_KEY);
    window.sessionStorage.setItem(ROLEID_KEY, roleId);
  }

  public getRoleId(): string | null {
    const roleId = window.sessionStorage.getItem(ROLEID_KEY);
    return roleId && JSON.parse(roleId);
  }

  public saveRoleName(roleName: string): void {
    window.sessionStorage.removeItem(ROLE_KEY);
    window.sessionStorage.setItem(ROLE_KEY, roleName);
  }

  public getRoleName(): string | null {
    return window.sessionStorage.getItem(ROLE_KEY);
  }

  public saveUserRoles(userRoles: string): void {
    window.sessionStorage.removeItem(USER_ROLES);
    window.sessionStorage.setItem(USER_ROLES, userRoles);
  }

  public getUserRoles(): string | null {
    return window.sessionStorage.getItem(USER_ROLES);
  }

  // User Session

  public saveLastSession(lastSession: any): void {
    window.sessionStorage.removeItem(LASTSESSION_KEY);
    window.sessionStorage.setItem(LASTSESSION_KEY, lastSession);
  }

  public getLastSession(): any {
    return window.sessionStorage.getItem(LASTSESSION_KEY);
  }

  // Dashboard

  public saveDashboardWidgets(dashboardWidgets: any): void {
    window.sessionStorage.removeItem(DASHBOARDWIDGETS);
    window.sessionStorage.setItem(DASHBOARDWIDGETS, JSON.stringify(dashboardWidgets));
  }
  public getDashboardWidgets(): any {
    const dashboardWidgets = window.sessionStorage.getItem(DASHBOARDWIDGETS);
    if (!dashboardWidgets || dashboardWidgets == "null") return [];
    else return JSON.parse(dashboardWidgets) as Widget[];
  }
  public saveDashboardWidgetsOrder(dashboardWidgetsOrder: any): void {
    window.sessionStorage.removeItem(DASHBOARDWIDGETSORDER);
    window.sessionStorage.setItem(DASHBOARDWIDGETSORDER, JSON.stringify(dashboardWidgetsOrder));
  }
  public getDashboardWidgetsOrder(): any {
    const dashboardWidgetsOrder = window.sessionStorage.getItem(DASHBOARDWIDGETSORDER);
    if (!dashboardWidgetsOrder || dashboardWidgetsOrder == "null") return [];
    else return JSON.parse(dashboardWidgetsOrder);
  }

  setDashboardWidgetsParamObj(widgetsParamObject: any) {
    this.dashboardWidgetsObj.next(widgetsParamObject);
  }

  getDashboardWidgetsParamObj() {
    return this.dashboardWidgetsObj.asObservable();
  }

  public saveMenuStatus(menuStatus: string): void {
    window.sessionStorage.removeItem(MENU_STATUS);
    window.sessionStorage.setItem(MENU_STATUS, menuStatus);
  }

  public getMenuStatus(): boolean {
    let menuStatus = window.sessionStorage.getItem(MENU_STATUS);
    return (menuStatus == 'EXPAND') ? true : false;
  }

  public saveLogoImage(user: any): void {
    window.sessionStorage.removeItem(LOGO_IMAGE);
    window.sessionStorage.setItem(LOGO_IMAGE, user['logoImagePath']);
  }

  public getLogoImage(): string | null {
    return window.sessionStorage.getItem(LOGO_IMAGE);
  }

  // Object Params
  setObjParamObject(paramObject: any) {
    this.objParamObject.next(paramObject);
  }

  getObjParamObject() {
    return this.objParamObject.asObservable();
  }

  public saveUdyamRegistrationNo(udyamRegistrationNo: string): void {
    window.sessionStorage.removeItem(UDYAMREGISTRATIONNO_KEY);
    window.sessionStorage.setItem(UDYAMREGISTRATIONNO_KEY, udyamRegistrationNo);
    this.udyamChangeSubject.next(true)
  }

  public getUdyamRegistrationNo(): string | null {
    return window.sessionStorage.getItem(UDYAMREGISTRATIONNO_KEY);
  }

}
