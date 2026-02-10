import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { EnterpriseStatusComponent } from '../modals/enterprise-status/enterprise-status.component';
import { MatTableDataSource } from '@angular/material/table';
import { AdminService } from '../../admin.service';
import { CommonService } from '@services/commom/common.service';
import { EncryptionService } from '@services/encryption/encryption.service';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { DataExportService } from '@services/data-export/data-export.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
    selector: 'app-enterprises',
    templateUrl: './enterprises.component.html',
    styleUrl: './enterprises.component.scss',
    standalone: false
})
export class EnterprisesComponent {
  // Default
  isLoading = false;

  // Table
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  displayedColumns = ['enterpriseName', 'udyamRegistrationNo', 'emailId', 'mobileNumber', 'entrepreneurName', 'inactive', 'actions'];
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
    
    public tokenStorageService: TokenStorageService,
    public dataExportService: DataExportService,
    public dialog: MatDialog,
    public translate: TranslateService
  ) { }

  ngOnInit() {
    this.loadEnterprises();
  }

  // To get all users
  async loadEnterprises() {
    try {
      this.isLoading = true;
      //  const defaultCondition = " AND appuser.userType = 'MSME'";
      const defaultCondition: any = {
        "filters": [
          {
            "table": "appuser",
            "field": "userType",
            "operator": "=",
            "value": "MSME",
            "sequence": 1,
            "condition": "AND"
          }
        ]
      };
      let enterpriseResponse = await this.adminService.profiles({ payload: this.encryptionService.encrypt({ defaultCondition }) }).toPromise();
      enterpriseResponse = enterpriseResponse?.payload ? this.encryptionService.decrypt(enterpriseResponse.payload) : [];
      this.enterpriseData = enterpriseResponse?.data || [];
      this.filterData();
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'EnterprisesComponent' });
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
      let data = [...this.enterpriseData];

      this.dataSource = new MatTableDataSource<any>(data);

      this.filterPredicate();

      if (this.searchInput != '') {
        this.dataSource.filter = this.searchInput;
      }

      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.dataSourceCards = this.dataSource.connect();
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'EnterprisesComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  filterPredicate() {
    this.dataSource.filterPredicate = (data: any): boolean => {
      const statusText = data.inactive == 'N' ? this.translate.instant('Admin.Active').toLowerCase() : this.translate.instant('Admin.Inactive').toLowerCase();
      return (
        (this.displayedColumns.indexOf('udyamRegistrationNo') != -1 && JSON.stringify(data?.udyamRegistrationNo)?.trim().toLowerCase().includes(this.searchInput)) ||
        (this.displayedColumns.indexOf('enterpriseName') != -1 && data?.enterpriseName?.toLowerCase().includes(this.searchInput)) ||
        (this.displayedColumns.indexOf('mobileNumber') != -1 && JSON.stringify(data?.mobileNumber)?.trim().toLowerCase().includes(this.searchInput)) ||
        (this.displayedColumns.indexOf('emailId') != -1 && data?.emailId?.toLowerCase().includes(this.searchInput)) ||
        (this.displayedColumns.indexOf('entrepreneurName') != -1 && data?.ownerNamebyPAN?.toLowerCase().includes(this.searchInput)) ||
        (this.displayedColumns.indexOf('inactive') != -1 && statusText.includes(this.searchInput))
      )
    }
  }


  enterpriseDetails(data?: any) {
    const dialogRef = this.dialog.open(EnterpriseStatusComponent, {
      disableClose: true,
      data: {
        enterpriseData: data,
      },
      width: '600px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result.type) this.loadEnterprises();
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
      this.displayedColumns = ['enterpriseName', 'udyamRegistrationNo', 'emailId', 'mobileNumber', 'entrepreneurName', 'inactive'];
      if (result == 'pdf') {
        await this.dataExportService.exportToPDF('dataTable', this.paginator, 'Enterprises');
        this.displayedColumns = tempColumns;
      } else if (result == 'excel') {
        setTimeout(async () => {
          await this.dataExportService.exportToExcel('Enterprises', 'dataTable', 'Enterprises');
          this.displayedColumns = tempColumns;
        }, 500)
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'EnterprisesComponent' });
    } finally {
      this.isLoading = false;
    }
  }
}
