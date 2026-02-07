import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigDashboardComponent } from './configurable-dashboard/config-dashboard/config-dashboard.component';
import { AddUdyamComponent } from './configurable-dashboard/widgets/add-udyam/add-udyam.component';
import { ProfileCompletionComponent } from './configurable-dashboard/widgets/profile-completion/profile-completion.component';
import { NewsFeedComponent } from './configurable-dashboard/widgets/news-feed/news-feed.component';

export const dashboardRoutes: Routes = [
  { path: "", component: ConfigDashboardComponent, data: { roles: ['ADMIN', 'MSME'] } },
  { path: "addudyam", component: AddUdyamComponent, data: { roles: ['ADMIN', 'MSME'] } },
  { path: "profilecompletion", component: ProfileCompletionComponent, data: { roles: ['ADMIN', 'MSME'] } },
  { path: "newsfeed", component: NewsFeedComponent, data: { roles: ['ADMIN', 'MSME'] } }
];

@NgModule({
  imports: [RouterModule.forChild(dashboardRoutes)],
  exports: [RouterModule]
})

export class DashboardRoutingModule { }
