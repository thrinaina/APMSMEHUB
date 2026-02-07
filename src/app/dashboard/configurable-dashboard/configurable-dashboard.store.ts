import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { addEntities, addEntity, removeEntity, updateEntity, withEntities } from '@ngrx/signals/entities';
import { pipe, switchMap } from 'rxjs';
import { Widget } from './configurable-dashboard.model';
import { startViewTransition } from './view-transitions';
import { DashboardService } from '@dashboard/dashboard.service';
import { TokenStorageService } from '@services/token-storage/token-storage.service';

type DashboardState = {
  order: number[];
  settings: {
    mode: 'view' | 'edit';
    state: true | false;
  };
  changed: boolean;
};

const initialState: DashboardState = {
  order: [],
  settings: { mode: 'view', state: false },
  changed: false
};

export const DashboardStore = signalStore(
  withState(initialState),
  withEntities<Widget>(),
  withComputed(({ entities, order, entityMap }, tokenStorageService = inject(TokenStorageService)) => ({
    widgetsToAdd: computed(() => {
      const widgetsData: any = tokenStorageService.getDashboardWidgetsParamObj();
      const widgets = widgetsData.source.value;
      const addedIds = entities().map((w) => w.id);
      return widgets.filter((w: Widget) => !addedIds.includes(w.id));
    }),
    addedWidgets: computed(() => {
      return order().map((w) => ({ ...entityMap()[w] }));
    }),
  })),
  withMethods(
    (store, dataService = inject(DashboardService), tokenStorageService = inject(TokenStorageService)) => ({
      fetchWidgets() {
        const widgets = dataService.fetchWidgets();
        const order = dataService.fetchOrder();
        startViewTransition(() => {
          patchState(store, addEntities(widgets), { order });
        });
      },
      addWidgetAtPosition(sourceWidgetId: number, destWidgetId: number) {
        const widgets: any = tokenStorageService.getDashboardWidgetsParamObj();
        const availableWidgets = widgets.source.value;
        const widgetToAdd = availableWidgets.find(
          (w: Widget) => w.id === sourceWidgetId
        );

        if (!widgetToAdd) {
          return;
        }

        const indexOfDestWidget = store.order().indexOf(destWidgetId);

        const positionToAdd =
          indexOfDestWidget === -1 ? store.order().length : indexOfDestWidget;
        const order = [...store.order()];
        order.splice(positionToAdd, 0, sourceWidgetId);
        startViewTransition(() => {
          patchState(store, addEntity({ ...widgetToAdd }), { order, changed: true });
        });
      },
      removeWidget(id: number) {
        startViewTransition(() => {
          patchState(store, removeEntity(id), {
            order: store.order().filter((w) => w !== id),
            changed: true,
          });
        });
      },
      updateWidget(id: number, data: Partial<Widget>) {
        startViewTransition(() => {
          patchState(store, updateEntity({ id, changes: { ...data } }), {
            changed: true,
          });
        });
      },
      updateWidgetPosition(sourceWidgetId: number, targetWidgetId: number) {
        const sourceIndex = store.order().indexOf(sourceWidgetId);

        const order = [...store.order()];
        const removedItem = order.splice(sourceIndex, 1)[0];
        const targetIndex = order.indexOf(targetWidgetId);

        const insertAt =
          sourceIndex === targetIndex ? targetIndex + 1 : targetIndex;

        order.splice(insertAt, 0, removedItem);
        startViewTransition(() => {
          patchState(store, { order, changed: true });
        });
      },
      setMode(mode: 'view' | 'edit') {
        const state = store.settings.state();
        patchState(store, { settings: { mode, state }, changed: false });
      },
      setState(state: true | false) {
        const mode = store.settings.mode();
        patchState(store, { settings: { mode, state } });
      },
      saveWidgets: rxMethod<Widget[]>(
        pipe(switchMap((widgets) => dataService.saveWidgets(widgets)))
      ),
      saveOrder: rxMethod<number[]>(
        pipe(switchMap((order) => dataService.saveOrder(order)))
      ),
      resetChanges() {
        patchState(store, { changed: false });
      },
      hasChanges() {
        return store.changed();
      },
    })
  ),
  withHooks({
    // onInit(store) {
    //   store.fetchWidgets();
    //   store.saveWidgets(store.entities);
    //   store.saveOrder(store.order);
    // },
  })
);
