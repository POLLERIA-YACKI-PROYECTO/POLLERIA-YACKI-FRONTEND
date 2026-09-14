// src/app/core/services/pedido-cliente.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PedidoClienteService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/pedidos-cliente`;

  // Headers con token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Headers para archivos (sin Content-Type, el navegador lo pone)
  private getMultipartHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  // ============================================
  // OBTENER
  // ============================================
  obtenerTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  obtenerPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendientes`, { headers: this.getHeaders() });
  }

  obtenerPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`, { headers: this.getHeaders() });
  }

  obtenerPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // ============================================
  // CREAR PEDIDO
  // ============================================
  crearPedido(pedido: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, pedido, { headers: this.getHeaders() });
  }

  // ============================================
  // SUBIR COMPROBANTE
  // ============================================
  subirComprobante(id: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('comprobante', archivo);
    return this.http.post<any>(
      `${this.apiUrl}/${id}/comprobante`,
      formData,
      { headers: this.getMultipartHeaders() }
    );
  }

  // ============================================
  // CONFIRMAR PAGO (ADMIN)
  // ============================================
  confirmarPago(id: number, tipoEntrega?: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/confirmar-pago`,
      { tipo_entrega: tipoEntrega || null },
      { headers: this.getHeaders() }
    );
  }

  // ============================================
  // RECHAZAR PAGO (ADMIN)
  // ============================================
  rechazarPago(id: number, motivo: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/rechazar-pago`,
      { motivo },
      { headers: this.getHeaders() }
    );
  }

  // ============================================
  // ACTUALIZAR ESTADO
  // ============================================
  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/estado`,
      { estado },
      { headers: this.getHeaders() }
    );
  }

  // ============================================
  // ELIMINAR
  // ============================================
  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}