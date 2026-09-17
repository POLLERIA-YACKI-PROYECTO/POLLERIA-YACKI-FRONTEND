// src/app/core/services/configuracion.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService extends BaseApiService {
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/configuracion`;
  private backendUrl = environment.apiUrl.replace(/\/api\/?$/, '');

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

  private getMultipartHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
  }

  // ============================================
  // PÚBLICO (sin token) — para la carta cliente
  // ============================================
  obtenerPublicas(forceRefresh = false): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/publicas`, {
      ttl: 10 * 60 * 1000,
      forceRefresh,
    });
  }

  // ============================================
  // ADMIN (con token)
  // ============================================
  obtenerConfiguracion(forceRefresh = false): Observable<any> {
    return this.getCached<any>(this.apiUrl, {
      ttl: 60 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  actualizarConfiguracion(cambios: Record<string, any>): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', this.apiUrl, cambios, this.getHeaders());
  }

  // Subir imagen (QR)
  subirImagen(clave: string, file: File): Observable<any> {
    this.limpiarCache(this.apiUrl);
    const formData = new FormData();
    formData.append('clave', clave);
    formData.append('imagen', file);
    return this.mutate(
      'POST',
      `${this.apiUrl}/imagen`,
      formData,
      this.getMultipartHeaders()
    );
  }

  //Eliminar imagen
  eliminarImagen(clave: string): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate(
      'DELETE',
      `${this.apiUrl}/imagen/${clave}`,
      null,
      this.getHeaders()
    );
  }

  // Alias por compatibilidad con el modal anterior
  actualizar(clave: string, valor: any): Observable<any> {
    return this.actualizarConfiguracion({ [clave]: valor });
  }

  //Helper: URL pública de la imagen de configuración
  getImagenConfigUrl(
    valor: string | null | undefined,
    version?: number
  ): string {
    if (!valor || typeof valor !== 'string' || !valor.trim()) return '';
    const v = valor.trim();

    if (
      v.startsWith('http://') ||
      v.startsWith('https://') ||
      v.startsWith('data:') ||
      v.startsWith('blob:')
    ) {
      return v;
    }

    let url = `${this.backendUrl}/uploads/configuracion/${encodeURIComponent(v)}`;
    if (version) url += `?v=${version}`;
    return url;
  }

  limpiarCacheConfiguracion(): void {
    this.limpiarCache(this.apiUrl);
  }
}