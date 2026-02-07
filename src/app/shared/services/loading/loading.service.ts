import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  private isLoading$ = new Subject<boolean>();
  private loadingQueue: boolean[] = [];

  constructor() { }

  public show(): void {
    this.loadingQueue.push(true);
    this.detectQueue();
  }

  public hide(): void {
    this.loadingQueue.pop();
    this.detectQueue();
  }

  public loadingStatus$(): Observable<boolean> {
    return this.isLoading$.asObservable();
  }

  private detectQueue(): void {
    if (this.loadingQueue.length > 0)
      this.isLoading$.next(true);
    else
    this.isLoading$.next(false);
  }

}
