// core/services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id: number;
  dni: string;
  nombre: string;
  rol: string;
  telefono?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioActual = signal<Usuario | null>(null);
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {
    // Cargar usuario al iniciar la aplicación
    this.cargarUsuarioDesdeStorage();
  }

  private cargarUsuarioDesdeStorage(): void {
    try {
      const stored = localStorage.getItem('usuario');
      const token = localStorage.getItem('token');
      
      console.log('AuthService - Cargando desde localStorage - Usuario:', stored);
      console.log('AuthService - Cargando desde localStorage - Token:', token);
      
      if (stored && token) {
        const usuario = JSON.parse(stored);
        this.usuarioActual.set(usuario);
        console.log('AuthService - Usuario cargado correctamente:', usuario);
      } else {
        console.log('AuthService - No hay usuario o token en localStorage');
      }
    } catch (error) {
      console.error('AuthService - Error al cargar usuario:', error);
      localStorage.removeItem('usuario');
      localStorage.removeItem('token');
    }
  }

  // Login para meseros
  loginMesero(dni: string): Observable<Usuario> {
    console.log('AuthService - Intentando login mesero con DNI:', dni);
    
    return this.http.post<any>(`${this.apiUrl}/login-mesero`, { dni }).pipe(
      tap(response => {
        console.log('AuthService - Respuesta del servidor:', response);
      }),
      map(response => {
        // Crear objeto usuario
        const usuario: Usuario = {
          id: response.id,
          dni: response.dni,
          nombre: response.nombre,
          rol: response.rol,
          telefono: response.telefono || '',
          email: response.email || ''
        };
        
        console.log('AuthService - Usuario creado:', usuario);
        
        // Guardar token
        if (response.token) {
          console.log('AuthService - Guardando token:', response.token);
          localStorage.setItem('token', response.token);
        } else {
          console.error('AuthService - No se recibió token del servidor');
        }
        
        // Guardar usuario
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.usuarioActual.set(usuario);
        
        console.log('AuthService - Usuario guardado en localStorage:', usuario);
        console.log('AuthService - Token guardado en localStorage:', localStorage.getItem('token'));
        
        return usuario;
      }),
      catchError((error) => {
        console.error('AuthService - Error en login:', error);
        return throwError(() => error.error || { error: 'Error al iniciar sesión' });
      })
    );
  }

  // Login para admin
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

  logout(): void {
    console.log('AuthService - Cerrando sesión');
    this.usuarioActual.set(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  }

  getUsuarioActual(): Usuario | null {
    const usuario = this.usuarioActual();
    console.log('AuthService - getUsuarioActual:', usuario);
    return usuario;
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('AuthService - getToken:', token);
    return token;
  }

  isAuthenticated(): boolean {
    const usuario = this.usuarioActual();
    const token = this.getToken();
    const autenticado = usuario !== null && token !== null;
    console.log('AuthService - isAuthenticated:', autenticado);
    return autenticado;
  }
}