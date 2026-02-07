import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IdleService } from 'src/app/shared/services/idle/idle.service';

@Component({
  selector: 'app-timeout-modal',
  standalone: true,
  template: `
    @if (idleService.showWarning()) {
      <div class="timeout-container">
        <div class="timeout-content">
          <h2>{{translate.instant('Common.SessionExpiring')}}</h2>
          <p>{{translate.instant('Common.YouHaveBeenIdleYouWillBeLoggedOutIn')}} <strong>{{ idleService.countdown() }}</strong> {{translate.instant('Common.Seconds')}}</p>
          <button class="btn btn-primary rounded" (click)="idleService.stayLoggedIn()">{{translate.instant('Common.StayLoggedIn')}}</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .timeout-container {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999;
    }
    .timeout-content {
      background: white; padding: 2rem; border-radius: 8px; text-align: center;
    }
  `]
})
export class TimeoutModalComponent {
  idleService = inject(IdleService);

  constructor(
    public translate: TranslateService
  ){}
}
