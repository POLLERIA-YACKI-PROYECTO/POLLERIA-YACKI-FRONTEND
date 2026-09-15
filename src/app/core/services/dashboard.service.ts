// src/app/core/services/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class DashboardService extends BaseApiService {
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/dashboard`;

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

  obtenerResumenUnificado(forceRefresh = false): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/resumen-unificado`, {
      ttl: 30 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  obtenerEstadisticas(): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/estadisticas`, {
      ttl: 60 * 1000,
      headers: this.getHeaders(),
    });
  }

  refrescar(): void {
    this.limpiarCache(this.apiUrl);
  }

  limpiarCacheDashboard(): void {
    this.limpiarCache(this.apiUrl);
  }
}