import { Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';

import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { UserComponent } from '../modals/user/user.component';

import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { AdminService } from '@admin/admin.service';
import { EncryptionService } from '@services/encryption/encryption.service';
import { SecurityService } from 'src/app/shared/services/security/security.service';
import { CommonService } from '@services/commom/common.service';
import { DataExportService } from '@services/data-export/data-export.service';
import { Observable } from 'rxjs';


@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss'],
    standalone: false
})
export class UsersComponent implements OnInit {
  // Default
  isLoading = false;

  // Table
 @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  @ViewChild('enterprisesCmp') enterprisesCmp!: any;
  displayedColumns = ['userName', 'loginName', 'userType', 'inactive', 'actions'];
  dataSource!: MatTableDataSource<any>;
  dataSourceCards!: Observable<any>;
  defaultPageSize = 10;
  pageSizeOptions = [10, 20, 30, 40];

  // General Variables
  selection = new SelectionModel<any>(true, []);


  // Data Variables
  usersData: any = [];
  enterpriseData: any = [];
  searchInput: string = '';
  selectedTabIndex = 0; // 0 = Users, 1 = Enterprises

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
    this.onTabChange(0);
  }

  async onTabChange(tabIndex: number) {
    try {
      this.isLoading = true;
      this.selectedTabIndex = tabIndex;
      this.searchInput = '';
      if (tabIndex == 0) {
        // const defaultCondition = " AND userType = 'ADMIN'";
        const defaultCondition: any = {
          "filters": [
            {
              "table": "appuser",
              "field": "userType",
              "operator": "=",
              "value": "ADMIN",
              "sequence": 1,
              "condition": "AND"
            }
          ]
        };
        // let response = await this.adminService.users({ payload: btoa(this.encryptionService.encrypt({ defaultCondition })) }).toPromise();
        // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
        const encryptedData = await this.securityService.encrypt({ defaultCondition }).toPromise();
        let response: any = await this.adminService.users({ payload: encryptedData.encryptedText} ).toPromise();
        response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.usersData = response?.data || [];
      } else if (tabIndex == 1) {
       this.enterprisesCmp?.loadEnterprises();
      }
      this.filterData();
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'UsersComponent' });
    } finally {
      this.isLoading = false;

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
      let data =  [...this.usersData];

      this.dataSource = new MatTableDataSource<any>(data);

      this.filterPredicate();

      if (this.searchInput != '') {
        this.dataSource.filter = this.searchInput;
      }

        this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

      this.dataSourceCards = this.dataSource.connect();
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'UsersComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  filterPredicate() {
    if (this.selectedTabIndex == 0) {
      this.dataSource.filterPredicate = (data: any): boolean => {
        const statusText = data.inactive == 'N' ? this.translate.instant('Admin.Active').toLowerCase() : this.translate.instant('Admin.Inactive').toLowerCase();
        return (
          (this.displayedColumns.indexOf('userName') != -1 && data?.userName?.toLowerCase().includes(this.searchInput)) ||
          (this.displayedColumns.indexOf('loginName') != -1 && data?.loginName?.toLowerCase().includes(this.searchInput)) ||
          (this.displayedColumns.indexOf('userType') != -1 && data?.userType?.toLowerCase().includes(this.searchInput)) ||
          (this.displayedColumns.indexOf('inactive') != -1 && statusText.includes(this.searchInput))
        )
      }
    }
  }

  openUserDetails(data?: any) {
    const dialogRef = this.dialog.open(UserComponent, {
      disableClose: true,
      data: {
        userData: data
      },
      width: '800px',
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
      let tempColumns = this.displayedColumns;
      this. displayedColumns = ['userName', 'loginName', 'userType', 'inactive'];

      if (result == 'pdf') {
        await this.dataExportService.exportToPDF('dataTable', this.paginator, 'Government Users');
        this.displayedColumns = tempColumns;
      } else if (result == 'excel') {
        setTimeout(async () => {
          await this.dataExportService.exportToExcel('Government Users', 'dataTable', 'Government Users');
          this.displayedColumns = tempColumns;
        }, 500)
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'UsersComponent' });
    } finally {
      this.isLoading = false;
    }
  }
}
