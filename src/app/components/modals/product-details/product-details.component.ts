import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EnquiryComponent } from 'src/app/discovery/modals/enquiry/enquiry.component';
@Component({
    selector: 'app-product-details',
    templateUrl: './product-details.component.html',
    styleUrl: './product-details.component.scss',
    standalone: false
})
export class ProductDetailsComponent implements OnInit {
  // Default
  isLoading: boolean = false;

  // General Variables
  safeImages: SafeResourceUrl[] = [];
  activeIndex = 0;
  thumbWindowSize = 4;
  thumbStartIndex = 0;
  contentExpanded = false;

  // Data Variables
  productData: any = {};

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<ProductDetailsComponent>,
    public tokenStorageService: TokenStorageService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sanitizer: DomSanitizer
  ) {
    this.productData = JSON.parse(JSON.stringify(data.product));
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.safeImages = (this.productData.documents || []).map(
      (document: any) =>
        this.sanitizer.bypassSecurityTrustResourceUrl(document.productImage)
    );
  }

  onActiveSlideChange(index: number): void {
    this.activeIndex = index;
    if (index < this.thumbStartIndex) {
      this.thumbStartIndex = index;
    } else if (index >= this.thumbStartIndex + this.thumbWindowSize) {
      this.thumbStartIndex = index - this.thumbWindowSize + 1;
    }
  }
  
  openEnquiry() {
    const dialogRef = this.dialog.open(EnquiryComponent, {
      disableClose: true,
      data: {
        type: 'product-details',
        productData: this.productData,
        safeImages: this.safeImages,
        enterprises: this.data.enterprises
      },
      width: '800px',
      maxWidth: '80vw'
    });
  }
}
