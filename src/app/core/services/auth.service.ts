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

export interface RegisterClienteResponse {
  success: boolean;
  requiereVerificacion: boolean;
  message: string;
}

export interface VerificarCodigoResponse {
  success: boolean;
  cliente: any;
  token: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  private readonly tokenKey = 'auth_token';
  private readonly usuarioKey = 'usuario_actual';
  private readonly tabIdKey = 'tab_id';

  private getTabId(): string {
    let tabId = sessionStorage.getItem(this.tabIdKey);
    if (!tabId) {
      tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem(this.tabIdKey, tabId);
    }
    return tabId;
  }

  private getStorageKey(baseKey: string): string {
    return `${baseKey}_${this.getTabId()}`;
  }

  private setItem(key: string, value: string): void {
    try {
      localStorage.setItem(this.getStorageKey(key), value);
    } catch (e) {
      console.error('[AuthService] Error al guardar en localStorage:', e);
    }
  }

  private getItem(key: string): string | null {
    try {
      return localStorage.getItem(this.getStorageKey(key));
    } catch (e) {
      console.error('[AuthService] Error al leer de localStorage:', e);
      return null;
    }
  }

  private removeItem(key: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(key));
    } catch (e) {
      console.error('[AuthService] Error al eliminar de localStorage:', e);
    }
  }

  private guardarSesion(
    usuario: any,
    token: string,
    tipo: 'cliente' | 'admin' | 'mesero' = 'cliente'
  ): void {
    const usuarioNormalizado = {
      ...usuario,
      tipo: usuario.tipo || tipo,
      rol: usuario.rol || tipo,
    };

    this.setItem(this.tokenKey, token);
    this.setItem(this.usuarioKey, JSON.stringify(usuarioNormalizado));

    console.log(`[AuthService] Sesion guardada (${tipo}) en pestana ${this.getTabId()}`);
  }

  loginAdmin(dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-admin`, { dni }).pipe(
      tap((response: any) => {
        if (response?.token) {
          this.guardarSesion(response, response.token, 'admin');
        }
      })
    );
  }

  loginMesero(dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-mesero`, { dni }).pipe(
      tap((response: any) => {
        if (response?.token) {
          this.guardarSesion(response, response.token, 'mesero');
        }
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

  registerCliente(payload: RegisterClienteRequest): Observable<RegisterClienteResponse> {
    return this.http.post<RegisterClienteResponse>(
      `${this.apiUrl}/cliente/register`,
      payload
    );
  }

  verificarCodigo(email: string, codigo: string): Observable<VerificarCodigoResponse> {
    return this.http.post<VerificarCodigoResponse>(
      `${this.apiUrl}/cliente/verificar-codigo`,
      { email, codigo }
    ).pipe(
      tap((response) => {
        if (response?.token && response?.cliente) {
          this.guardarSesion(response.cliente, response.token, 'cliente');
        }
      })
    );
  }

  reenviarCodigo(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cliente/reenviar-codigo`, { email });
  }

  getToken(): string | null {
    return this.getItem(this.tokenKey);
  }

  getUsuarioActual(): any {
    const raw = this.getItem(this.usuarioKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  logout(): void {
    this.removeItem(this.tokenKey);
    this.removeItem(this.usuarioKey);
    console.log(`[AuthService] Sesion cerrada en pestana ${this.getTabId()}`);
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