// src/app/core/services/venta.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class VentaService extends BaseApiService {
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/ventas`;

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

  // ============================================
  // GET
  // ============================================
  obtenerVentas(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(this.apiUrl, {
      ttl: 30 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  obtenerVenta(id: number): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/${id}`, {
      ttl: 30 * 1000,
      headers: this.getHeaders(),
    });
  }

  obtenerVentasHoy(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/hoy`, {
      ttl: 30 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  // ============================================
  // MUTACIONES
  // ============================================
  crearVenta(venta: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('POST', this.apiUrl, venta, this.getHeaders());
  }

  actualizarVenta(id: number, venta: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}`, venta, this.getHeaders());
  }

  eliminarVenta(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('DELETE', `${this.apiUrl}/${id}`, null, this.getHeaders());
  }

  // ============================================
  // CACHÉ
  // ============================================
  limpiarCacheVentas(): void {
    this.limpiarCache(this.apiUrl);
  }
}