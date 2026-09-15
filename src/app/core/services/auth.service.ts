// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'auth_token';
  private readonly usuarioKey = 'usuario_actual';

  private guardarSesion(usuario: any, token: string, tipo: 'cliente' | 'admin' | 'mesero' = 'cliente'): void {
    const usuarioNormalizado = {
      ...usuario,
      tipo: usuario.tipo || tipo,
      rol: usuario.rol || tipo,
    };
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.usuarioKey, JSON.stringify(usuarioNormalizado));
  }

  loginAdmin(dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-admin`, { dni }).pipe(
      tap((response: any) => {
        if (response?.token) this.guardarSesion(response, response.token, 'admin');
      })
    );
  }

  loginMesero(dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-mesero`, { dni }).pipe(
      tap((response: any) => {
        if (response?.token) this.guardarSesion(response, response.token, 'mesero');
      })
    );
  }

  loginCliente(payload: LoginClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(`${this.apiUrl}/cliente/login`, payload).pipe(
      tap((response) => {
        if (response?.token && response?.cliente) {
          this.guardarSesion(response.cliente, response.token, 'cliente');
        }
      })
    );
  }

  registerCliente(payload: RegisterClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(`${this.apiUrl}/cliente/register`, payload).pipe(
      tap((response) => {
        if (response?.token && response?.cliente) {
          this.guardarSesion(
            { ...response.cliente, nombre: payload.nombre, telefono: payload.telefono, direccion: payload.direccion },
            response.token,
            'cliente'
          );
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUsuarioActual(): any {
    const raw = localStorage.getItem(this.usuarioKey);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
  }

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

  getClienteId(): number | null {
    return this.getUsuarioActual()?.id ?? null;
  }

  getNombreCompleto(): string {
    const u = this.getUsuarioActual();
    if (!u) return '';
    return [u.nombre, u.apellido].filter(Boolean).join(' ');
  }
}