import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';
import { DiscoveryService } from '../../discovery.service';
import { CommonService } from 'src/app/shared/services/commom/common.service';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { TranslateService } from '@ngx-translate/core';
import { formatDate } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { SafeResourceUrl } from '@angular/platform-browser';

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
    selector: 'app-enquiry',
    templateUrl: './enquiry.component.html',
    styleUrl: './enquiry.component.scss',
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
export class EnquiryComponent {
  // Default
  isLoading: boolean = false;

  // Form
  enquiryForm!: FormGroup;

  // General Variables
  isSavedEnquiry = false;
  currentDate: Date = new Date();
  activeIndex = 0;
  thumbWindowSize = 4;
  thumbStartIndex = 0;
  contentExpanded = false;

  // Data Variables
  productData: any;
  safeImages: SafeResourceUrl[] = [];
  enterprises: any;
  selectedEnterprise: any;

  constructor(
    public dialogRef: MatDialogRef<EnquiryComponent>,
    public dialog: MatDialog,
    private encryptionService: EncryptionService,
    
    private discoveryService: DiscoveryService,
    private commonService: CommonService,
    private toastr: ToastrService,
    public translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.productData = this.data.productData;
    this.safeImages = this.data.safeImages;
    this.enterprises = this.data.enterprises;
    this.selectedEnterprise = this.enterprises ? this.enterprises[0] : null;

    this.enquiryForm = new FormGroup({
      enquiryId: new FormControl(0),
      enterprises: new FormControl([], [Validators.required]),
      contactName: new FormControl(null, [Validators.required, Validators.pattern("^[^<>\"'/|()\\\\*]+$"), Validators.maxLength(200),]),
      countryCode: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(2), Validators.pattern('[0-9]{2}$')]),
      contactMobileNo: new FormControl(null, [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern('[0-9]{10}$')]),
      contactEmail: new FormControl(null, [Validators.required, Validators.maxLength(50), Validators.email,Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]),
      productId: new FormControl(this.productData?.productId, [Validators.required]),
      productName: new FormControl(this.productData?.productName),
      productQuantity: new FormControl(null, [Validators.required, Validators.min(0), Validators.max(999999), Validators.pattern(/^[0-9]+$/)]),
      timeLimitResponse: new FormControl(null, [Validators.required]),
      enquiryDescription: new FormControl(null, [Validators.maxLength(5000), Validators.pattern("^[^<>\"'/|()\\\\*]+$"),]),
    });

    // Change validators based on productData availibility
    if (this.productData) {
      this.enquiryForm.get('enterprises')?.addValidators([Validators.required]);
      this.enquiryForm.get('enterprises')?.updateValueAndValidity();
      this.enquiryForm.get('productId')?.addValidators([Validators.required]);
      this.enquiryForm.get('productId')?.updateValueAndValidity();
      this.enquiryForm.get('productQuantity')?.addValidators([Validators.required, Validators.min(0), Validators.max(9999999999)]);
      this.enquiryForm.get('productQuantity')?.updateValueAndValidity();
      this.enquiryForm.get('timeLimitResponse')?.addValidators([Validators.required]);
      this.enquiryForm.get('timeLimitResponse')?.updateValueAndValidity();
      if (this.data.type == 'product-details') {
        this.enquiryForm.patchValue({ enterprises: [this.productData?.udyamRegistrationNo] });
        this.selectedEnterprise = this.enterprises ? this.enterprises.find((enterprise: any) => enterprise.udyamRegistrationNo == this.productData?.udyamRegistrationNo) : null;
      }
    } else {
      this.enquiryForm.get('enterprises')?.clearValidators();
      this.enquiryForm.get('enterprises')?.updateValueAndValidity();
      this.enquiryForm.get('productId')?.clearValidators();
      this.enquiryForm.get('productId')?.updateValueAndValidity();
      this.enquiryForm.get('productQuantity')?.clearValidators();
      this.enquiryForm.get('productQuantity')?.updateValueAndValidity();
      this.enquiryForm.get('timeLimitResponse')?.clearValidators();
      this.enquiryForm.get('timeLimitResponse')?.updateValueAndValidity();

      this.enquiryForm.patchValue({ enterprises: [this.enterprises[0]?.udyamRegistrationNo] });
    }
  }

  onNoClick(): void {
    this.dialogRef.close({ type: false, id: 0 });
  }

  onActiveSlideChange(index: number): void {
    this.activeIndex = index;

    if (index < this.thumbStartIndex) {
      this.thumbStartIndex = index;
    } else if (index >= this.thumbStartIndex + this.thumbWindowSize) {
      this.thumbStartIndex = index - this.thumbWindowSize + 1;
    }
  }

  async sendEnquiry() {
    try {
      this.isSavedEnquiry = true;

      if (this.enquiryForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Discovery.SubmitEnquiry"),
          message: this.translate.instant("Discovery.DoYouWantToSubmitEnquiry"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      this.isLoading = true;

      this.enquiryForm.patchValue({
        timeLimitResponse: formatDate(this.enquiryForm.value.timeLimitResponse, "yyyy-MM-dd", "en-US")
      });

      let payload = this.enquiryForm.value;
      payload.enterprisesData = this.enterprises.filter((enterprise: any) =>
        payload.enterprises.includes(enterprise.udyamRegistrationNo)
      ).map((enterprise: any) => {
        return {
          udyamRegistrationNo: enterprise.udyamRegistrationNo,
          contactPersonEmailId: enterprise.contactPersonEmailId,
          emailId: enterprise.emailId
        }
      });
      if (!payload.enterprisesData) return;

      let response = await this.discoveryService.sendEnquiry({ payload: this.encryptionService.encrypt(payload) }).toPromise();
      response = response?.payload ? this.encryptionService.decrypt(response.payload) : {};
      if(response.status == 'success') this.toastr.success(response?.message);
      this.dialogRef.close({ type: true, id: 0 });
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.enquiryForm.value.enquiryId, component: 'EnquiryComponent' });
    } finally {
      this.isLoading = false;
    }
  }

}
