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
  private adminApiUrl = `${environment.apiUrl}/admin/reports`;

  // ==========================================
  // --- MÉTODOS DEL CLONADO (PANEL ADMIN) ---
  // ==========================================

  /**
   * Obtiene el reporte general de ventas por rango de fechas
   */
  getReporteVentas(fechaInicio: string, fechaFin: string): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get(`${this.apiUrl}/ventas`, { params });
  }

  /**
   * Obtiene el resumen de ventas diario del cajero
   */
  getReporteDiarioCajero(fecha: string): Observable<any> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get(`${this.apiUrl}/diario-cajero`, { params });
  }

  /**
   * Reporte de rendimiento de ventas por mesero
   */
  getReporteVentasPorMesero(fechaInicio: string, fechaFin: string, usuarioId?: number): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    if (usuarioId) {
      params = params.set('usuarioId', usuarioId.toString());
    }
    return this.http.get(`${this.apiUrl}/ventas-mesero`, { params });
  }

  // ==========================================
  // --- MÉTODOS DE TU CÓDIGO (AVANZADOS) ---
  // ==========================================

  /**
   * Resumen diario de operaciones
   */
  dailySummary(date: string): Observable<any> {
    return this.http.get<any>(`${this.adminApiUrl}/daily-summary`, { params: { date } });
  }

  /**
   * Desglose de ingresos por método de pago (Efectivo, Yape/Plin, Tarjeta, etc.)
   */
  byPaymentMethod(from: string, to: string, channel?: string): Observable<any[]> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (channel) params = params.set('channel', channel);
    return this.http.get<any[]>(`${this.adminApiUrl}/by-payment-method`, { params });
  }

  /**
   * Filtro avanzado de pedidos por canal y responsable
   */
  filteredOrders(from: string, to: string, channel?: string, assignedTo?: string): Observable<any[]> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (channel) params = params.set('channel', channel);
    if (assignedTo) params = params.set('assignedTo', assignedTo);
    return this.http.get<any[]>(`${this.adminApiUrl}/orders`, { params });
  }

  /**
   * Realiza el cierre de caja del turno actual
   */
  closeCashRegister(): Observable<any> {
    return this.http.post<any>(`${this.adminApiUrl}/close-cash-register`, {});
  }

  /**
   * Genera el enlace directo para la descarga del reporte en formato CSV
   */
  exportCsvUrl(from: string, to: string): string {
    return `${this.adminApiUrl}/export.csv?from=${from}&to=${to}`;
  }
}