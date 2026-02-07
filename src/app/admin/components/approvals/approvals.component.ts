import { Component, QueryList, ViewChildren } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog'
import { AlertsComponent } from 'src/app/components/alerts/alerts.component'
import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { AdminService } from '@admin/admin.service';
import { EncryptionService } from '@services/encryption/encryption.service';
import { SecurityService } from '@services/security/security.service';
import { CommonService } from '@services/commom/common.service';
import { DataExportService } from '@services/data-export/data-export.service';
import { CategoryApprovalsComponent } from '../modals/category-approvals/category-approvals.component';
import { formatDate } from '@angular/common';
import { Observable } from 'rxjs';
import { ProfileApprovalsComponent } from '../modals/profile-approvals/profile-approvals.component';

@Component({
    selector: 'app-approvals',
    templateUrl: './approvals.component.html',
    styleUrl: './approvals.component.scss',
    standalone: false
})
export class ApprovalsComponent {
  // Default
  isLoading = false;

  // Table
  @ViewChildren(MatPaginator) paginator = new QueryList<MatPaginator>();
  @ViewChildren(MatSort) sort = new QueryList<MatSort>();
  profileDisplayedColumns = ['udyamRegistrationNo', 'enterpriseName', 'mobileNumber', 'emailId', 'enterpriseStatusDate', 'enterpriseStatus', 'enterpriseStatusRemarks'];
  approveDisplayedColumns = ['sno', 'requestDate', 'userName', 'requestedName', 'requestDescription', 'requestStatusDate', 'requestStatus', 'requestStatusRemarks'];

  dataSource!: MatTableDataSource<any>;
  dataSourceCards!: Observable<any>;
  defaultPageSize = 10;
  pageSizeOptions = [10, 20, 30, 40];

  // General Variables
  selectedRow: any = null;
  searchInput: string = '';
  selectedTabIndex = 0; // 0 = Profile, 1 = Category

  // Data Variables
  requestData: any = [];
  profileData: any = [];

  constructor(
    private adminService: AdminService,
    private commonService: CommonService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    public tokenStorageService: TokenStorageService,
    public dataExportService: DataExportService,
    public dialog: MatDialog,
    public translate: TranslateService
  ) { }

  ngOnInit() {
    // Load all endpoints
    this.onTabChange(0);
  }

