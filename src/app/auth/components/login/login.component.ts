import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { NgOtpInputComponent } from 'ng-otp-input';
import { TokenStorageService } from '../../../shared/services/token-storage/token-storage.service';
import { CommonService } from '../../../shared/services/commom/common.service';
import { interval, Subscription } from 'rxjs';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';
import { AuthService } from '../../auth.service';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    standalone: false
})

export class LoginComponent {
  @Output() childEvent = new EventEmitter();
  @ViewChild(NgOtpInputComponent, { static: false })
  ngOtpInput!: NgOtpInputComponent;

  activeDiv: string = "LOGIN-INPUT" // LOGIN-INPUT, PASSWORD-INPUT, OTP-INPUT,  FORGOT-PASSWORD, SET-PASSWORD-INPUT, SUCCESS;
  isSaved = false;
  isLoading = false;
  invalidOTP = false;
  hidePassword = true;
  hideConfirmPassword = true;

  validUpperCase = false;
  validLowerCase = false;
  validSpecial = false;
  validNumber = false;
  validLength = false;
  validCount = 0;

  loginForm!: FormGroup;

  hide = true;
  actualPassword = '';
  maskedPassword = '';

  // Time Limit
  totalTime = 120; // 2 minutes
  timeLeft = this.totalTime;
  canResend = false;
  timerSub!: Subscription;
  otpValue: string = '';

  captchaText: string = '';
  captchaImage: string = '';

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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    public translate: TranslateService,
    public tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    private authService: AuthService,
    private encryptionService: EncryptionService,
    
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      loginName: new FormControl(null, [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern('[0-9]{10}$')]),
      loginType: new FormControl('MOBILE'),
      userType: new FormControl('MSME'),
      password: new FormControl(null, [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
      confirmPassword: new FormControl(null),
      captcha: new FormControl(null)
    });

