import { NgModule } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { DiscoveryRoutingModule } from './discovery-routing.module';

// Components
import { SearchComponent } from './components/search/search.component';
import { ProfileComponent } from './components/profile/profile.component';
import { WebviewComponent } from './components/webview/webview.component';

import { MatIconModule } from "@angular/material/icon";
import { MatExpansionModule } from '@angular/material/expansion';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { SharedModule } from '@shared/shared.module';
import { ComponentsModule } from '../components/components.module';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { NgSelectModule } from '@ng-select/ng-select';
import { CarouselModule as BsCarouselModule } from 'ngx-bootstrap/carousel';


import localeEnIn from '@angular/common/locales/en-IN';
import { ProductProfileComponent } from './components/product-profile/product-profile.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { EnquiryComponent } from './modals/enquiry/enquiry.component';
import { MatDatepickerModule } from '@angular/material/datepicker';

registerLocaleData(localeEnIn, 'en-IN');

@NgModule({
  declarations: [
    SearchComponent,
    ProfileComponent,
    WebviewComponent,
    ProductProfileComponent,
    EnquiryComponent
  ],
  imports: [
    CommonModule,
    DiscoveryRoutingModule,
    SharedModule,
    ComponentsModule,
    MatIconModule,
    MatExpansionModule,
    CarouselModule,
    CarouselModule,
    BsCarouselModule,
    MatPaginatorModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatSliderModule,
    MatDividerModule,
    NgSelectModule,
    MatSlideToggle,
    MatDatepickerModule
  ]
})

export class DiscoveryModule { }
