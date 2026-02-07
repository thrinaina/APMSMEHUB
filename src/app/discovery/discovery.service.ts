import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const API_DISCOVERY_URL = environment.apiUrl + 'api/discovery/';

@Injectable({
  providedIn: 'root'
})
export class DiscoveryService {

  constructor(
    private http: HttpClient,
  ) { }

  // To Get Public Session Token
  publicSession(): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'publicsession', {});
  }

  // To Get Enterprise Data
  enterprises(enterpriseData: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'enterprises', enterpriseData);
  }

  // To Get Clients Data
  clients(clientData: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'clients', clientData);
  }

  // To Get products Data
  products(productData: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'products', productData);
  }

  // To Get Udyam Data
  udyams(udyamData: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'udyams', udyamData);
  }

  // To Get Assets Data
  assets(assetData: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'assets', assetData);
  }

  enterpriseFilters(data: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'enterprisefilters', data);
  }

  discoveryUdyams(data: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'discoveryudyams', data);
  }

  discoveryProducts(data: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'discoveryproducts', data);
  }

  discoveryProductById(data: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'discoveryproductbyid', data);
  }

  enterprisesByCategoryId(data: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'enterprisesbycategoryid', data);
  }

  sendEnquiry(data: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'sendenquiry', data);
  }

  categories(categoryData: any): Observable<any> {
    return this.http.post(API_DISCOVERY_URL + 'categories', categoryData);
  }

}
