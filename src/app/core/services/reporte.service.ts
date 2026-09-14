// src/app/core/services/reporte.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reportes`;

  // ============================================
  // REPORTE GENERAL DE VENTAS
  // ============================================
  getReporteVentas(fechaInicio: string, fechaFin: string): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get(`${this.apiUrl}/ventas`, { params });
  }

  // ============================================
  // REPORTE DIARIO DE CAJERO
  // ============================================
  getReporteDiarioCajero(fecha: string): Observable<any> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get(`${this.apiUrl}/diario-cajero`, { params });
  }

  // ============================================
  // REPORTE POR MESERO
  // ============================================
  getReporteVentasPorMesero(
    fechaInicio: string,
    fechaFin: string,
    usuarioId?: number
  ): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    if (usuarioId) {
      params = params.set('usuarioId', usuarioId.toString());
    }

    return this.http.get(`${this.apiUrl}/ventas-mesero`, { params });
  }

  // ============================================
  // ✅ NUEVO: REPORTE SEMANAL
  // ============================================
  getReporteSemanal(fechaInicio: string, fechaFin: string): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get(`${this.apiUrl}/semanal`, { params });
  }

  // ============================================
  // ✅ NUEVO: REPORTE POR CLIENTE
  // ============================================
  getReportePorCliente(fechaInicio: string, fechaFin: string): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get(`${this.apiUrl}/por-cliente`, { params });
  }

  // ============================================
  // ✅ NUEVO: REPORTE MOTORIZADA
  // ============================================
  getReporteMotorizada(fechaInicio: string, fechaFin: string): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get(`${this.apiUrl}/motorizada`, { params });
  }
}