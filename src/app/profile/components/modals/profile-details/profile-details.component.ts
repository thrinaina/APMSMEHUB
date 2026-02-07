import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { ProfileService } from '@profile/profile.service';
import { CommonService } from '@services/commom/common.service';
import { EncryptionService } from '@services/encryption/encryption.service';
import { SecurityService } from 'src/app/shared/services/security/security.service';
import { TokenStorageService } from '@services/token-storage/token-storage.service';
import { AlertsComponent } from 'src/app/components/alerts/alerts.component';

import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-profile-details',
    templateUrl: './profile-details.component.html',
    styleUrl: './profile-details.component.scss',
    standalone: false
})
export class ProfileDetailsComponent implements OnInit {
  // Default
  isLoading = false;

  // Form
  profileForm!: FormGroup;

  // General Variables
  isSavedProfile: boolean = false;
  socialMessage: string | undefined;

  fileUploadError: any = {};
  documents: any[] = [];
  removedDocuments: any[] = [];

  // Data Variables
  socialTypes: any = [
    {
      siteId: '1',
      siteName: 'Facebook',
      siteImagePath: 'assets/icons/facebook.svg'
    },
    {
      siteId: '2',
      siteName: 'Instagram',
      siteImagePath: 'assets/icons/instagram.svg'
    },
    {
      siteId: '3',
      siteName: 'LinkedIn',
      siteImagePath: 'assets/icons/linkedin.svg'
    },
    {
      siteId: '4',
      siteName: 'Twitter',
      siteImagePath: 'assets/icons/twitter.svg'
    },
    {
      siteId: '5',
      siteName: 'Website',
      siteImagePath: 'assets/icons/website.svg'
    },
    {
      siteId: '6',
      siteName: 'Youtube',
      siteImagePath: 'assets/icons/youtube.svg'
    }
  ];
  profileData: any = {};

