import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as Highcharts from 'highcharts';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/dashboard/dashboard.service';
import { CommonService } from 'src/app/shared/services/commom/common.service';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';


@Component({
    selector: 'app-profile-completion',
    templateUrl: './profile-completion.component.html',
    styleUrl: './profile-completion.component.scss',
    standalone: false
})
export class ProfileCompletionComponent {

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions!: Highcharts.Options;

  checklist: any = [];
  profileStatusData: any;
  udyamChange!: Subscription;

  private destroySub = new Subject<void>();

  constructor(
    private router: Router,
    public translate: TranslateService,
    private dashboardService: DashboardService,
    private commonService: CommonService,
    private encryptionService: EncryptionService,    
    private tokenStorageService: TokenStorageService
  ) { }

  ngOnInit() {
    this.translate.onLangChange.pipe(takeUntil(this.destroySub)).subscribe(() => {
      this.setProfileCompletion();
    });

    this.tokenStorageService.udyamChanged.pipe(takeUntil(this.destroySub)).subscribe(() => {
      this.setProfileCompletion();
    });
  }

  async setProfileCompletion() {
    try {
      const response: any = await this.dashboardService.profileCompletion({ payload: this.encryptionService.encrypt({ udyamRegistrationNo: this.tokenStorageService.getUdyamRegistrationNo() }) }).toPromise();
      this.profileStatusData = response?.payload ? this.encryptionService.decrypt(response.payload).data[0] : {};

      this.checklist = [
        { label: 'About Enterprise', completed: this.profileStatusData.aboutEnterpriseCount > 0 },
        { label: 'Client Details', completed: this.profileStatusData.clientsCount > 0 },
        { label: 'Market Presence', completed: this.profileStatusData.marketPresenceCount > 0 },
        { label: 'Products', completed: this.profileStatusData.productsCount > 0 },
        { label: 'Assets', completed: this.profileStatusData.assetsCount > 0 }
      ];

      let completedValue: number = 0;
      this.checklist.forEach((item: any) => {
        if (item.completed) completedValue += 2;
      })

      this.chartOptions = {
        chart: {
          type: 'pie',
          backgroundColor: 'transparent'
        },
        title: {
          text: ''
        },
        tooltip: {
          enabled: false
        },
        plotOptions: {
          pie: {
            innerSize: '70%',
            size: '60%',
            // startAngle: -90,
            dataLabels: {
              enabled: true,
              distance: -15,
              format: '{point.percentage:.0f}%',
              style: {
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '12px'
              }
            }
          }
        },
        series: [{
          type: 'pie',
          name: 'Status',
          data: [
            {
              name: this.translate.instant('Dashboard.Completion'),
              y: completedValue,
              color: '#7E57C2'
            },
            {
              name: this.translate.instant('Dashboard.Pending'),
              y: 10 - completedValue,
              color: '#FFB74D'
            }
          ],
          showInLegend: true
        }],
        credits: { enabled: false },
        exporting: { enabled: false }
      };
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ProfileCompletionComponent' });
    }
  }

  ngOnDestroy() {
    this.destroySub.next();
    this.destroySub.complete();
  }


}
