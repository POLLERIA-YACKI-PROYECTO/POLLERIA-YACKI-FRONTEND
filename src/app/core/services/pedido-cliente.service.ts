// src/app/core/services/pedido-cliente.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoClienteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pedidos-cliente`;

  // ============================================
  // OBTENER
  // ============================================
  obtenerTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  obtenerPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendientes`);
  }

  obtenerPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  obtenerPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // ============================================
  // CREAR PEDIDO
  // ============================================
  crearPedido(pedido: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, pedido);
  }

  // ============================================
  // ✅ SUBIR COMPROBANTE
  // ============================================
  subirComprobante(id: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('comprobante', archivo);
    return this.http.post<any>(`${this.apiUrl}/${id}/comprobante`, formData);
  }

  // ============================================
  // ✅ CONFIRMAR PAGO (ADMIN)
  // - tipoEntrega opcional: permite al admin cambiar Local/Motorizado
  // ============================================
  confirmarPago(id: number, tipoEntrega?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/confirmar-pago`, {
      tipo_entrega: tipoEntrega || null
    });
  }

  // ============================================
  // ✅ RECHAZAR PAGO (ADMIN)
  // ============================================
  rechazarPago(id: number, motivo: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/rechazar-pago`, { motivo });
  }

  // ============================================
  // ACTUALIZAR ESTADO
  // ============================================
  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  // ============================================
  // ELIMINAR
  // ============================================
  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}