    this.refreshCaptcha();
  }

  async verifyInput(currentDiv: string) {
    if (currentDiv == 'LOGIN-INPUT') {
      this.activeDiv = 'PASSWORD-INPUT';
    } else if (currentDiv == 'PASSWORD-INPUT') {
      this.loginWithPassword();
    } else if (currentDiv == 'OTP-LOGIN') {
      this.loginWithOTP();
    } else if (currentDiv == 'FORGOT-PASSWORD') {
      this.activeDiv = 'FORGOT-PASSWORD-OTP-INPUT'
    } else if (currentDiv == 'FORGOT-FLOW') {
      this.verifyOTP();
    } else if (currentDiv == 'SET-PASSWORD-INPUT') {
      if (this.passwordMatch()) await this.updatePassword();
    } else if (currentDiv == 'SUCCESS') {
      this.activeDiv = 'LOGIN-INPUT'
    }
  }

  private generateCaptcha() {
    // 1) Random text (avoid confusing chars)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const len = 6;
    this.captchaText = Array.from({ length: len }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');

    // 2) Canvas setup (match your sample proportions)
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 70;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Helpers ---
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const randi = (min: number, max: number) => Math.floor(rand(min, max + 1));
    const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
    const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    // 3) Background (light gray/blue + slight gradient)
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, '#f4f7ff');
    bg.addColorStop(1, '#e8efff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4) Horizontal scanlines (like your image)
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    for (let y = 10; y < canvas.height; y += 7) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 5) Sprinkle noise dots
    for (let i = 0; i < 450; i++) {
      const a = rand(0.03, 0.12);
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.fillRect(rand(0, canvas.width), rand(0, canvas.height), 1, 1);
    }

    // 6) Draw text with per-character rotation/jitter (teal-ish)
    const fonts = ['Arial', 'Verdana', 'Tahoma', 'Trebuchet MS'];
    const baseX = 26;
    const step = 30;

    ctx.textBaseline = 'alphabetic';

    for (let i = 0; i < this.captchaText.length; i++) {
      const ch = this.captchaText[i];

      ctx.save();

      const fontSize = 45 + randi(-4, 4);
      ctx.font = `${fontSize}px ${pick(fonts)}`;

      // dark-teal like sample
      const teal = randi(60, 90);
      ctx.fillStyle = `rgb(${0}, ${teal + 60}, ${teal + 80})`; // bluish-green

      const x = baseX + i * step + rand(-4, 4);
      const y = 46 + rand(-3, 3);

      const angle = rand(-0.25, 0.25); // rotate each char
      ctx.translate(x, y);
      ctx.rotate(angle);

      // slight skew
      ctx.transform(1, rand(-0.10, 0.10), rand(-0.10, 0.10), 1, 0, 0);

      // shadow to add depth + reduce OCR friendliness a bit
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 1.2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(ch, 0, 0);

      ctx.restore();
    }

    // 7) Draw wavy strike-through lines (black + red like sample)
    const drawWave = (color: string, width: number, yBase: number, amp: number, freq: number, phase: number) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x++) {
        const y = yBase + Math.sin((x * freq) + phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    drawWave('rgba(220,0,0,0.70)', 2.4, 20, 5, 0.09, rand(0, Math.PI * 2));
    drawWave('rgba(0,0,0,0.65)', 2.2, 40, 6, 0.08, rand(0, Math.PI * 2));
    drawWave('rgba(0,0,0,0.45)', 1.6, 33, 5, 0.10, rand(0, Math.PI * 2));
    drawWave('rgba(220,0,0,0.70)', 2.4, 50, 5, 0.09, rand(0, Math.PI * 2));

    // 8) Extra random curves / arcs to clutter segmentation
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.strokeStyle = `rgba(0,0,0,${rand(0.15, 0.30)})`;
      ctx.lineWidth = rand(1, 2);
      ctx.beginPath();
      const sx = rand(0, canvas.width * 0.4);
      const ex = rand(canvas.width * 0.6, canvas.width);
      const sy = rand(10, canvas.height - 10);
      const ey = rand(10, canvas.height - 10);
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(
        rand(canvas.width * 0.25, canvas.width * 0.45), rand(0, canvas.height),
        rand(canvas.width * 0.55, canvas.width * 0.75), rand(0, canvas.height),
        ex, ey
      );
      ctx.stroke();
      ctx.restore();
    }

    // 9) Slight global blur/contrast effect (cheap “distortion”)
    // (Don’t overdo; keep it readable for humans)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      // tiny luminance jitter
      const jitter = rand(-8, 8);
      d[i] = clamp(d[i] + jitter, 0, 255);
      d[i + 1] = clamp(d[i + 1] + jitter, 0, 255);
      d[i + 2] = clamp(d[i + 2] + jitter, 0, 255);
    }
    ctx.putImageData(img, 0, 0);

    // 10) Export
    this.captchaImage = canvas.toDataURL('image/png');
  }

  refreshCaptcha() {
    this.generateCaptcha();
    this.loginForm.get('captcha')?.reset();
  }

  async sendOTP(type: string) {
    try {
      if (!navigator.onLine) {
        this.toastr.warning(
          this.translate.instant('Auth.NoInternetAvailable')
        );
        return;
      }

      if (this.loginForm.get('loginName')?.invalid) return;
      this.isSaved = true;
      this.isLoading = true;
      const response = await this.authService.sendOTP({ payload: this.encryptionService.encrypt(this.loginForm.value) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      this.tokenStorageService.saveToken(decryptResponse.data.accessToken);
      if (decryptResponse?.status == 'alreadysent' && this.activeDiv == 'FORGOT-PASSWORD-OTP-INPUT') {
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
      this.activeDiv = type == 'Login-OTP' ? 'LOGIN-OTP-INPUT' : 'FORGOT-PASSWORD-OTP-INPUT';
      this.startTimer();
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'LoginComponent' });
    } finally {
      this.isLoading = false;
      this.isSaved = false;
    }
  }

  async loginWithPassword() {
    try {
      if (this.loginForm.invalid) return;
      this.isSaved = true;
      this.isLoading = true;

      if (this.loginForm.value.captcha !== this.captchaText) {
        const dialogRef = this.dialog.open(AlertsComponent, {
          disableClose: true,
          data: {
            type: "error-type",
            title: this.translate.instant('Common.Unauthorized'),
            message: this.translate.instant('Common.InvalidError') + ' ' + this.translate.instant('Auth.Captcha'),
          },
          width: '550px',
          maxWidth: '60vw'
        });
        this.refreshCaptcha();
        return;
      }

      const response = await this.authService.loginWithPassword({ payload: this.encryptionService.encrypt(this.loginForm.value) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      if (decryptResponse?.status == 'Unauthorized') {
        const dialogRef = this.dialog.open(AlertsComponent, {
          disableClose: true,
          data: {
            type: "error-type",
            title: this.translate.instant('Common.Unauthorized'),
            message: this.translate.instant(decryptResponse?.message == 'Invalid login credentials' ? 'Common.Invalidlogincredentials' : decryptResponse?.message),
          },
          width: '550px',
          maxWidth: '60vw'
        });
        this.refreshCaptcha();
      } else if (decryptResponse?.status == 'success') {
        this.tokenStorageService.saveToken(decryptResponse.data.accessToken);
        this.tokenStorageService.saveRefreshToken(decryptResponse.data.refreshToken);
        const userData = {
          userType: decryptResponse.data.userType,
          userName: decryptResponse.data.userName,
        }
        this.tokenStorageService.saveUser(userData);
        this.tokenStorageService.saveLastSession(decryptResponse.data.lastSession);
        this.tokenStorageService.saveDashboardWidgets(decryptResponse.data.dashboardWidgets);
        this.tokenStorageService.saveDashboardWidgetsOrder(JSON.parse(decryptResponse.data.dashboardWidgetsOrder));
        this.authService.inactiveSessions(true, "Login");
        this.tokenStorageService.updateLoginStatus(true);
        this.router.navigate(["/dashboard"]);
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'LoginComponent' });
    } finally {
      this.isLoading = false;
      this.isSaved = false;
    }
  }

  otpForgotPassword() {
    if (this.loginForm?.controls['loginName'].invalid) {
      const dialogRef = this.dialog.open(AlertsComponent, {
        data: {
          type: 'error-type',
          title: this.translate.instant('Common.InvalidData'),
          message: this.translate.instant('Common.PleaseEnterEmailID'),
        },
        width: '300px',
      });
    } else {
      this.sendOTP('Forgot-Password');
    }
  }

  onPasswordEntry() {
    const password = this.loginForm?.value.password;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[~!@#$%^&*()_+=]/.test(password);
    const hasValidLength = password.length > 8;

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

  async loginWithOTP() {
    try {
      if (this.loginForm.get('loginName')?.invalid) return;
      this.isSaved = true;
      this.isLoading = true;
      const sendData: any = { loginName: this.loginForm.value.loginName, loginType: this.loginForm.value.loginType, otp: this.ngOtpInput.currentVal, userType: this.loginForm.value.userType };
      const response = await this.authService.loginWithOTP({ payload: this.encryptionService.encrypt(sendData) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      if (decryptResponse?.status == 'success') {
        this.tokenStorageService.saveToken(decryptResponse.data.accessToken);
        this.tokenStorageService.saveRefreshToken(decryptResponse.data.refreshToken);
        const userData = {
          userType: decryptResponse.data.userType,
          userName: decryptResponse.data.userName
        }
        this.tokenStorageService.saveUser(userData);
        this.tokenStorageService.saveLastSession(decryptResponse.data.lastSession);
        this.tokenStorageService.saveDashboardWidgets(decryptResponse.data.dashboardWidgets);
        this.tokenStorageService.saveDashboardWidgetsOrder(JSON.parse(decryptResponse.data.dashboardWidgetsOrder));
        await this.authService.inactiveSessions(decryptResponse.data.accessToken, true, "Login");
        this.tokenStorageService.updateLoginStatus(true);
        this.router.navigate(["/dashboard"]);
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

      if (status == 'badrequest' ) {
        this.invalidOTP = true;
        this.toastr.warning(errorMessage);
      } else {
        this.commonService.handleError(err, { type: 'GET', id: 0, component: 'LoginComponent' });
      }
    } finally {
      this.isLoading = false;
      this.isSaved = false;
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
    this.otpForgotPassword();
  }

  routeToRegister() {
    this.router.navigate(['/auth/register'], { relativeTo: this.route });
  }

  routeTo() {
    this.router.navigate(['/']);
  }

  // Handle password input events
  onPasswordInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value;

    // Update the actual password while keeping it masked
    if (this.hide) {
      const addedChar = inputValue.length > this.actualPassword.length ? inputValue.slice(-1) : '';
      this.actualPassword = inputValue.length > this.actualPassword.length
        ? this.actualPassword + addedChar
        : this.actualPassword.slice(0, inputValue.length);
      this.maskedPassword = '*'.repeat(this.actualPassword.length);
    } else {
      this.actualPassword = inputValue;
      this.maskedPassword = inputValue;
    }

    // Update the FormControl value
    this.loginForm.get('password')?.setValue(this.actualPassword);
  }

  // Handle password paste events
  onPasswordPaste(event: ClipboardEvent): void {
    event.preventDefault(); // Prevent the default paste action
    const pastedData = event.clipboardData?.getData('text') || '';

    // Update the actual password and masked password
    this.actualPassword = pastedData;
    this.maskedPassword = this.hide ? '*'.repeat(pastedData.length) : pastedData;

    // Update the FormControl value
    this.loginForm.get('password')?.setValue(this.actualPassword);
  }

  // Toggle password visibility
  togglePasswordVisibility(reset: boolean): void {
    this.hide = reset ? true : false;
    this.maskedPassword = this.hide
      ? '*'.repeat(this.actualPassword.length)
      : this.actualPassword;
  }

  loginVia(type: string) {
    this.loginForm.patchValue({
      loginName: null,
      loginType: type,
      password: null
    });
    this.activeDiv = "LOGIN-INPUT";
    if (type == 'MOBILE') {
      this.loginForm.get('loginName')?.clearValidators();
      this.loginForm.get('loginName')?.updateValueAndValidity();
      this.loginForm.get('loginName')?.setValidators([Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern('[0-9]{10}$')]);
      this.loginForm.get('loginName')?.updateValueAndValidity();
    } else {
      this.loginForm.get('loginName')?.clearValidators();
      this.loginForm.get('loginName')?.updateValueAndValidity();
      this.loginForm.get('loginName')?.setValidators([Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]);
      this.loginForm.get('loginName')?.updateValueAndValidity();
    }
  }

  get maskedLoginName(): string {
    const loginName = this.loginForm.value.loginName;
    if (!loginName) return '';
    if (this.loginForm.value.loginType == 'EMAIL') {
      const [name, domain] = loginName.split('@');
      if (name.length <= 2) {
        return `${name[0]}***@${domain}`;
      }
      return `${name.substring(0, 2)}****${name.substring(name.length - 1)}@${domain}`;
    } else {
      return loginName.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
    }
  }

  passwordMatch() {
    const password = this.loginForm.get('password')?.value;
    const confirmPassword = this.loginForm.get('confirmPassword')?.value;

    if (password === confirmPassword) {
      return true;
    } else {
      this.isSaved = true;
      this.loginForm.get('confirmPassword')?.setErrors({ mismatch: true });
      return false;
    }
  }

  async verifyOTP() {
    try {
      if (this.loginForm.get('loginName')?.invalid) return;
      this.isSaved = true;
      this.isLoading = true;
      const sendData: any = { loginName: this.loginForm.value.loginName, registerType: this.loginForm.value.loginType, otp: this.ngOtpInput.currentVal };
      const response = await this.authService.verifyOTP({ payload: this.encryptionService.encrypt(sendData) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      if (decryptResponse?.status == 'success') this.activeDiv = 'SET-PASSWORD-INPUT';
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
        this.commonService.handleError(err, { type: 'GET', id: 0, component: 'LoginComponent' });
      }
    } finally {
      this.isLoading = false;
      this.isSaved = false;
      this.invalidOTP = true;
      this.loginForm.patchValue({ userType: 'MSME' });
    }
  }

  async updatePassword() {
    try {
      if (this.loginForm.invalid) return;
      this.isSaved = true;
      this.isLoading = true;
      const sendData: any = { loginName: this.loginForm.value.loginName, password: this.loginForm.value.password, otp: this.otpValue };
      const response = await this.authService.updatePassword({ payload: this.encryptionService.encrypt(sendData) }).toPromise();
      const decryptResponse = response.payload ? this.encryptionService.decrypt(response.payload) : {};
      if (decryptResponse?.status == 'success') {
        this.loginForm.patchValue({ loginName: null, password: null, confirmPassword: null });
        this.activeDiv = 'SUCCESS';
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'LoginComponent' });
    } finally {
      this.isLoading = false;
      this.isSaved = false;
      this.invalidOTP = true;
      this.loginForm.patchValue({ loginType: 'EMAIL', userType: 'MSME' });
    }
  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
  }

}
