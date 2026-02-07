import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
    standalone: false
})
export class HeaderComponent implements OnInit {

  isMenuOpen: boolean = true;
  showChildren = "";

  constructor(
    public translate: TranslateService,
    public tokenStorageService: TokenStorageService,
  ) { }

  ngOnInit() {
    const lang = this.tokenStorageService.getAppLanguage();
    this.onLanguageChange(lang);
  }

  onLanguageChange(lang: any) {
    this.tokenStorageService.saveAppLanguage(lang);
    this.translate.use(lang);
  }

  setDefaultColors(): void {
    document.documentElement.style.setProperty('--header-bg-color', '#ffffff');
    document.documentElement.style.setProperty('--body-bg-color', '#f4f6f8');
    document.documentElement.style.setProperty('--table-bg-color','#f7f9fc');
  }

  changeBackground(color: string): void {
    document.documentElement.style.setProperty('--header-bg-color', color);
    document.documentElement.style.setProperty('--body-bg-color', color);
    document.documentElement.style.setProperty('--bg-secondary-light', color);
    document.documentElement.style.setProperty('--table-bg-color',color);
  }

  private isDarkMode: boolean = false;

  toggleMode(): void {
    this.isDarkMode = !this.isDarkMode;

    if (this.isDarkMode) {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
    } else {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
    }
  }

  private isSaturation: boolean = false;

  toggleSaturation() {
    this.isSaturation = !this.isSaturation;
    if (this.isSaturation) {
      document.documentElement.classList.add('dark-saturation');
      document.documentElement.classList.remove('light-saturation');
    } else {
      document.documentElement.classList.add('light-saturation');
      document.documentElement.classList.remove('dark-saturation');
    }
  }

  fontStep = 0;
  maxSteps = 3;

  fontSizes = Array.from({ length: 101 }, (_, i) => ({
    variable: `--size-${i}`,
    currentSize: i,
    defaultSize: i
  }));

  increaseFontSize() {
    if (this.fontStep < this.maxSteps) this.fontStep++;
    this.apply();
  }

  decreaseFontSize() {
    if (this.fontStep > -this.maxSteps) this.fontStep--;
    this.apply();
  }

  resetFontSize() {
    this.fontStep = 0;
    this.apply(true);
  }

  apply(reset = false) {
    this.fontSizes.forEach(f => {
      f.currentSize = reset ? f.defaultSize : f.defaultSize + this.fontStep * 2;
      document.documentElement.style.setProperty(f.variable, `${f.currentSize}px`);
    });
  }

  menuToggle() {
    const isOpen = this.tokenStorageService.getMenuStatus();

    this.tokenStorageService.saveMenuStatus(
      isOpen ? 'COLLAPSE' : 'EXPAND'
    );
  }
}
