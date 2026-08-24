import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioActual = signal<Usuario | null>(null);

  login(dni: string): Observable<Usuario> {
    if (dni.length !== 8 || !/^\d{8}$/.test(dni)) {
      return throwError(() => new Error('DNI inválido'));
    }

    const usuario: Usuario = {
      id: 1,
      dni: dni,
      nombre: 'Administrador',
      rol: 'admin'
    };

    this.usuarioActual.set(usuario);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    return of(usuario).pipe(delay(800));
  }

  logout(): void {
    this.usuarioActual.set(null);
    localStorage.removeItem('usuario');
  }

  getUsuarioActual(): Usuario | null {
    if (!this.usuarioActual()) {
      const stored = localStorage.getItem('usuario');
      if (stored) {
        try {
          this.usuarioActual.set(JSON.parse(stored));
        } catch {
          this.usuarioActual.set(null);
        }
      }
    }
    return this.usuarioActual();
  }

  isAuthenticated(): boolean {
    return this.getUsuarioActual() !== null;
  }
}