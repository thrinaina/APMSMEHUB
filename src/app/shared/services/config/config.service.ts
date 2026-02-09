import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private httpClient = inject(HttpClient);
  private configData: any;

  async loadConfig(): Promise<void> {
    try {
      // Fetching from the local assets folder
      this.configData = await lastValueFrom(
        this.httpClient.get('/assets/config/config.json')
      );
      // console.log('Config Loaded Successfully:', this.configData);
    } catch (error) {
      console.error('Critical Error: Could not load config.json', error);
      // Fallback for local development if fetch fails
      // this.configData = { bffUrl: 'http://localhost:3001/api/crypto' };
      this.configData = { bffUrl: 'https://thrinaina.centralindia.cloudapp.azure.com/bffapi' };
    }
  }

  get bffUrl(): string {
    if (!this.configData) {
      console.warn('Accessing bffUrl before config loaded. Returning fallback.');
      // return 'http://localhost:3001/api/crypto'; 
      return 'https://thrinaina.centralindia.cloudapp.azure.com/bffapi'; 
    }
    return this.configData.bffUrl;
  }
}