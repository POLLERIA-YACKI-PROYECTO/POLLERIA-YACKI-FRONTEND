// src/app/core/services/categoria.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class CategoriaService extends BaseApiService {
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/categorias`;

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

  obtenerCategorias(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(this.apiUrl, { ttl: 10 * 60 * 1000, forceRefresh });
  }

  obtenerCategoriasActivas(): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/activas`, { ttl: 10 * 60 * 1000 });
  }

  obtenerCategoria(id: number): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/${id}`, { ttl: 10 * 60 * 1000 });
  }

  obtenerProductosPorCategoria(id: number): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/${id}/productos`, { ttl: 5 * 60 * 1000 });
  }

  crearCategoria(categoria: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('POST', this.apiUrl, categoria, this.getHeaders());
  }

  actualizarCategoria(id: number, categoria: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}`, categoria, this.getHeaders());
  }

  eliminarCategoria(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('DELETE', `${this.apiUrl}/${id}`, null, this.getHeaders());
  }

  limpiarCacheCategorias(): void {
    this.limpiarCache(this.apiUrl);
  }
}