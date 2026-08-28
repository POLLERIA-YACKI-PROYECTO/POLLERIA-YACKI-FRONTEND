// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private usuarioKey = 'usuario_actual';

  constructor(private http: HttpClient) {}

  loginAdmin(dni: string): Observable<any> {
    console.log('🔐 Intentando login con DNI:', dni);
    
    return this.http.post(`${this.apiUrl}/login-admin`, { dni }).pipe(
      tap((response: any) => {
        console.log('📥 Respuesta login:', response);
        
        if (response && response.token) {
          console.log('✅ Token recibido:', response.token.substring(0, 20) + '...');
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.usuarioKey, JSON.stringify(response));
          console.log('✅ Token guardado en localStorage');
        } else {
          console.error('❌ No se recibió token en la respuesta');
        }
      })
    );
  }

  loginMesero(dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-mesero`, { dni }).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.usuarioKey, JSON.stringify(response));
        }
      })
    );
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    console.log('🔑 Token recuperado:', token ? token.substring(0, 20) + '...' : 'No hay token');
    return token;
  }

  getUsuarioActual(): any {
    const usuario = localStorage.getItem(this.usuarioKey);
    if (usuario) {
      try {
        return JSON.parse(usuario);
      } catch (e) {
        console.error('Error al parsear usuario:', e);
        return null;
      }
    }
    return null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    console.log('👋 Sesión cerrada');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const usuario = this.getUsuarioActual();
    return !!token && !!usuario;
  }
}