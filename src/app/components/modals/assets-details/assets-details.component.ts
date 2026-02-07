import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
@Component({
    selector: 'app-assets-details',
    templateUrl: './assets-details.component.html',
    styleUrl: './assets-details.component.scss',
    standalone: false
})
export class AssetsDetailsComponent implements OnInit {
  // Default
  isLoading = false;

  // General Variables
  type = '';
  title = '';

  // Data Variables
  assetData: any = {};
  assetsData: any = [];

  activeIndex = 0;
  thumbWindowSize = 4;
  thumbStartIndex = 0;
  currentIndex = 0;
  contentExpanded = false;

  safeImages: SafeResourceUrl[] = [];

  constructor(
    public tokenStorageService: TokenStorageService,
    public translate: TranslateService,
    public dialogRef: MatDialogRef<AssetsDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    this.type = this.data.type;
    this.title = this.getTitle(this.data.assetType);
    // Single Asset
    this.assetData = this.data.assetData || {};

    this.safeImages = (this.assetData.documents || []).map(
      (document: any) =>
        document.assetImage
    );

    if (this.data.type == 'gallery') {
      this.currentIndex = this.data.selectedIndex;
    }
  }

  getTitle(type: string): string {
    switch (type) {
      case 'Awards': return this.translate.instant('Web.AwardDetails');
      case 'Certifications': return this.translate.instant('Web.CertificationDetails');
      default: return this.translate.instant('Web.AwardDetails');
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onActiveSlideChange(index: number) {
    this.activeIndex = index;

    if (index < this.thumbStartIndex) {
      this.thumbStartIndex = index;
    } else if (index >= this.thumbStartIndex + this.thumbWindowSize) {
      this.thumbStartIndex = index - this.thumbWindowSize + 1;
    }
  }
}
