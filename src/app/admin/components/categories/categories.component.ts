import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { AlertsComponent } from '@components/alerts/alerts.component';
import { CategoryComponent } from '../modals/category/category.component';
import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { AdminService } from '@admin/admin.service';
import { EncryptionService } from '@services/encryption/encryption.service';
import { CommonService } from '@services/commom/common.service';
import { DataExportService } from '@services/data-export/data-export.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-categories',
    templateUrl: './categories.component.html',
    styleUrl: './categories.component.scss',
    standalone: false
})
export class CategoriesComponent implements OnInit {
  // Default
  isLoading = false;

  // Table
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  displayedColumns = ['categoryName', 'categoryDescription', 'isGITag', 'inactive', 'actions'];
  dataSource!: MatTableDataSource<any>;
  dataSourceCards!: Observable<any>;
  defaultPageSize = 10;
  pageSizeOptions = [10, 20, 30, 40];

  // General Variables
  selection = new SelectionModel<any>(true, []);
  searchInput: string = '';

  // Data Variables
  categoriesData: any = [];

  constructor(
    public translate: TranslateService,
    private commonService: CommonService,
    private adminService: AdminService,
    private encryptionService: EncryptionService,
    
    public tokenStorageService: TokenStorageService,
    public dataExportService: DataExportService,
    public dialog: MatDialog,
  ) { }

  async ngOnInit() {
    // Load all endpoints
    await this.onLoad();
  }

  // To get all users
  async onLoad() {
    try {
      this.isLoading = true;
      const defaultCondition:any = { filters: [] };
      let response = await this.adminService.categories({ payload: this.encryptionService.encrypt({ defaultCondition }) }).toPromise();
      response = response?.payload ? this.encryptionService.decrypt(response.payload) : [];
      this.categoriesData = response?.data || [];
      this.dataSource = new MatTableDataSource(this.categoriesData);
      this.dataSourceCards = this.dataSource.connect();
      this.setFilterPredicate();
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'CategoriesComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  searchFilter(e: any) {
    this.searchInput = (e.target.value || '').trim().toLowerCase();
    this.filterData();
  }

  filterData() {
    this.dataSource.filter = this.searchInput;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  setFilterPredicate() {
    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const search = filter.trim().toLowerCase();
      const statusText = data.inactive == 'N' ? this.translate.instant('Admin.Active').toLowerCase() : this.translate.instant('Admin.Inactive').toLowerCase();
      const giTagText = data.isGITag === 'Y' ? 'yes' : 'no';

      return (
        (this.displayedColumns.includes('categoryName') && data?.categoryName?.toLowerCase().includes(search)) ||
        (this.displayedColumns.includes('categoryDescription') && data?.categoryDescription?.toLowerCase().includes(search)) ||
        (this.displayedColumns.includes('isGITag') && giTagText.toLowerCase().includes(search)) ||
        (this.displayedColumns.includes('inactive') && statusText.includes(search))
      );
    };
  }

  openCategoryDetails(data?: any) {
    const dialogRef = this.dialog.open(CategoryComponent, {
      disableClose: true,
      data: {
        userData: data
      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result.type) this.onLoad();
    });
  }

  async exportSelected() {
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
      this.displayedColumns = ['categoryName', 'categoryDescription', 'isGITag', 'inactive'];
      if (result == 'pdf') {
        await this.dataExportService.exportToPDF('dataTable', this.paginator, 'Categories');
        this.displayedColumns = tempColumns;
      } else if (result == 'excel') {
        setTimeout(async () => {
          await this.dataExportService.exportToExcel('Categories', 'dataTable', 'Categories');
          this.displayedColumns = tempColumns;
        }, 500)
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'CategoriesComponent' });
    } finally {
      this.isLoading = false;
    }
  }
}
