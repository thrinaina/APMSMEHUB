import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser';
import { OwlOptions } from 'ngx-owl-carousel-o';

import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '@shared/services/commom/common.service';

import { ProductDetailsComponent } from '@components/modals/product-details/product-details.component';
import { AssetsDetailsComponent } from 'src/app/components/modals/assets-details/assets-details.component';

import { EncryptionService } from '@shared/services/encryption/encryption.service';
import { SecurityService } from 'src/app/shared/services/security/security.service';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DiscoveryService } from '../../discovery.service';
import { EnquiryComponent } from '../../modals/enquiry/enquiry.component';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
    standalone: false
})
export class ProfileComponent implements OnInit {
  // Default
  isLoading: boolean = false;

  webAddressPrefix = environment.WEBADDRESS_PREFIX;
  // General Variables
  selectedCategory: string = 'About';

  selectedAssetCategory: string = 'Assets';
  selectedAsset!: string | null;

  webAddress: string | null = '';

  contentExpanded: any = {};

  // Data Variables
  profileData: any;
  productsData: any = [];

  assetsData: any = [];
  gallaryData: any = [];
  safeImages: SafeResourceUrl[] = [];

  udyamDetails: any;

  carouselOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: false,
    navSpeed: 700,
    navText: ['❮', '❯'],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      740: {
        items: 3
      },
      940: {
        items: 4
      }
    },
    nav: true
  };

  // Table
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource();
  dataSourceCards: any;
  defaultPageSize = 10;
  pageSizeOptions = [10, 20, 30, 40];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly translate: TranslateService,
    public readonly commonService: CommonService,
    private readonly encryptionService: EncryptionService,
    private readonly securityService: SecurityService,
    private readonly dialog: MatDialog,
    private readonly discoveryService: DiscoveryService,
    private readonly tokenStorageService: TokenStorageService
  ) { }

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const webAddress = params.get('webAddress');
      if (!webAddress) return this.backToSearch();

      this.webAddress = webAddress;
      // Load All endpoints on load
      await this.onLoad();
    });
  }

  async onLoad() {
    try {
      this.isLoading = true;
      if (this.selectedCategory === 'About') {
        // let defaultCondition = " AND enterprise.webAddress = '" + this.webAddress + "'";
        let defaultCondition: any = {
          "filters": [
            {
              "table": "enterprise",
              "field": "webAddress",
              "operator": "=",
              "value": this.webAddress,
              "sequence": 1,
              "condition": "AND"
            }
          ]
        };
        // let response = await this.discoveryService.enterprises({ payload: btoa(this.encryptionService.encrypt({ defaultCondition })) }).toPromise();
        // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
        let response: any = await this.discoveryService.enterprises({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.profileData = response?.data ? response?.data[0] : {};
        // Fallback if profileData or udyamRegistrationNo does not exist
        if (!this.profileData || !this.profileData?.udyamRegistrationNo) {
          this.backToSearch()
          return;
        }
        if (this.profileData?.domesticMarkets) this.profileData['domesticMarkets'] = JSON.parse(this.profileData.domesticMarkets);
        if (this.profileData?.internationalMarkets) this.profileData['internationalMarkets'] = JSON.parse(this.profileData.internationalMarkets);
        if (this.profileData?.sectorsServed) this.profileData['sectorsServed'] = JSON.parse(this.profileData.sectorsServed);

        if (this.profileData.documents) {
          this.profileData.documents.forEach(async (document: any) => {
            if (document?.documentName) {
              const encryptedData = await this.securityService.encrypt({ fileName: document?.documentName }).toPromise();
              const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: encryptedData.encryptedText }));
              const reader = new FileReader();
              reader.onload = () => {
                if (document.transactionType == 'coverImage') this.profileData['coverImage'] = reader.result;
                if (document.transactionType == 'enterpriseLogo') this.profileData['enterpriseLogo'] = reader.result;
              };
              reader.readAsDataURL(responseBlob);
            }
          });
        }

        // defaultCondition = " AND client.udyamRegistrationNo = '" + this.profileData?.udyamRegistrationNo + "'";
        defaultCondition = {
          "filters": [
            {
              "table": "client",
              "field": "udyamRegistrationNo",
              "operator": "=",
              "value": this.profileData.udyamRegistrationNo,
              "sequence": 1,
              "condition": "AND"
            }
          ]
        };
        // response = await this.discoveryService.clients({ payload: btoa(this.encryptionService.encrypt({ defaultCondition })) }).toPromise();
        // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
        const encryptedData2 = await this.securityService.encrypt({defaultCondition}).toPromise();
        response = await this.discoveryService.clients({ payload: encryptedData2.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.profileData['clients'] = response?.data ?? [];

        if (this.profileData.clients) {
          this.profileData.clients.forEach(async (client: any) => {
            if (client.document?.documentName) {
              const encryptedData = await this.securityService.encrypt({ fileName: client.document?.documentName }).toPromise();
              const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: encryptedData.encryptedText }));
              const reader = new FileReader();
              reader.onload = () => {
                client['clientLogo'] = reader.result;
              };
              reader.readAsDataURL(responseBlob);
            }
          });
        }
      } else if (this.selectedCategory === 'Products') {
        // const defaultCondition = " AND product.udyamRegistrationNo = '" + this.profileData?.udyamRegistrationNo + "'";
        const defaultCondition = {
          "filters": [
            {
              "table": "product",
              "field": "udyamRegistrationNo",
              "operator": "=",
              "value": this.profileData.udyamRegistrationNo,
              "sequence": 1,
              "condition": "AND"
            }
          ]
        };
        // let response = await this.discoveryService.products({ payload: btoa(this.encryptionService.encrypt({ defaultCondition })) }).toPromise();
        // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
        let response = await this.discoveryService.products({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.productsData = response?.data ?? [];

        this.productsData.forEach((product: any) => {
          if (product.documents) {
            product.documents.forEach(async (document: any) => {
              if (document.documentName) {
                const encryptedData = await this.securityService.encrypt({ fileName: document.documentName }).toPromise();
                const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: encryptedData.encryptedText }));
                const reader = new FileReader();
                reader.onload = () => {
                  document['productImage'] = reader.result;
                };
                reader.readAsDataURL(responseBlob);
              }
            });
          }
        });
      } else if (this.selectedCategory === 'Assets') {
        this.gallaryData = [];
        // const defaultCondition = " AND asset.udyamRegistrationNo = '" + this.profileData?.udyamRegistrationNo + "'";
        const defaultCondition = {
          "filters": [
            {
              "table": "asset",
              "field": "udyamRegistrationNo",
              "operator": "=",
              "value": this.profileData.udyamRegistrationNo,
              "sequence": 1,
              "condition": "AND"
            }
          ]
        };
        // let response = await this.discoveryService.assets({ payload: btoa(this.encryptionService.encrypt({ defaultCondition })) }).toPromise();
        // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
        let response = await this.discoveryService.assets({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.assetsData = response?.data ?? [];

        for (const asset of this.assetsData) {
          if (!asset.documents) continue;
          for (const document of asset.documents) {
            if (!document.documentName) continue;
            const encryptedData = await this.securityService.encrypt({ fileName: document.documentName }).toPromise();
            const blob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: encryptedData.encryptedText }));
            document['assetImage'] = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            document.safeUrl = document.assetImage;

            let galaryData = JSON.parse(JSON.stringify(document));
            galaryData['assetType'] = asset.assetType;
            galaryData['assetName'] = asset.assetName;
            galaryData['safeUrl'] = document.assetImage;

            this.gallaryData.push(galaryData);
          }
          asset.renderKey = Date.now() + Math.random();
        }
      } else if (this.selectedCategory === 'UdyamDetails') {
        // const defaultCondition = " AND udyam.udyamRegistrationNo = '" + this.profileData?.udyamRegistrationNo + "'";
        const defaultCondition = {
          "filters": [
            {
              "table": "udyam",
              "field": "udyamRegistrationNo",
              "operator": "=",
              "value": this.profileData.udyamRegistrationNo,
              "sequence": 1,
              "condition": "AND"
            }
          ]
        };
        // let response = await this.discoveryService.udyams({ payload: btoa(this.encryptionService.encrypt({ defaultCondition })) }).toPromise();
        // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
        let response = await this.discoveryService.udyams({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.udyamDetails = response?.data ? response?.data[0] : [];
      }

      await this.filterData();
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ProfileComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  // Common
  changeCategory(category: string) {
    this.selectedCategory = category;
    this.selectedAssetCategory = 'Assets';
    this.selectedAsset = null;
    this.onLoad();
  }

  previewAsWebsite() {
    this.router.navigate(['/webview/' + this.webAddress]);
  }

  backToSearch() {
    this.router.navigate(['/']);
  }

  async filterData() {
    try {
      this.isLoading = true;
      let data = this.selectedCategory == 'Products' ? this.productsData
        : this.selectedAssetCategory == 'Photos' ? this.gallaryData
          : this.selectedAsset != null ? this.assetsData.filter((item: any) => item.assetType == this.selectedAsset)
            : [];

      this.dataSource = new MatTableDataSource<any>(data);
      this.dataSource.paginator = this.paginator;

      this.dataSourceCards = this.dataSource.connect();
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ProfileComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  get hidePaginator() {
    return (
      this.selectedCategory != 'Products' &&
      this.selectedAssetCategory != 'Photos' &&
      this.selectedAsset == null
    )
  }

  // Products
  openProductView(data: any) {
    const dialogRef = this.dialog.open(ProductDetailsComponent, {
      disableClose: true,
      data: {
        type: 'profile-view',
        title: this.translate.instant('Profile.ProductDetails'),
        product: data,
        enterprises: [this.profileData]
      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.onLoad();
    });
  }


  // Assets
  changeAssetsCategory(category: string) {
    this.selectedAssetCategory = category;
    this.filterData();
  }

  selectAsset(asset: string | null) {
    this.selectedAsset = asset;
    this.filterData();
  }

  openAssetView(data: any) {
    if (!this.selectedAsset) return;
    const type = (this.selectedAsset != 'Brochures' && this.selectedAsset != 'Images') ? 'awardCertificationDetails' : this.selectedAsset;
    const dialogRef = this.dialog.open(AssetsDetailsComponent, {
      disableClose: true,
      data: {
        type: type,
        assetType: this.selectedAsset,
        title: this.translate.instant(this.selectedAsset),
        assetData: data,
        assetsData: this.assetsData.filter((asset: any) => asset.assetType === this.selectedAsset)
      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.onLoad();
    });
  }

  trackByAsset(index: number, asset: any) {
    return asset.renderKey;
  }

  async downloadFile(doc: any) {
    const encryptedData = await this.securityService.encrypt({ fileName: doc.documentName }).toPromise();
    const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: encryptedData.encryptedText }));
    const url = window.URL.createObjectURL(responseBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.documentName;
    a.click();
  }

  openGalleryView(viewIndex: any) {
    const pageIndex = this.paginator.pageIndex;
    const pageSize = this.paginator.pageSize;
  
    const realIndex = pageIndex * pageSize + viewIndex;
    const dialogRef = this.dialog.open(AssetsDetailsComponent, {
      disableClose: true,
      data: {
        type: 'gallery',
        title: this.translate.instant('Profile.Gallery'),
        gallaryData: this.gallaryData,
        selectedIndex: realIndex
      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.onLoad();
    });
  }

  toggleExpandContent(id: string) {
    this.contentExpanded[id] = !this.contentExpanded[id];
  }

  getAssetName(assetType: string) {
    return this.assetsData.some((asset: any) => asset.assetType == assetType);
  }

  openEnquiry() {
    const dialogRef = this.dialog.open(EnquiryComponent, {
      disableClose: true,
      data: {
        type: 'general',
        enterprises: [this.profileData]
      },
      width: '800px',
      maxWidth: '80vw'
    });
  }
}
