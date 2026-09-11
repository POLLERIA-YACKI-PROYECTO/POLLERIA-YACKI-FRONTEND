// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private tokenKey = 'auth_token';
  private usuarioKey = 'usuario_actual';
  private clientesKey = 'clientes_registrados';

  constructor(private http: HttpClient) {}

  private guardarSesion(usuario: any, token?: string): void {
    const tokenFinal = token || `local-session-${Date.now()}`;
    localStorage.setItem(this.tokenKey, tokenFinal);
    localStorage.setItem(this.usuarioKey, JSON.stringify(usuario));
  }

  loginAdmin(dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-admin`, { dni }).pipe(
      tap((response: any) => {
        console.log('🔐 Login response:', response);
        if (response.token) {
          this.guardarSesion(response, response.token);
          console.log('✅ Token guardado:', response.token.substring(0, 20) + '...');
        } else {
          console.warn('⚠️ No se recibió token en la respuesta');
        }
      })
    );
  }

  loginMesero(dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-mesero`, { dni }).pipe(
      tap((response: any) => {
        if (response.token) {
          this.guardarSesion(response, response.token);
        }
      })
    );
  }

  loginCliente(payload: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/cliente/login`, payload).pipe(
      tap((response: any) => {
        if (response.token && response.cliente) {
          this.guardarSesion(response.cliente, response.token);
        }
      }),
      catchError((error) => {
        if (error.status !== 0 && error.status !== 404) {
          return throwError(() => error);
        }

        const cliente = this.obtenerClientesLocales().find(
          (item) => item.email === payload.email && item.password === payload.password
        );

        if (!cliente) {
          return throwError(() => ({ error: { message: 'Correo o contraseña incorrectos.' } }));
        }

        const { password: _password, ...usuario } = cliente;
        this.guardarSesion(usuario, `cliente-local-${Date.now()}`);
        return of(usuario);
      })
    );
  }

  registerCliente(cliente: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cliente/registro`, cliente).pipe(
      tap((response: any) => {
        if (response.token && response.cliente) {
          this.guardarSesion(response.cliente, response.token);
        }
      }),
      catchError((error) => {
        if (error.status !== 0 && error.status !== 404) {
          return throwError(() => error);
        }

        const clientes = this.obtenerClientesLocales();
        if (clientes.some((item) => item.email === cliente.email)) {
          return throwError(() => ({ error: { message: 'Ese correo ya está registrado.' } }));
        }

        const nuevoCliente = {
          id: Date.now(),
          nombre: cliente.nombre,
          email: cliente.email,
          telefono: cliente.telefono,
          direccion: cliente.direccion,
          password: cliente.password,
          rol: 'cliente'
        };

        clientes.push(nuevoCliente);
        localStorage.setItem(this.clientesKey, JSON.stringify(clientes));

        const { password: _password, ...usuario } = nuevoCliente;
        this.guardarSesion(usuario, `cliente-local-${Date.now()}`);
        return of(usuario);
      })
    );
  }

  private obtenerClientesLocales(): any[] {
    try {
      return JSON.parse(localStorage.getItem(this.clientesKey) || '[]');
    } catch {
      return [];
    }
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    console.log('🔐 Token recuperado:', token ? token.substring(0, 20) + '...' : '❌ No existe');
    return token;
  }

  getUsuarioActual(): any {
    const usuario = localStorage.getItem(this.usuarioKey);
    return usuario ? JSON.parse(usuario) : null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isCliente(): boolean {
    const usuario = this.getUsuarioActual();
    return !!usuario && usuario.rol === 'cliente';
  }
}