  constructor(
    private tokenStorageService: TokenStorageService,
    private commonService: CommonService,
    private profileService: ProfileService,
    private encryptionService: EncryptionService,
    private securityService: SecurityService,
    public translate: TranslateService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<ProfileDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  async ngOnInit() {
    // Profile Form
    this.profileForm = new FormGroup({
      enterpriseId: new FormControl(0),
      webAddress: new FormControl(null, [Validators.required, Validators.pattern(/^[a-z0-9]+$/), Validators.maxLength(50)]),
      coverImage: new FormControl(null, [Validators.required]),
      enterpriseLogo: new FormControl(null, [Validators.required]),
      socials: new FormArray([this.initSocialRows()]),
      emailId:  new FormControl(null),
      mobileNumber:  new FormControl(null),
      loginUserId: new FormControl(this.tokenStorageService.getUser().appUserId),
      udyamRegistrationNo: new FormControl(this.tokenStorageService.getUdyamRegistrationNo()),
    });

    // If data is passed, patch the form
    if (this.data && this.data.profileData) {
      this.profileData = this.data.profileData;

      // Patch Profile Data
      this.profileForm.patchValue({
        enterpriseId: this.profileData.enterpriseId,
        udyamRegistrationNo: this.profileData.udyamRegistrationNo,
        webAddress: this.profileData.webAddress,
        coverImage: this.profileData.coverImage,
        enterpriseLogo: this.profileData.enterpriseLogo,
        emailId: this.profileData.emailId,
        mobileNumber: this.profileData.mobileNumber,
      });

      this.documents = this.profileData?.documents; //? JSON.parse(this.profileData.documents) : [];
      if (this.documents) {
        this.documents.forEach(async document => {
          if (document?.documentName) {
            const responseBlob: Blob = await firstValueFrom(this.commonService.previewFile({ payload: await this.securityService.encrypt({fileName: document?.documentName}).toPromise() }));
            const reader = new FileReader();
            reader.onload = () => {
              let data: any = {
                document: null,
                documentName: null,
                readerDocument: reader.result,
              };
              if (!this.documents) this.documents = [];

              if (document?.transactionType == 'enterpriseLogo') {
                this.profileForm.patchValue({ enterpriseLogo: data.readerDocument });
                data.transactionType = 'enterpriseLogo';
              } else {
                this.profileForm.patchValue({ coverImage: data.readerDocument });
                data.transactionType = 'coverImage';
              }
              this.documents.push(data);
            };
            reader.readAsDataURL(responseBlob);
          }
        });
      }

      // Patch Socials Data
      const socialsArray = this.profileForm.get('socials') as FormArray;
      socialsArray.clear();
      if (this.profileData.socials && this.profileData.socials.length > 0) {
        this.profileData.socials.forEach((social: any) => {
          const socialGroup = this.initSocialRows();
          socialGroup.patchValue({
            urlType: social.linkType,
            url: social.linkURL
          });
          socialsArray.push(socialGroup);
        });
      } else {
        socialsArray.push(this.initSocialRows());
      }
    }
  }

  // initSocialRows() {
  //   return new FormGroup({
  //     urlType: new FormControl(null),
  //     url: new FormControl(null),
  //   });
  // }

  initSocialRows() {
    const group = new FormGroup({
      urlType: new FormControl(null),
      url: new FormControl(null)
    });
  
    group.get('urlType')?.valueChanges.subscribe(name => {
      const c = group.get('url');
      c?.clearValidators();
  
      const r =
        name === 'Facebook'  ? /^(https?:\/\/)?(www\.)?facebook\.com(\/([^<>\"'\/|()\\*]+)?)?$/ :
        name === 'Instagram' ? /^(https?:\/\/)?(www\.)?instagram\.com(\/([^<>\"'\/|()\\*]+)?)?$/ :
        name === 'LinkedIn'  ? /^(https?:\/\/)?(www\.)?linkedin\.com(\/([^<>\"'\/|()\\*]+)?)?$/ :
        name === 'Twitter'   ? /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)(\/([^<>\"'\/|()\\*]+)?)?$/ :
        name === 'Website'   ? /^(https?:\/\/)?(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+(com|org|net|edu|gov|mil|io|co|in|uk|html)(\/([^<>\"'\/|()\\*]+)?)?$/ :
        name === 'Youtube'   ? /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)(\/([^<>\"'\/|()\\*]+)?)?$/ :
        null;
  
      r && c?.setValidators([Validators.required, Validators.pattern(r)]);
      c?.updateValueAndValidity();
    });
  
    return group;
  }
  

  getSocialRowArray(form: any) {
    return form.controls.socials.controls;
  }

  addNewSocial() {
    const control = <FormArray>this.profileForm.get("socials");
    control.push(this.initSocialRows());
  }

  deleteSocialRow(index: number) {
    this.socialMessage = "";
    const control = <FormArray>this.profileForm.get("socials");
    control.removeAt(index);
  }

  async findDuplicateSocial(dataArr: any[]) {
    let socialMessage = '';
    try {
      if (dataArr.length != 0) {
        for (let i = 0; i < dataArr.length; i++) {
          let outerWebsite;
          if (dataArr[i].urlType != null) outerWebsite = dataArr[i].urlType;
          for (let j = 0; j < dataArr.length; j++) {
            let innerWebsite;
            if (dataArr[j].urlType != null) {
              innerWebsite = dataArr[j].urlType;
            }

            if (!dataArr[j].urlType && dataArr[j].url) {
              socialMessage = "Common.URLTypeisrequired";
              return socialMessage;
            } else if (dataArr[j].urlType && !dataArr[j].url) {
              socialMessage = "Common.URLisrequired";
              return socialMessage;
            }

            if (dataArr.length > 1 && (!dataArr[j].urlType && !dataArr[j].url)) {
              socialMessage = "Common.URLTypeisrequired";
              return socialMessage;
            }

            if (i != j && outerWebsite) {
              if (outerWebsite == innerWebsite) {
                socialMessage = this.translate.instant("Profile.SocialUrlType")+" : '" + outerWebsite + "' "+this.translate.instant("Profile.IsRepeated");
                return socialMessage;
              }
            }
          }
        }
      }
      return socialMessage;
    } catch (err) {
      this.commonService.handleError(err, { type: 'GET', id: 0, component: 'ProfileDetailsComponent' });
      return undefined;
    } finally {
      this.isLoading = false;
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
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1);

    reader.onload = () => {
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
      };
      if (!this.documents) this.documents = [];

      data.transactionType = type;
      this.documents.push(data);
      this.profileForm.patchValue({ [type]: data.readerDocument });
    };

    reader.readAsDataURL(file);
  }

  removeFile(type: string): void {
    let index = this.documents.findIndex(doc => doc.transactionType == type);
    if (index === -1) {
      const controlValue = this.profileForm.get(type)?.value;
      index = this.documents.findIndex(doc => doc.readerDocument === controlValue);
    }
    if (index !== -1) {
      const doc = this.documents[index];
      if (doc.document === undefined) this.removedDocuments.push(doc);
      this.documents.splice(index, 1);
      this.profileForm.patchValue({ [type]: null });
    }
  }

  onNoClick() {
    this.dialogRef.close({ type: false, id: 0 });
  }

  async saveProfileDetails() {
    try {
      this.isSavedProfile = true;
      this.socialMessage = await this.findDuplicateSocial(this.profileForm.value.socials);

      if (this.socialMessage != "") {
        this.socialMessage = this.socialMessage;
        this.profileForm.controls["socials"].setErrors({ unique: true });
      } else {
        this.profileForm.controls["socials"].setErrors(null);
      }

      if (this.profileForm.invalid) {
        return;
      }

      const dialogRef = this.dialog.open(AlertsComponent, {
        disableClose: true,
        data: {
          type: "confirmation",
          title: this.translate.instant("Profile.SubmitProfileDetails"),
          message: this.translate.instant("Profile.DoYouWantToSubmitProfileDetails"),
        },
        width: '550px',
        maxWidth: '60vw'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (!result) return;

      this.isLoading = true;

      // let response = await this.profileService.profileDetail({ payload: btoa(this.encryptionService.encrypt(this.profileForm.value)) }).toPromise();
      // response = response.payload ? this.encryptionService.decrypt(atob(response.payload)) : {};
      const encryptedData = await this.securityService.encrypt(this.profileForm.value).toPromise();
      let response: any = await this.profileService.profileDetail({ payload: encryptedData.encryptedText} ).toPromise();
      response = response.payload ? await this.securityService.decrypt(response.payload).toPromise() : {};

      if (response?.status == 'conflict') {
        const dialogRef = this.dialog.open(AlertsComponent, {
          disableClose: true,
          data: {
            type: "error-type",
            title: this.translate.instant('Common.Filenotfound'),
            message: this.translate.instant('Common.Enterprisewebaddress') +": '"+ this.profileForm.value.webAddress + "' "+this.translate.instant('Common.AlreadyExist'),
          },
          width: '550px',
          maxWidth: '60vw'
        });
      } else if (response?.status == 'success') {
        await this.commonService.handleFiles({
          addDocuments: this.documents,
          removedDocuments: this.removedDocuments,
          transactionId: this.profileForm.value.enterpriseId,
          loginUserId: this.profileForm.value.loginUserId
        });
  
        this.toastr.success(response?.message);
        this.dialogRef.close({ type: true, id: 0 });
      }
    } catch (err) {
      this.commonService.handleError(err, { type: 'POST', id: this.profileForm.value.enterpriseId, component: 'ProfileDetailsComponent' });
    } finally {
      this.isLoading = false;
    }

  }
}
