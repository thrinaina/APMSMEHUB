import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NavigationBlockerService {

  private isBlocking = false;
  private routerEventSub!: Subscription;

  constructor(private router: Router) {}

  enable(): void {
    if (this.isBlocking) return;
    this.isBlocking = true;

    // Block back button
    history.pushState(null, '', null);
    window.onpopstate = () => {
      history.go(1);
    };

    window.addEventListener("keyup", disableF5);
    window.addEventListener("keydown", disableF5);

    function disableF5(e: any) {
      if ((e.which || e.keyCode) == 116) e.preventDefault();
    };
    
    function onBeforeUnLoad() {
      window.onbeforeunload = (event) => {
        event.preventDefault();
        return '';
      };
    }

    if (environment.production) {
      document.addEventListener('input', onBeforeUnLoad);
      document.addEventListener('change', onBeforeUnLoad);
    }

    this.routerEventSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        window.onbeforeunload = null;
        window.history.pushState(null, '', null);
      };
    });
  }

  disable(): void {
    this.isBlocking = false;
    window.onpopstate = null;
    window.onbeforeunload = null;
    window.removeEventListener("keyup", ()=>{});
    window.removeEventListener("keydown", ()=>{});
    if (environment.production) {
      document.removeEventListener('input', ()=>{});
      document.removeEventListener('change', ()=>{});
    }
    if (this.routerEventSub) this.routerEventSub.unsubscribe();
  }
}
