import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ProfileService } from '@profile/profile.service';
import { CommonService } from '@services/commom/common.service';
import { EncryptionService } from '@services/encryption/encryption.service';
import { SecurityService } from 'src/app/shared/services/security/security.service';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { ToastrService } from 'ngx-toastr';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';

@Component({
    selector: 'app-market-details',
    templateUrl: './market-details.component.html',
    styleUrl: './market-details.component.scss',
    standalone: false
})
export class MarketDetailsComponent implements OnInit{
  // Default
  isLoading = false;

  // Form
  marketForm!: FormGroup;

  // General Variables
  isSavedMarket: boolean = false;
  domesticMarkets: any = [];
  internationalMarkets: any = [];
  sectorsServed: any = [];
  marketData: any = {};

  constructor(
    private tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    private profileService: ProfileService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    public dialog: MatDialog,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<MarketDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async ngOnInit() {
    // Market Form
    this.marketForm = new FormGroup({
      marketPresenceId: new FormControl(0),
      domesticMarkets: new FormControl(null, [Validators.required]),
      internationalMarkets: new FormControl(null),
      sectorsServed: new FormControl(null, [Validators.required]),
      udyamRegistrationNo: new FormControl(this.tokenStorageService.getUdyamRegistrationNo()),
    });

    // Load endpoints on load
    await this.onLoad();

    // If Edit Mode, patch the form with data
    if (this.data && this.data.marketData) {
      this.marketData = this.data.marketData;
      this.marketForm.patchValue({
        marketPresenceId: this.marketData.marketPresenceId,
        domesticMarkets: this.marketData.domesticMarkets,
        internationalMarkets: this.marketData.internationalMarkets,
        sectorsServed: this.marketData.sectorsServed
      });
    }
  }

  async onLoad() {
    try {
      this.isLoading = true;

      // GET States and Counties from Static List 
      // let defaultCondition = " AND staticlist.type IN ('STATE', 'COUNTRY')";
      let defaultCondition: any = {
        "filters": [
          {
            "table": "staticlist",
            "field": "type",
            "operator": "=",
            "value": 'UOM',
            "sequence": 1,
            "condition": "AND"
          }
        ]
      };
      // let response = await this.profileService.staticLists({ payload: btoa(this.encryptionService.encrypt({ defaultCondition }))}).toPromise();
      // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
      const encryptedData = await this.securityService.encrypt({ defaultCondition }).toPromise();
      let response: any = await this.profileService.staticLists({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      this.domesticMarkets = response?.data.filter((staticList: any) => staticList.type == 'STATE') ?? [];
      this.internationalMarkets = response?.data.filter((staticList: any) => staticList.type == 'COUNTRY') ?? [];

      // Domestic Markets - States
      defaultCondition = { filters: [] };
      // response = await this.profileService.sectors({ payload: btoa(this.encryptionService.encrypt({ defaultCondition }))}).toPromise();
      // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
      const encryptedData2 = await this.securityService.encrypt({ defaultCondition }).toPromise();
      let response2: any = await this.profileService.sectors({ payload: encryptedData2.encryptedText} ).toPromise();
      response2 = response2.payload ? await this.securityService.decrypt(response2.payload).toPromise() : {};
      this.sectorsServed = response?.data ?? [];
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'MarketDetailsComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  onNoClick() {
    this.dialogRef.close({ type: false, id: 0 });
  }

  async saveMarketDetails() {
    try {
      this.isSavedMarket = true;
      if (this.marketForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Profile.SubmitMarketDetails"),
          message: this.translate.instant("Profile.DoYouWantToSubmitMarketDetails"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      this.isLoading = true;

      // let response = await this.profileService.marketPresence({ payload: btoa(this.encryptionService.encrypt(this.marketForm.value)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(this.marketForm.value).toPromise();
      let response: any = await this.profileService.marketPresence({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};

      this.toastr.success(response?.message);

      this.dialogRef.close({ type: true, id: 0 });
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.marketForm.value.marketPresenceId, component: 'MarketDetailsComponent' });
    } finally {
      this.isLoading = false;
    }

  }
}
