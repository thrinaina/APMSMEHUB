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
import { firstValueFrom } from 'rxjs';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';
import { CategoryRequestComponent } from '../category-request/category-request.component';

@Component({
    selector: 'app-product',
    templateUrl: './product.component.html',
    styleUrl: './product.component.scss',
    standalone: false
})
export class ProductComponent implements OnInit {
  // Default
  isLoading = false;

  // Form
  productForm!: FormGroup;

  // General Variables
  isSavedProduct: boolean = false;

  documents: any[] = [];
  removedDocuments: any[] = [];

  // Data Variables
  productCategories: any = [];
  productGITags: any = [];
  productUnits: any = [];

  productData: any = {};
  selectedCategory: any;

  constructor(
    private tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    private profileService: ProfileService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    public dialog: MatDialog,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<ProductComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  async ngOnInit() {
    // Product Form
    this.productForm = new FormGroup({
      productId: new FormControl(0),
      categoryId: new FormControl(null, [Validators.required]),
      productGITag: new FormControl(null),
      productName: new FormControl(null, [Validators.required, Validators.pattern(/^[a-zA-Z0-9 .,()\-@&/]+$/), Validators.maxLength(100)]),
      productPrice: new FormControl(null, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/), Validators.maxLength(20)]),
      productQuantity: new FormControl(null, [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.maxLength(10)]),
      productUnit: new FormControl(null, [Validators.required]),
      productDescription: new FormControl(null, [Validators.required, Validators.pattern("^[^<>\"'\/|()\\\\\*]+$")]),
      productImages: new FormControl(null, [Validators.required]),
      inactive: new FormControl(false),
      udyamRegistrationNo: new FormControl(this.tokenStorageService.getUdyamRegistrationNo()),
    });

    // Loading all endpoints on load
    await this.onLoad();

