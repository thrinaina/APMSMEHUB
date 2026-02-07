import { Component, ViewEncapsulation } from '@angular/core';
import { LoadingService } from '@services/loading/loading.service';

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss'],
    encapsulation: ViewEncapsulation.ShadowDom,
    standalone: false
})
export class LoaderComponent {
  constructor(public loader: LoadingService) { }
}
