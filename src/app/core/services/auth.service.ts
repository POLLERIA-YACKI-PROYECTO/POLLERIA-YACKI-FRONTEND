import { Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioActual = signal<Usuario | null>(null);
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {
    // Cargar usuario al iniciar
    const stored = localStorage.getItem('usuario');
    if (stored) {
      try {
        this.usuarioActual.set(JSON.parse(stored));
      } catch {
        this.usuarioActual.set(null);
      }
    }
  }

  // Login para administradores
  loginAdmin(dni: string): Observable<Usuario> {
    return this.http.post<any>(`${this.apiUrl}/login-admin`, { dni }).pipe(
      map(response => {
        const usuario: Usuario = {
          id: response.id,
          dni: response.dni,
          nombre: response.nombre,
          rol: response.rol,
          telefono: response.telefono || '',
          email: response.email || ''
        };
        
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.usuarioActual.set(usuario);
        return usuario;
      }),
      catchError((error) => {
        return throwError(() => error.error || { error: 'Error al iniciar sesión' });
      })
    );
  }

  // Login para meseros
  loginMesero(dni: string): Observable<Usuario> {
    return this.http.post<any>(`${this.apiUrl}/login-mesero`, { dni }).pipe(
      map(response => {
        const usuario: Usuario = {
          id: response.id,
          dni: response.dni,
          nombre: response.nombre,
          rol: response.rol,
          telefono: response.telefono || '',
          email: response.email || ''
        };
        
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.usuarioActual.set(usuario);
        return usuario;
      }),
      catchError((error) => {
        return throwError(() => error.error || { error: 'Error al iniciar sesión' });
      })
    );
  }

  // Login general (para compatibilidad)
  login(dni: string): Observable<Usuario> {
    return this.http.post<any>(`${this.apiUrl}/login`, { dni }).pipe(
      map(response => {
        const usuario: Usuario = {
          id: response.id,
          dni: response.dni,
          nombre: response.nombre,
          rol: response.rol,
          telefono: response.telefono || '',
          email: response.email || ''
        };
        
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.usuarioActual.set(usuario);
        return usuario;
      }),
      catchError((error) => {
        return throwError(() => error.error || { error: 'Error al iniciar sesión' });
      })
    );
  }

  logout(): void {
    this.usuarioActual.set(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  }

  getUsuarioActual(): Usuario | null {
    return this.usuarioActual();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return this.usuarioActual() !== null && this.getToken() !== null;
  }

  isAdmin(): boolean {
    const usuario = this.getUsuarioActual();
    return usuario !== null && (usuario.rol === 'admin' || usuario.rol === 'cajero');
  }

  isMesero(): boolean {
    const usuario = this.getUsuarioActual();
    return usuario !== null && usuario.rol === 'mesero';
  }
}