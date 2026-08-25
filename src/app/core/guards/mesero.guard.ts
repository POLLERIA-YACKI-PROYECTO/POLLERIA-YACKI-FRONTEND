import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const MeseroGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.getUsuarioActual();
  
  if (usuario && usuario.rol === 'mesero') {
    return true;
  }

  return router.parseUrl('/login-mesero');
};