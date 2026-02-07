import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class IconService {

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) { }

  public registerIcons(): void {
    this.loadIcons(Object.values(Icons), 'assets/icons');
  }

  private loadIcons(iconKeys: string[], iconUrl: string): void {
    iconKeys.forEach(key => {
      this.matIconRegistry.addSvgIcon(key, this.domSanitizer.bypassSecurityTrustResourceUrl(`${iconUrl}/${key}.svg`));
    });
  }
}

export enum Icons {
  Facebook = 'facebook',
  Instagram = 'instagram',
  Linkedin = 'linkedin',
  Twitter = 'twitter',
  Website = 'website',
  Whatsapp = 'whatsapp',
  Youtube = 'youtube',
  DarkTheme = 'dark-theme',
  Saturation = 'saturation',
  Phone = 'phone',
  Success = "success",
  Expand = "expand",
  Collapse = "collapse",
  User = "user",
  Roles = "roles",
  RoleConfig = "role-config",
  UserCog = 'user-cog',
  Dashboard = 'dashboard',
  DownloadIcon = 'download-icon',
  Categories = 'categories',
  Approvals = 'approvals',
  Search = 'search',
  BackArrow = 'back-arrow',
  MapPin = "map-pin",
  FacebookNew = "facebook-new",
  InstagramNew = "instagram-new",
  GlobeWhite = "globe-white",
  ShareNew = "share-new",
  Link = "link",
}

