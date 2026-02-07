import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenStorageService } from '../shared/services/token-storage/token-storage.service';
import { Widget } from './configurable-dashboard/configurable-dashboard.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const DASHBOARD_API_URL = environment.apiUrl + 'api/dashboard/';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private httpClient: HttpClient,
    public tokenStorageService: TokenStorageService
  ) { }

  fetchWidgets(): Widget[] {
    const widgetsData: any = this.tokenStorageService.getDashboardWidgetsParamObj();
    const widgetsDirectory = widgetsData.source.value;
    let widgets = this.tokenStorageService.getDashboardWidgets();
    if (widgets == null) widgets = [];
    widgets.forEach((widget: Widget) => {
      const content = widgetsDirectory.find((w: any) => w.id === widget.id)?.content;
      if (content) widget.content = content;
    });
    return widgets;
  }

  fetchOrder(): number[] {
    let orderAsString = this.tokenStorageService.getDashboardWidgetsOrder();
    return orderAsString as number[];
  }

  saveWidgets(widgets: Widget[]): Promise<void> {
    const widgetsWithoutContent: Partial<Widget>[] = widgets.map((w) => ({ ...w }));
    widgetsWithoutContent.forEach((w) => {
      delete w.content;
    });
    this.tokenStorageService.saveDashboardWidgets(widgetsWithoutContent);
    return Promise.resolve();
  }

  saveOrder(order: number[]): Promise<void> {
    this.tokenStorageService.saveDashboardWidgetsOrder(order);
    return Promise.resolve();
  }

  // User Type Widgets
  userTypeWidgets(userTypeData: any): Observable<any> {
    return this.httpClient.post(DASHBOARD_API_URL + "usertypewidgets", userTypeData);
  }

  // Update User Dashboard
  postUserDashboard(dashboardData: any): Observable<any> {
    return this.httpClient.post(DASHBOARD_API_URL + "updatedashboard", dashboardData);
  }

  // Verify Udyam Number
  verifyUdyam(data: any): Observable<any> {
    return this.httpClient.post(DASHBOARD_API_URL + "verifyudyam", data);
  }
  // Verify OTP
  verifyOTP(data: any): Observable<any> {
    return this.httpClient.post(DASHBOARD_API_URL + "verifyotp", data);
  }

  // Submit Udyam
  submitUdyam(data: any): Observable<any> {
    return this.httpClient.post(DASHBOARD_API_URL + "submitudyam", data);
  }

  // Submit Consent
  submitConsent(data: any): Observable<any> {
    return this.httpClient.post(DASHBOARD_API_URL + "submitconsent", data);
  }

  // app User Udyams
  appUserUdyams(data: any): Observable<any> {
    return this.httpClient.post(DASHBOARD_API_URL + "appuserudyams", data);
  }

  // Enterprise counts
  enterpriseCounts(data: any): Observable<any> {
    return this.httpClient.post(DASHBOARD_API_URL + "enterprisecounts", data);
  }

  // Profile Completion
  profileCompletion(data: any): Observable<any> {
    return this.httpClient.post(DASHBOARD_API_URL + "profilecompletion", data);
  }

}
