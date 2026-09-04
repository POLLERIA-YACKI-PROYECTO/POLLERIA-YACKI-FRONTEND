// src/app/core/services/producto.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
// ✅ CORREGIDO: ProductCategory añadido a interfaces
import { ProductCategory, Product } from '../models/interfaces';

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

  // ==========================================
  // --- FLUJO PÚBLICO (CLIENTE / MENÚ) ---
  // ==========================================

  obtenerMenuPublico(): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>(`${environment.apiUrl}/products`);
  }

  listCategories(): Observable<ProductCategory[]> {
    return this.obtenerMenuPublico();
  }

  buscarProductos(termino: string, productos: any[]): any[] {
    if (!termino || termino.trim() === '') {
      return productos;
    }

    const terminoLower = termino.toLowerCase().trim();
    
    return productos.filter(producto => {
      const nombreMatch = producto.nombre?.toLowerCase().includes(terminoLower) || producto.name?.toLowerCase().includes(terminoLower);
      const categoriaMatch = producto.categoria_nombre?.toLowerCase().includes(terminoLower) || producto.category?.toLowerCase().includes(terminoLower);
      const precioMatch = producto.precio?.toString().includes(terminoLower) || producto.price?.toString().includes(terminoLower);
      const idMatch = producto.id?.toString().includes(terminoLower);
      
      return nombreMatch || categoriaMatch || precioMatch || idMatch;
    });
  }

  // ==========================================
  // --- MÓDULO ADMINISTRATIVO / MESERO ---
  // ==========================================

  obtenerProductos(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  obtenerPorCategoria(categoriaId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/categoria/${categoriaId}`, { 
      headers: this.getHeaders() 
    });
  }

  obtenerProducto(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  crearProducto(producto: any): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, producto, { headers: this.getHeaders() });
  }

  actualizarProducto(id: number, producto: any): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, producto, { headers: this.getHeaders() });
  }

  toggleDisponible(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle`, {}, { headers: this.getHeaders() });
  }

  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}