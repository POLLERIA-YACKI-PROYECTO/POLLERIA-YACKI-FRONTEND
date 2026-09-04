
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ProductCategory, Product } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = `${environment.apiUrl}/productos`;

  /**
   * Genera los encabezados con token para operaciones administrativas
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==========================================
  // --- FLUSO PÚBLICO (CLIENTE / MENÚ) ---
  // ==========================================

  /**
   * Obtiene la carta agrupada por categorías para la vista del cliente
   */
  obtenerMenuPublico(): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>(`${environment.apiUrl}/products`);
  }

  /**
   * Alias de compatibilidad para el servicio de catálogo en inglés
   */
  listCategories(): Observable<ProductCategory[]> {
    return this.obtenerMenuPublico();
  }

  /**
   * Filtro de productos local en cliente/mesero por término
   */
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

  /**
   * Obtener lista plana de productos
   */
  obtenerProductos(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  /**
   * Obtener productos filtrados por ID de categoría
   */
  obtenerPorCategoria(categoriaId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/categoria/${categoriaId}`, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * Obtener el detalle de un producto por ID
   */
  obtenerProducto(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Crear nuevo producto en la carta
   */
  crearProducto(producto: any): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, producto, { headers: this.getHeaders() });
  }

  /**
   * Actualizar datos de un producto
   */
  actualizarProducto(id: number, producto: any): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, producto, { headers: this.getHeaders() });
  }

  /**
   * Cambiar disponibilidad rápida (Disponible/Agotado)
   */
  toggleDisponible(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle`, {}, { headers: this.getHeaders() });
  }

  /**
   * Eliminar producto del inventario
   */
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}