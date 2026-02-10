import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter, } from '@angular/material-moment-adapter';
import { ProfileService } from '@profile/profile.service';
import { CommonService } from '@services/commom/common.service';
import { EncryptionService } from '@services/encryption/encryption.service';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { formatDate } from '@angular/common';
import { firstValueFrom } from 'rxjs';

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD MM YYYY',
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
    selector: 'app-assets-entry',
    templateUrl: './assets-entry.component.html',
    styleUrl: './assets-entry.component.scss',
    providers: [
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
        },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
    standalone: false
})
export class AssetsEntryComponent implements OnInit {
  // Default
  isLoading = false;

  // Form
  assetForm!: FormGroup;

  // General Variables
  isSavedAsset: boolean = false;
  documents: any[] = [];
  removedDocuments: any[] = [];

  // Data Variables
  assetTypes: string[] = ['Awards', 'Certifications', 'Brochures', 'Images'];
  assetNames: any[] = [];
  assetsData: any = {};

  constructor(
    private tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    private profileService: ProfileService,
    private encryptionService: EncryptionService,
    
    public dialog: MatDialog,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<AssetsEntryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  async ngOnInit() {
    // Asset Form
    this.assetForm = new FormGroup({
      assetId: new FormControl(0),
      assetName: new FormControl(null, [Validators.required]),
      assetType: new FormControl(this.data.type, [Validators.required]),
      validFromDate: new FormControl(null),
      validToDate: new FormControl(null),
      assetDescription: new FormControl(null),
      assetDocuments: new FormControl(null),
      udyamRegistrationNo: new FormControl(this.tokenStorageService.getUdyamRegistrationNo()),
    });

    // Load endpoints on load
    await this.onLoad();

    // display and apply validations based on asset Type
    this.displayFields();

    // If Edit Mode, patch the form with data
    if (this.data && this.data.assetsData) {
      this.assetsData = this.data.assetsData;
      this.assetForm.patchValue({
        assetId: this.assetsData.assetId,
        assetName: this.assetsData.assetName,
        assetType: this.assetsData.assetType,
        validFromDate: this.assetsData.validFromDate,
        validToDate: this.assetsData.validToDate,
        assetDescription: this.assetsData.assetDescription,
        assetDocuments: this.assetsData.assetDocuments
      });

      let tranType: string = 'assetImages';
      if (this.assetForm.value.assetType != 'Images') {
        tranType = 'asset' + this.assetForm.value.assetType.slice(0, -1) + 'Images';
      }

      const assetDocs = this.assetsData?.documents || [];
      if (this.assetsData.documents && this.assetsData.documents.length > 0) {
        for (let i = 0; i < this.assetsData.documents.length; i++) {
          if (assetDocs[i]?.documentName) {     
            const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: this.encryptionService.encrypt({ fileName: assetDocs[i].documentName }) }));
            const reader: any = new FileReader();
            const isPdf = assetDocs[i]?.documentName.toLowerCase().endsWith('.pdf');
            reader.onload = () => {
              let data: any = {
                document: null,
                documentName: assetDocs[i].documentName,
                readerDocument: isPdf ? reader.result : reader.result,
                transactionType: tranType
              };
              if (!this.documents) this.documents = [];
              this.documents.push(data);
            }
            reader.readAsDataURL(responseBlob);
          }
        }
      }
    }
  }

  async onLoad() {
    try {
      this.isLoading = true;
      // let defaultCondition = " AND staticlist.type = 'CERTIFICATION'";
      const defaultCondition = {
        "filters": [
          {
            "table": "staticlist",
            "field": "type",
            "operator": "=",
            "value": 'CERTIFICATION',
            "sequence": 1,
            "condition": "AND"
          }
        ]
      };
      let response = await this.profileService.staticLists({ payload: this.encryptionService.encrypt({ defaultCondition }) }).toPromise();
      response = response?.payload ? this.encryptionService.decrypt(response.payload) : [];
      this.assetNames = response?.data ?? [];
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'AssetsEntryComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  changeAssetType() {
    this.documents = [];
    this.displayFields();
  }

  extractFilesFromEvent(event: DragEvent): File[] {
    return event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    const droppedFiles = this.extractFilesFromEvent(event);
    const fileSizeInMB = droppedFiles[0].size / (1024 * 1024);
    if ((this.documents.length + droppedFiles.length) > 5 || fileSizeInMB > 5) {
      this.assetForm.get('assetDocuments')?.setErrors({ fileLimit: (fileSizeInMB > 5), limitReached: (this.documents.length + droppedFiles.length > 5) });
      return;
    }
    this.assetForm.get('assetDocuments')?.setErrors({ fileLimit: false, limitReached: false });
    this.readFile(droppedFiles);
  }

  handleFileChange(event: any): void {
    const selectedFiles = event.target.files;
    const fileSizeInMB = selectedFiles[0].size / (1024 * 1024);
    if ((this.documents.length + selectedFiles.length) > 5 || fileSizeInMB > 5) {
      this.assetForm.get('assetDocuments')?.setErrors({ fileLimit: (fileSizeInMB > 5), limitReached: (this.documents.length + selectedFiles.length > 5) });
      return;
    }
    this.assetForm.get('assetDocuments')?.setErrors({ fileLimit: false, limitReached: false });
    this.readFile(selectedFiles);
  }

  readFile(files: File[]): void {
    let tranType: string = 'assetImages';
    if (this.assetForm.value.assetType != 'Images') {
      tranType = 'asset' + this.assetForm.value.assetType.slice(0, -1) + 'Images';
    }
    let alertCount = 0;
    for (const file of files) {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const isPdf = file.type === 'application/pdf';
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1);

        if (this.assetForm.value.assetType === 'Brochures' && !(isPdf || (fileExtension == 'pdf'))) {
          if (alertCount == 0) {
            const dialogRef = this.dialog.open(AlertsComponent, {
              disableClose: true,
              data: {
                type: "error-type",
                title: this.translate.instant('Common.Pdffilesareallowed'),
                message: this.translate.instant('Common.Onlypdffilesareallowed')
              },
              width: '550px',
              maxWidth: '60vw'
            });
          }
          alertCount++;
          return;
        } else if (this.assetForm.value.assetType !== 'Brochures' && !(fileExtension == 'jpg' || fileExtension == 'jpeg' || fileExtension == 'png')) {
          if (alertCount == 0) {
            const dialogRef = this.dialog.open(AlertsComponent, {
              disableClose: true,
              data: {
                type: "error-type",
                title: this.translate.instant('Common.Imagesareallowed'),
                message: this.translate.instant('Common.Onlyimagesareallowed')
              },
              width: '550px',
              maxWidth: '60vw'
            });
          }
          alertCount++;
          return;
        }

        this.documents.push({
          transactionType: tranType,
          document: file,
          documentName: file.name,
          documentType: file.type,
          readerDocument: isPdf ? reader.result as any : reader.result
        });
      };
    }
  }

  removeFile(index: number): void {
    if (index !== -1) {
      const doc = this.documents[index];
      if (doc.document == null) this.removedDocuments.push(doc);
      this.documents.splice(index, 1);
    }
  }

  onNoClick() {
    this.dialogRef.close({ type: false, id: 0 });
  }

  get showFields() {
    return this.assetForm.value.assetType != 'Brochures' && this.assetForm.value.assetType != 'Images';
  }

  displayFields() {
    if (this.assetForm.value.assetType === 'Brochures' || this.assetForm.value.assetType === 'Images' || this.assetForm.value.assetType === 'Awards') {
      this.assetForm.get('validFromDate')?.clearValidators();
      this.assetForm.get('validFromDate')?.updateValueAndValidity();
      this.assetForm.get('validToDate')?.clearValidators();
      this.assetForm.get('validToDate')?.updateValueAndValidity();
      this.assetForm.get('assetDescription')?.clearValidators();
      this.assetForm.get('assetDescription')?.updateValueAndValidity();
      this.assetForm.get('assetName')?.clearValidators();
      this.assetForm.get('assetName')?.addValidators([Validators.required, Validators.pattern(/^[a-zA-Z0-9 .,()\-@&/]+$/), Validators.maxLength(100)]);
      this.assetForm.get('assetName')?.updateValueAndValidity();
    }
    else {
      this.assetForm.get('validFromDate')?.addValidators([Validators.required]);
      this.assetForm.get('validFromDate')?.updateValueAndValidity();
      this.assetForm.get('validToDate')?.addValidators([Validators.required]);
      this.assetForm.get('validToDate')?.updateValueAndValidity();
      this.assetForm.get('assetDescription')?.addValidators([Validators.pattern("^[^<>\"'\/|()\\\\\*]+$")]);
      this.assetForm.get('assetDescription')?.updateValueAndValidity();
      this.assetForm.get('assetName')?.clearValidators();
      this.assetForm.get('assetName')?.addValidators([Validators.required]);
      this.assetForm.get('assetName')?.updateValueAndValidity();
    }
  }

  async saveProfileDetails() {
    try {
      this.isSavedAsset = true;

      const documents = (this.documents.length > 0) ? this.documents : null;
      this.assetForm.patchValue({ assetDocuments: documents });

      if (this.assetForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Profile.SubmitAssetDetails"),
          message: this.translate.instant("Profile.DoYouWantToSubmitAssetDetails"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      this.isLoading = true;

      if (this.assetForm.value.assetType === 'Certifications') {
        this.assetForm.patchValue({
          validFromDate: formatDate(this.assetForm.value.validFromDate, "yyyy-MM-dd", "en-US"),
          validToDate: formatDate(this.assetForm.value.validToDate, "yyyy-MM-dd", "en-US")
        });
      } else {
        this.assetForm.patchValue({
          validFromDate: null,
          validToDate: null
        });
      }

      const assetObj = JSON.parse(JSON.stringify(this.assetForm.value));
      assetObj.assetDocuments = null;

      let response = await this.profileService.asset({ payload: this.encryptionService.encrypt(assetObj) }).toPromise();
      response = response.payload ? this.encryptionService.decrypt(response.payload) : {};

      if (response?.status != 'success') return;

      await this.commonService.handleFiles({
        addDocuments: this.documents,
        removedDocuments: this.removedDocuments,
        transactionId: response.id,
        loginUserId: this.assetForm.value.loginUserId
      });

      this.toastr.success(response?.message);
      this.dialogRef.close({ type: true, id: 0 });
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.assetForm.value.assetId, component: 'AssetsEntryComponent' });
    } finally {
      this.isLoading = false;
    }
  }

}
