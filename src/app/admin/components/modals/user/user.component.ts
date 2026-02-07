import { Component, OnInit, Inject } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";

import { AlertsComponent } from "@components/alerts/alerts.component";

import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from 'src/app/shared/services/token-storage/token-storage.service';
import { AdminService } from '@admin/admin.service';
import { EncryptionService } from 'src/app/shared/services/encryption/encryption.service';
import { SecurityService } from "src/app/shared/services/security/security.service";
import { CommonService } from 'src/app/shared/services/commom/common.service';
import { ToastrService } from 'ngx-toastr';

import { firstValueFrom } from 'rxjs';

@Component({
    selector: "app-user",
    templateUrl: "./user.component.html",
    styleUrls: ["./user.component.scss"],
    standalone: false
})
export class UserComponent implements OnInit {
  // Default
  isLoading = false;

  // Form
  userForm!: FormGroup;

  // General Variables
  isSavedForm = false;
  userTypes: any;

  // Document Upload
  fileUploadError: any = {};
  documents: any[] = [];
  removedDocuments: any[] = [];

  // Data Variables
  userData: any = []

  constructor(
    private adminService: AdminService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    public tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<UserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  async ngOnInit() {
    // User Form
    this.userForm = new FormGroup({
      appUserId: new FormControl(0),
      userType: new FormControl("ADMIN", [Validators.required]),
      userName: new FormControl(null, [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9 .@]*$/)]),
      loginName: new FormControl(null, [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)]),
      userImage: new FormControl(null),
      inactive: new FormControl(false),
      setDefaultPassword: new FormControl(true),
      loginUserId: new FormControl(this.tokenStorageService.getUser().appUserId)
    });

    // Patch existing data
    if (this.data.userData) {
      this.userData = this.data.userData;
      this.userForm.patchValue({
        appUserId: this.userData.appUserId,
        userType: this.userData.userType,
        userName: this.userData.userName,
        loginName: this.userData.loginName,
        inactive: this.userData.inactive == "Y" ? true : false,
        setDefaultPassword: false
      });

      const userDocs = this.userData?.documents ? JSON.parse(this.userData.documents) : [];
      if (userDocs[0]?.documentName) {
        const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: await this.securityService.encrypt({fileName: userDocs[0].documentName}).toPromise() }));
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
          this.userForm.patchValue({ userImage: data.readerDocument });
        };
        reader.readAsDataURL(responseBlob);
      } else {
        this.userForm.patchValue({ userImage: null });
      }
    }
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
        transactionType: 'userImage'
      };
      if (!this.documents) this.documents = [];
      this.documents.push(data);
      this.userForm.patchValue({ [type]: data.readerDocument });
    };

    reader.readAsDataURL(file);
  }

  removeFile(type: string): void {
    let index = this.documents.findIndex(doc => doc.transactionType == type);
    if (index === -1) {
      const controlValue = this.userForm.get(type)?.value;
      index = this.documents.findIndex(doc => doc.readerDocument === controlValue);
    }
    if (index !== -1) {
      const doc = this.documents[index];
      if (doc.document == null) this.removedDocuments.push(doc);
      this.documents.splice(index, 1);
      this.userForm.patchValue({ [type]: null });
    }
  }

  async downloadFile(type: string) {
    let index = this.documents.findIndex(doc => doc.transactionType == type);
    if (index === -1) {
      const controlValue = this.userForm.get(type)?.value;
      index = this.documents.findIndex(doc => doc.readerDocument === controlValue);
    }
    if (index !== -1) {
      const doc = this.documents[index];
      const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: await this.securityService.encrypt({fileName: doc.documentName}).toPromise() }));
      const url = window.URL.createObjectURL(responseBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.documentName;
      a.click();
    }
  }

  onNoClick() {
    this.dialogRef.close({ type: false, id: 0 });
  }

  async saveUser() {
    try {
      this.isLoading = true;
      this.isSavedForm = true;

      if (this.userForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Admin.SubmitUserForm"),
          message: this.translate.instant("Admin.DoYouWantToSubmitUserForm"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      // let response = await this.adminService.user({ payload: btoa(this.encryptionService.encrypt(this.userForm.value)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(this.userForm.value).toPromise();
      let response: any = await this.adminService.user({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};

      if (response?.status == 'success') {
        await this.commonService.handleFiles({
          addDocuments: this.documents,
          removedDocuments: this.removedDocuments,
          transactionId: this.userForm.value.appUserId,
          loginUserId: this.userForm.value.loginUserId
        });
      }

      this.toastr.success(response?.message);
      this.dialogRef.close({ type: true, id: 0 });
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.userForm.value.appUserId, component: 'UserComponent' });
    } finally {
      this.isLoading = false;
    }
  }
}
