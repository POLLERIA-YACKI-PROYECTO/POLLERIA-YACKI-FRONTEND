// src/app/core/services/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  /**
   * ✅ Obtiene resumen unificado:
   * - Ventas tradicionales (mesero/cajero)
   * - Pedidos web confirmados por el admin
   */
  obtenerResumenUnificado(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resumen-unificado`);
  }
}