import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser';
import { OwlOptions } from 'ngx-owl-carousel-o';

import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '@shared/services/commom/common.service';
import { EncryptionService } from '@shared/services/encryption/encryption.service';
import { SecurityService } from 'src/app/shared/services/security/security.service';

import { ProfileDetailsComponent } from '../modals/profile-details/profile-details.component';
import { EnterpriseDetailsComponent } from '../modals/enterprise-details/enterprise-details.component';
import { MarketDetailsComponent } from '../modals/market-details/market-details.component';
import { ClientDetailsComponent } from '../modals/client-details/client-details.component';
import { ComplianceDetailsComponent } from '../modals/compliance-details/compliance-details.component';
import { AssetsEntryComponent } from '../modals/assets-entry/assets-entry.component';
import { ProductComponent } from '../modals/product/product.component';
import { ProductDetailsComponent } from '@components/modals/product-details/product-details.component';
import { AssetsDetailsComponent } from 'src/app/components/modals/assets-details/assets-details.component';
import { ContactPersonDetailsComponent } from '../modals/contact-person-details/contact-person-details.component';
import { ProfileService } from '../../profile.service';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

import { FormControl, FormGroup, Validators } from '@angular/forms';
import { formatDate } from '@angular/common';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';

@Component({
    selector: 'app-profile-entry',
    templateUrl: './profile-entry.component.html',
    styleUrl: './profile-entry.component.scss',
    standalone: false
})
export class ProfileEntryComponent implements OnInit {
  // Default
  isLoading: boolean = false;

  webAddressPrefix = environment.WEBADDRESS_PREFIX;
  // General Variables
  selectedCategory: string = 'About';

  selectedAssetCategory: string = 'Assets';
  selectedAsset!: string | null;

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

  contentExpanded: any = {};

