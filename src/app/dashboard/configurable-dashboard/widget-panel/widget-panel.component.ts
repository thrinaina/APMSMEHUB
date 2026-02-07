import { Component, inject } from '@angular/core';
import { DashboardStore } from '../configurable-dashboard.store';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { Widget } from '../configurable-dashboard.model';

@Component({
    selector: 'app-widget-panel',
    templateUrl: './widget-panel.component.html',
    styleUrls: ['./widget-panel.component.scss'],
    host: {
        class: '[view-transition-name:widgets-panel] bg-primary-container text-on-primary-container z-3 rounded',
    },
    standalone: false
})
export class WidgetPanelComponent {
  store = inject(DashboardStore);
  isDragging = false;
  userWidgets: Widget[] = [];

  private displayWidgets: number[] = [];

  constructor(
    private tokenStorageService: TokenStorageService,
  ) {}

  ngOnInit() {
    const widgetsData: any = this.tokenStorageService.getDashboardWidgetsParamObj();
    this.userWidgets = widgetsData.source.value;
    this.userWidgets.forEach((widget: Widget) => {
      this.displayWidgets.push(widget.id);
    });
  }

  trackByWidgetId(index: number, widget: any): number {
    return widget.id;
  }

  get isEditMode(): boolean {
    return this.store.settings.mode() === 'edit';
  }

  hasAccessToWidget(widget: any) {
    return this.displayWidgets.includes(widget.id);
  }
}
