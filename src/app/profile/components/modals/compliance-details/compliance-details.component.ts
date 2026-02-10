import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter, } from '@angular/material-moment-adapter';
import { ProfileService } from '@profile/profile.service';
import { CommonService } from '@services/commom/common.service';
import { EncryptionService } from '@services/encryption/encryption.service';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { formatDate } from '@angular/common';

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD MM YYYY',
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
    selector: 'app-compliance-details',
    templateUrl: './compliance-details.component.html',
    styleUrl: './compliance-details.component.scss',
    providers: [
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
        },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
    standalone: false
})
export class ComplianceDetailsComponent implements OnInit {
  // Default
  isLoading = false;

  // Form
  complainceForm!: FormGroup ;

  // General Variables
  isSavedComplaince: boolean = false;
  industryLicenseMessage = '';

  // Data Variables
  industryLicenses: any = [];
  complainceData: any = {};

  constructor(
    private tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    private profileService: ProfileService,
    private encryptionService: EncryptionService,
    
    public dialog: MatDialog,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<ComplianceDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  async ngOnInit() {
    // Complaince Form
    this.complainceForm = new FormGroup({
      enterpriseId: new FormControl(0),
      pan: new FormControl(null, [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]),
      gstin: new FormControl(null, [Validators.pattern(/^[0-9]{2}[A-Za-z]{5}[0-9]{4}[0-9A-Z]{4}$/)]),
      iecCode: new FormControl(null, [Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^[a-zA-Z0-9 ]+$/)]),
      industryLicenses: new FormArray([this.initComplainceRows()]),
      udyamRegistrationNo: new FormControl(this.tokenStorageService.getUdyamRegistrationNo()),
    });

    // Load endpoints on load
    await this.onLoad();

    // If Edit Mode, patch the form with data
    if (this.data && this.data.complainceData) {
      this.complainceData = this.data.complainceData;
      this.complainceForm.patchValue({
        enterpriseId: this.complainceData.enterpriseId,
        pan: this.complainceData.pan,
        gstin: this.complainceData.gstin,
        iecCode: this.complainceData.iecCode
      });

      // Patch Industry Licenses
      if (this.complainceData.industryLicenses && this.complainceData.industryLicenses.length > 0) {
        const control = <FormArray>this.complainceForm.get('industryLicenses');
        control.clear();
        this.complainceData.industryLicenses.forEach((license: any) => {
          control.push(
            new FormGroup({
              licenseNo: new FormControl(license.licenseNo, [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9 .,()\-@&/]+$/)]),
              licenseName: new FormControl(license.licenseName, [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9 .,()\-@&/]+$/)]),
              licenseType: new FormControl(license.licenseType, [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9 .,()\-@&/]+$/)]),
              validFromDate: new FormControl(license.validFromDate ? new Date(license.validFromDate) : null, [Validators.required]),
              validToDate: new FormControl(license.validToDate ? new Date(license.validToDate) : null, [Validators.required])
            })
          );
        });
      }
    }
  }

  async onLoad() {
    try {
      this.isLoading = true;

    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ComplainceDetailsComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  initComplainceRows() {
    return new FormGroup({
      licenseNo: new FormControl(null, [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9 .,()\-@&/]+$/)]),
      licenseName: new FormControl(null, [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9 .,()\-@&/]+$/)]),
      licenseType: new FormControl(null, [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9 .,()\-@&/]+$/)]),
      validFromDate: new FormControl(null, [Validators.required]),
      validToDate: new FormControl(null, [Validators.required]),
    });
  }

  getComplainceRowArray(form: any) {
    return form.controls.industryLicenses.controls;
  }

  get industryLicensesArray(): FormArray {
    return this.complainceForm.get('industryLicenses') as FormArray;
  }


  addNewComplaince() {
    const control = <FormArray>this.complainceForm.get("industryLicenses");
    control.push(this.initComplainceRows());
  }

  deleteComplainceRow(index: number) {
    this.industryLicenseMessage = "";
    const control = <FormArray>this.complainceForm.get("industryLicenses");
    control.removeAt(index);
  }

  async findDuplicateIndustryLicense(dataArr: any[]) {
    try {
      if (!dataArr || dataArr.length === 0) {
        return '';
      }

      const seen = new Set<string>();

      for (let i = 0; i < dataArr.length; i++) {
        if (dataArr.at(i).licenseNo) {
          const licenseNo: string = dataArr.at(i).licenseNo.toString().trim();
          if (!licenseNo) continue;
          if (seen.has(licenseNo)) return licenseNo;
          seen.add(licenseNo);
        }
      }

      return '';
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ComplainceDetailsComponent' });
      return undefined;
    } finally {
      this.isLoading = false;
    }
  }

  async checkGstinWithPan() {
    try {
      const pan = this.complainceForm.get('pan')?.value;
      const gstin = this.complainceForm.get('gstin')?.value;

      if (!pan || !gstin) return true;

      const normalizedPan = pan.trim().toUpperCase();
      const normalizedGstin = gstin.trim().toUpperCase();

      const panFromGstin = normalizedGstin.substring(2, 12);

      if (normalizedPan !== panFromGstin) return false;

      return true;
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ComplainceDetailsComponent' });
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  onNoClick() {
    this.dialogRef.close({ type: false, id: 0 });
  }

  async saveProfileDetails() {
    try {
      this.isSavedComplaince = true;

      let isGstPanMatched = await this.checkGstinWithPan();
      if (!isGstPanMatched) {
        this.complainceForm.get('gstin')?.setErrors({ notmatched: !isGstPanMatched });
        if (!isGstPanMatched) return;
      } else {
        this.complainceForm.get('gstin')?.clearValidators();
        this.complainceForm.get('gstin')?.setValidators([Validators.pattern(/^[0-9]{2}[A-Za-z]{5}[0-9]{4}[0-9A-Z]{4}$/)]);
        this.complainceForm.get('gstin')?.updateValueAndValidity();
      }

      this.industryLicenseMessage = await this.findDuplicateIndustryLicense(this.complainceForm.value.industryLicenses) ?? '';
      if (this.industryLicenseMessage != "") {
        this.industryLicenseMessage = this.industryLicenseMessage;
        this.complainceForm.controls["industryLicenses"].setErrors({ unique: true });
      } else {
        this.complainceForm.controls["industryLicenses"].setErrors(null);
      }

      if (this.complainceForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Profile.SubmitComplainceDetails"),
          message: this.translate.instant("Profile.DoYouWantToSubmitComplainceDetails"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      this.isLoading = true;

      this.complainceForm.value.industryLicenses.forEach((il: any) => {
        if (il.licenseNo) {
          il.validFromDate = formatDate(il.validFromDate, "yyyy-MM-dd", "en-US");
          il.validToDate = formatDate(il.validToDate, "yyyy-MM-dd", "en-US");
        } else {
          il.validFromDate = null;
          il.validToDate = null;
        }
      });
      let response = await this.profileService.complainceDetail({ payload: this.encryptionService.encrypt(this.complainceForm.value) }).toPromise();
      response = response.payload ? this.encryptionService.decrypt(response.payload) : {};

      this.toastr.success(response?.message);

      this.dialogRef.close({ type: true, id: 0 });
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.complainceForm.value.enterpriseId, component: 'ComplainceDetailsComponent' });
    } finally {
      this.isLoading = false;
    }

  }
}
