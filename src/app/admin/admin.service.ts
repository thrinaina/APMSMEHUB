import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from '../shared/services/token-storage/token-storage.service';

const API_ADMIN_URL = environment.apiUrl + 'api/admin/';
@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(
    private http: HttpClient,
    private tokenStorageService: TokenStorageService
  ) { }

  private objParam = new BehaviorSubject<any>({
    Id: 0
  });

  setObjParam(paramId: any) {
    this.objParam.next({ Id: paramId });
  }

  getObjParam() {
    return this.objParam.asObservable();
  }

  user(userData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'user', userData);
  }

  users(userData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'users', userData);
  }

  loginUser(userData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'loginuser', userData);
  }

  userMenuRoles(userMenuRoles: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'usermenuroles', userMenuRoles);
  }

  userRoleAssignments(userRoleAssignmentsData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'userroleassignments', userRoleAssignmentsData);
  }

  userRoleAssignment(userRoleAssignmentsData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'userroleassignment', userRoleAssignmentsData);
  }

  category(categoryData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'category', categoryData);
  }

  categories(categoryData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'categories', categoryData);
  }

  userMenu(userMenuData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'usermenu', userMenuData);
  }

  requests(requestData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'requests', requestData);
  }

  requeststatus(requestData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'requeststatus', requestData);
  }

  profiles(profileData: any): Observable<any> {
  return this.http.post(API_ADMIN_URL + 'profiles', profileData);
  }

  profileStatus(profileData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'profileStatus', profileData);
  }

  enterpriseStatus(enterpriseData: any): Observable<any> {
    return this.http.post(API_ADMIN_URL + 'enterpriseStatus', enterpriseData);
  }
}

