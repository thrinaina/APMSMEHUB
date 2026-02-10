import { Component, ElementRef, inject, viewChild } from "@angular/core";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { DashboardService } from "@dashboard/dashboard.service";
import { EncryptionService } from "@services/encryption/encryption.service";

import { DashboardStore } from '../configurable-dashboard.store';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { wrapGrid } from "animate-css-grid";
import { CommonService } from "@services/commom/common.service";

@Component({
    selector: "app-config-dashboard",
    templateUrl: "./config-dashboard.component.html",
    styleUrls: ["./config-dashboard.component.scss"],
    standalone: false
})
export class ConfigDashboardComponent {
  dashboard = viewChild.required<ElementRef>("dashboard");
  store = inject(DashboardStore);
  isDragging = false;
  isLoading: boolean = false;
  userType: string = '';

  constructor(
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    
    public commonService: CommonService,
    public tokenStorageService: TokenStorageService
  ) { }

  ngOnInit() {
    this.store.setMode("view");

    this.UserTypeWidgets();

    if (!(document as any).startViewTransition) {
      wrapGrid(this.dashboard().nativeElement, {
        duration: 300,
      });
    }
  }

  async UserTypeWidgets() {
    try {
      this.isLoading = true;
      const defaultCondition: any = { filters: [] };
      const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
      let response: any = await this.dashboardService.userTypeWidgets({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      if (response?.data) this.userType = response?.data[0].userType;
      const userWidgets = (response?.data ?? []).map((widget: any) => ({
        id: widget.dashboardWidgetId ?? 0,
        label: widget.dashboardWidgetName ?? '',
        content: widget.dashboardWidgetComponent ?? null,
        rows: widget.dashboardWidgetRows ?? 0,
        columns: widget.dashboardWidgetColumns ?? 0
      }));
      // Save dashboard widgets based on userType
      this.tokenStorageService.setDashboardWidgetsParamObj(userWidgets);

      setTimeout(() => {
        // Fetch dashboard widgets
        this.store.fetchWidgets();
        this.store.saveWidgets(this.store.entities);
        this.store.saveOrder(this.store.order);
      }, 500);
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ConfigDashboardComponent' });
    } finally {
      this.isLoading = false;
    }

  }

  drop(event: CdkDragDrop<number, any>) {
    const { previousContainer, container, item: { data } } = event;
    if (data) {
      this.store.addWidgetAtPosition(data, container.data);
      return;
    }
    this.store.updateWidgetPosition(previousContainer.data, container.data);
  }

  widgetDroppedInPanel(event: CdkDragDrop<number, any>) {
    const { previousContainer } = event;
    this.store.removeWidget(previousContainer.data);
  }

  trackByWidgetId(index: number, widget: any): number {
    return widget.id;
  }

  get isEditMode(): boolean {
    return this.store.settings.mode() === 'edit';
  }

  get hasUnsavedChanges(): boolean {
    return this.isEditMode && this.store.hasChanges();
  }

  async applyChanges() {
    try {
      this.isLoading = true;
      this.store.setMode("view");
      const dashboardData = {
        dashboardWidgets: this.tokenStorageService.getDashboardWidgets(),
        dashboardWidgetsOrder: this.tokenStorageService.getDashboardWidgetsOrder(),
      };
      // var response = await this.dashboardService.postUserDashboard({ payload: btoa(this.encryptionService.encrypt(dashboardData)) }).toPromise();
      // response = response.data ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(dashboardData).toPromise();
      var response: any = await this.dashboardService.postUserDashboard({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: response?.appUserDashboardId, component: 'ConfigDashboardComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  toggleMode() {
    let value = this.store.settings.mode();
    if (value === 'view') {
      this.store.setMode('edit');
      this.store.setState(true);
    } else if (value === 'edit') {
      this.store.setMode('view');
      this.store.setState(false);
    }
  }

}
