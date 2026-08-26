// reporte.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private apiUrl = 'http://localhost:3000/api/reportes';

  constructor(private http: HttpClient) {}

  getReporteVentas(fechaInicio: string, fechaFin: string): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get(`${this.apiUrl}/ventas`, { params });
  }

  getReporteDiarioCajero(fecha: string): Observable<any> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get(`${this.apiUrl}/diario-cajero`, { params });
  }

  // Nuevo: Reporte de ventas por mesero
  getReporteVentasPorMesero(fechaInicio: string, fechaFin: string, usuarioId?: number): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    if (usuarioId) {
      params = params.set('usuarioId', usuarioId.toString());
    }
    return this.http.get(`${this.apiUrl}/ventas-mesero`, { params });
  }
}