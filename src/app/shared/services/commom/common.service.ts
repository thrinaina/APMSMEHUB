import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { EncryptionService } from '../encryption/encryption.service';
import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from '../token-storage/token-storage.service';
import { HttpClient } from '@angular/common/http';
import { Observable, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { formatDate } from '@angular/common';

const API_AUTH_URL = environment.apiUrl + 'api/auth/';
const API_ADMIN_URL = environment.apiUrl + 'api/admin/';
const API_FILE_URL = environment.apiUrl + 'api/file/';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor(
    public translate: TranslateService,
    private httpClient: HttpClient,
    public tokenStorageService: TokenStorageService,
    private encryptionService: EncryptionService,
    
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  getAppProduction() {
    return environment.production;
  }

  // Error Logging
  errorLog(tranId: any, componentName: string, errorMessage: string): Observable<any> {
    const data = {
      tranId: tranId,
      componentName: componentName,
      errorMessage: errorMessage
    };
    return this.httpClient.post(API_AUTH_URL + 'errorlog', data);
  }

  // Check inactive session
  // inactiveSessions(userData: any, status: any, sessionLogDesc: string): Observable<any> {
  //   const data = {
  //     token: userData.accessToken,
  //     appUserId: userData.appUserId,
  //     status: status,
  //     sessionLogDesc: sessionLogDesc,
  //     ipAddress: this.tokenStorageService.getIPAddress(),
  //     browserName: this.tokenStorageService.getBrowserName()
  //   };
  //   return this.httpClient.post(API_AUTH_URL + 'inactivesessions', { payload: btoa(this.encryptionService.encrypt(data)) });
  // }
  async inactiveSessions(accessToken: string, status: any, sessionLogDesc: string): Promise<any> {
    const data = {
      token: accessToken,
      status: status,
      sessionLogDesc: sessionLogDesc,
      ipAddress: this.tokenStorageService.getIPAddress(),
      browserName: this.tokenStorageService.getBrowserName()
    };

    const encryptedData = await this.securityService.encrypt(data).toPromise();
    return this.httpClient.post(API_AUTH_URL + 'inactivesessions', { payload: encryptedData }).toPromise();
  }

  // Refresh Token
  refreshToken(token: string) {
    return this.httpClient.post(API_AUTH_URL + 'refreshtoken', { refreshToken: token });
  }

  // Error Handler
  async handleError(err: any, data: any) {
    data = data || { type: 'GET', id: 0, component: '' };
    let message = '', errorMessage = '';

    // Detailed error message
    if (err?.error?.payload) {
      try {
        const payload = await this.securityService.decrypt(err?.error?.payload).toPromise();
        errorMessage = payload.message;
      } catch (e) {
        errorMessage = err?.error?.message;
      } finally {
        message = errorMessage;
      }
    } else {
      errorMessage = err?.error?.message;
      message = err?.error?.message;
    }

    // Generic message in production
    // if (this.getAppProduction()) {
    //   const errorTemplate = data?.type == 'POST' ? 'Common.FailedToPostData' : 'Common.FailedToFetchData';
    //   message = this.translate.instant(errorTemplate);
    // }

    if (message == '') return;

    if (errorMessage == 'User Session Expired.' || errorMessage == 'No token provided!' || errorMessage == 'Unauthorized!') {
      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "error-type",
          title: errorMessage,
          message: errorMessage,
        },
        width: '550px',
        maxWidth: '60vw'
      });
    } else if (err.statusText == 'Not Found') {
      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "error-type",
          title: this.translate.instant('Common.Filenotfound'),
          message: this.translate.instant('Common.Filenotfound'),
        },
        width: '550px',
        maxWidth: '60vw'
      });
    } else {
      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "error-type",
          title: err?.statusText || this.translate.instant('Common.ClientRuntimeError'),
          title1: err?.status || 400,
          message: message,
        },
        width: '550px',
        maxWidth: '60vw'
      });
    }
    
    await this.errorLog(data?.appUserId, data?.component, errorMessage).toPromise();

    if (errorMessage == 'User Session Expired.' || errorMessage == 'No token provided!' || errorMessage == 'Unauthorized!') {
      await this.inactiveSessions(this.tokenStorageService.getUser().accessToken, false, "Logout");
      this.dialog.closeAll();
      this.tokenStorageService.signOut();
      this.router.navigate(['/'], { relativeTo: this.route });
    }
  }

  // Add Document
  addDocument(documentData: any) {
    return this.httpClient.post(API_ADMIN_URL + 'adddocument', documentData);
  }

  // Delete Document
  deleteDocument(documentData: any) {
    return this.httpClient.post(API_ADMIN_URL + 'deletedocument', documentData);
  }

  // Upload File
  uploadFile(file: File, fileName: string) {
    const formData = new FormData();
    formData.append('file', file, fileName);
    return this.httpClient.post(API_FILE_URL + 'uploadfile', formData);
  }

  // COMMENTED BY ASHWIN (DOWNLOAD HANDLER NOT USED)
  // Download File
  // downloadFile(fileData: any) {
  //   return this.httpClient.post(API_FILE_URL + 'downloadfile', fileData, { responseType: 'blob' });
  // }

  // Preview File
  previewFile(fileData: any) {
    return this.httpClient.post(API_FILE_URL + 'previewfile', fileData, { responseType: 'blob' });
  }

  // Delete File
  deleteFile(fileData: any) {
    return this.httpClient.post(API_FILE_URL + 'removefile', fileData);
  }

  // Handle Files Upload/Delete
  async handleFiles(data: any) {
    let fileDateString = '', statusDate = '';
    const addDocuments = data.addDocuments.filter((addDoc: any) => addDoc.document != undefined);
    if (addDocuments.length > 0 && data.removedDocuments.length > 0) {
      // Add documents
      for (let docIndex = 0; docIndex < addDocuments.length; docIndex++) {
        const doc = addDocuments[docIndex];
        fileDateString = formatDate(new Date(), "yyyyMMddhhmmssSSSSSS", "en-US").toString();
        statusDate = formatDate(new Date(), "yyyy-MM-dd HH:mm:ss", "en-US");
        doc["documentName"] = (data?.transactionType || doc?.transactionType) + "_" + data.transactionId + "_" + fileDateString + "." + doc.document.name.split(".")[1];
        await this.uploadFile(doc.document, doc.documentName).toPromise();
        let documentData = {
          transactionId: data.transactionId,
          transactionType: data?.transactionType || doc?.transactionType,
          documentType: doc.document?.type,
          documentName: doc.documentName,
          aliasName: doc.document?.name,
          statusDate: statusDate,
          statusType: "Uploaded"
        };
        const encryptedData = await this.securityService.encrypt(documentData).toPromise();
        await this.addDocument({ payload: encryptedData.encryptedText }).toPromise();
      }
      // Remove documents
      for (let removeDocIndex = 0; removeDocIndex < data.removedDocuments.length; removeDocIndex++) {
        let removeDoc = data.removedDocuments[removeDocIndex];
        removeDoc.transactionId = data.transactionId;
        const encryptedData = await this.securityService.encrypt({ fileName: removeDoc.documentName }).toPromise();
        await this.deleteFile({ payload: encryptedData.encryptedText }).toPromise();
        const encryptedData2 = await this.securityService.encrypt(removeDoc).toPromise();
        await this.deleteDocument({ payload: encryptedData2.encryptedText }).toPromise();
      }
    } else if (addDocuments.length > 0 && data.removedDocuments.length == 0) {
      // Add documents only
      for (let docIndex = 0; docIndex < addDocuments.length; docIndex++) {
        const doc = addDocuments[docIndex];
        fileDateString = formatDate(new Date(), "yyyyMMddhhmmssSSSSSS", "en-US").toString();
        statusDate = formatDate(new Date(), "yyyy-MM-dd HH:mm:ss", "en-US");
        doc["documentName"] = (data?.transactionType || doc?.transactionType) + "_" + data.transactionId + "_" + fileDateString + "." + doc.document.name.split(".")[1];
        await this.uploadFile(doc.document, doc.documentName).toPromise();
        let documentData = {
          transactionId: data.transactionId,
          transactionType: data?.transactionType || doc?.transactionType,
          documentType: doc.document?.type,
          documentName: doc.documentName,
          aliasName: doc.document?.name,
          statusDate: statusDate,
          statusType: "Uploaded"
        };
        const encryptedData = await this.securityService.encrypt(documentData).toPromise();
        await this.addDocument({ payload: encryptedData.encryptedText }).toPromise();
      }
    } else if (addDocuments.length == 0 && data.removedDocuments.length > 0) {
      // Remove documents only
      for (let removeDocIndex = 0; removeDocIndex < data.removedDocuments.length; removeDocIndex++) {
        const removeDoc = data.removedDocuments[removeDocIndex];
        removeDoc.transactionId = data.transactionId;
        const encryptedData = await this.securityService.encrypt({ fileName: removeDoc.documentName }).toPromise();
        await this.deleteFile({ payload: encryptedData.encryptedText }).toPromise();
        const encryptedData2 = await this.securityService.encrypt(removeDoc).toPromise();
        await this.deleteDocument({ payload: encryptedData2.encryptedText }).toPromise();
      }
    }
    return true
  }

  // To open Google Maps based on latitude & longitude
  openMap(lat: any, lng: any): void {
    if (lat && lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  }
}
