//src\app\core\guards\auth.guard.ts
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

  if (usuario && token) {
    console.log('AuthGuard - Autenticado correctamente');
    return true;
  }

  console.log('AuthGuard - No autenticado, redirigiendo');
  return router.parseUrl('/login-mesero');
};