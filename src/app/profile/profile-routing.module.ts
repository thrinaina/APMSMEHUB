import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { ProfileEntryComponent } from './components/profile-entry/profile-entry.component';


export const profileRoutes: Routes = [
  { path: "entry", component: ProfileEntryComponent, data: { roles: ['MSME'] } },
];

@NgModule({
  imports: [RouterModule.forChild(profileRoutes)],
  exports: [RouterModule]
})

export class ProfileRoutingModule { }
