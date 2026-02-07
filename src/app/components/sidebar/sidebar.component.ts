import { Component } from '@angular/core';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { MatDrawer, MatDrawerMode } from "@angular/material/sidenav";
import { AuthService } from 'src/app/auth/auth.service';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { AdminService } from 'src/app/admin/admin.service';
import { CommonService } from 'src/app/shared/services/commom/common.service';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';
import { SecurityService } from 'src/app/shared/services/security/security.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
    standalone: false
})
export class SidebarComponent {
  // Default
  isLoading = false;

  // General Variables
  isMenuOpen = false;
  sidenavMode: MatDrawerMode = 'side';
  sidenavPosition: MatDrawer["position"] = 'start'
  showChildren = "";
  currentUrl?: string;
  currentLabel: string = 'Dashboard';
  isLoggedIn?: boolean;
  loginUserData: any = {};

  // Data Variables
  menuItems: any = [];
  documents: any[] = [];
  userImage: string = ''

  constructor(
    public tokenStorageService: TokenStorageService,
    private authService: AuthService,
    private adminService: AdminService,
    private commonService: CommonService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  async ngOnInit() {
    this.isMenuOpen = false;
    await this.onLoad();
    await this.getMenu();
    this.tokenStorageService.saveMenuStatus("COLLAPSE");
    this.setCurrentRouteByUrl(this.router.url);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart || event instanceof NavigationEnd) {
        this.setCurrentRouteByUrl(event.url);
      };
    });
    await this.getUserImage();
  }

  async onLoad() {
    try {
      this.isLoading = true;
      const defaultCondition: any = { filters: [] };
      const encryptedData = await this.securityService.encrypt({ defaultCondition }).toPromise();
      const response: any = await this.adminService.loginUser({ payload: encryptedData.encryptedText }).toPromise();
      const decryptResponse = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      if (decryptResponse) this.loginUserData = decryptResponse.data[0];
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'SidebarComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  setCurrentRouteByUrl(url: string) {
    const menu = this.menuItems.find((menuItem: any) => menuItem.route === url);
    if (menu) {
      this.currentLabel = menu.label;
      this.currentUrl = menu.url;
    }
  }

  async logout() {
    await this.authService.inactiveSessions(this.tokenStorageService.getUser(), false, "Logout");
    this.tokenStorageService.signOut();
    this.isLoggedIn = false;
    this.router.navigate(["/"], { relativeTo: this.route });
  }

  async expandMenu(title: any) {
    try {
      await this.authService.verifyActiveLogin().toPromise();
      if (this.showChildren == title) {
        this.showChildren = "";
      } else {
        this.showChildren = title;
      }

      if (!this.isMenuOpen) {
        this.onToggleMenu();
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'SidebarComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  onToggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.tokenStorageService.saveMenuStatus("EXPAND");
    } else {
      this.tokenStorageService.saveMenuStatus("COLLAPSE");
      this.showChildren = "";
    }
  }

  async routeToPage(route: string, userRoles: any) {
    try {
      await this.authService.verifyActiveLogin().toPromise();
      this.router.navigate([route]);
      this.tokenStorageService.saveUserRoles(userRoles);
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'SidebarComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  async getUserImage() {
    const userDocs = this.loginUserData.documents ? JSON.parse(this.loginUserData.documents.documents) : [];
    if (userDocs[0]?.documentName) {
      const responseBlob: Blob = await firstValueFrom(
        this.commonService.previewFile({ payload: await this.securityService.encrypt({ fileName: userDocs[0].documentName }).toPromise() })
      );

      const reader = new FileReader();
      reader.onload = () => {
        let data: any = {
          document: null,
          documentName: userDocs[0].documentName,
          readerDocument: reader.result,
          transactionType: 'userImage'
        };

        if (!this.documents) this.documents = [];
        this.documents.push(data);
        this.userImage = data.readerDocument;
      };

      reader.readAsDataURL(responseBlob);
    } else {
      this.userImage = '';
    }
  }

  async getMenu() {
    try {
      if (this.loginUserData.userType == 'ADMIN') {
        this.menuItems = [
          {
            route: "/dashboard",
            label: "Dashboard",
            role: "[ROLE_ADMIN]",
            icon: "dashboard",
          },
          {
            route: "/admin/listofusers",
            label: "Users",
            role: "[ROLE_ADMIN]",
            icon: "user",
          },
          {
            route: "/admin/roleassignment",
            label: "RoleAssignment",
            role: "[ROLE_ADMIN]",
            icon: "user-cog",
          },
          {
            route: "/admin/listofcategories",
            label: "Categories",
            role: "[ROLE_ADMIN]",
            icon: "categories",
          },
          {
            route: "/admin/approvals",
            label: "Approvals",
            role: "[ROLE_ADMIN]",
            icon: "approvals",
          },
        ];
      } else {
        this.isLoading = true;
        // const defaultCondition = " AND appuserrole.appUserId = " + this.tokenStorageService.getUser().appUserId;
        const defaultCondition: any = { filters: [] };
        // const response = await this.adminService.userMenu({ payload: btoa(this.encryptionService.encrypt({ defaultCondition })) }).toPromise();
        // const decryptResponse = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
        const encryptedData = await this.securityService.encrypt({ defaultCondition }).toPromise();
        const response: any = await this.adminService.userMenu({ payload: encryptedData.encryptedText }).toPromise();
        const decryptResponse = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
        this.menuItems = decryptResponse.data || [];
        this.menuItems = this.menuItems.filter((menu: any) => menu.label);
        this.menuItems.forEach((menu: any) => {
          if (menu.children) menu.children = JSON.parse(menu.children);
          if (menu.userRoles) menu.userRoles = menu.userRoles;
        });
      }
      this.isLoading = false;
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'SidebarComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  ngDoCheck(): void {
    const status = this.tokenStorageService.getMenuStatus();
    if (this.isMenuOpen !== status) {
      this.isMenuOpen = status;
      if (!status) {
        this.showChildren = '';
      }
    }
  }
}
