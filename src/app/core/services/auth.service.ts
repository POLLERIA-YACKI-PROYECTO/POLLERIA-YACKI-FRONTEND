// core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private tokenKey = 'auth_token';
  private usuarioKey = 'usuario_actual';

  constructor(private http: HttpClient) {}

  loginAdmin(dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-admin`, { dni }).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.usuarioKey, JSON.stringify(response));
        }
      })
    );
  }

  loginMesero(dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-mesero`, { dni }).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.usuarioKey, JSON.stringify(response));
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
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
}
