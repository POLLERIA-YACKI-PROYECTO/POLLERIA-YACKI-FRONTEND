// src/app/core/services/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   *  Obtiene resumen unificado:
   * - Ventas tradicionales (mesero/cajero)
   * - Pedidos web confirmados por el admin
   */
  obtenerResumenUnificado(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/resumen-unificado`,
      { headers: this.getHeaders() }
    );
  }
}