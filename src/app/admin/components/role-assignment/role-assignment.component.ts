import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AdminService } from '../../admin.service';
import { CommonService } from 'src/app/shared/services/commom/common.service';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';
import { SecurityService } from 'src/app/shared/services/security/security.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-role-assignment',
    templateUrl: './role-assignment.component.html',
    styleUrl: './role-assignment.component.scss',
    standalone: false
})
export class RoleAssignmentComponent {
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  displayedColumns = ['select', 'userName'];
  dataSource!: MatTableDataSource<any>;
  dataSourceCards!: Observable<any>;
  defaultPageSize = 10;
  pageSizeOptions = [10, 20, 30, 40];
  roleAssignForm!: FormGroup;
  isSavedAssignment = false;
  rolesData: any = [];
  isLoading = false;
  selection = new SelectionModel<any>(true, []);
  searchInput: string = '';
  userRoleAssignmentData: any = [];

  constructor(
    private tokenStorageService: TokenStorageService,
    private adminService: AdminService,
    private commonService: CommonService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    public translate: TranslateService
  ) { }

  async ngOnInit() {

    this.roleAssignForm = new FormGroup({
      userMenuId: new FormControl(null, [Validators.required]),
      userMenuRoleId: new FormControl(null, [Validators.required]),
      users: new FormControl(null),
      loginUserId: new FormControl(this.tokenStorageService.getUser().appUserId, [Validators.required]),
      inactive: new FormControl('N')
    })

    try {

      this.isLoading = true;
      const defaultCondition: any = { filters: [] };
      // let roleResponse = await this.adminService.userMenuRoles({ payload: btoa(this.encryptionService.encrypt({defaultCondition})) }).toPromise();
      // roleResponse = roleResponse.payload ? this.encryptionService.decrypt(atob(roleResponse.payload)) : [];
      const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
      let roleResponse: any = await this.adminService.userMenuRoles({ payload: encryptedData.encryptedText} ).toPromise();
      roleResponse = roleResponse.payload ? await this.securityService.decrypt(roleResponse.payload).toPromise() : {};
      this.rolesData = roleResponse.data;
      if (this.rolesData.length) {
        this.roleAssignForm.patchValue({
          userMenuRoleId: this.rolesData[0].userMenuRoleId,
          userMenuId: this.rolesData[0].userMenuId
        })
      }
      // let userResponse = await this.adminService.userRoleAssignments({ payload: btoa(this.encryptionService.encrypt(this.roleAssignForm.value)) }).toPromise();
      // userResponse = userResponse.payload ? this.encryptionService.decrypt(atob(userResponse.payload)) : [];
      const encryptedData2 = await this.securityService.encrypt(this.roleAssignForm.value).toPromise();
      let userResponse: any = await this.adminService.userRoleAssignments({ payload: encryptedData2.encryptedText} ).toPromise();
      userResponse = userResponse.payload ? await this.securityService.decrypt(userResponse.payload).toPromise() : {};
      this.userRoleAssignmentData = userResponse.data;
      this.userRoleAssignmentData.forEach((element: any) => {
        if (element.isSelected) this.selection.select(element);
      });
      this.dataSource = new MatTableDataSource<any>(this.userRoleAssignmentData);
      this.dataSourceCards = this.dataSource.connect();
      this.setFilterPredicate();
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'RoleAssignmentComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ? this.clearAllSelected() : this.dataSource.data.forEach(row => {
      row.isSelected = true;
      this.selection.select(row)
    });
  }

  clearAllSelected() {
    this.selection.clear();
    this.dataSource.data.forEach(row => row.isSelected = false);
  }

  setSelectedStatus(msmeData: any) {
    msmeData.isSelected = !msmeData.isSelected;
  }

  back() {
    this.router.navigate(['/dashboard'], { relativeTo: this.route })
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
    this.dataSource.filterPredicate = (data: any): boolean => {
      return (
        (this.displayedColumns.indexOf('userName') != -1 && data?.userName?.toLowerCase().includes(this.searchInput))
      )
    }
  }

  async userMenuRoles() {
    try {
      this.isLoading = true;
      const defaultCondition: any = { filters: [] };
      // let roleResponse = await this.adminService.userMenuRoles({ payload: btoa(this.encryptionService.encrypt({defaultCondition})) }).toPromise();
      // roleResponse = roleResponse.payload ? this.encryptionService.decrypt(atob(roleResponse.payload)) : [];
      const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
      let roleResponse: any = await this.adminService.userMenuRoles({ payload: encryptedData.encryptedText} ).toPromise();
      roleResponse = roleResponse.payload ? await this.securityService.decrypt(roleResponse.payload).toPromise() : {};
      this.rolesData = roleResponse.data;
      if (this.rolesData.length) {
        this.roleAssignForm.patchValue({
          userMenuRoleId: this.rolesData[0].userMenuRoleId,
          userMenuId: this.rolesData[0].userMenuId
        })
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'RoleAssignmentComponent' });
    } finally {
      this.isLoading = false;
    }
  }


  async getUserRoleAssignments() {
    try {
      this.isLoading = true;
      // let userResponse = await this.adminService.userRoleAssignments({ payload: btoa(this.encryptionService.encrypt(this.roleAssignForm.value)) }).toPromise();
      // userResponse = userResponse.payload ? this.encryptionService.decrypt(atob(userResponse.payload)) : [];
      const encryptedData = await this.securityService.encrypt(this.roleAssignForm.value).toPromise();
      let userResponse: any = await this.adminService.userRoleAssignments({ payload: encryptedData.encryptedText} ).toPromise();
      userResponse = userResponse.payload ? await this.securityService.decrypt(userResponse.payload).toPromise() : {};
      this.userRoleAssignmentData = userResponse.data || [];
      this.userRoleAssignmentData.forEach((element: any) => {
        if (element.isSelected) this.selection.select(element);
      });
      this.dataSource = new MatTableDataSource<any>(this.userRoleAssignmentData);
      this.dataSourceCards = this.dataSource.connect();
      this.setFilterPredicate();
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'RoleAssignmentComponent' });
    } finally {
      this.isLoading = false;
      this.isSavedAssignment = false;
    }

  }

  async postUserRoleAssignment() {
    try {
      this.isLoading = true;
      this.isSavedAssignment = true;
      if (this.roleAssignForm.invalid) return;
      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Admin.SubmitRoleAssignment"),
          message: this.translate.instant("Admin.DoYouWantToSubmitRoleAssignment"),
        },
        width: '550px',
        maxWidth: '60vw'
      });
      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;
      this.roleAssignForm.patchValue({ users: this.userRoleAssignmentData.filter((data: any) => data.isSelected == true) });
      // let response = await this.adminService.userRoleAssignment({ payload: btoa(this.encryptionService.encrypt(this.roleAssignForm.value)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
      const encryptedData = await this.securityService.encrypt(this.roleAssignForm.value).toPromise();
      let response: any = await this.adminService.userRoleAssignment({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      await this.getUserRoleAssignments();
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'RoleAssignmentComponent' });
    } finally {
      this.isLoading = false;
      this.isSavedAssignment = false;
    }
  }

  async changeRole(event: any) {
    this.roleAssignForm.patchValue({
      userMenuId: this.rolesData.find((role: any) => role.userMenuRoleId == event).userMenuId
    })
    this.getUserRoleAssignments();
  }

}
