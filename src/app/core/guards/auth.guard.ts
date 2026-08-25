import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir según el rol que intentaba acceder
  const usuario = authService.getUsuarioActual();
  if (usuario) {
    if (usuario.rol === 'admin' || usuario.rol === 'cajero') {
      return router.parseUrl('/login-admin');
    } else if (usuario.rol === 'mesero') {
      return router.parseUrl('/login-mesero');
    }
  }

  return router.parseUrl('/login-admin');
};