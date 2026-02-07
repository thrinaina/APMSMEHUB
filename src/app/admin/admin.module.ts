import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ComponentsModule } from '../components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UsersComponent } from './components/users/users.component';
import { UserComponent } from './components/modals/user/user.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { CategoryComponent } from './components/modals/category/category.component';
import { RoleAssignmentComponent } from './components/role-assignment/role-assignment.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApprovalsComponent } from './components/approvals/approvals.component';
import { CategoryApprovalsComponent } from './components/modals/category-approvals/category-approvals.component';
import {MatTabsModule} from '@angular/material/tabs';
import { ProfileApprovalsComponent } from './components/modals/profile-approvals/profile-approvals.component';
import { EnterpriseStatusComponent } from './components/modals/enterprise-status/enterprise-status.component';
import { EnterprisesComponent } from './components/enterprises/enterprises.component';


@NgModule({
  declarations: [
    UsersComponent,
    UserComponent,
    CategoriesComponent,
    CategoryComponent,
    RoleAssignmentComponent,
    ApprovalsComponent,
    CategoryApprovalsComponent,
    ProfileApprovalsComponent,
    EnterpriseStatusComponent,
    EnterprisesComponent,
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatSlideToggleModule,
    NgSelectModule,
    MatCheckboxModule,
    MatTabsModule
  ]
})

export class AdminModule { }
