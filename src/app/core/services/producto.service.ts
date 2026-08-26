// producto.service.ts (agregar método)
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

  // Obtener todos los productos
  obtenerProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Buscar productos por término
  buscarProductos(termino: string): Observable<any[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<any[]>(`${this.apiUrl}/buscar`, { 
      headers: this.getHeaders(),
      params 
    });
  }

  // Obtener productos por categoría
  obtenerPorCategoria(categoriaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categoria/${categoriaId}`, { 
      headers: this.getHeaders() 
    });
  }

  // Obtener producto por ID
  obtenerProducto(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Crear producto (Admin)
  crearProducto(producto: any): Observable<any> {
    return this.http.post(this.apiUrl, producto, { headers: this.getHeaders() });
  }

  // Actualizar producto (Admin)
  actualizarProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, producto, { headers: this.getHeaders() });
  }

  // Toggle disponible (Mesero/Admin)
  toggleDisponible(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle`, {}, { headers: this.getHeaders() });
  }

  // Eliminar producto (Admin)
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}