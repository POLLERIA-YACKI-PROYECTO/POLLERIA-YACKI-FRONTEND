// src/app/core/services/producto.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class ProductoService extends BaseApiService {
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/productos`;
  private backendUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(http: HttpClient) {
    super(http);
  }

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

  // GET
  obtenerProductos(forceRefresh = false): Observable<any[]> {
    return this.getCached<any[]>(this.apiUrl, { ttl: 5 * 60 * 1000, forceRefresh });
  }

  obtenerProductosDisponibles(): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/disponibles`, { ttl: 5 * 60 * 1000 });
  }

  obtenerPorCategoria(categoriaId: number): Observable<any[]> {
    return this.getCached<any[]>(`${this.apiUrl}/categoria/${categoriaId}`, { ttl: 5 * 60 * 1000 });
  }

  obtenerProducto(id: number): Observable<any> {
    return this.getCached<any>(`${this.apiUrl}/${id}`, { ttl: 5 * 60 * 1000 });
  }

  // MUTACIONES
  crearProductoConImagen(formData: FormData): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('POST', this.apiUrl, formData, this.getMultipartHeaders());
  }

  actualizarProductoConImagen(id: number, formData: FormData): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}`, formData, this.getMultipartHeaders());
  }

  actualizarImagen(id: number, file: File): Observable<any> {
    this.limpiarCache(this.apiUrl);
    const formData = new FormData();
    formData.append('imagen', file);
    return this.mutate('PATCH', `${this.apiUrl}/${id}/imagen`, formData, this.getMultipartHeaders());
  }

  restaurarImagenDefault(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PATCH', `${this.apiUrl}/${id}/restore-image`, {}, this.getHeaders());
  }

  eliminarImagen(id: number): Observable<any> {
    return this.restaurarImagenDefault(id);
  }

  actualizarProducto(id: number, producto: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PUT', `${this.apiUrl}/${id}`, producto, this.getHeaders());
  }

  crearProducto(producto: any): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('POST', this.apiUrl, producto, this.getHeaders());
  }

  toggleDisponible(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('PATCH', `${this.apiUrl}/${id}/toggle`, {}, this.getHeaders());
  }

  eliminarProducto(id: number): Observable<any> {
    this.limpiarCache(this.apiUrl);
    return this.mutate('DELETE', `${this.apiUrl}/${id}`, null, this.getHeaders());
  }

  // CACHÉ
  limpiarCacheProductos(): void {
    this.limpiarCache(this.apiUrl);
  }

  // ============================================
  // IMÁGENES
  // ============================================
  /**
   * Genera la URL de la imagen de un producto.
   *
   * @param imagen  Nombre del archivo (ej: "producto-xxx.jpg")
   * @param version Opcional. Timestamp/versión para forzar recarga
   *                cuando la imagen cambia en el servidor.
   *                Se agrega como query param `?v=<version>`.
   */
  getImagenUrl(imagen: string | null | undefined, version?: number | string): string {
    const valor = String(imagen || '').trim();

    let url: string;

    if (!valor || valor === 'imagen.jpg') {
      url = `${this.backendUrl}/uploads/productos/imagen.jpg`;
    } else if (
      valor.startsWith('http://') ||
      valor.startsWith('https://') ||
      valor.startsWith('data:') ||
      valor.startsWith('blob:')
    ) {
      url = valor;
    } else if (valor.startsWith('/uploads/')) {
      url = `${this.backendUrl}${valor}`;
    } else if (valor.startsWith('uploads/')) {
      url = `${this.backendUrl}/${valor}`;
    } else if (valor.startsWith('/assets/') || valor.startsWith('assets/')) {
      url = valor;
    } else {
      url = `${this.backendUrl}/uploads/productos/${encodeURIComponent(valor)}`;
    }

    // Cache busting: agregar ?v=<version>
    if (version !== undefined && version !== null && version !== '') {
      const separador = url.includes('?') ? '&' : '?';
      url = `${url}${separador}v=${encodeURIComponent(String(version))}`;
    }

    return url;
  }

  esImagenDefault(imagen: string | null | undefined): boolean {
    return !imagen || imagen === 'imagen.jpg';
  }

  buscarProductos(termino: string, productos: any[]): any[] {
    if (!termino || termino.trim() === '') return productos;
    const t = termino.toLowerCase().trim();
    return productos.filter((p) => {
      return (
        p.nombre?.toLowerCase().includes(t) ||
        p.categoria_nombre?.toLowerCase().includes(t) ||
        p.precio?.toString().includes(t) ||
        p.id?.toString().includes(t) ||
        p.descripcion?.toLowerCase().includes(t)
      );
    });
  }
}