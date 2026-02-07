import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProfileService } from '@profile/profile.service';
import { CommonService } from '@services/commom/common.service';
import { EncryptionService } from '@services/encryption/encryption.service';
import { SecurityService } from 'src/app/shared/services/security/security.service';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-enterprise-details',
    templateUrl: './enterprise-details.component.html',
    styleUrl: './enterprise-details.component.scss',
    standalone: false
})
export class EnterpriseDetailsComponent implements OnInit{
  // Default
  isLoading = false;

  // Form
  enterpriseForm!: FormGroup;

  // General Variables
  isSavedEnterprise: boolean = false;

  // Data Variables
  enterpriseData: any = {};

  constructor(
    private tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    private profileService: ProfileService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    public dialog: MatDialog,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<EnterpriseDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async ngOnInit() {
    // Enterprise Form
    this.enterpriseForm = new FormGroup({
      enterpriseId: new FormControl(0),
      aboutEnterprise: new FormControl(null, [Validators.required,Validators.pattern("^[^<>\"'\/|()\\\\\*]+$")]),
      vision: new FormControl(null, [ Validators.pattern("^[^<>\"'\/|()\\\\\*]+$")]),
      mission: new FormControl(null, [ Validators.pattern("^[^<>\"'\/|()\\\\\*]+$")]),
      coreValue: new FormControl(null, [ Validators.pattern("^[^<>\"'\/|()\\\\\*]+$")]),
      loginUserId: new FormControl(this.tokenStorageService.getUser().appUserId),
      udyamRegistrationNo: new FormControl(this.tokenStorageService.getUdyamRegistrationNo()),
    });

    // Load endpoints on load
    await this.onLoad();

    // If Edit Mode, patch the form with data
    if (this.data && this.data.enterpriseData) {
      this.enterpriseData = this.data.enterpriseData;
      this.enterpriseForm.patchValue({
        enterpriseId: this.enterpriseData.enterpriseId,
        aboutEnterprise: this.enterpriseData.aboutEnterprise,
        vision: this.enterpriseData.vision,
        mission: this.enterpriseData.mission,
        coreValue: this.enterpriseData.coreValue
      });
    }
  }

  async onLoad() {
    try {
      this.isLoading = true;
      
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'EnterpriseDetailsComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  onNoClick() {
    this.dialogRef.close({ type: false, id: 0 });
  }

  async saveEnterpriseDetails() {
    try {
      this.isSavedEnterprise = true;
      if (this.enterpriseForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Profile.SubmitEnterpriseDetails"),
          message: this.translate.instant("Profile.DoYouWantToSubmitEnterpriseDetails"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      this.isLoading = true;

      // let response = await this.profileService.enterpriseDetail({ payload: btoa(this.encryptionService.encrypt(this.enterpriseForm.value)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(this.enterpriseForm.value).toPromise();
      let response: any = await this.profileService.enterpriseDetail({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};

      this.toastr.success(response?.message);
      this.dialogRef.close({ type: true, id: 0 });
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.enterpriseForm.value.enterpriseId, component: 'EnterpriseDetailsComponent' });
    } finally {
      this.isLoading = false;
    }

  }
}
