import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AssetsComponent } from 'src/app/components/modals/assets/assets.component';
import { ProductDetailsComponent } from 'src/app/components/modals/product-details/product-details.component';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { EncryptionService } from '@shared/services/encryption/encryption.service';

import { CommonService } from 'src/app/shared/services/commom/common.service';
import { DiscoveryService } from '../../discovery.service';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SafeResourceUrl } from '@angular/platform-browser';
import { EnquiryComponent } from '../../modals/enquiry/enquiry.component';
@Component({
    selector: 'app-webview',
    templateUrl: './webview.component.html',
    styleUrl: './webview.component.scss',
    standalone: false
})
export class WebviewComponent implements OnInit {

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  // Default
  isLoading: boolean = false;

  webAddressPrefix = environment.WEBADDRESS_PREFIX;

  profileData: any;
  productsData: {
    productImages?: string[];
    productName?: string;
    productUnit?: string;
    categoryName?: string;
    productDescription?: string;
    productPrice?: number;
    productQuantity?: number;
    documents?: any
  }[] = [];


  gallaryData: any = [];
  safeImages: SafeResourceUrl[] = [];

  udyamDetails: any;
  assetsData: {
    assetName: any;
    assetType: string;
    documents?: any
  }[] = [];

  selectedAssetCategory: string = 'Assets';
  selectedAsset!: string | null;

  // General Variables
  isSticky = false;
  awardsData: any;
  showProductLimit = 8;
  activeMenuItem!: string;
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

  onScroll() {
    const scrollTop = this.scrollContainer.nativeElement.scrollTop;
    this.isSticky = scrollTop > 50;
  }

  allMenuItems = [
    { title: 'AboutUs', section: 'AboutUs' } ,
    { title: 'Products', section: 'Products' },
    { title: 'Assets', section: 'Assets' },
    { title: 'Contact', section: 'Contact' }
  ];

  menuItems:any = [];

  webAddress: string | null = '';

  contentExpanded: any = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    public translate: TranslateService,
    public readonly tokenStorageService: TokenStorageService,
    public readonly commonService: CommonService,
    private readonly encryptionService: EncryptionService,
    private readonly discoveryService: DiscoveryService,
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

  setMenuItems() {
    this.menuItems = this.allMenuItems.filter(item => {
      if (item.title === 'AboutUs') {
        return !!this.profileData?.aboutEnterprise;
      }

      if (item.title === 'Products') {
        return this.productsData?.length > 0;
      }

      if (item.title === 'Assets') {
        return this.assetsData?.length > 0;
      }

      if (item.title === 'Contact') {
        return !!(
          this.profileData?.emailId ||
          this.profileData?.mobileNumber ||
          this.profileData?.website
        );
      }

      return false;
    });
  }

