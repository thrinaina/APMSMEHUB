import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { CommonService } from '@services/commom/common.service';
import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';
import { SecurityService } from 'src/app/shared/services/security/security.service';
import { DiscoveryService } from '../../discovery.service';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrl: './search.component.scss',
    standalone: false
})
export class SearchComponent {
  // Default
  isLoading = false;
  isFilter = true;
  showOverlay = false;
  isMobile = false;

  // Alert
  private searchWarningCooldown = false;
  private warningTimer: any;

  // Form
  filterForm!: FormGroup;

  // General Variables
  selectedPage: 'SEARCH' | 'LIST' = 'SEARCH';

  // Data variables
  enterpriseData: any[] = [];
  productsData: any = [];

  // Filters
  categories = [
    { value: 'ENTERPRISE', label: 'Discovery.Enterprise' },
    { value: 'PRODUCT', label: 'Discovery.Product' },
  ];
  // Enterprise Filters
  organisationTypes = [
    'CO-OPERATIVE',
    'HINDU UNDIVIDED FAMILY',
    'LIMITED LIABILITY PARTNERSHIP',
    'OTHERS',
    'PARTNERSHIP',
    'PRIVATE LIMITED COMPANY',
    'PROPRIETARY',
    'PUBLIC LIMITED COMPANY',
    'SELF HELP GROUP',
    'SOCIETY',
    'TRUST',
  ];

  districts = [
    'ALLURI SITHARAMA RAJU',
    'ANAKAPALLI',
    'ANANTHAPUR',
    'ANNAMAYYA',
    'BAPATLA',
    'CHITOOR',
    'EAST GODAVARI',
    'ELURU',
    'GUNTUR',
    'KAKINADA',
    'KONASEEMA',
    'KRISHNA',
    'KURNOOL',
    'NANDYAL',
    'NTR',
    'PALNADU',
    'PARVATHIPURAM MANYAM',
    'PRAKASAM',
    'SPSR NELLORE',
    'SRI SATHYA SAI',
    'SRIKAKULAM',
    'TIRUPATI',
    'VISAKHAPATNAM',
    'VIZIANAGARAM',
    'WEST GODAVARI',
    'Y.S.R',
  ];

  enterpriseTypes: string[] = ['MICRO', 'SMALL', 'MEDIUM'];

  majorActivities: string[] = ['MANUFACTURING', 'SERVICES', 'TRADING'];
  // Product Filters
  productCategories: any = [];
  productGITags: string[] = [];

  // Table
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<any>();
  dataSourceCards: any;

  // Pagination
  defaultPageSize: number = 15;
  pageSizeOptions: number[] = [15];
  defaultPageIndex = 0;
  defaultPageOffset = 0;
  totalLength: number = 0;
  pageControl = new FormControl(this.defaultPageIndex + 1);

