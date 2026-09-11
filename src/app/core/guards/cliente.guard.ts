import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const ClienteGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.getUsuarioActual();
  const token = authService.getToken();

  if (usuario && usuario.rol === 'cliente' && token) {
    return true;
  }

  return router.parseUrl('/login-cliente');
};
