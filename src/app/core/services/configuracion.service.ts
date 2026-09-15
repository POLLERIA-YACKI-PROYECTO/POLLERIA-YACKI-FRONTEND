// src/app/core/services/configuracion.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService extends BaseApiService {
  private apiUrl = `${environment.apiUrl}/configuracion`;

  constructor(http: HttpClient) {
    super(http);
  }

  obtenerConfiguracion(forceRefresh = false): Observable<any> {
    return this.getCached<any>(this.apiUrl, {
      ttl: 10 * 60 * 1000,
      forceRefresh,
    });
  }

  actualizarConfiguracion(clave: string, valor: string): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${clave}`, { valor });
  }

  limpiarCacheConfiguracion(): void {
    this.limpiarCache(this.apiUrl);
  }
}