  consentDate: Date = new Date();
  tempUdyamData: any = {};
  udyamForm!: FormGroup;
  udyams: any = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly translate: TranslateService,
    public readonly commonService: CommonService,
    private readonly encryptionService: EncryptionService,
    private readonly securityService: SecurityService,
    private readonly dialog: MatDialog,
    private readonly profileService: ProfileService,
    private readonly tokenStorageService: TokenStorageService
  ) { }

  async ngOnInit() {

    this.udyamForm = new FormGroup({
      udyamRegistrationNo: new FormControl(null, [Validators.required]),
      loginName: new FormControl(this.tokenStorageService.getUser().loginName),
      termsAndConditions: new FormControl(false),
    });

    // Load All endpoints on load
    await this.getAppUserUdyams();
    await this.onLoad();
  }

  async submitUdyam() {
    try {
      this.isLoading = true;
      const sendData: any = { udyamRegistrationNo: this.udyamForm.value.udyamRegistrationNo, appUserId: this.tokenStorageService.getUser().appUserId, consentDate: formatDate(this.consentDate, "yyyy-MM-dd HH:mm:ss", "en-US") };
      // const response = await this.profileService.submitConsent({ payload: btoa(this.encryptionService.encrypt(sendData)) }).toPromise();
      // const decryptResponse = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(sendData).toPromise();
      const response: any = await this.profileService.submitConsent({ payload: encryptedData.encryptedText} ).toPromise();
      const decryptResponse = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      if (decryptResponse?.status == 'success') {
        this.udyamForm.get('udyamRegistrationNo')?.reset();
        this.tempUdyamData = {};
        this.getAppUserUdyams();
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ProfileEntryComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  async getAppUserUdyams() {
    try {
      this.isLoading = true;
      // const defaultCondition = " AND appuserudyam.appUserId = " + this.tokenStorageService.getUser().appUserId;
      const defaultCondition:any = { filters: [] };
      // const response = await this.profileService.appUserUdyams({ payload: btoa(this.encryptionService.encrypt({ defaultCondition })) }).toPromise();
      // this.udyams = response?.payload ? this.encryptionService.decrypt(atob(response.payload)).data : [];
      const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
      let response: any = await this.profileService.appUserUdyams({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      this.udyams = response?.data || [];
      if(this.udyams.length == 0) {
        const dialogRef = this.dialog.open(AlertsComponent, {
          disableClose: true,
          data: {
            type: "error-type",
            title: this.translate.instant("Common.NoUdyamFound"),
            message: this.translate.instant("Common.NoUdyamsFound"),
          },
          width: '550px',
          maxWidth: '60vw'
        });
        this.router.navigate(['/dashboard'], { relativeTo: this.route });
        return;
      }
      const udyamRegistrationNo = this.tokenStorageService.getUdyamRegistrationNo();
      const selectedUdyam = this.udyams.length > 0 ? this.udyams.find((udyam: any) => udyam.udyamRegistrationNo === udyamRegistrationNo) : {};
      this.tempUdyamData = selectedUdyam != undefined ? selectedUdyam : (this.udyams.length > 0 ? this.udyams[0] : {});
      this.udyamForm.patchValue({
        udyamRegistrationNo: this.tempUdyamData?.udyamRegistrationNo,
      });
      this.tokenStorageService.saveUdyamRegistrationNo(this.udyamForm.value.udyamRegistrationNo);
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ProfileEntryComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  async onLoad() {
    try {
      this.selectedAsset = null;
      this.isLoading = true;
      if (this.selectedCategory === 'About') {
        // let defaultCondition = " AND udyam.udyamRegistrationNo = '" + this.udyamForm.value.udyamRegistrationNo + "'";
        let defaultCondition: any = {
          "filters": [
            {
              "table": "udyam",
              "field": "udyamRegistrationNo",
              "operator": "=",
              "value": this.udyamForm.value.udyamRegistrationNo,
              "sequence": 1,
              "condition": "AND"
            }
          ]
        };

        // let response = await this.profileService.enterprises({ payload: btoa(this.encryptionService.encrypt({defaultCondition})) }).toPromise();
        // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
        let response: any = await this.profileService.enterprises({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.profileData = response?.data ? response?.data[0] : [];
        if (this.profileData?.domesticMarkets) this.profileData['domesticMarkets'] = JSON.parse(this.profileData.domesticMarkets);
        if (this.profileData?.internationalMarkets) this.profileData['internationalMarkets'] = JSON.parse(this.profileData.internationalMarkets);
        if (this.profileData?.sectorsServed) this.profileData['sectorsServed'] = JSON.parse(this.profileData.sectorsServed);

        if (this.profileData?.documents) {
          this.profileData.documents.forEach(async (document: any) => {
            if (document?.documentName) {
              const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: await this.securityService.encrypt({fileName: document?.documentName}).toPromise() }));
              const reader = new FileReader();
              reader.onload = () => {
                if (document.transactionType == 'coverImage') this.profileData['coverImage'] = reader.result;
                if (document.transactionType == 'enterpriseLogo') this.profileData['enterpriseLogo'] = reader.result;
              };
              reader.readAsDataURL(responseBlob);
            }
          });
        }

        // defaultCondition = " AND client.udyamRegistrationNo = '" + this.udyamForm.value.udyamRegistrationNo + "'";
        defaultCondition = {
          "filters": [
            {
              "table": "client",
              "field": "udyamRegistrationNo",
              "operator": "=",
              "value": this.udyamForm.value.udyamRegistrationNo,
              "sequence": 1,
              "condition": "AND"
            }
          ]
        };

        // response = await this.profileService.clients({ payload: btoa(this.encryptionService.encrypt({defaultCondition})) }).toPromise();
        // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
        const encryptedData2 = await this.securityService.encrypt({defaultCondition}).toPromise();
        response = await this.profileService.clients({ payload: encryptedData2.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.profileData['clients'] = response?.data ?? [];

        if (this.profileData.clients) {
          this.profileData.clients.forEach(async (client: any) => {
            if (client.document?.documentName) {
              const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: await this.securityService.encrypt({fileName: client.document?.documentName}).toPromise() }));
              const reader = new FileReader();
              reader.onload = () => {
                client['clientLogo'] = reader.result;
              };
              reader.readAsDataURL(responseBlob);
            }
          });
        }
      } else if (this.selectedCategory === 'Products') {
        // const defaultCondition = " AND product.udyamRegistrationNo = '" + this.udyamForm.value.udyamRegistrationNo + "'";
        const defaultCondition: any = {
          "filters": [
            {
              "table": "product",
              "field": "udyamRegistrationNo",
              "operator": "=",
              "value": this.udyamForm.value.udyamRegistrationNo,
              "sequence": 1,
              "condition": "AND"
            }
          ]
        };

        // let response = await this.profileService.products({ payload: btoa(this.encryptionService.encrypt({defaultCondition})) }).toPromise();
        // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
        let response = await this.profileService.products({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.productsData = response?.data ?? [];

        this.productsData.forEach((product: any) => {
          if (product.documents) {
            // product.documents = JSON.parse(product.documents);
            product.documents.forEach(async (document: any) => {
              if (document.documentName) {
                const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: await this.securityService.encrypt({fileName: document.documentName}).toPromise() }));
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
        // const defaultCondition = " AND asset.udyamRegistrationNo = '" + this.udyamForm.value.udyamRegistrationNo + "'";
        const defaultCondition: any = {
          "filters": [
            {
              "table": "asset",
              "field": "udyamRegistrationNo",
              "operator": "=",
              "value": this.udyamForm.value.udyamRegistrationNo,
              "sequence": 1,
              "condition": "AND"
            }
          ]
        };
        // let response = await this.profileService.assets({ payload: btoa(this.encryptionService.encrypt({defaultCondition})) }).toPromise();
        // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
        let response = await this.profileService.assets({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.assetsData = response?.data ?? [];

        for (const asset of this.assetsData) {
          if (!asset.documents) continue;
          for (const document of asset.documents) {
            if (!document.documentName) continue;
            const blob = await firstValueFrom(this.commonService.previewFile({ payload: await this.securityService.encrypt({fileName: document.documentName}).toPromise() }));
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
          // asset.renderKey = Date.now() + Math.random();
        }
      } else if (this.selectedCategory === 'UdyamDetails') {
        // const defaultCondition = " AND udyam.udyamRegistrationNo = '" + this.udyamForm.value.udyamRegistrationNo + "'";
        const defaultCondition: any = {
          "filters": [
            {
              "table": "udyam",
              "field": "udyamRegistrationNo",
              "operator": "=",
              "value": this.udyamForm.value.udyamRegistrationNo,
              "sequence": 1,
              "condition": "AND"
            }
          ]
        };
        // let response = await this.profileService.udyams({ payload: btoa(this.encryptionService.encrypt({defaultCondition})) }).toPromise();
        // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
        let response = await this.profileService.udyams({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.udyamDetails = response?.data ? response?.data[0] : [];
      }

      await this.filterData();
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ProfileEntryComponent' });
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
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ProfileEntryComponent' });
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

  // Profile
  openProfileDetails() {
    const dialogRef = this.dialog.open(ProfileDetailsComponent, {
      disableClose: true,
      data: {
        profileData: this.profileData
      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result.type) return;
      this.onLoad();
    });
  }

  // About
  openAboutEnterprise() {
    const dialogRef = this.dialog.open(EnterpriseDetailsComponent, {
      disableClose: true,
      data: {
        enterpriseData: this.profileData
      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result.type) return;
      this.onLoad();
    });
  }

  openClients() {
    const dialogRef = this.dialog.open(ClientDetailsComponent, {
      disableClose: true,
      data: {
        clientsData: this.profileData.clients
      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result.type) return;
      this.onLoad();
    });
  }

  openMarketPresence() {
    const dialogRef = this.dialog.open(MarketDetailsComponent, {
      disableClose: true,
      data: {
        marketData: this.profileData
      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result.type) return;
      this.onLoad();
    });
  }

  openComplainceRegistrations() {
    const dialogRef = this.dialog.open(ComplianceDetailsComponent, {
      disableClose: true,
      data: {
        complainceData: this.profileData
      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result.type) return;
      this.onLoad();
    });
  }

  // Products
  openProduct(event: any, data?: any) {
    event.stopPropagation();
    if (this.productsData && this.productsData.length > 100) {
      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "error-type",
          title: this.translate.instant('Common.LimitExceeded'),
          message: this.translate.instant('Common.ProductsLimitExceeded'),
        },
        width: '550px',
        maxWidth: '60vw'
      });
      return;
    }
    const dialogRef = this.dialog.open(ProductComponent, {
      disableClose: true,
      data: {
        productData: data
      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result.type) return;
      this.onLoad();
    });
  }

  openProductView(data: any) {
    const dialogRef = this.dialog.open(ProductDetailsComponent, {
      disableClose: true,
      data: {
        type: 'profile-entry',
        title: this.translate.instant('Profile.ProductDetails'),
        product: data
      },
      width: '800px',
      maxWidth: '95vw'
    });
  }

    // About
    openContactDetails() {
      const dialogRef = this.dialog.open(ContactPersonDetailsComponent, {
        disableClose: true,
        data: {
          contactData: this.profileData
        },
        width: '800px',
        maxWidth: '95vw'
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (!result.type) return;
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

  openAsset(event: any, data?: any) {
    event.stopPropagation();

    const title = this.selectedAsset == 'Awards' ? 'AwardDetails'
      : this.selectedAsset == 'Certifications' ? 'CertificationDetails'
        : this.selectedAsset == 'Brochures' ? 'BrochureDetails'
          : this.selectedAsset == 'Images' ? 'ImageDetails'
            : 'AssetDetails';
    const dialogRef = this.dialog.open(AssetsEntryComponent, {
      disableClose: true,
      data: {
        type: this.selectedAsset,
        title: this.translate.instant(title || 'AssetDetails'),
        assetsData: data
      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result.type) return;
      this.onLoad();
    });
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
  }

  async downloadFile(doc: any) {
    const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: await this.securityService.encrypt({fileName: doc.documentName}).toPromise() }));
    const url = window.URL.createObjectURL(responseBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.documentName;
    a.click();
  }

  openGalleryView(viewIndex: number) {
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
  }

  toggleExpandContent(id: string) {
    this.contentExpanded[id] = !this.contentExpanded[id];
  }

  previewAsWebsite() {
    window.onbeforeunload = null;
    const basePath = window.location.pathname.replace(/\/$/, '');
    const url = `${window.location.origin}${basePath}/#/${this.profileData?.webAddress}`;
    window.open(url, '_blank');
  }

  cancelConsent(){
    this.router.navigate(['/dashboard'], { relativeTo: this.route });
    this.udyamForm.patchValue({
      udyamRegistrationNo: null,
      termsAndConditions: false
    });
    this.tempUdyamData = '';
  }

  changeUdyamNo(udyamRegistrationNo: string) {
    const udyam = this.udyams.find((udyam: any) => udyam.udyamRegistrationNo == udyamRegistrationNo);
    this.tempUdyamData = udyam;    
    this.udyamForm.patchValue({
      udyamRegistrationNo: udyam?.udyamRegistrationNo,
    });
    this.tokenStorageService.saveUdyamRegistrationNo(udyam?.udyamRegistrationNo);
    setTimeout(() => {
      this.onLoad();
    }, 100);
  }
}
