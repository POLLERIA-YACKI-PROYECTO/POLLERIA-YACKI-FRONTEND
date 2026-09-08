// src/app/core/services/producto.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/productos`;
  private backendUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  private getMultipartHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
  }

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

  crearProductoConImagen(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData, { headers: this.getMultipartHeaders() });
  }

  actualizarProductoConImagen(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData, { headers: this.getMultipartHeaders() });
  }

  actualizarImagen(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', file);

    return this.http.patch(`${this.apiUrl}/${id}/imagen`, formData, {
      headers: this.getMultipartHeaders(),
    });
  }

  restaurarImagenDefault(id: number): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/restore-image`,
      {},
      { headers: this.getHeaders() },
    );
  }

  eliminarImagen(id: number): Observable<any> {
    return this.restaurarImagenDefault(id);
  }

  actualizarProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, producto, { headers: this.getHeaders() });
  }

  crearProducto(producto: any): Observable<any> {
    return this.http.post(this.apiUrl, producto, { headers: this.getHeaders() });
  }

  toggleDisponible(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle`, {}, { headers: this.getHeaders() });
  }

  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getImagenUrl(imagen: string | null | undefined): string {
    const valor = String(imagen || '').trim();

    if (!valor || valor === 'imagen.jpg') {
      return `${this.backendUrl}` + '/uploads/productos/imagen.jpg';
    }

    if (
      valor.startsWith('http://') ||
      valor.startsWith('https://') ||
      valor.startsWith('data:') ||
      valor.startsWith('blob:')
    ) {
      return valor;
    }

    if (valor.startsWith('/uploads/')) {
      return `${this.backendUrl}${valor}`;
    }

    if (valor.startsWith('uploads/')) {
      return `${this.backendUrl}/${valor}`;
    }

    if (valor.startsWith('/assets/') || valor.startsWith('assets/')) {
      return valor;
    }

    return `${this.backendUrl}` + '/uploads/productos/' + encodeURIComponent(valor);
  }

  esImagenDefault(imagen: string | null | undefined): boolean {
    return !imagen || imagen === 'imagen.jpg';
  }

  buscarProductos(termino: string, productos: any[]): any[] {
    if (!termino || termino.trim() === '') {
      return productos;
    }

    const terminoLower = termino.toLowerCase().trim();

    return productos.filter((producto) => {
      const nombreMatch = producto.nombre?.toLowerCase().includes(terminoLower) || false;
      const categoriaMatch =
        producto.categoria_nombre?.toLowerCase().includes(terminoLower) || false;
      const precioMatch = producto.precio?.toString().includes(terminoLower) || false;
      const idMatch = producto.id?.toString().includes(terminoLower) || false;
      const descripcionMatch = producto.descripcion?.toLowerCase().includes(terminoLower) || false;

      return nombreMatch || categoriaMatch || precioMatch || idMatch || descripcionMatch;
    });
  }
}