  async onTabChange(tabIndex: number) {
    try {
      this.isLoading = true;
      this.selectedTabIndex = tabIndex;
      this.searchInput = '';

      if (this.selectedTabIndex == 0) {
        const defaultCondition:any = { filters: [] };
        // let profileResponse = await this.adminService.profiles({ payload: btoa(this.encryptionService.encrypt({defaultCondition})) }).toPromise();
        // profileResponse = profileResponse?.payload ? this.encryptionService.decrypt(atob(profileResponse.payload)) : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
        let profileResponse: any = await this.adminService.profiles({ payload: encryptedData.encryptedText} ).toPromise();
        profileResponse = profileResponse.payload ? await this.securityService.decrypt(profileResponse.payload).toPromise() : {};
        this.profileData = profileResponse?.data || [];
      } else if (this.selectedTabIndex == 1) {
        const defaultCondition:any = { filters: [] };
        // let requestResponse = await this.adminService.requests({ payload: btoa(this.encryptionService.encrypt({defaultCondition})) }).toPromise();
        // requestResponse = requestResponse?.payload ? this.encryptionService.decrypt(atob(requestResponse.payload)) : [];
        const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
        let requestResponse: any = await this.adminService.requests({ payload: encryptedData.encryptedText} ).toPromise();
        requestResponse = requestResponse.payload ? await this.securityService.decrypt(requestResponse.payload).toPromise() : {};
        this.requestData = requestResponse?.data || [];
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ApprovalsComponent' });
    } finally {
      this.isLoading = false;
      this.filterData();
    }

  }

  searchFilter(e: any) {
    const value = e.target.value;
    this.searchInput = value.trim().toLowerCase();
    this.filterData();
  }

  filterData() {
    try {
      this.isLoading = true;
      let data = this.selectedTabIndex == 0 ? [...this.profileData] : [...this.requestData];

      this.dataSource = new MatTableDataSource<any>(data);

      this.filterPredicate();

      if (this.searchInput != '') {
        this.dataSource.filter = this.searchInput;
      }

      this.dataSource.paginator = this.selectedTabIndex == 0 ? this.paginator.toArray()[0] : this.paginator.toArray()[1];
      this.dataSource.sort = this.selectedTabIndex == 0 ? this.sort.toArray()[0] : this.sort.toArray()[1];

      this.dataSourceCards = this.dataSource.connect();
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ApprovalsComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  filterPredicate() {
    if (this.selectedTabIndex == 0) {
      this.dataSource.filterPredicate = (data: any): boolean => {
        return (
          (this.profileDisplayedColumns.indexOf('udyamRegistrationNo') != -1 && JSON.stringify(data?.udyamRegistrationNo)?.trim().toLowerCase().includes(this.searchInput)) ||
          (this.profileDisplayedColumns.indexOf('enterpriseName') != -1 && data?.enterpriseName?.toLowerCase().includes(this.searchInput)) ||
          (this.profileDisplayedColumns.indexOf('mobileNumber') != -1 && JSON.stringify(data?.mobileNumber)?.trim().toLowerCase().includes(this.searchInput)) ||
          (this.profileDisplayedColumns.indexOf('emailId') != -1 && data?.emailId?.toLowerCase().includes(this.searchInput)) ||
          (this.profileDisplayedColumns.indexOf('enterpriseStatus') != -1 && data?.enterpriseStatus?.toLowerCase().includes(this.searchInput)) ||
          (this.profileDisplayedColumns.indexOf('enterpriseStatusDate') != -1 && formatDate(data.enterpriseStatusDate, 'MMM d, y', 'en-US').toLowerCase().includes(this.searchInput)) ||
          (this.profileDisplayedColumns.indexOf('enterpriseStatusRemarks') != -1 && data?.enterpriseStatusRemarks?.toLowerCase().includes(this.searchInput))
        )
      }
    } else {
      this.dataSource.filterPredicate = (data: any): boolean => {
        return (
          (this.approveDisplayedColumns.indexOf('requestDate') != -1 && formatDate(data.requestDate, 'MMM d, y', 'en-US').toLowerCase().includes(this.searchInput)) ||
          (this.approveDisplayedColumns.indexOf('userName') != -1 && data?.userName?.toLowerCase().includes(this.searchInput)) ||
          (this.approveDisplayedColumns.indexOf('requestedName') != -1 && data?.requestedName?.toLowerCase().includes(this.searchInput)) ||
          (this.approveDisplayedColumns.indexOf('requestDescription') != -1 && data?.requestDescription?.toLowerCase().includes(this.searchInput)) ||
          (this.approveDisplayedColumns.indexOf('requestStatus') != -1 && data?.requestStatus?.toLowerCase().includes(this.searchInput)) ||
          (this.approveDisplayedColumns.indexOf('requestStatusDate') != -1 && formatDate(data.requestStatusDate, 'MMM d, y', 'en-US').toLowerCase().includes(this.searchInput)) ||
          (this.approveDisplayedColumns.indexOf('requestStatusRemarks') != -1 && data?.requestStatusRemarks?.toLowerCase().includes(this.searchInput))
        )
      }
    }
  }

  openRequestDetails(data?: any) {
    this.selectedRow = data;
    const dialogRef = this.dialog.open(CategoryApprovalsComponent, {
      disableClose: true,
      data: {
        requestData: data
      },
      width: '600px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result.type) this.onTabChange(1);
    });
  }

  profileRequestDetails(data?: any) {
    this.selectedRow = data;
    const dialogRef = this.dialog.open(ProfileApprovalsComponent, {
      disableClose: true,
      data: {
        profileData: data,
        componentName: 'ApprovalsComponent'
      },
      width: '600px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result.type) this.onTabChange(0);
    });
  }

  async exportSelected(tab: string) {
    try {
      this.isLoading = true;
      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "export",
          title: this.translate.instant('Common.SelectFileFormat')
        },
        width: "500px",
      });
      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;
      const tableName = tab == 'Profile' ? 'Profile' : 'Request Category';
      const paginator = tab == 'Profile' ? this.paginator.toArray()[0] : this.paginator.toArray()[1];
      if (result == 'pdf') {
        await this.dataExportService.exportToPDF('dataTable', paginator, tableName);
      } else if (result == 'excel') {
        setTimeout(async () => {
          await this.dataExportService.exportToExcel(tableName, 'dataTable', tableName);
        }, 500)
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ApprovalsComponent' });
    } finally {
      this.isLoading = false;
    }
  }
}
