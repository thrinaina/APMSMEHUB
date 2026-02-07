import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrModule } from 'ngx-toastr';
import { PdfViewerModule } from 'ng2-pdf-viewer';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TranslateModule,
    ToastrModule,
    PdfViewerModule
  ],
  exports: [
    TranslateModule,
    ToastrModule,
    PdfViewerModule
  ]
})
export class SharedModule { }
