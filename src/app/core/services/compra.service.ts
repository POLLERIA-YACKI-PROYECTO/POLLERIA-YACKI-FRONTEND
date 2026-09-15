// src/app/core/services/compra.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class CompraService extends BaseApiService {
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/compras`;

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

  obtenerCompras(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(this.apiUrl, {
      ttl: 60 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  obtenerCompra(id: number): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/${id}`, {
      ttl: 60 * 1000,
      headers: this.getHeaders(),
    });
  }

  crearCompra(compra: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('POST', this.apiUrl, compra, this.getHeaders());
  }

  actualizarCompra(id: number, compra: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}`, compra, this.getHeaders());
  }

  eliminarCompra(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('DELETE', `${this.apiUrl}/${id}`, null, this.getHeaders());
  }

  limpiarCacheCompras(): void {
    this.limpiarCache(this.apiUrl);
  }
}