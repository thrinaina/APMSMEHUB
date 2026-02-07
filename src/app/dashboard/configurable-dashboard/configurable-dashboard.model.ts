import { Type } from '@angular/core';

export type Widget = {
  id: number;
  label: string;
  content: Type<unknown>;
  rows?: number;
  columns?: number;
  backgroundColor?: string;
  backgroundImage?: string;
  color?: string;
  url?: string;
};
