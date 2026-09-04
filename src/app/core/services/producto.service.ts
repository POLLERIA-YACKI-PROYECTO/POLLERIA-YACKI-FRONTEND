// src/app/core/services/producto.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/productos`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ PÚBLICO - Sin autenticación
  obtenerProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // ✅ PÚBLICO - Sin autenticación
  obtenerProductosDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/disponibles`);
  }

  // ✅ PÚBLICO - Sin autenticación
  obtenerPorCategoria(categoriaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categoria/${categoriaId}`);
  }

  // ✅ PÚBLICO - Sin autenticación
  obtenerProducto(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Buscar productos por término (frontend)
  buscarProductos(termino: string, productos: any[]): any[] {
    if (!termino || termino.trim() === '') {
      return productos;
    }

    const terminoLower = termino.toLowerCase().trim();
    
    return productos.filter(producto => {
      const nombreMatch = producto.nombre?.toLowerCase().includes(terminoLower) || false;
      const categoriaMatch = producto.categoria_nombre?.toLowerCase().includes(terminoLower) || false;
      const precioMatch = producto.precio?.toString().includes(terminoLower) || false;
      const idMatch = producto.id?.toString().includes(terminoLower) || false;
      const descripcionMatch = producto.descripcion?.toLowerCase().includes(terminoLower) || false;
      
      return nombreMatch || categoriaMatch || precioMatch || idMatch || descripcionMatch;
    });
  }

  // 🔒 REQUIERE AUTENTICACIÓN
  crearProducto(producto: any): Observable<any> {
    return this.http.post(this.apiUrl, producto, { headers: this.getHeaders() });
  }

  // 🔒 REQUIERE AUTENTICACIÓN
  actualizarProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, producto, { headers: this.getHeaders() });
  }

  // 🔒 REQUIERE AUTENTICACIÓN
  toggleDisponible(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle`, {}, { headers: this.getHeaders() });
  }

  // 🔒 REQUIERE AUTENTICACIÓN
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}