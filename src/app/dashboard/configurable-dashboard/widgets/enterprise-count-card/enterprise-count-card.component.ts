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
      const response: any = await this.dashboardService.enterpriseCounts({ payload: this.encryptionService.encrypt({}) }).toPromise();
      this.counts = response.payload ? this.encryptionService.decrypt(response.payload).data[0] : {};
      this.counts = response?.data[0] || {};
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'EnterpriseCountCardComponent' });
    }

  }
}
