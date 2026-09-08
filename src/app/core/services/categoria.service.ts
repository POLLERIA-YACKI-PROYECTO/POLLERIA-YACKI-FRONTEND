// src/app/core/services/categoria.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/categorias`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ PÚBLICO - Sin autenticación
  obtenerCategorias(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // ✅ PÚBLICO - Sin autenticación
  obtenerCategoriasActivas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/activas`);
  }

  // ✅ PÚBLICO - Sin autenticación
  obtenerCategoria(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // ✅ PÚBLICO - Sin autenticación
  obtenerProductosPorCategoria(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/productos`);
  }

  // 🔒 REQUIERE AUTENTICACIÓN
  crearCategoria(categoria: any): Observable<any> {
    return this.http.post(this.apiUrl, categoria, { headers: this.getHeaders() });
  }

  // 🔒 REQUIERE AUTENTICACIÓN
  actualizarCategoria(id: number, categoria: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, categoria, { headers: this.getHeaders() });
  }

  // 🔒 REQUIERE AUTENTICACIÓN
  eliminarCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}