import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.getUsuarioActual();
  
  if (usuario && (usuario.rol === 'admin' || usuario.rol === 'cajero')) {
    return true;
  }

  return router.parseUrl('/login-admin');
};