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
    selector: 'app-profile-approvals',
    templateUrl: './profile-approvals.component.html',
    styleUrl: './profile-approvals.component.scss',
    standalone: false
})
export class ProfileApprovalsComponent {
  // Default
  isLoading = false;

  // Form
  approvalForm!: FormGroup;

  // General Variables
  isSavedForm = false;

  // Data Variables
  profileData: any = []

  constructor(
    private adminService: AdminService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    public tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<ProfileApprovalsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  async ngOnInit() {
    // Approval Form
    this.approvalForm = new FormGroup({
      enterpriseId: new FormControl(this.data.profileData.enterpriseId),
      enterpriseEmailId: new FormControl(this.data.profileData.emailId),
      enterpriseMobileNo: new FormControl(this.data.profileData.mobileNumber),
      enterpriseStatus: new FormControl(this.data.profileData.enterpriseStatus),
      enterpriseStatusRemarks: new FormControl(null, [Validators.required, Validators.maxLength(500), Validators.pattern("^[^<>\"'\/|()\\\\\*]+$")]),
    });
  }

  onNoClick() {
    this.dialogRef.close({ type: false, id: 0 });
  }

  async saveRequest(statusType: string) {
    try {
      this.isSavedForm = true;
      if (this.approvalForm.invalid) {
        return;
      }
      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Admin.SubmitProfileApproval"),
          message: this.translate.instant("Admin.DoYouWantToSubmitProfileApproval"),
        },
        width: '550px',
        maxWidth: '60vw'
      });
      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;
      this.approvalForm.patchValue({ enterpriseStatus: statusType });
      // let response = await this.adminService.profileStatus({ payload: btoa(this.encryptionService.encrypt(this.approvalForm.value)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(this.approvalForm.value).toPromise();
      let response: any = await this.adminService.profileStatus({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      this.toastr.success(this.translate.instant(response?.message));
      this.dialogRef.close({type: true});
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.approvalForm.value.loginUserId, component: 'ProfileApprovalsComponent' });
    } finally {
      this.isLoading = false;
    }

  }
}

