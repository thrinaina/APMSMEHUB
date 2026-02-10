import { Component } from '@angular/core';
import { DashboardService } from 'src/app/dashboard/dashboard.service';
import { CommonService } from 'src/app/shared/services/commom/common.service';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';


@Component({
    selector: 'app-enterprise-count-card',
    templateUrl: './enterprise-count-card.component.html',
    styleUrl: './enterprise-count-card.component.scss',
    standalone: false
})
export class EnterpriseCountCardComponent {
  counts: any;

  constructor(
    private dashboardService: DashboardService,
    private commonService: CommonService,
    private encryptionService: EncryptionService
  ) { }

  async ngOnInit() {

    try {
      // const response: any = await this.dashboardService.enterpriseCounts({ payload: btoa(this.encryptionService.encrypt({})) }).toPromise();
      // this.counts = response.payload ? this.encryptionService.decrypt(atob(response.payload)).data[0] : {};

      const encryptedData = await this.securityService.encrypt({}).toPromise();
      let response: any = await this.dashboardService.enterpriseCounts({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      this.counts = response?.data[0] || {};
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'EnterpriseCountCardComponent' });
    }

  }
}
