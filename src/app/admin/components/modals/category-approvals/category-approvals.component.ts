import { Component, OnInit, Inject } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { AlertsComponent } from "@components/alerts/alerts.component";
import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { AdminService } from '@admin/admin.service';
import { EncryptionService } from '@services/encryption/encryption.service';
import { CommonService } from '@services/commom/common.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-category-approvals',
    templateUrl: './category-approvals.component.html',
    styleUrl: './category-approvals.component.scss',
    standalone: false
})
export class CategoryApprovalsComponent {
  // Default
  isLoading = false;

  // Form
  approvalForm!: FormGroup;

  // General Variables
  isSavedForm = false;


  // Data Variables
  requestData: any = []

  constructor(
    private adminService: AdminService,
    private encryptionService: EncryptionService,    
    public tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<CategoryApprovalsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  async ngOnInit() {
    // User Form
    this.approvalForm = new FormGroup({
      requestId: new FormControl(this.data.requestData.requestId),
      requestedBy: new FormControl(this.data.requestData.userName),
      requestStatus: new FormControl(this.data.requestData.requestStatus),
      requestStatusRemarks: new FormControl(null, [Validators.required, Validators.maxLength(500), Validators.pattern("^[^<>\"'\/|()\\\\\*]+$")]),
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
          title: this.translate.instant("Admin.SubmitCategoryApproval"),
          message: this.translate.instant("Admin.DoYouWantToSubmitCategoryApproval"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;
      this.approvalForm.patchValue({ requestStatus: statusType });
      let response = await this.adminService.requeststatus({ payload: this.encryptionService.encrypt(this.approvalForm.value) }).toPromise();
      response = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      this.toastr.success(
        this.translate.instant(response?.message)
      );
      this.dialogRef.close();
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.approvalForm.value.loginUserId, component: 'CategoryApprovalsComponent' });
    } finally {
      this.isLoading = false;
    }

  }
}
