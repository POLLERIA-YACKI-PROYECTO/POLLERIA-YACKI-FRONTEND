// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.getUsuarioActual();
  const token = authService.getToken();
  
  console.log('AuthGuard - Usuario:', usuario);
  console.log('AuthGuard - Token:', token);

  // Si tiene usuario y token, está autenticado
  if (usuario && token) {
    console.log('AuthGuard - Autenticado correctamente');
    return true;
  }

  // Si no está autenticado, redirigir al login según el rol
  console.log('AuthGuard - No autenticado, redirigiendo');
  
  // Verificar si hay un usuario en localStorage pero no token
  const storedUser = localStorage.getItem('usuario');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.rol === 'mesero') {
        return router.parseUrl('/login-mesero');
      } else {
        return router.parseUrl('/login-admin');
      }
    } catch {
      return router.parseUrl('/login-mesero');
    }
  }

  return router.parseUrl('/login-mesero');
};