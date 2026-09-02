// src\app\core\services\pedido.service.ts
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

  crearPedido(pedido: any): Observable<any> {
    return this.http.post(this.apiUrl, pedido, { headers: this.getHeaders() });
  }

  cambiarEstado(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/estado`, { estado }, { headers: this.getHeaders() });
  }

  // ✅ MÉTODO PARA MARCAR PAGADO
  marcarPagado(id: number, metodo_pago: string): Observable<any> {
    console.log('📤 Enviando pago - Pedido ID:', id, 'Método:', metodo_pago);
    return this.http.put(`${this.apiUrl}/${id}/pagar`, { metodo_pago }, { headers: this.getHeaders() });
  }

  eliminarPedido(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}