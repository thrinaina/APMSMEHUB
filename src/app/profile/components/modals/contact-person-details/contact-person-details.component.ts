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
    selector: 'app-contact-person-details',
    templateUrl: './contact-person-details.component.html',
    styleUrl: './contact-person-details.component.scss',
    standalone: false
})
export class ContactPersonDetailsComponent implements OnInit{
  // Default
  isLoading = false;

  // Form
  contactForm!: FormGroup;

  // General Variables
  isSavedContact: boolean = false;

  // Data Variables
  contactData: any = {};

  constructor(
    private tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    private profileService: ProfileService,
    private encryptionService: EncryptionService,
    
    public dialog: MatDialog,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<ContactPersonDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async ngOnInit() {
    // Contact Form
    this.contactForm = new FormGroup({
      enterpriseId: new FormControl(0),
      contactPersonName: new FormControl(null, [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9 .,()\-@&/]+$/)]),
      contactPersonEmailId: new FormControl(null, [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]),
      contactPersonMobileNo: new FormControl(null, [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern('[0-9]{10}$')]),
      countryCode: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(2), Validators.pattern('[0-9]{2}$')]),
      udyamRegistrationNo: new FormControl(this.tokenStorageService.getUdyamRegistrationNo()),
    });

    // If Edit Mode, patch the form with data
    if (this.data && this.data.contactData) {
      this.contactData = this.data.contactData;
      this.contactForm.patchValue({
        enterpriseId: this.contactData.enterpriseId,
        contactPersonName: this.contactData.contactPersonName,
        contactPersonEmailId: this.contactData.contactPersonEmailId,
        contactPersonMobileNo: this.contactData.contactPersonMobileNo,
        countryCode: this.contactData.countryCode
      });
    }
  }

  onNoClick() {
    this.dialogRef.close({ type: false, id: 0 });
  }

  async saveContactDetails() {
    try {
      this.isSavedContact = true;
      if (this.contactForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Profile.SubmitContactDetails"),
          message: this.translate.instant("Profile.DoYouWantToSubmitContactDetails"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      this.isLoading = true;

      let response = await this.profileService.enterpriseContactDetail({ payload: this.encryptionService.encrypt(this.contactForm.value) }).toPromise();
      response = response.payload ? this.encryptionService.decrypt(response.payload) : {};

      this.toastr.success(response?.message);
      this.dialogRef.close({ type: true, id: 0 });
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.contactForm.value.enterpriseId, component: 'ContactPersonDetailsComponent' });
    } finally {
      this.isLoading = false;
    }

  }

}
