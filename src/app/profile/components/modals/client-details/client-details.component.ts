import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

import { ProfileService } from '@profile/profile.service';
import { CommonService } from '@services/commom/common.service';
import { EncryptionService } from '@services/encryption/encryption.service';

import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';

@Component({
    selector: 'app-client-details',
    templateUrl: './client-details.component.html',
    styleUrl: './client-details.component.scss',
    standalone: false
})
export class ClientDetailsComponent implements OnInit {
  // Default
  isLoading = false;

  // Form
  clientForm!: FormGroup;

  // General Variables
  isSavedClient: boolean = false;

  // Data Variables
  clientsData: any = {};

  // Document Upload
  fileUploadError: any = {};
  documents: any[] = [];
  removedDocuments: any[] = [];

  displayEntryForm = false;
  editIndex: number | null = null;

  constructor(
    private tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    private profileService: ProfileService,
    private encryptionService: EncryptionService,
    
    public dialog: MatDialog,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<ClientDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  async ngOnInit() {
    // Client Form
    this.clientForm = new FormGroup({
      clientId: new FormControl(0),
      clientName: new FormControl(null, [Validators.required, Validators.pattern(/^[a-zA-Z0-9& ]+$/), Validators.maxLength(100)]),
      clientType: new FormControl('DOMESTIC', [Validators.required]),
      clientLogo: new FormControl(null, [Validators.required]),
      udyamRegistrationNo: new FormControl(this.tokenStorageService.getUdyamRegistrationNo())
    });

    // If Edit Mode, patch the form with data
    if (this.data && this.data.clientsData.length > 0) {
      this.clientsData = this.data.clientsData;
      this.displayEntryForm = false;
    } else {
      this.displayEntryForm = true;
    }
  }

  async onLoad() {
    // const defaultCondition = " AND client.udyamRegistrationNo = '" + this.clientForm.value.udyamRegistrationNo + "'";
    const defaultCondition: any = {
      "filters": [
        {
          "table": "client",
          "field": "udyamRegistrationNo",
          "operator": "=",
          "value": this.clientForm.value.udyamRegistrationNo,
          "sequence": 1,
          "condition": "AND"
        }
      ]
    };
    // let response = await this.profileService.clients({ payload: btoa(this.encryptionService.encrypt({ defaultCondition })) }).toPromise();
    // response = response?.payload ? this.encryptionService.decrypt(atob(response.payload)) : [];
    const encryptedData = await this.securityService.encrypt({ defaultCondition }).toPromise();
    let response: any = await this.profileService.clients({ payload: encryptedData.encryptedText} ).toPromise();
    response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
    this.clientsData = response?.data ?? [];

    this.clientsData.forEach(async (client: any) => {
      if (client.document?.documentName) {
        const encryptedData = await this.securityService.encrypt({ fileName: client.document.documentName }).toPromise();
        const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: encryptedData.encryptedText }));
        const reader = new FileReader();
        reader.onload = () => {
          client['clientLogo'] = reader.result;
        };
        reader.readAsDataURL(responseBlob);
      }
    });
  }

  addClient(){
    this.displayEntryForm = true;
    this.clientForm.patchValue({
      clientId: 0,
      clientName: null,
      clientType: 'DOMESTIC',
      clientLogo: null
    });
    setTimeout(() => {
      const element = document.querySelector(
        `.cdk-overlay-pane [formControlName="clientName"]`
      ) as HTMLElement | null;

      element?.focus();
    }, 100);
  }

  editClient(client: any, index: number) {
    this.editIndex = index;
    this.displayEntryForm = true;
    this.clientForm.patchValue(client);
    if (!this.documents) this.documents = [];
    let data: any = {
      document: null,
      documentName: client.document.documentName,
      readerDocument: this.clientForm.value.clientLogo,
      transactionType: 'clientLogo'
    };
    this.documents.push(data);
  }

  discardClients() {
    this.clientForm.patchValue({
      clientId: 0,
      clientName: null,
      clientType: 'DOMESTIC',
      clientLogo: null
    })
  }

  extractFilesFromEvent(event: DragEvent): File[] {
    return event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  handleDrop(type: string, event: DragEvent): void {
    event.preventDefault();
    const droppedFiles = this.extractFilesFromEvent(event);
    const fileSizeInMB = droppedFiles[0].size / (1024 * 1024);
    if (droppedFiles.length > 1 || fileSizeInMB > 5) {
      this.fileUploadError[type] = { limitReached: (fileSizeInMB > 5), fileLimit: (droppedFiles.length > 1) };
      return;
    }
    this.fileUploadError[type] = { limitReached: false, fileLimit: false };
    this.readFile(type, droppedFiles[0]);
  }

  handleFileChange(type: string, event: any): void {
    const selectedFiles = event.target.files;
    const fileSizeInMB = selectedFiles[0].size / (1024 * 1024);
    if (selectedFiles.length > 1 || fileSizeInMB > 5) {
      this.fileUploadError[type] = { limitReached: (fileSizeInMB > 5), fileLimit: (selectedFiles.length > 1) };
      return;
    }
    this.fileUploadError[type] = { limitReached: false, fileLimit: false };
    this.readFile(type, selectedFiles[0]);
  }

  readFile(type: string, file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1);
      if (!(fileExtension == 'jpg' || fileExtension == 'jpeg' || fileExtension == 'png')) {
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
        return;
      }

      let data: any = {
        document: file,
        documentName: file.name,
        readerDocument: reader.result,
        transactionType: 'clientLogo'
      };
      if (!this.documents) this.documents = [];
      this.documents.push(data);
      this.clientForm.patchValue({ [type]: data.readerDocument });
    };

    reader.readAsDataURL(file);
  }

  removeFile(type: string): void {
    let index = this.documents.findIndex(doc => doc.transactionType == type);
    if (index === -1) {
      const controlValue = this.clientForm.get(type)?.value;
      index = this.documents.findIndex(doc => doc.readerDocument === controlValue);
    }
    if (index !== -1) {
      const doc = this.documents[index];
      if (doc.document == null) this.removedDocuments.push(doc);
      this.documents.splice(index, 1);
      this.clientForm.patchValue({ [type]: null });
    }
  }

  onNoClick() {
    this.dialogRef.close({ type: false, id: 0 });
  }

  async saveClientDetails() {
    try {
      this.isSavedClient = true;

      if (this.clientForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Profile.SubmitClientDetails"),
          message: this.translate.instant("Profile.DoYouWantToSubmitClientDetails"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      const clientData = {
        clientId: this.clientForm.value.clientId,
        clientName: this.clientForm.value.clientName,
        clientType: this.clientForm.value.clientType,
        loginUserId: this.clientForm.value.loginUserId,
        udyamRegistrationNo: this.clientForm.value.udyamRegistrationNo
      };

      // let response = await this.profileService.client({ payload: btoa(this.encryptionService.encrypt(clientData)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(clientData).toPromise();
      let response: any = await this.profileService.client({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};

      if (response?.status == 'success') {
        await this.commonService.handleFiles({
          addDocuments: this.documents,
          removedDocuments: this.removedDocuments,
          transactionId: response.clientId,
          loginUserId: this.clientForm.value.loginUserId
        });
        await this.onLoad();
      }

      this.toastr.success(response?.message);

      this.dialogRef.close({ type: true, id: 0 });
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.clientForm.value.clientId, component: 'ClientDetailsComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  async deleteClient(client: any) {
    try {
      this.isSavedClient = true;
      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Profile.DeleteClientDetails"),
          message: this.translate.instant("Profile.DoYouWantToDeleteClientDetails"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      this.isLoading = true;

      const clientData = {
        clientId: client.clientId,
        udyamRegistrationNo: this.tokenStorageService.getUdyamRegistrationNo()
      };

      // let response = await this.profileService.deleteClient({ payload: btoa(this.encryptionService.encrypt(clientData)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(clientData).toPromise();
      let response: any = await this.profileService.deleteClient({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};

      if (response?.status == 'success') {
        await this.onLoad();
      }

      this.toastr.success(response?.message);

      this.dialogRef.close({ type: true, id: 0 });
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.clientForm.value.clientId, component: 'ClientDetailsComponent' });
    } finally {
      this.isLoading = false;
    }
  }
}
