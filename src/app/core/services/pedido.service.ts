// src/app/core/services/pedido.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, interval, switchMap, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderStatusResponse,
  VoucherResponse,
  LiveOrder,
  OrderStatus
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = `${environment.apiUrl}/pedidos`;
  private adminApiUrl = `${environment.apiUrl}/admin/orders`;

  /**
   * Encabezados con JWT para endpoints administrativos
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==========================================
  // --- FLUSO DEL CLIENTE (MÓDULO PÚBLICO) ---
  // ==========================================

  /**
   * Crear pedido desde la web/app del cliente
   */
  crearPedido(payload: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(this.apiUrl, payload);
  }

  /**
   * Alias de compatibilidad para el flujo en inglés
   */
  createOrder(payload: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.crearPedido(payload);
  }

  /**
   * Obtener el voucher/comprobante mediante el código de orden
   */
  obtenerVoucher(orderCode: string): Observable<VoucherResponse> {
    return this.http.get<VoucherResponse>(`${this.apiUrl}/${orderCode}/voucher`);
  }

  getVoucher(orderCode: string): Observable<VoucherResponse> {
    return this.obtenerVoucher(orderCode);
  }

  /**
   * POLLING de respaldo: Consulta cada 3s el estado del pedido.
   * Se ejecuta en paralelo con WebSockets (qr-view.component.ts)
   */
  pollOrderStatus(orderCode: string, stop$: Subject<void>): Observable<OrderStatusResponse> {
    return interval(3000).pipe(
      switchMap(() => this.http.get<OrderStatusResponse>(`${this.apiUrl}/${orderCode}/status`)),
      takeUntil(stop$)
    );
  }

  // ==========================================
  // --- MÓDULO ADMINISTRATIVO / MESERO / CAJA ---
  // ==========================================

  obtenerPedidos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  obtenerPedidosPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendientes`, { headers: this.getHeaders() });
  }

  obtenerPedidosPagados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pagados`, { headers: this.getHeaders() });
  }

  obtenerPedidosPorTipo(tipo: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tipo/${tipo}`, { headers: this.getHeaders() });
  }

  obtenerPedido(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  listLiveOrders(): Observable<LiveOrder[]> {
    return this.http.get<LiveOrder[]>(`${this.adminApiUrl}/live`, { headers: this.getHeaders() });
  }

  cambiarEstado(id: number, estado: string | OrderStatus): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/estado`, { estado }, { headers: this.getHeaders() });
  }

  updateOrderStatus(id: number, status: OrderStatus): Observable<LiveOrder> {
    return this.http.patch<LiveOrder>(
      `${this.adminApiUrl}/${id}/status`, 
      { status }, 
      { headers: this.getHeaders() }
    );
  }

  marcarPagado(id: number, metodo_pago: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/pagar`, { metodo_pago }, { headers: this.getHeaders() });
  }

  reprintVoucher(id: number): Observable<{ pdfPath: string; reprintCount: number }> {
    return this.http.post<{ pdfPath: string; reprintCount: number }>(
      `${this.adminApiUrl}/${id}/reprint-voucher`,
      {},
      { headers: this.getHeaders() }
    );
  }

  eliminarPedido(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}