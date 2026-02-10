import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { NgOtpInputComponent } from 'ng-otp-input';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { TokenStorageService } from '../../../shared/services/token-storage/token-storage.service';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../auth.service';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';
import { CommonService } from 'src/app/shared/services/commom/common.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss',
    standalone: false
})
export class RegisterComponent {
  @ViewChild(NgOtpInputComponent, { static: false })
  ngOtpInput!: NgOtpInputComponent;
  activeDiv: string = "REG-INPUT" // REG-INPUT, OTP-INPUT, PASSWORD-INPUT, SUCCESS
  isSaved = false;
  isLoading = false;
  invalidOTP = false;
  hidePassword = true;
  hideConfirmPassword = true;

  registerForm!: FormGroup;

  validUpperCase = false;
  validLowerCase = false;
  validSpecial = false;
  validNumber = false;
  validLength = false;
  validCount = 0;

  // Time Limit
  totalTime = 120; // 2 minutes
  timeLeft = this.totalTime;
  canResend = false;
  timerSub!: Subscription;
  otpValue: string = '';

  config = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: true,
    disableAutoFocus: false,
    inputStyles: {
      width: "40px",
      height: "60px"
    },
  };
  isVerifyLogin: boolean = false;

  constructor(
    private router: Router,
    public tokenStorageService: TokenStorageService,
    public dialog: MatDialog,
    public translate: TranslateService,
    private authService: AuthService,
    private encryptionService: EncryptionService,
    
    private commonService: CommonService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.registerForm = new FormGroup({
      loginName: new FormControl(null, [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern('[0-9]{10}$')]),
      registerType: new FormControl('MOBILE'),
      password: new FormControl(null, [Validators.minLength(8), Validators.maxLength(20)]),
      confirmPassword: new FormControl(null)
    });
  }

  onPasswordEntry() {
    const password = this.registerForm.value.password;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[~!@#$%^&*()_+=]/.test(password);
    const hasValidLength = password.length >= 8;

    // Initialize counter
    this.validCount = 0;

    // Increment count if condition is true
    if (hasUpperCase) {
      this.validCount++;
    }
    if (hasLowerCase) {
      this.validCount++;
    }
    if (hasNumber) {
      this.validCount++;
    }
    if (hasSpecial) {
      this.validCount++;
    }
    if (hasValidLength) {
      this.validCount++;
    }

    // Update instance variables
    this.validUpperCase = hasUpperCase;
    this.validLowerCase = hasLowerCase;
    this.validNumber = hasNumber;
    this.validSpecial = hasSpecial;
    this.validLength = hasValidLength;
  }

  getPasswordStrengthLevel(): string {
    const criteriaMet = [
      this.validLength,
      this.validLowerCase,
      this.validUpperCase,
      this.validNumber,
      this.validSpecial,
    ].filter((criteria) => criteria).length;

    if (criteriaMet <= 1) {
      return "Auth.Weak";
    } else if (criteriaMet === 2) {
      return "Auth.Moderate";
    } else if (criteriaMet === 3) {
      return "Auth.Medium";
    } else if (criteriaMet === 4) {
      return "Auth.Strong";
    } else {
      return "Auth.Excellent";
    }
  }

  verifyInput(currentDiv: string) {
    if (currentDiv == 'REG-INPUT') {
      if (!navigator.onLine) {
        this.toastr.warning(
          this.translate.instant('Auth.NoInternetAvailable')
        );
        return;
      }
      this.verifyLoginName();
    } else if (currentDiv == 'OTP-INPUT') {
      this.verifyOTP();
    } else if (currentDiv == 'PASSWORD-INPUT') {
      if (this.passwordMatch()) {
        this.register();
      }
    } else if (currentDiv == 'SUCCESS') {
      this.router.navigate(["/auth/login"]);
    }
  }

  async verifyLoginName() {
    try {
      if (this.registerForm.get('loginName')?.invalid) return;
      this.isVerifyLogin = true;
      this.isLoading = true;
      const sendData: any = { loginName: this.registerForm.value.loginName, registerType: this.registerForm.value.registerType };
      const response = await this.authService.verifyLoginName({ payload: this.encryptionService.encrypt(sendData) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      if (decryptResponse?.data) this.tokenStorageService.saveToken(decryptResponse.data.accessToken);
      if (decryptResponse?.status == 'alreadysent' && this.activeDiv == 'OTP-INPUT') {
        const dialogRef = this.dialog.open(AlertsComponent, {
          disableClose: true,
          data: {
            type: "error-type",
            title: this.translate.instant('Common.Unauthorized'),
            message: this.translate.instant(decryptResponse?.message),
          },
          width: '550px',
          maxWidth: '60vw'
        });
      }
      this.activeDiv = 'OTP-INPUT';
      this.startTimer();
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'RegisterComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  async verifyOTP() {
    try {
      this.isLoading = true;
      const sendData: any = { loginName: this.registerForm.value.loginName, registerType: this.registerForm.value.registerType, otp: this.ngOtpInput.currentVal };
      const response = await this.authService.verifyOTP({ payload: this.encryptionService.encrypt(sendData) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      if (decryptResponse?.status == 'success') this.activeDiv = 'PASSWORD-INPUT';
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
        this.commonService.handleError(err, { type: 'GET', id: 0, component: 'RegisterComponent' });
      }
    } finally {
      this.isLoading = false;
      this.invalidOTP = true;
    }
  }

  async register() {
    try {
      if (this.registerForm.invalid) return;
      this.isLoading = true;
      const sendData: any = { loginName: this.registerForm.value.loginName, password: this.registerForm.value.password, otp: this.otpValue };
      const response = await this.authService.register({ payload: this.encryptionService.encrypt(sendData) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      if (decryptResponse?.status == 'success') this.activeDiv = 'SUCCESS';
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'RegisterComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  passwordMatch() {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;

    if (password === confirmPassword) {
      return true;
    } else {
      this.isSaved = true;
      this.registerForm.get('confirmPassword')?.setErrors({ mismatch: true });
      return false;
    }
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
  onOtpChange(otp: string) {
    this.otpValue = otp;
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  resendOtp() {
    if (!this.canResend) return;
    this.ngOtpInput.setValue('');
    this.verifyLoginName();
  }

  login() {
    this.registerForm.reset();
    this.router.navigate(["/auth/login"]);
  }

  routeTo() {
    this.router.navigate(['/']);
  }

  registerVia(type: string) {
    this.registerForm.patchValue({
      loginName: null,
      registerType: type,
      password: null,
      confirmPassword: null
    });
    if (type == 'MOBILE') {
      this.registerForm.get('loginName')?.clearValidators();
      this.registerForm.get('loginName')?.updateValueAndValidity();
      this.registerForm.get('loginName')?.setValidators([Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern('[0-9]{10}$')]);
      this.registerForm.get('loginName')?.updateValueAndValidity();
    } else {
      this.registerForm.get('loginName')?.clearValidators();
      this.registerForm.get('loginName')?.updateValueAndValidity();
      this.registerForm.get('loginName')?.setValidators([Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]);
      this.registerForm.get('loginName')?.updateValueAndValidity();
    }
  }

  get maskedLoginName(): string {
    const loginName = this.registerForm.value.loginName;
    if (!loginName) return '';
    if (this.registerForm.value.registerType == 'EMAIL') {
      const [name, domain] = loginName.split('@');
      if (name.length <= 2) {
        return `${name[0]}***@${domain}`;
      }
      return `${name.substring(0, 2)}****${name.substring(name.length - 1)}@${domain}`;
    } else {
      return loginName.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
    }
  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
  }

}
