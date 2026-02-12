import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from '../shared/services/token-storage/token-storage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EncryptionService } from '../shared/services/encryption/encryption.service';

const API_AUTH_URL = environment.apiUrl + 'api/auth/';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private tokenStorageService: TokenStorageService,
    private encryptionService: EncryptionService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  accessToken() {
    return this.tokenStorageService.getToken();
  }

  // Silent Refresh: Sends HttpOnly cookie automatically
  refreshAccessToken(): Observable<any> {
    const refreshToken = this.tokenStorageService.getRefreshToken();
    // Passing the refresh token in a custom header
    const headers = new HttpHeaders().set('x-refresh-token', refreshToken || '');
    return this.http.post(API_AUTH_URL + "refresh", {}, { headers }).pipe(
      tap((res: any) => this.tokenStorageService.saveToken(res.accessToken)),
      catchError(async (err) => {
        this.inactiveSessions(this.tokenStorageService.getUser().accessToken, false, "Logout");
        this.tokenStorageService.signOut();
        this.router.navigate(["/"], { relativeTo: this.route });
        return throwError(() => err);
      })
    );
  }

  // To Get Public Session Token
  publicSession(): Observable<any> {
    return this.http.post(API_AUTH_URL + 'publicsession', {});
  }

  verifyLoginName(data: any): Observable<any> {
    return this.http.post(API_AUTH_URL + "verifyloginname", data);
  }

  verifyOTP(data: any): Observable<any> {
    return this.http.post(API_AUTH_URL + "verifyotp", data);
  }

  register(data: any): Observable<any> {
    return this.http.post(API_AUTH_URL + "register", data);
  }

  sendOTP(data: any): Observable<any> {
    return this.http.post(API_AUTH_URL + "sendotp", data);
  }

  loginWithPassword(data: any): Observable<any> {
    return this.http.post(API_AUTH_URL + "loginwithpassword", data);
  }

  loginWithOTP(data: any): Observable<any> {
    return this.http.post(API_AUTH_URL + "loginwithotp", data);
  }

  verifyActiveLogin(): Observable<any> {
    return this.http.post(API_AUTH_URL + 'verifyactivelogin', {});
  }

  updatePassword(passwordData: any): Observable<any> {
    return this.http.post(API_AUTH_URL + 'updatepassword', passwordData);
  }

  async inactiveSessions(accessToken: string, status: any, sessionLogDesc: string): Promise<any> {
    const data = {
      token: accessToken,
      status: status,
      sessionLogDesc: sessionLogDesc,
      ipAddress: this.tokenStorageService.getIPAddress(),
      browserName: this.tokenStorageService.getBrowserName()
    };

    return this.http.post(API_AUTH_URL + 'inactivesessions', { payload: this.encryptionService.encrypt(data) });
  }

  getAppProduction() {
    return environment.production;
  }
}
