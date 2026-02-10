import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { NgOtpInputComponent } from 'ng-otp-input';
import { interval, Subscription } from 'rxjs';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';

import { CommonService } from 'src/app/shared/services/commom/common.service';
import { DashboardService } from 'src/app/dashboard/dashboard.service';
import { formatDate } from '@angular/common';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-add-udyam',
    templateUrl: './add-udyam.component.html',
    styleUrl: './add-udyam.component.scss',
    standalone: false
})
export class AddUdyamComponent {
  @ViewChild(NgOtpInputComponent, { static: false })
  ngOtpInput!: NgOtpInputComponent;

  // UDYAM SECTION
  udyamForm!: FormGroup;
  activeDiv: string = "UDYAM-SELECTION"  // UDYAM-SELECTION / UDYAM-INPU / OTP-INPUT
  invalidOTP = false;
  currentEntry = 'udyam';
  otpValue: string = '';

  config = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: true,
    disableAutoFocus: false,
    inputStyles: {
      width: "50px",
      height: "60px"
    },
  };

  // UDYAM Sample Data
  udyams: any = [];

  // Time Limit
  totalTime = 120; // 2 minutes
  timeLeft = this.totalTime;
  canResend = false;
  timerSub!: Subscription;

  loginType: string = '';
  isLoading: boolean = false;
  consentDate: Date = new Date();
  tempUdyamData: any = {};
  maskedEmailId: string = '';

  constructor(
    public tokenStorageService: TokenStorageService,
    private router: Router,
    public translate: TranslateService,
    private encryptionService: EncryptionService,
    
    private commonService: CommonService,
    private dashboardService: DashboardService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) { }

  ngOnInit() {

    this.udyamForm = new FormGroup({
      selectedudyamRegistrationNo: new FormControl(null, [Validators.required]),
      udyamRegistrationNo: new FormControl(null, [Validators.required, Validators.pattern("[0-9]{2}[-]{1}[0-9]{7}$")]),
      // loginName: new FormControl(this.tokenStorageService.getUser().loginName),
      termsAndConditions: new FormControl(false,),
    }),

      this.getAppUserUdyams();
  }

  verifyInput(currentDiv: string) {
    if (currentDiv === 'UDYAM-SELECTION') {
      this.activeDiv = 'UDYAM-INPUT';
      this.udyamForm.get('udyamRegistrationNo')?.reset();
      return;
    } else if (currentDiv === 'UDYAM-INPUT') {
      this.verifyUdyam();
    } else if (currentDiv === 'OTP-INPUT') {
      this.verifyOTP();
    } else if (currentDiv === 'DECLARATION-INPUT') {
      this.submitUdyam();
    } else if (currentDiv === 'CONSENT-INPUT') {
      this.submitConsent();
    }
  }

  maskudyamRegistrationNo(fullNo: string): string {
    return fullNo.replace(/(\d{2})-(\d{4})\d{3}/, '$1-******1');
  }

  async verifyUdyam() {
    try {
      this.isLoading = true;
      let sendData: any = { udyamRegistrationNo: 'UDYAM-AP-' + this.udyamForm.value.udyamRegistrationNo, loginName: this.udyamForm.value.loginName };
      const response = await this.dashboardService.verifyUdyam({ payload: this.encryptionService.encrypt(sendData) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      if (decryptResponse?.status == 'notexist' || decryptResponse?.status == 'conflict') {
        const dialogRef = this.dialog.open(AlertsComponent, {
          disableClose: true,
          data: {
            type: "error-type",
            title: this.translate.instant(decryptResponse?.status == 'notexist' ? 'Common.Notexist' : 'Common.Alreadyregistered'),
            message: this.translate.instant(decryptResponse?.status == 'notexist' ? 'Common.UdyamRegistrationNumberdoesnotexist' : 'Common.UdyamRegistrationNumberalreadyregistered'),
          },
          width: '550px',
          maxWidth: '60vw'
        });
      } else if (decryptResponse?.status == 'success') {
        this.maskedEmailId = decryptResponse.maskedEmailId;
        this.activeDiv = 'OTP-INPUT';
        this.startTimer();
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'AddUdyamComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  async verifyOTP() {
    try {
      this.isLoading = true;
      const sendData: any = { loginName: this.udyamForm.value.loginName, otp: this.ngOtpInput.currentVal, udyamRegistrationNo: 'UDYAM-AP-' + this.udyamForm.value.udyamRegistrationNo };
      const response = await this.dashboardService.verifyOTP({ payload: this.encryptionService.encrypt(sendData) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      if (decryptResponse?.status == 'success') {
        this.tempUdyamData = decryptResponse.data;
        this.activeDiv = 'DECLARATION-INPUT';
      }
    } catch (err: any) {
      let payload: any = {}, errorMessage = '', status = '';
      if (err?.error?.payload) {
        try {
          payload = this.encryptionService.decrypt(err?.error?.payload);
          errorMessage = payload.message;
          status = payload.status;
        } catch (e) {
          errorMessage = err?.error?.message;
        }
      } else {
        errorMessage = err?.error?.message;
      }

      if (status == 'badrequest' || status == 'gone') {
        this.invalidOTP = true;
        this.toastr.warning(errorMessage);
      } else {
        this.commonService.handleError(err, { type: 'GET', id: 0, component: 'AddUdyamComponent' });
      }
    } finally {
      this.isLoading = false;
    }
  }

  async submitUdyam() {
    try {
      this.isLoading = true;
      const sendData: any = { udyamRegistrationNo: 'UDYAM-AP-' + this.udyamForm.value.udyamRegistrationNo, consentDate: formatDate(this.consentDate, "yyyy-MM-dd HH:mm:ss", "en-US"), otp: this.otpValue };
      const response = await this.dashboardService.submitUdyam({ payload: this.encryptionService.encrypt(sendData) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      if (decryptResponse?.status == 'success') {
        this.activeDiv = 'UDYAM-SELECTION';
        this.udyamForm.get('udyamRegistrationNo')?.reset();
        this.tempUdyamData = {};
        this.getAppUserUdyams();
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'AddUdyamComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  async submitConsent() {
    try {
      this.isLoading = true;
      const sendData: any = { udyamRegistrationNo: this.udyamForm.value.selectedudyamRegistrationNo, consentDate: formatDate(this.consentDate, "yyyy-MM-dd HH:mm:ss", "en-US") };
      const response = await this.dashboardService.submitConsent({ payload: this.encryptionService.encrypt(sendData) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      if (decryptResponse?.status == 'success') {
        this.router.navigate(["/profile/entry"]);
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'AddUdyamComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  async getAppUserUdyams() {
    try {
      this.isLoading = true;
      const defaultCondition: any = { filters: [] };
      const response = await this.dashboardService.appUserUdyams({ payload: this.encryptionService.encrypt({ defaultCondition }) }).toPromise();
      this.udyams = response?.payload ? this.encryptionService.decrypt(response.payload).data : [];

      this.udyamForm.patchValue({
        selectedudyamRegistrationNo: this.udyams.length > 0 ? this.udyams[0].udyamRegistrationNo : null
      });

      this.tokenStorageService.saveUdyamRegistrationNo(this.udyamForm.value.selectedudyamRegistrationNo);
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'AddUdyamComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  onUdyamChange(udyamRegistrationNo: any) {
    this.tokenStorageService.saveUdyamRegistrationNo(udyamRegistrationNo);
  }

  editProfile(udyam: any) {
    if (udyam.enterpriseId) {
      this.router.navigate(["/profile/entry"]);
    } else {
      this.activeDiv = 'CONSENT-INPUT';
      this.tempUdyamData = udyam;
    }
  }

  onOtpChange(otp: string) {
    this.otpValue = otp;
  }

  cancel() {
    this.activeDiv = 'UDYAM-SELECTION';
    this.ngOtpInput.setValue('');
    this.udyamForm.patchValue({
      udyamRegistrationNo: null,
      termsAndConditions: false
    });
    this.tempUdyamData = '';
  }

  startTimer() {
    this.canResend = false;
    this.timeLeft = this.totalTime;

    this.timerSub?.unsubscribe();

    this.timerSub = interval(1000).subscribe(() => {
      this.timeLeft--;

      if (this.timeLeft <= 0) {
        this.canResend = true;
        this.timerSub.unsubscribe();
      }
    });
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  resendOtp() {
    if (!this.canResend) return;
    this.ngOtpInput.setValue('');
    this.verifyUdyam();
  }

  login() {
    this.udyamForm.reset();
    this.activeDiv = 'UDYAM-INPUT';
    this.router.navigate(["/auth/login"]);
  }

}
