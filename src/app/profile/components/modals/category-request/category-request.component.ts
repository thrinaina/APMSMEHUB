import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProfileService } from '@profile/profile.service';
import { CommonService } from '@services/commom/common.service';
import { EncryptionService } from '@services/encryption/encryption.service';

import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-category-request',
    templateUrl: './category-request.component.html',
    styleUrl: './category-request.component.scss',
    standalone: false
})
export class CategoryRequestComponent {
  // Default
  isLoading = false;

  // Form
  requestForm!: FormGroup;

  // General Variables
  isSaved: boolean = false;

  // Data Variables
  enterpriseData: any = {};

  constructor(
    private tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    private profileService: ProfileService,
    private encryptionService: EncryptionService,
    
    public dialog: MatDialog,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<CategoryRequestComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async ngOnInit() {
    this.requestForm = new FormGroup({
      requestId: new FormControl(0),
      requestType: new FormControl('NEW-CATEGORY'),
      categoryName: new FormControl(null, [Validators.required,  Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9 .,()\-@&/]+$/)]),
      purposeofuse: new FormControl(null, [ Validators.maxLength(500), Validators.pattern("^[^<>\"'\/|()\\\\\*]+$")])
    });
  }

  onNoClick() {
    this.dialogRef.close({ type: false, id: 0 });
  }

  async requestCategoryDetails() {
    try {
      this.isSaved = true;
      if (this.requestForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Profile.SubmitCategoryRequest"),
          message: this.translate.instant("Profile.DoYouWantToSubmitCategoryRequest"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      this.isLoading = true;

      // let response = await this.profileService.categoryRequest({ payload: btoa(this.encryptionService.encrypt(this.requestForm.value)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(this.requestForm.value).toPromise();
      let response: any = await this.profileService.categoryRequest({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      this.toastr.success(response?.message);

      this.dialogRef.close();
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.requestForm.value.loginUserId, component: 'CategoryRequestComponent' });
    } finally {
      this.isLoading = false;
    }

  }
}
