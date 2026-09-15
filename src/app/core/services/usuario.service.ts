// src/app/core/services/usuario.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class UsuarioService extends BaseApiService {
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/usuarios`;

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

  obtenerUsuarios(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(this.apiUrl, {
      ttl: 60 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  obtenerUsuario(id: number): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/${id}`, {
      ttl: 60 * 1000,
      headers: this.getHeaders(),
    });
  }

  obtenerPorRol(rol: string): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/rol/${rol}`, {
      ttl: 60 * 1000,
      headers: this.getHeaders(),
    });
  }

  crearUsuario(usuario: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('POST', this.apiUrl, usuario, this.getHeaders());
  }

  actualizarUsuario(id: number, usuario: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}`, usuario, this.getHeaders());
  }

  eliminarUsuario(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('DELETE', `${this.apiUrl}/${id}`, null, this.getHeaders());
  }

  toggleActivo(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PATCH', `${this.apiUrl}/${id}/toggle`, {}, this.getHeaders());
  }

  limpiarCacheUsuarios(): void {
    this.limpiarCache(this.apiUrl);
  }
}