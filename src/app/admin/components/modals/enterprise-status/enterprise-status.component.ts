import { Component, OnInit, Inject } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";

import { AlertsComponent } from "@components/alerts/alerts.component";

import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { AdminService } from '@admin/admin.service';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';
import { SecurityService } from "src/app/shared/services/security/security.service";
import { CommonService } from 'src/app/shared/services/commom/common.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-enterprise-status',
    templateUrl: './enterprise-status.component.html',
    styleUrl: './enterprise-status.component.scss',
    standalone: false
})
export class EnterpriseStatusComponent {
 // Default
  isLoading = false;

  // Form
  enterpriseForm!: FormGroup;

  // General Variables
  isSavedForm = false;


  // Data Variables
  enterpriseData: any = []

  constructor(
    private adminService: AdminService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    public tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<EnterpriseStatusComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  async ngOnInit() {
    // Approval Form
    this.enterpriseForm = new FormGroup({
      enterpriseId: new FormControl(this.data.enterpriseData.enterpriseId),
      loginName: new FormControl(this.tokenStorageService.getUser().loginName),
      loginUserId: new FormControl(this.tokenStorageService.getUser().appUserId),
      inactiveRemarks: new FormControl(null, [Validators.required, Validators.maxLength(500), Validators.pattern("^[^<>\"'\/|()\\\\\*]+$")]),
      inactive: new FormControl(false),
    });
    this.enterpriseForm.patchValue({
      inactive: this.data.enterpriseData?.inactive == "Y" ? true : false,
    })
  }

  onNoClick() {
    this.dialogRef.close({ type: false, id: 0 });
  }

  async saveStatus() {
    try {
      this.isSavedForm = true;
      if (this.enterpriseForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Admin.SubmitEnterprisestatus"),
          message: this.translate.instant("Admin.DoYouWantToSubmitEnterprisestatus"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;
      // let response = await this.adminService.enterpriseStatus({ payload: btoa(this.encryptionService.encrypt(this.enterpriseForm.value)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(this.enterpriseForm.value).toPromise();
      let response: any = await this.adminService.enterpriseStatus({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      this.toastr.success(this.translate.instant(response?.message));
      this.dialogRef.close({type: true});
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.enterpriseForm.value.loginUserId, component: 'EnterpriseStatusComponent' });
    } finally {
      this.isLoading = false;
    }

  }
}