    // If Edit Mode, patch the form with data
    if (this.data && this.data.productData) {
      this.productData = this.data.productData;
      this.productForm.patchValue({
        productId: this.productData.productId,
        categoryId: this.productData.categoryId,
        productGITag: this.productData.productGITag,
        productName: this.productData.productName,
        productPrice: this.productData.productPrice,
        productQuantity: this.productData.productQuantity,
        productUnit: this.productData.productUnit,
        productDescription: this.productData.productDescription,
        udyamRegistrationNo: this.productData.udyamRegistrationNo
      });

      const productDocs = this.productData?.documents || [];
      if (this.productData.documents && this.productData.documents.length > 0) {
        for (let i = 0; i < this.productData.documents.length; i++) {
          if (productDocs[i]?.documentName) {
            const encryptedData = await this.securityService.encrypt({ fileName: productDocs[i].documentName }).toPromise();
            const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: encryptedData.encryptedText }));
            const reader = new FileReader();
            reader.onload = () => {
              let data: any = {
                document: null,
                documentName: productDocs[i].documentName,
                readerDocument: reader.result,
                transactionType: 'productImages'
              };
              if (!this.documents) this.documents = [];
              this.documents.push(data);
            }
            reader.readAsDataURL(responseBlob);
          }
        }
      }

      this.changeCategory();
    }
  }

  async onLoad() {
    try {
      this.isLoading = true;
      let defaultCondition:any = { filters: [] };
      // let response1: any = await this.profileService.categories({ payload: btoa(this.encryptionService.encrypt({defaultCondition})) }).toPromise();
      // this.productCategories = response1.payload ? this.encryptionService.decrypt(atob(response1.payload)).data : [];
      const encryptedData = await this.securityService.encrypt({defaultCondition}).toPromise();
      let response1: any = await this.profileService.categories({ payload: encryptedData.encryptedText} ).toPromise();
      response1 = response1.payload ? await this.securityService.decrypt(response1.payload).toPromise() : {};
      this.productCategories = response1.data || [];

      // defaultCondition = " AND staticlist.type = 'UOM'";
      defaultCondition = {
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
      // let response2: any = await this.profileService.staticLists({ payload: btoa(this.encryptionService.encrypt({defaultCondition})) }).toPromise();
      // this.productUnits = response2.payload ? this.encryptionService.decrypt(atob(response2.payload)).data : [];
      const encryptedData2 = await this.securityService.encrypt({defaultCondition}).toPromise();
      let response2: any = await this.profileService.staticLists({ payload: encryptedData2.encryptedText} ).toPromise();
      response2 = response2.payload ? await this.securityService.decrypt(response2.payload).toPromise() : {};
      this.productUnits = response2.data || [];
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ProductComponent' });
    } finally {
      this.isLoading = false;
    }
  }

  changeCategory() {
    this.selectedCategory = this.productCategories.find((category: any) => category.categoryId == this.productForm.value.categoryId);
    this.productForm.patchValue({ productGITag: this.selectedCategory.isGITag == "Y" ? this.selectedCategory.categoryName : null });
  }

  requestCategory() {
    const dialogRef = this.dialog.open(CategoryRequestComponent, {
      disableClose: true,
      data: {

      },
      width: '800px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.onLoad();
    });
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
      this.productForm.get('productImages')?.setErrors({ fileLimit: (fileSizeInMB > 5), limitReached: (this.documents.length + droppedFiles.length > 5) });
      return;
    }
    this.productForm.get('productImages')?.setErrors({ fileLimit: false, limitReached: false });
    this.readFile(droppedFiles);
  }

  handleFileChange(event: any): void {
    const selectedFiles = event.target.files;
    const fileSizeInMB = selectedFiles[0].size / (1024 * 1024);
    if ((this.documents.length + selectedFiles.length) > 5 || fileSizeInMB > 5) {
      this.productForm.get('productImages')?.setErrors({ fileLimit: (fileSizeInMB > 5), limitReached: (this.documents.length + selectedFiles.length > 5) });
      return;
    }
    this.productForm.get('productImages')?.setErrors({ fileLimit: false, limitReached: false });
    this.readFile(selectedFiles);
  }

  readFile(files: File[]): void {
    let alertCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file: File = files[i];
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1);
        if (!(fileExtension == 'jpg' || fileExtension == 'jpeg' || fileExtension == 'png')) {
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

        let data: any = {
          transactionType: 'productImages',
          document: file,
          documentName: file.name,
          readerDocument: reader.result,
        };
        if (!this.documents) this.documents = [];
        this.documents.push(data);
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

  async downloadFile(type: string) {
    let index = this.documents.findIndex(doc => doc.transactionType == type);
    if (index === -1) {
      const controlValue = this.productForm.get(type)?.value;
      index = this.documents.findIndex(doc => doc.readerDocument === controlValue);
    }
    if (index !== -1) {
      const doc = this.documents[index];
      const encryptedData = await this.securityService.encrypt({ fileName: doc.documentName }).toPromise();
      const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: encryptedData.encryptedText }));
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

  async saveProductDetails() {
    try {
      this.isSavedProduct = true;

      const documents = (this.documents.length > 0) ? this.documents : null;
      this.productForm.patchValue({ productImages: documents });

      if (this.productForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Profile.SubmitProductDetails"),
          message: this.translate.instant("Profile.DoYouWantToSubmitProductDetails"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      this.isLoading = true;

      // let response = await this.profileService.product({ payload: btoa(this.encryptionService.encrypt(this.productForm.value)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(this.productForm.value).toPromise();
      let response: any = await this.profileService.product({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};
      if (response?.status == 'conflict') {
        const dialogRef = this.dialog.open(AlertsComponent, {
          disableClose: true,
          data: {
            type: "error-type",
            title: this.translate.instant('Common.DulipcateData'),
            message: this.translate.instant('Profile.ProductName') +" '"+ this.productForm.value.productName + "' "+ this.translate.instant('Common.AlreadyExist'),
          },
          width: '550px',
          maxWidth: '60vw'
        });
      } else if (response?.status == 'success') {
        await this.commonService.handleFiles({
          addDocuments: this.documents,
          removedDocuments: this.removedDocuments,
          transactionId: response.id
        });
        this.toastr.success(response?.message);
        this.dialogRef.close({ type: true, id: 0 });
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.productForm.value.productId, component: 'ProductComponent' });
    } finally {
      this.isLoading = false;
    }

  }
}
