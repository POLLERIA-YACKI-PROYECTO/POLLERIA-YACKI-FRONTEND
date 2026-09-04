
// src\app\core\services\auth.service.ts

import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

// Tipado de usuario del sistema (Admin, Mesero, Cajero, etc.)
export interface AdminUser {
  id: number;
  fullName?: string;
  nombre?: string;
  role: 'admin' | 'mesero' | 'cajero' | 'cocina' | 'motorizado';
  email?: string;
  dni?: string;
}

export interface AuthResponse {
  token: string;
  user?: AdminUser;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'dy_admin_token';
  private usuarioKey = 'dy_admin_user';

  /**
   * Login tradicional mediante correo y contraseña
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => this.guardarSesion(res))
    );
  }

  /**
   * Login rápido mediante DNI para el Administrador
   */
  loginAdmin(dni: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login-admin`, { dni }).pipe(
      tap((res) => this.guardarSesion(res))
    );
  }

  /**
   * Login rápido mediante DNI para Meseros
   */
  loginMesero(dni: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login-mesero`, { dni }).pipe(
      tap((res) => this.guardarSesion(res))
    );
  }

  /**
   * Cierra sesión, remueve credenciales del almacenamiento y redirige al login
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    this.router.navigate(['/admin/login']);
  }

  /**
   * Obtiene el token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Obtiene los datos del usuario logueado actualmente
   */
  getUser(): AdminUser | null {
    const raw = localStorage.getItem(this.usuarioKey);
    return raw ? JSON.parse(raw) : null;
  }

  /**
   * Alias de compatibilidad para el proyecto clonado
   */
  getUsuarioActual(): AdminUser | null {
    return this.getUser();
  }

  /**
   * Comprueba si existe un token guardado en el navegador
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Método privado para centralizar el guardado de la sesión en localStorage
   */
  private guardarSesion(response: AuthResponse): void {
    if (response?.token) {
      localStorage.setItem(this.tokenKey, response.token);
      const usuarioData = response.user || response;
      localStorage.setItem(this.usuarioKey, JSON.stringify(usuarioData));
    }
  }
}