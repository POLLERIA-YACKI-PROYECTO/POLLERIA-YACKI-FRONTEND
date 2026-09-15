// src/app/core/services/descargo.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class DescargoService extends BaseApiService {
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/descargos`;

  constructor(http: HttpClient) {
    super(http);
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  obtenerDescargos(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(this.apiUrl, {
      ttl: 60 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  obtenerDescargo(id: number): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/${id}`, {
      ttl: 60 * 1000,
      headers: this.getHeaders(),
    });
  }

  crearDescargo(descargo: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('POST', this.apiUrl, descargo, this.getHeaders());
  }

  actualizarDescargo(id: number, descargo: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}`, descargo, this.getHeaders());
  }

  eliminarDescargo(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('DELETE', `${this.apiUrl}/${id}`, null, this.getHeaders());
  }

  limpiarCacheDescargos(): void {
    this.limpiarCache(this.apiUrl);
  }
}