// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginClienteRequest {
  email: string;
  password: string;
}

export interface RegisterClienteRequest {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  password: string;
}

export interface ClienteResponse {
  success: boolean;
  cliente: any;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';

  private readonly tokenKey = 'auth_token';
  private readonly usuarioKey = 'usuario_actual';

  // ============================================
  // GUARDAR SESIÓN
  // ============================================
  private guardarSesion(usuario: any, token: string, tipo: 'cliente' | 'admin' | 'mesero' = 'cliente'): void {
    // Normalizar: siempre agregamos tipo y rol para compatibilidad con guards
    const usuarioNormalizado = {
      ...usuario,
      tipo: usuario.tipo || tipo,
      rol: usuario.rol || tipo
    };

    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.usuarioKey, JSON.stringify(usuarioNormalizado));

    console.log('🔐 Sesión guardada:', {
      tipo: usuarioNormalizado.tipo,
      rol: usuarioNormalizado.rol,
      nombre: usuarioNormalizado.nombre
    });
  }

  // ============================================
  // LOGIN ADMIN (por DNI)
  // ============================================
  loginAdmin(dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-admin`, { dni }).pipe(
      tap((response: any) => {
        if (response?.token) {
          this.guardarSesion(response, response.token, 'admin');
        }
      })
    );
  }

  // ============================================
  // LOGIN MESERO (por DNI)
  // ============================================
  loginMesero(dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-mesero`, { dni }).pipe(
      tap((response: any) => {
        if (response?.token) {
          this.guardarSesion(response, response.token, 'mesero');
        }
      })
    );
  }

  // ============================================
  // LOGIN CLIENTE (email + password)
  // ============================================
  loginCliente(payload: LoginClienteRequest): Observable<ClienteResponse> {
    return this.http
      .post<ClienteResponse>(`${this.apiUrl}/cliente/login`, payload)
      .pipe(
        tap((response) => {
          if (response?.token && response?.cliente) {
            this.guardarSesion(response.cliente, response.token, 'cliente');
          }
        })
      );
  }

  // ============================================
  // REGISTRO CLIENTE
  // ============================================
  registerCliente(payload: RegisterClienteRequest): Observable<ClienteResponse> {
    return this.http
      .post<ClienteResponse>(`${this.apiUrl}/cliente/register`, payload)
      .pipe(
        tap((response) => {
          if (response?.token && response?.cliente) {
            this.guardarSesion(response.cliente, response.token, 'cliente');
          }
        })
      );
  }

  // ============================================
  // TOKEN
  // ============================================
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // ============================================
  // USUARIO ACTUAL
  // ============================================
  getUsuarioActual(): any {
    const raw = localStorage.getItem(this.usuarioKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // ============================================
  // LOGOUT
  // ============================================
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    console.log('🚪 Sesión cerrada');
  }

  // ============================================
  // VERIFICACIONES
  // ============================================
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUsuarioActual();
  }

  isCliente(): boolean {
    const u = this.getUsuarioActual();
    if (!u) return false;
    return u.tipo === 'cliente' || u.rol === 'cliente';
  }

  isAdmin(): boolean {
    const u = this.getUsuarioActual();
    if (!u) return false;
    return u.rol === 'admin' || u.rol === 'cajero';
  }

  isMesero(): boolean {
    const u = this.getUsuarioActual();
    return !!u && u.rol === 'mesero';
  }

  // ============================================
  // HELPERS
  // ============================================
  getClienteId(): number | null {
    return this.getUsuarioActual()?.id ?? null;
  }

  getNombreCompleto(): string {
    const u = this.getUsuarioActual();
    if (!u) return '';
    return [u.nombre, u.apellido].filter(Boolean).join(' ');
  }
}