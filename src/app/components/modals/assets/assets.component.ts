import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { AssetsDetailsComponent } from '../assets-details/assets-details.component';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/shared/services/commom/common.service';
@Component({
    selector: 'app-assets',
    templateUrl: './assets.component.html',
    styleUrl: './assets.component.scss',
    standalone: false
})
export class AssetsComponent implements OnInit {
  isLoading: boolean = false;
  assetData: any = [];
  constructor(
    public dialog: MatDialog,
    public translate: TranslateService,
    private readonly commonService: CommonService,
    public dialogRef: MatDialogRef<AssetsComponent>,
    public tokenStorageService: TokenStorageService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.assetData = this.data.assets;
  }

  getTitle(type: string): string {
    switch (type) {
      case 'Awards': return this.translate.instant('Web.AwardDetails');
      case 'Certifications': return this.translate.instant('Web.CertificationDetails');
      case 'Brochures': return this.translate.instant('Web.BrochuresDetails');
      case 'Images': return this.translate.instant('Web.ImagesDetails');
      default: return this.translate.instant('Web.AwardDetails');
    }
  }

  openAssetDetails(asset: any) {
    try {
      this.isLoading = true;
      const type = (this.data.assetType != 'Brochures' && this.data.assetType != 'Images') ? 'awardCertificationDetails' : this.data.assetType;
      const title = this.data.assetType == 'Awards' ? 'AwardDetails'
        : this.data.assetType == 'Certifications' ? 'CertificationDetails'
          : this.data.assetType == 'Brochures' ? 'BrochureDetails'
            : this.data.assetType == 'Images' ? 'ImageDetails'
              : 'AssetDetails';

      const dialogRef = this.dialog.open(AssetsDetailsComponent, {
        data: {
          type: type,
          assetData: asset,
          assetType: this.data.assetType,
          title: this.translate.instant(title || 'AssetDetails')
        },
       width: '800px',
      maxWidth: '95vw'
      });
    }
    catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'AssetsComponent' });
    } finally {
      this.isLoading = false;
    }
  }


}
