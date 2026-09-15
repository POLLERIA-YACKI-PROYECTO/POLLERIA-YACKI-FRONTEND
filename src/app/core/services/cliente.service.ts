// src/app/core/services/cliente.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class ClienteService extends BaseApiService {
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/clientes`;

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

  obtenerClientes(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(this.apiUrl, {
      ttl: 60 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  obtenerCliente(id: number): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/${id}`, {
      ttl: 60 * 1000,
      headers: this.getHeaders(),
    });
  }

  buscarClientes(termino: string): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/buscar?q=${termino}`, {
      ttl: 30 * 1000,
      headers: this.getHeaders(),
    });
  }

  crearCliente(cliente: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('POST', this.apiUrl, cliente, this.getHeaders());
  }

  actualizarCliente(id: number, cliente: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}`, cliente, this.getHeaders());
  }

  eliminarCliente(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('DELETE', `${this.apiUrl}/${id}`, null, this.getHeaders());
  }

  limpiarCacheClientes(): void {
    this.limpiarCache(this.apiUrl);
  }
}