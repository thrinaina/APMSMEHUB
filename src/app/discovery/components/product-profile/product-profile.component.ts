import { Component } from '@angular/core';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DiscoveryService } from '../../discovery.service';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';
import { SecurityService } from 'src/app/shared/services/security/security.service';
import { CommonService } from 'src/app/shared/services/commom/common.service';
import { MatDialog } from '@angular/material/dialog';
import { EnquiryComponent } from '../../modals/enquiry/enquiry.component';

@Component({
    selector: 'app-product-profile',
    templateUrl: './product-profile.component.html',
    styleUrl: './product-profile.component.scss',
    standalone: false
})
export class ProductProfileComponent {
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
  enterprises: any = [];
  allEnterprises: any = [];
  searchCriteria: any ;
  selectedQuantity: number = 1;

  constructor(
    private router: Router,
    public tokenStorageService: TokenStorageService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    private discoveryService: DiscoveryService,
    private commonService: CommonService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.tokenStorageService.getObjParamObject().subscribe(data => {
      if(data.productId){
      this.loadData(data.productId);
      this.searchCriteria = data.searchCriteria;
      }
    });
  }

  async loadData(productId: any) {
    try {
      // let defaultCondition = ` AND product.productId = ${productId}`;
      let defaultCondition: any = {
        "filters": [
          {
            "table": "product",
            "field": "productId",
            "operator": "=",
            "value": productId,
            "sequence": 1,
            "condition": "AND"
          }
        ]
      };
      // const response = await this.discoveryService.discoveryProductById({ payload: btoa(this.encryptionService.encrypt({ defaultCondition })) }).toPromise();
      // this.productData = response?.payload ? this.encryptionService.decrypt(atob(response.payload)).data[0] : {};

      const encryptedData = await this.securityService.encrypt({ defaultCondition }).toPromise();
      let response: any = await this.discoveryService.discoveryProductById({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      this.productData = response?.data[0] || [];

      if (this.productData.documents) {
        this.productData.documents = JSON.parse(this.productData.documents);
        this.productData.documents.forEach(async (document: any) => {
          if (document.documentName) {
            const encryptedData = await this.securityService.encrypt({ fileName: document.documentName }).toPromise();
            const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: encryptedData.encryptedText }));
            const reader: any = new FileReader();
            reader.onload = () => {
              this.safeImages.push(reader.result)
            };
            reader.readAsDataURL(responseBlob);
          }
        });
      }

      // let defaultCondition1 = ` AND product.categoryId = ${this.productData.categoryId}`;
      let defaultCondition1: any = {
        "filters": [
          {
            "table": "product",
            "field": "categoryId",
            "operator": "=",
            "value": this.productData.categoryId,
            "sequence": 1,
            "condition": "AND"
          }
        ]
      };
      // const response1 = await this.discoveryService.enterprisesByCategoryId({ payload: btoa(this.encryptionService.encrypt({defaultCondition: defaultCondition1})) }).toPromise();
      // this.allEnterprises = response1?.payload ? this.encryptionService.decrypt(atob(response1.payload)).data : [];

      const encryptedData1 = await this.securityService.encrypt({ defaultCondition }).toPromise();
      let response1: any = await this.discoveryService.enterprisesByCategoryId({ payload: encryptedData1.encryptedText} ).toPromise();
      response = response1.payload ? await this.securityService.decrypt(response1.payload).toPromise() : {};
      this.allEnterprises = response1?.data || [];

      this.allEnterprises.forEach(async (enterprise: any) => {
        if (enterprise.enterpriseLogoDocName) {
          const encryptedData = await this.securityService.encrypt({ fileName: enterprise.enterpriseLogoDocName }).toPromise();
          const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: encryptedData.encryptedText }));
          const reader = new FileReader();
          reader.onload = () => {
            enterprise['enterpriseLogo'] = reader.result;
          };
          reader.readAsDataURL(responseBlob);
        }
      });
      this.enterprises = this.allEnterprises.filter((enterprise: any) => enterprise.enterpriseName !== this.productData.enterpriseName);
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ProductProfileComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  onActiveSlideChange(index: number): void {
    this.activeIndex = index;

    if (index < this.thumbStartIndex) {
      this.thumbStartIndex = index;
    } else if (index >= this.thumbStartIndex + this.thumbWindowSize) {
      this.thumbStartIndex = index - this.thumbWindowSize + 1;
    }
  }

  backToSearch() {
    const data = {searchCriteria: this.searchCriteria};
    this.tokenStorageService.setObjParamObject(data);
    this.router.navigate(['/']);
  }

  enterpriseRoute(webAddress: any) {
    window.onbeforeunload = null;
    const basePath = window.location.pathname.replace(/\/$/, '');
    const url = `${window.location.origin}${basePath}/#/${webAddress}`;
    window.open(url, '_blank');
  }

  openEnquiry() {
    const dialogRef = this.dialog.open(EnquiryComponent, {
      disableClose: true,
      data: {
        type: 'product-profile',
        productData: this.productData,
        safeImages: this.safeImages,
        enterprises: this.allEnterprises
      },
      width: '800px',
      maxWidth: '80vw'
    });
  }
}
