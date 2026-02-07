import { NgModule } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";

// Components
import { HeaderComponent } from './header/header.component';
import { LoaderComponent } from './loader/loader.component';
import { AlertsComponent } from './alerts/alerts.component';
import { AssetsComponent } from './modals/assets/assets.component';
import { AssetsDetailsComponent } from './modals/assets-details/assets-details.component';
import { ProductDetailsComponent } from './modals/product-details/product-details.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { SharedModule } from '../shared/shared.module';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { CarouselModule as BsCarouselModule } from 'ngx-bootstrap/carousel';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

import localeEnIn from '@angular/common/locales/en-IN';
import { RouterOutlet } from "@angular/router";
import { MatTooltipModule } from '@angular/material/tooltip';

registerLocaleData(localeEnIn, 'en-IN');

@NgModule({
  declarations: [
    HeaderComponent,
    LoaderComponent,
    AlertsComponent,
    AssetsComponent,
    AssetsDetailsComponent,
    ProductDetailsComponent,
    SidebarComponent,

  ],
  imports: [
    CommonModule,
    SharedModule,
    MatIconModule,
    MatButtonToggleModule,
    MatButtonModule,
    CarouselModule,
    BsCarouselModule,
    MatSidenavModule,
    RouterOutlet,
    MatListModule,
    MatTooltipModule
],
  exports: [
    HeaderComponent,
    LoaderComponent,
    AlertsComponent,
    AssetsComponent,
    AssetsDetailsComponent,
    ProductDetailsComponent,
    SidebarComponent
  ]
})
export class ComponentsModule { }