  async onLoad() {
    try {
      this.isLoading = true;

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
      let response = await this.discoveryService.enterprises({ payload: this.encryptionService.encrypt({ defaultCondition }) }).toPromise();
      response = response?.payload ? this.encryptionService.decrypt(response.payload) : [];

      this.profileData = response?.data ? response?.data[0] : {};
      this.setMenuItems();
      // Fallback if profileData or udyamRegistrationNo does not exist
      if (!this.profileData || !this.profileData?.udyamRegistrationNo) {
        this.backToSearch();
        return;
      }
      if (this.profileData?.domesticMarkets) this.profileData['domesticMarkets'] = JSON.parse(this.profileData.domesticMarkets);
      if (this.profileData?.internationalMarkets) this.profileData['internationalMarkets'] = JSON.parse(this.profileData.internationalMarkets);
      if (this.profileData?.sectorsServed) this.profileData['sectorsServed'] = JSON.parse(this.profileData.sectorsServed);

      if (this.profileData.documents) {
        this.profileData.documents.forEach(async (document: any) => {
          if (document?.documentName) {
            const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: this.encryptionService.encrypt({ fileName: document.documentName }) }));
            const reader = new FileReader();
            reader.onload = () => {
              if (document.transactionType == 'coverImage') this.profileData['coverImage'] = reader.result;
              if (document.transactionType == 'enterpriseLogo') this.profileData['enterpriseLogo'] = reader.result;
            };
            reader.readAsDataURL(responseBlob);
          }
        });
      }

      // defaultCondition = " AND client.udyamRegistrationNo = '" + this.profileData.udyamRegistrationNo + "'";
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
      response = await this.discoveryService.clients({ payload: this.encryptionService.encrypt({ defaultCondition }) }).toPromise();
      response = response?.payload ? this.encryptionService.decrypt(response.payload) : [];
      this.profileData['clients'] = response?.data ?? [];

      if (this.profileData.clients) {
        this.profileData.clients.forEach(async (client: any) => {
          if (client.document?.documentName) {
            const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: this.encryptionService.encrypt({ fileName: client.document.documentName }) }));
            const reader = new FileReader();
            reader.onload = () => {
              client['clientLogo'] = reader.result;
            };
            reader.readAsDataURL(responseBlob);
          }
        });
      }

      defaultCondition = {
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
      response = await this.discoveryService.products({ payload: this.encryptionService.encrypt({ defaultCondition }) }).toPromise();
      response = response?.payload ? this.encryptionService.decrypt(response.payload) : [];
      this.productsData = response?.data ?? [];
      this.setMenuItems();

      this.productsData.forEach((product: any) => {
        if (product.documents) {
          product.documents.forEach(async (document: any) => {
            if (document.documentName) {
              const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: this.encryptionService.encrypt({ fileName: document.documentName }) }));
              const reader = new FileReader();
              reader.onload = () => {
                document['productImage'] = reader.result;
              };
              reader.readAsDataURL(responseBlob);
            }
          });
        }
      });

      defaultCondition = {
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
      response = await this.discoveryService.udyams({ payload: this.encryptionService.encrypt({ defaultCondition }) }).toPromise();
      response = response?.payload ? this.encryptionService.decrypt(response.payload) : [];
      this.udyamDetails = response?.data ? response?.data[0] : [];

      defaultCondition = {
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
      response = await this.discoveryService.assets({ payload: this.encryptionService.encrypt({ defaultCondition }) }).toPromise();
      response = response?.payload ? this.encryptionService.decrypt(response.payload) : [];
      this.assetsData = response?.data ?? [];
      this.setMenuItems();

      for (const asset of this.assetsData) {
        if (!asset.documents) continue;
        for (const document of asset.documents) {
          if (!document.documentName) continue;
          const blob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: this.encryptionService.encrypt({ fileName: document.documentName }) }));
          document['assetImage'] = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          document.safeUrl = document.assetImage;
        }
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'WebviewComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  backToSearch() {
    this.router.navigate(['/']);
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

  viewAsProfile() {
    this.router.navigate(['/' + this.webAddress]);
  }

  scrollToSection(sectionId: string) {
    this.activeMenuItem = sectionId;

    const container = document.querySelector('.wrapper') as HTMLElement;
    const target = document.getElementById(sectionId);

    if (!container || !target) return;

    const headerOffset = 80;
    const targetPosition = target.offsetTop;
    const scrollPosition = targetPosition - headerOffset;

    container.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openAssets(assetType: string) {
    try {
      this.isLoading = true;
      this.dialog.open(AssetsComponent, {
        data: {
          assetType: assetType,
          title: this.translate.instant(assetType),
          assets: this.assetsData.filter((asset: any) => asset.assetType === assetType)
        },
        width: '800px',
        maxWidth: '800px'
      });

    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'WebviewComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  openProducts(product: any) {
    try {
      this.isLoading = true;
      const dialogRef = this.dialog.open(ProductDetailsComponent, {
        data: {
          type: 'web-view',
          title: this.translate.instant('Web.ProductDetails'),
          product: product,
          enterprises: [this.profileData]
        },
        maxWidth: '800px',
        width: '800px'
      });
    }
    catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'WebviewComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  loadMoreProducts(): void {
    this.showProductLimit = this.showProductLimit >= this.productsData.length ? 8 : this.showProductLimit + 4;
  }

  toggleExpandContent(id: string) {
    this.contentExpanded[id] = !this.contentExpanded[id];
  }

  getAssetName(assetType: string) {
    return this.assetsData.some((asset: any) => asset.assetType == assetType);
  }
}
