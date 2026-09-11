// src/app/core/services/pedido.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/pedidos`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ Obtener TODOS los pedidos del usuario autenticado
  obtenerPedidos(): Observable<any[]> {
    console.log('📤 Solicitando todos los pedidos');
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  obtenerPedidosPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendientes`, { headers: this.getHeaders() });
  }

  obtenerPedidosPagados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pagados`, { headers: this.getHeaders() });
  }

  // ✅ OBTENER PEDIDOS ENTREGADOS DEL MESERO
  obtenerPedidosPagadosMesero(): Observable<any[]> {
    console.log('📤 Solicitando pedidos entregados del mesero');
    return this.http.get<any[]>(`${this.apiUrl}/entregados/mesero`, { 
      headers: this.getHeaders() 
    });
  }

  obtenerPedidosPorTipo(tipo: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tipo/${tipo}`, { headers: this.getHeaders() });
  }

  obtenerPedido(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  crearPedido(pedido: any): Observable<any> {
    return this.http.post(this.apiUrl, pedido, { headers: this.getHeaders() });
  }

  crearPedidoCliente(pedido: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/cliente/pedidos`, pedido, { headers: this.getHeaders() });
  }

  obtenerHistorialCliente(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/cliente/pedidos`, { headers: this.getHeaders() });
  }

  cambiarEstado(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/estado`, { estado }, { headers: this.getHeaders() });
  }

  marcarPagado(id: number, metodo_pago: string): Observable<any> {
    console.log('📤 Enviando pago - Pedido ID:', id, 'Método:', metodo_pago);
    return this.http.patch(`${this.apiUrl}/${id}/pagar`, { metodo_pago }, { headers: this.getHeaders() });
  }

  eliminarPedido(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}