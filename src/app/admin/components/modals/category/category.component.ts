import { Component, OnInit, Inject } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";

import { AlertsComponent } from "@components/alerts/alerts.component";

import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { AdminService } from '@admin/admin.service';
import { EncryptionService } from '@services/encryption/encryption.service';
import { SecurityService } from "@services/security/security.service";
import { CommonService } from '@services/commom/common.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-category',
    templateUrl: './category.component.html',
    styleUrl: './category.component.scss',
    standalone: false
})
export class CategoryComponent implements OnInit {
  // Default
  isLoading = false;

  // Form
  categoryForm!: FormGroup;

  // General Variables
  isSavedForm = false;

  // Data Variables
  userData: any = []

  constructor(
    private adminService: AdminService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    public tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<CategoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    // Category Form
    this.categoryForm = new FormGroup({
      categoryId: new FormControl(0),
      categoryName: new FormControl(null, [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9 .]*$/)]),
      categoryDescription: new FormControl(null, [Validators.required, Validators.maxLength(500),Validators.pattern("^[^<>\"'\/|()\\\\\*]+$")]),
      isGITag: new FormControl('N'),
      inactive: new FormControl(false)
    });

    // Patch existing data
    if (this.data.userData) {
      this.userData = this.data.userData;
      this.categoryForm.patchValue({
        categoryId: this.userData.categoryId,
        categoryName: this.userData.categoryName,
        categoryDescription: this.userData.categoryDescription,
        isGITag: this.userData.isGITag,
        inactive: this.userData.inactive == "Y" ? true : false
      });
    }
  }

  onNoClick() {
    this.dialogRef.close();
  }

  async saveUser() {
    try {
      this.isLoading = true;
      this.isSavedForm = true;

      if (this.categoryForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Admin.SubmitCategoryForm"),
          message: this.translate.instant("Admin.DoYouWantToSubmitCategoryForm"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      // let response = await this.adminService.category({ payload: btoa(this.encryptionService.encrypt(this.categoryForm.value)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};

      const encryptedData = await this.securityService.encrypt(this.categoryForm.value).toPromise();
      let response: any = await this.adminService.category({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};

      this.toastr.success(response?.message);
      this.dialogRef.close({ type: true, id: 0 });
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.categoryForm.value.appUserId, component: 'CategoryComponent' });
    } finally {
      this.isLoading = false;
    }
  }
}