  enterpriseFilters: any;
  udyamData: any;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private commonService: CommonService,
    private tokenStorageService: TokenStorageService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    private discoveryService: DiscoveryService,
    private toastr: ToastrService,
  ) { }

  async ngOnInit() {
    this.isMobile = window.innerWidth < 576;
    // Filter Form
    this.filterForm = new FormGroup({
      searchText: new FormControl(''),
      category: new FormControl('ENTERPRISE'),
      organisationType: new FormControl(null),
      district: new FormControl(null),
      enterpriseType: new FormControl(null),
      majorActivity: new FormControl(null),
      registeredEnterprises: new FormControl(false),
      productCategory: new FormControl(null),
      gitags: new FormControl(false)
    });

    this.tokenStorageService.getObjParamObject().subscribe(data => {
      if (data.searchCriteria) {
        this.filterForm.setValue(data.searchCriteria);
        this.selectedPage = 'LIST';
        this.newSearch();
      }
    });
    await this.publicSession();
  }

  async publicSession() {
    try {
      this.isLoading = true;
      // const publicSession: any = await this.discoveryService.publicSession().toPromise();
      // const decryptResponse = publicSession.payload ? this.encryptionService.decrypt(atob(publicSession.payload)) : {};
      const publicSession = await this.discoveryService.publicSession().toPromise();
      const decryptResponse = publicSession.payload ? await this.securityService.decrypt(publicSession.payload).toPromise() : {};
      this.tokenStorageService.saveToken(decryptResponse.data.accessToken);
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'SearchComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  getCategory(item: any) {
    return this.categories.find((c) => c.value === item.type)?.label || '';
  }

  async newSearch(keydoardEvent?: any) {
    if (keydoardEvent) {
      const input = keydoardEvent.target as HTMLInputElement;
      input.blur();
    }
    this.udyamData = [];
    this.productsData = [];
    this.dataSource.data = [];

    if (this.filterForm.value.category == 'PRODUCT' && this.productCategories.length == 0) {
      try {
        this.isLoading = true;
        const defaultCondition = { filters: [] };
        // let response1: any = await this.discoveryService.categories({ payload: btoa(this.encryptionService.encrypt({ defaultCondition })) }).toPromise();
        // this.productCategories = response1.payload ? this.encryptionService.decrypt(atob(response1.payload)).data : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
        let response = await this.discoveryService.categories({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.productCategories = response.data || [];
      } catch (err) {
        this.commonService.handleError(err, { type: 'GET', id: 0, component: 'SearchComponent' });
      } finally {
        this.isLoading = false;
      }
    }

    this.defaultPageIndex = 0;
    this.defaultPageOffset = 0;
    this.totalLength = 0;
    this.pageControl.setValue(this.defaultPageIndex + 1);

    this.onSearch();
  }

  async onSearch() {
    try {
      this.isLoading = true;
      const filters = [];

      // IN conditions helper
      const addInFilter = (table: string, field: string, values: (string | number)[]) => {
        if (values?.length > 0) {
          const normalizedValues = values.map(v =>
            typeof v === "string" ? v.toUpperCase() : v
          );
      
          filters.push({
            table,
            field,
            operator: "IN",
            value: normalizedValues,
            sequence: filters.length + 1,
            condition: "AND"
          });
        }
      };
      
      if (this.filterForm.value.category == 'ENTERPRISE') {
        // let defaultCondition = '';
        if (this.filterForm.value.searchText) {
          if (this.filterForm.value.searchText.length < 4) {
            if (this.searchWarningCooldown) {
              return;
            } else {
              this.toastr.warning(this.translate.instant('Discovery.Enteratleast4characterstosearchforallenterprises'));
            }
            this.searchWarningCooldown = true;

            this.warningTimer = setTimeout(() => {
              this.searchWarningCooldown = false;
            }, 5000);

            return;
          }

          // defaultCondition = `AND udyam.enterpriseName LIKE '%${this.filterForm.value.searchText}%'`;
          filters.push({
            table: "udyam",
            field: "enterpriseName",
            operator: "LIKE",
            value: this.filterForm.value.searchText,
            likeType: "contains",
            sequence: filters.length + 1,
            condition: "AND"
          });
        }

        // if (this.filterForm.value.organisationType?.length > 0) defaultCondition += ` AND UPPER(udyam.organisationType) IN (${this.filterForm.value.organisationType.map((element: string) => `'${element}'`).join(',')})`;
        // if (this.filterForm.value.enterpriseType?.length > 0) defaultCondition += ` AND UPPER(udyam.enterpriseType) IN (${this.filterForm.value.enterpriseType.map((element: string) => `'${element}'`).join(',')})`;
        // if (this.filterForm.value.district?.length > 0) defaultCondition += ` AND UPPER(udyam.district) IN (${this.filterForm.value.district.map((element: string) => `'${element}'`).join(',')})`;
        // if (this.filterForm.value.majorActivity?.length > 0) defaultCondition += ` AND UPPER(udyam.majorActivity) IN (${this.filterForm.value.majorActivity.map((element: string) => `'${element}'`).join(',')})`;
        // if (this.filterForm.value.registeredEnterprises) defaultCondition += ` AND enterprise.enterpriseId IS NOT NULL`;

        if (this.filterForm.value.organisationType?.length > 0) addInFilter("udyam", "organisationType", this.filterForm.value.organisationType);
        if (this.filterForm.value.enterpriseType?.length > 0) addInFilter("udyam", "enterpriseType", this.filterForm.value.enterpriseType);
        if (this.filterForm.value.district?.length > 0) addInFilter("udyam", "district", this.filterForm.value.district);
        if (this.filterForm.value.majorActivity?.length > 0) addInFilter("udyam", "majorActivity", this.filterForm.value.majorActivity);
        if (this.filterForm.value.registeredEnterprises) {
          filters.push({
            table: "enterprise",
            field: "enterpriseId",
            operator: "IS NOT NULL",
            sequence: filters.length + 1,
            condition: "AND"
          });
        }

        if (filters.length == 0) {
          if (this.searchWarningCooldown) {
            return;
          } else {
            this.toastr.warning(this.translate.instant('Discovery.Pleaseapplyatleastonesearchcriteriaforsearchingenterprises'));
          }
          this.searchWarningCooldown = true;

          this.warningTimer = setTimeout(() => {
            this.searchWarningCooldown = false;
          }, 5000);
          return;
        }

        const defaultCondition = { filters };
        this.selectedPage = 'LIST';
        // let response: any = await this.discoveryService.discoveryUdyams({ payload: btoa(this.encryptionService.encrypt({ defaultCondition: defaultCondition, limit: this.defaultPageSize, offset: this.defaultPageOffset })) }).toPromise();
        // this.totalLength = response?.payload ? this.encryptionService.decrypt(atob(response.payload)).total : 0;
        // this.udyamData = response?.payload ? this.encryptionService.decrypt(atob(response.payload)).data : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition: defaultCondition, limit: this.defaultPageSize, offset: this.defaultPageOffset}).toPromise();
        let response = await this.discoveryService.discoveryUdyams({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.totalLength = response.total || 0;
        this.udyamData = response.data || [];
        this.udyamData.forEach(async (udyam: any) => {
          if (udyam.enterpriseLogoDocName) {
            const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: await this.securityService.encrypt({ fileName: udyam.enterpriseLogoDocName }).toPromise() }));
            const reader = new FileReader();
            reader.onload = () => {
              udyam['enterpriseLogo'] = reader.result;
            };
            reader.readAsDataURL(responseBlob);
          }
        });
        this.udyamData.sort((a: any, b: any) => Number(a.enterpriseId == null) - Number(b.enterpriseId == null));
        this.dataSource = new MatTableDataSource<any>(this.udyamData);
      } else if (this.filterForm.value.category == 'PRODUCT') {
        // let defaultCondition = '';
        if (this.filterForm.value.searchText) {
          if (this.filterForm.value.searchText.length < 4) {
            if (this.searchWarningCooldown) {
              return;
            } else {
              this.toastr.warning(this.translate.instant('Discovery.Enteratleast4characterstosearchforallproducts'));
            }
            this.searchWarningCooldown = true;

            this.warningTimer = setTimeout(() => {
              this.searchWarningCooldown = false;
            }, 5000);

            return;
          }
        }
        // if (this.filterForm.value.searchText) defaultCondition = `AND product.productName LIKE '%${this.filterForm.value.searchText}%'`;
        // if (this.filterForm.value.productCategory?.length > 0) defaultCondition += ` AND product.categoryId IN (${this.filterForm.value.productCategory.map((element: string) => `'${element}'`).join(',')})`;
        // if (this.filterForm.value.gitags) defaultCondition += ` AND category.isGITag = 'Y'`;
        if (this.filterForm.value.searchText) {
          filters.push({
            table: "product",
            field: "productName",
            operator: "LIKE",
            value: this.filterForm.value.searchText,
            likeType: "contains",
            sequence: filters.length + 1,
            condition: "AND"
          });
        }

        if (this.filterForm.value.productCategory?.length > 0) addInFilter("product", "categoryId", this.filterForm.value.productCategory);

        if (this.filterForm.value.gitags) {
          filters.push({
            table: "category",
            field: "isGITag",
            operator: "=",
            value: "Y",
            sequence: filters.length + 1,
            condition: "AND"
          });
        }
        
        if (filters.length == 0) {
          if (this.searchWarningCooldown) {
            return;
          } else {
            this.toastr.warning(this.translate.instant('Discovery.Pleaseapplyatleastonesearchcriteriaforsearchingproducts'));
          }
          this.searchWarningCooldown = true;

          this.warningTimer = setTimeout(() => {
            this.searchWarningCooldown = false;
          }, 5000);
          return;
        }
        const defaultCondition = { filters };
        this.selectedPage = 'LIST';
        // const response = await this.discoveryService.discoveryProducts({ payload: btoa(this.encryptionService.encrypt({ defaultCondition: defaultCondition, limit: this.defaultPageSize, offset: this.defaultPageOffset, })) }).toPromise();
        // this.totalLength = response?.payload ? this.encryptionService.decrypt(atob(response.payload)).total : 0;
        // this.productsData = response?.payload ? this.encryptionService.decrypt(atob(response.payload)).data : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition: defaultCondition, limit: this.defaultPageSize, offset: this.defaultPageOffset}).toPromise();
        let response = await this.discoveryService.discoveryProducts({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.totalLength = response.total || 0;
        this.udyamData = response.data || [];
        this.productsData.forEach(async (product: any) => {
          if (product.productDocName) {
            const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: await this.securityService.encrypt({ fileName: product.productDocName }).toPromise() }));
            const reader = new FileReader();
            reader.onload = () => {
              product['productImage'] = reader.result;
            };
            reader.readAsDataURL(responseBlob);
          }
        });
        this.dataSource = new MatTableDataSource<any>(this.productsData);
      }

      if (!this.dataSource || this.dataSource.data.length === 0) this.defaultPageIndex = 0;
      this.dataSourceCards = this.dataSource.connect();
      this.showOverlay = false;
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'SearchComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  onPageChange(event: PageEvent) {
    this.defaultPageSize = event.pageSize;
    this.defaultPageIndex = event.pageIndex;
    const offset = event.pageIndex * event.pageSize;
    this.defaultPageOffset = offset == 0 ? 0 : offset;

    this.onSearch();
  }

  jumpToPage(value: string) {
    const pageIndex = Number(value) - 1;

    if (isNaN(pageIndex) || pageIndex < 0 || pageIndex >= this.totalPages) {
      if (this.searchWarningCooldown) {
        return;
      } else {
        this.toastr.warning(this.translate.instant('Discovery.OnlyNumbersbetween1andTotalPagesareallowed', { totalPages: this.totalPages }));
      }
      this.searchWarningCooldown = true;

      this.warningTimer = setTimeout(() => {
        this.searchWarningCooldown = false;
      }, 5000);

      return;
    }

    this.defaultPageIndex = pageIndex;
    this.paginator.pageIndex = pageIndex;

    this.paginator.page.next({
      pageIndex,
      pageSize: this.defaultPageSize,
      length: this.totalLength,
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalLength / this.defaultPageSize);
  }

  clearFilters() {
    this.udyamData = [];
    this.productsData = [];
    this.dataSource.data = [];
    this.filterForm.patchValue({
      searchText: '',
      organisationType: null,
      district: null,
      enterpriseType: null,
      majorActivity: null,
      registeredEnterprises: false,
      productCategory: null,
      gitags: false
    });
  }

  showWebView(webAddress: string) {
    window.onbeforeunload = null;
    const basePath = window.location.pathname.replace(/\/$/, '');
    const url = `${window.location.origin}${basePath}/#/${webAddress}`;
    window.open(url, '_blank');
  }

  shareWebView(webAddress: string) {
    window.onbeforeunload = null;

    const basePath = window.location.pathname.replace(/\/$/, '');
    const url = `${window.location.origin}${basePath}/#/${webAddress}`;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        this.toastr.success(this.translate.instant('Common.CopiedToClipboard'));
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      this.toastr.success(this.translate.instant('Common.CopiedToClipboard'));
    }
  }

  showProductDetails(id: any) {
    const data = { productId: id, searchCriteria: this.filterForm.value };
    this.tokenStorageService.setObjParamObject(data);
    this.router.navigate(['/productprofile'], { skipLocationChange: true });
  }

  backToSearch() {
    this.selectedPage = 'SEARCH';
    this.clearFilters();
  }

  routeTo(page: string) {
    const map: any = {
      DepartmentLogin: '/auth/adminlogin',
      MSMELogin: '/auth/login',
      Register: '/auth/register'
    };

    this.router.navigate([map[page]]);
  }

}
