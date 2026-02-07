import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UsersComponent } from './components/users/users.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { RoleAssignmentComponent } from './components/role-assignment/role-assignment.component';
import { ApprovalsComponent } from './components/approvals/approvals.component';

export const adminRoutes: Routes = [
  { path: 'listofusers', component: UsersComponent, data: { roles: ['ADMIN'] } },
  { path: 'listofcategories', component: CategoriesComponent, data: { roles: ['ADMIN'] } },
  { path: 'roleassignment', component: RoleAssignmentComponent, data: { roles: ['ADMIN'] } },
  { path: 'approvals', component: ApprovalsComponent, data: { roles: ['ADMIN'] } }
];

@NgModule({
  imports: [RouterModule.forChild(adminRoutes)],
  exports: [RouterModule]
})

export class AdminRoutingModule { }
