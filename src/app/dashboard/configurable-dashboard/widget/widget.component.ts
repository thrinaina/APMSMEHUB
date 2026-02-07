import { Component, Injector, inject, input, signal,SimpleChanges, OnInit } from '@angular/core';
import { Widget } from '../configurable-dashboard.model';
import { DashboardStore } from '../configurable-dashboard.store';
import { FormControl, FormGroup } from '@angular/forms';
import { widgetsComponents } from '../widgets-directory';
import { TokenStorageService } from '@services/token-storage/token-storage.service';

@Component({
    selector: 'app-widget',
    templateUrl: './widget.component.html',
    styleUrls: ['./widget.component.scss'],
    host: {
        '[style.grid-area]': '"span " + (data().rows ?? 1) + "/ span " + (data().columns ?? 1)',
        class: 'd-block',
    },
    standalone: false
})
export class WidgetComponent implements OnInit {
  data = input.required<Widget>();

  store = inject(DashboardStore);

  showOptions = signal(false);

  dataInjector!: Injector;

  widgetForm!: FormGroup;

  widgetContent: any;

  constructor(private injector: Injector, private tokenStorageService: TokenStorageService) {}

  ngOnInit() {
    this.widgetForm = new FormGroup({
      url: new FormControl(this.data().url || '')
    });

    this.initializeDataInjector();

    this.widgetForm.get('url')?.valueChanges.subscribe(url => {
      this.onURLChange(url);
    });
  }

  ngOnChanges(changes: SimpleChanges  ) {
    if (changes['data']) {
      if (this.widgetContent == undefined) {
        const data: any = this.tokenStorageService.getDashboardWidgetsParamObj();
        const widgets = data.source.value;
        let widget: any = widgets.find((widget: Widget) => widget.id === this.data().id)?.content
        if (widget != undefined) this.widgetContent = widgetsComponents[widget];
      }

      this.initializeDataInjector();
    }
  }

  private initializeDataInjector() {
    const value = {
      id: this.data().id,
      label: this.data().label,
      url: this.data().url,
      rows: this.data().rows,
      columns: this.data().columns
    };
    this.dataInjector = Injector.create({
      providers: [{ provide: 'WidgetData', useValue: value }],
      parent: this.injector
    });
  }

  private onURLChange(url: string) {
    this.store.updateWidget(this.data().id, { url });
    this.initializeDataInjector();
  }
}
