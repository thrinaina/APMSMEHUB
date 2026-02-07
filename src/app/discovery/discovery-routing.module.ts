import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { webAddressMatcher, atSymbolMatcherPath } from '../shared/helpers/utils';
import { ProfileComponent } from './components/profile/profile.component';
import { SearchComponent } from './components/search/search.component';
import { WebviewComponent } from './components/webview/webview.component';
import { ProductProfileComponent } from './components/product-profile/product-profile.component';

export const discoveryRoutes: Routes = [
  { path: "", component: SearchComponent },
  { path: "webview", component: WebviewComponent },
  { matcher: atSymbolMatcherPath('webview'), component: WebviewComponent },
  { matcher: webAddressMatcher, component: ProfileComponent },
  { path: "productprofile", component: ProductProfileComponent},
];

@NgModule({
  imports: [RouterModule.forChild(discoveryRoutes)],
  exports: [RouterModule]
})

export class DiscoveryRoutingModule { }
