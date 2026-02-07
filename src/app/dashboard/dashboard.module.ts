import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ComponentsModule } from '../components/components.module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from "@angular/material/form-field";
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DashboardStore } from './configurable-dashboard/configurable-dashboard.store';
import { NgOtpInputModule } from 'ng-otp-input';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { HighchartsChartModule } from 'highcharts-angular';

import { ConfigDashboardComponent } from './configurable-dashboard/config-dashboard/config-dashboard.component';
import { WidgetComponent } from './configurable-dashboard/widget/widget.component';
import { WidgetPanelComponent } from './configurable-dashboard/widget-panel/widget-panel.component';
import { AddUdyamComponent } from './configurable-dashboard/widgets/add-udyam/add-udyam.component';
import { ProfileCompletionComponent } from './configurable-dashboard/widgets/profile-completion/profile-completion.component';
import { NewsFeedComponent } from './configurable-dashboard/widgets/news-feed/news-feed.component';
import { EnterpriseCountCardComponent } from './configurable-dashboard/widgets/enterprise-count-card/enterprise-count-card.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
@NgModule({
  declarations: [
    ConfigDashboardComponent,
    WidgetPanelComponent,
    WidgetComponent,
    AddUdyamComponent,
    ProfileCompletionComponent,
    NewsFeedComponent,
    EnterpriseCountCardComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule,
    ComponentsModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatTooltipModule,
    NgOtpInputModule,
    MatRadioModule,
    HighchartsChartModule,
    MatCheckboxModule
  ],
  providers:[
    DashboardStore,
  ]
})
export class DashboardModule { }
