import { NgModule, inject, provideAppInitializer } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { SharedModule } from './shared/shared.module';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { DiscoveryLayoutComponent } from './layouts/discovery-layout/discovery-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { ComponentsModule } from './components/components.module';
import { MatExpansionModule } from "@angular/material/expansion";
import { ToastrModule } from 'ngx-toastr'
import { authInterceptor } from './shared/helpers/auth.interceptor'
import { TimeoutModalComponent } from './components/timeout-modal/timeout-modal.component';

import { ConfigService } from './shared/services/config/config.service';

@NgModule({
  declarations: [
    AppComponent,
    AuthLayoutComponent,
    DiscoveryLayoutComponent,
    AdminLayoutComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    AppRoutingModule,
    SharedModule,
    ComponentsModule,
    TimeoutModalComponent,
    TranslateModule.forRoot({
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json'
      }),
      fallbackLang: 'en'
    }),
    MatExpansionModule,
    ToastrModule.forRoot()
  ],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideAppInitializer(() => {
        const initializerFn = ((c: ConfigService) => () => c.loadConfig())(inject(ConfigService));
        return initializerFn();
      })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
