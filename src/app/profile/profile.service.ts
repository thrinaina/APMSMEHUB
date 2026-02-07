import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const API_PROFILE_URL = environment.apiUrl + 'api/profile/';
@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(
    private http: HttpClient,
  ) { }

  private objParam = new BehaviorSubject<any>({
    Id: 0
  });

  setObjParam(paramId: any) {
    this.objParam.next({ Id: paramId });
  }

  getObjParam() {
    return this.objParam.asObservable();
  }

  // To Post Document
  addDocument(documentData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'adddocument', documentData);
  }

  // To Post Delete Document
  deleteDocument(documentData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'deletedocument', documentData);
  }

  // To Post Web Address, Social Links  -- Cover Image, Enterprise Logo,
  profileDetail(profileDetailData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'profiledetail', profileDetailData);
  }

  // To Post About Enterprise, Vision, Mission, Core Values
  enterpriseDetail(enterpriseDetailData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'enterprisedetail', enterpriseDetailData);
  }

  // To Post Add Client
  client(clientData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'client', clientData);
  }

  // To Post Delete Client
  deleteClient(clientData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'deleteclient', clientData);
  }

  // To Post Market Presence (Domestic, International, Sectors Served)
  marketPresence(marketPresenceData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'marketpresence', marketPresenceData);
  }

  // To Post PAN, GSTIN, IEC, Industry Licenses 
  complainceDetail(complainceDetailsData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'complaincedetail', complainceDetailsData);
  }

  // To Get Enterprise Data
  enterprises(enterpriseData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'enterprises', enterpriseData);
  }

  // To Get Clients Data
  clients(clientData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'clients', clientData);
  }

  // To Get Sectors Data
  sectors(sectorData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'sectors', sectorData);
  }

  // To Get static List Data -- STATES, COUNTRIES, UOMS
  staticLists(staticListData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'staticlists', staticListData);
  }


  //  *******************************  PRODUCTS TAB **************************
  // To Post product
  product(productData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'product', productData);
  }

  // To Get Product Categories Data
  categories(categoryData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'categories', categoryData);
  }

  // To Get products Data
  products(productData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'products', productData);
  }


  //  *******************************  ASSETS TAB **************************
  // To Post Asset
  asset(assetData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'asset', assetData);
  }

  // To Get Assets Data
  assets(assetData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'assets', assetData);
  }


  //  *******************************  UDYAM DETAILS TAB **************************
  // To Get Udyam Data
  udyams(udyamData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'udyams', udyamData);
  }

  // Category Request
  categoryRequest(categoryRequestData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'categoryrequest', categoryRequestData);
  }

  // Submit Consent
  submitConsent(data: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + "submitconsent", data);
  }

  // To Get Appuser Udyam Data
  appUserUdyams(data: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + "appuserudyams", data);
  }

  // To Post Contact Person Details
  enterpriseContactDetail(contactData: any): Observable<any> {
    return this.http.post(API_PROFILE_URL + 'enterprisecontactdetail', contactData);
  }
}
