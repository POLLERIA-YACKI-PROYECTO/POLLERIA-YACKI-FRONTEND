// src/app/core/services/pedido.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class PedidoService extends BaseApiService {
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/pedidos`;

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

  // ============================================
  // GET
  // ============================================
  obtenerPedidos(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(this.apiUrl, {
      ttl: 2 * 60 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  obtenerPedidosPendientes(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/pendientes`, {
      ttl: 60 * 1000,
      forceRefresh,
      headers: this.getHeaders(),
    });
  }

  obtenerPedido(id: number): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/${id}`, {
      ttl: 2 * 60 * 1000,
      headers: this.getHeaders(),
    });
  }

  obtenerPorMesa(mesaId: number): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/mesa/${mesaId}`, {
      ttl: 60 * 1000,
      headers: this.getHeaders(),
    });
  }

  obtenerPedidosPagadosMesero(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/pagados-mesero`, {
      ttl: 2 * 60 * 1000,
      forceRefresh,
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

  actualizarPedido(id: number, pedido: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}`, pedido, this.getHeaders());
  }

  cambiarEstado(id: number, estado: string): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}/estado`, { estado }, this.getHeaders());
  }

  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.cambiarEstado(id, estado);
  }

  marcarPagado(id: number, metodoPago: string): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate(
      'PUT',
      `${this.apiUrl}/${id}/marcar-pagado`,
      { metodo_pago: metodoPago },
      this.getHeaders()
    );
  }

  eliminarPedido(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('DELETE', `${this.apiUrl}/${id}`, null, this.getHeaders());
  }

  // ============================================
  // CACHÉ
  // ============================================
  limpiarCachePedidos(): void {
    this.limpiarCache(this.apiUrl);
  }
}