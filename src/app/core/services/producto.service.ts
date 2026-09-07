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
  private apiUrl = `${environment.apiUrl}/api/productos`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ============================================
  // ✅ PÚBLICO - Sin autenticación
  // ============================================
  
  obtenerProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  obtenerProductosDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/disponibles`);
  }

  obtenerPorCategoria(categoriaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categoria/${categoriaId}`);
  }

  obtenerProducto(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // ============================================
  // 🔒 REQUIERE AUTENTICACIÓN - Admin
  // ============================================
  
  // ✅ Crear producto con imagen (FormData)
  crearProductoConImagen(formData: FormData): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
    return this.http.post(this.apiUrl, formData, { headers });
  }

  // ✅ Actualizar producto con imagen (FormData)
  actualizarProductoConImagen(id: number, formData: FormData): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
    return this.http.put(`${this.apiUrl}/${id}`, formData, { headers });
  }

  // ✅ Actualizar SOLO la imagen
  actualizarImagen(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', file);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
    return this.http.patch(`${this.apiUrl}/${id}/imagen`, formData, { headers });
  }

  // ✅ Restaurar imagen por defecto
  restaurarImagenDefault(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/restore-image`, {}, { 
      headers: this.getHeaders() 
    });
  }

  // ✅ Eliminar imagen (solo para compatibilidad, en realidad restaura la default)
  eliminarImagen(id: number): Observable<any> {
    return this.restaurarImagenDefault(id);
  }

  // ✅ Actualizar producto (sin imagen)
  actualizarProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, producto, { headers: this.getHeaders() });
  }

  // ✅ Crear producto (sin imagen)
  crearProducto(producto: any): Observable<any> {
    return this.http.post(this.apiUrl, producto, { headers: this.getHeaders() });
  }

  toggleDisponible(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle`, {}, { headers: this.getHeaders() });
  }

  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // ============================================
  // 🖼️ UTILIDADES DE IMAGEN
  // ============================================
  
  // ✅ Obtener URL de la imagen - CORREGIDO
  getImagenUrl(imagen: string | null): string {
    if (!imagen) return `${environment.apiUrl}/uploads/productos/imagen.jpg`;
    if (imagen.startsWith('http')) return imagen;
    if (imagen.startsWith('assets/')) return imagen;
    // ✅ URL correcta: http://localhost:3000/uploads/productos/imagen.jpg
    return `${environment.apiUrl}/uploads/productos/${imagen}`;
  }

  // ✅ Verificar si es la imagen por defecto
  esImagenDefault(imagen: string | null): boolean {
    return !imagen || imagen === 'imagen.jpg';
  }

  // ✅ Buscar productos (frontend)
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
}