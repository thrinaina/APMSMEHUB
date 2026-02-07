import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@services/config/config.service';

@Injectable({ providedIn: 'root' })
export class SecurityService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  encrypt(data: any) {
    return this.http.post<any>(`${this.config.bffUrl}/encrypt`, { sensitiveData: data });
  }

  decrypt(payload: string) {
    return this.http.post<any>(`${this.config.bffUrl}/decrypt`, { encryptData: payload});
  }
}