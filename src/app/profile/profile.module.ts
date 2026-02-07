import { NgModule } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { ProfileRoutingModule } from './profile-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ComponentsModule } from '../components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { NgSelectModule } from '@ng-select/ng-select';

// Locale Register
import localeEnIn from '@angular/common/locales/en-IN';
registerLocaleData(localeEnIn, 'en-IN');

// Components
import { ProfileEntryComponent } from './components/profile-entry/profile-entry.component';
import { ProductComponent } from './components/modals/product/product.component';
import { ProfileDetailsComponent } from './components/modals/profile-details/profile-details.component';
import { EnterpriseDetailsComponent } from './components/modals/enterprise-details/enterprise-details.component';
import { ClientDetailsComponent } from './components/modals/client-details/client-details.component';
import { MarketDetailsComponent } from './components/modals/market-details/market-details.component';
import { ComplianceDetailsComponent } from './components/modals/compliance-details/compliance-details.component';
import { AssetsEntryComponent } from './components/modals/assets-entry/assets-entry.component';
import { CategoryRequestComponent } from './components/modals/category-request/category-request.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ContactPersonDetailsComponent } from './components/modals/contact-person-details/contact-person-details.component';
@NgModule({
  declarations: [
    ProfileEntryComponent,
    ProductComponent,
    ProfileDetailsComponent,
    EnterpriseDetailsComponent,
    ClientDetailsComponent,
    MarketDetailsComponent,
    ComplianceDetailsComponent,
    AssetsEntryComponent,
    CategoryRequestComponent,
    ContactPersonDetailsComponent
  ],
  imports: [
    CommonModule,
    ProfileRoutingModule,
    SharedModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatDividerModule,
    CarouselModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgSelectModule,
    MatCheckboxModule
]
})
export class ProfileModule { }
