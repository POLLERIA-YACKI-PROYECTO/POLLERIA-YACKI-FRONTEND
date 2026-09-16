// src/app/core/services/pedido-cliente.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class PedidoClienteService extends BaseApiService {
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/pedidos-cliente`;

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
  // GET
  // ============================================
  obtenerTodos(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(this.apiUrl, {
      ttl: 60 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  obtenerPendientes(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/pendientes`, {
      ttl: 30 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  obtenerPorCliente(clienteId: number): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/cliente/${clienteId}`, {
      ttl: 60 * 1000,
      headers: this.getHeaders(),
    });
  }

  obtenerPorId(id: number): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/${id}`, {
      ttl: 60 * 1000,
      headers: this.getHeaders(),
    });
  }

  // ============================================
  // MUTACIONES
  // ============================================
  crearPedido(pedido: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('POST', this.apiUrl, pedido, this.getHeaders());
  }

  subirComprobante(id: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('comprobante', archivo);
    this.limpiarCache(this.apiUrl);
    return this.mutate('POST', `${this.apiUrl}/${id}/comprobante`, formData, this.getMultipartHeaders());
  }

  confirmarPago(id: number, tipoEntrega?: string): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate(
      'PUT',
      `${this.apiUrl}/${id}/confirmar-pago`,
      { tipo_entrega: tipoEntrega || null },
      this.getHeaders()
    );
  }

  rechazarPago(id: number, motivo: string): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}/rechazar-pago`, { motivo }, this.getHeaders());
  }

  actualizarEstado(id: number, estado: string): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}/estado`, { estado }, this.getHeaders());
  }

  // ✅ ELIMINAR PEDIDO
  eliminarPedido(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('DELETE', `${this.apiUrl}/${id}`, null, this.getHeaders());
  }

  // Alias por compatibilidad
  eliminar(id: number): Observable<any> {
    return this.eliminarPedido(id);
  }

  limpiarCachePedidos(): void {
    this.limpiarCache(this.apiUrl);
  }
}