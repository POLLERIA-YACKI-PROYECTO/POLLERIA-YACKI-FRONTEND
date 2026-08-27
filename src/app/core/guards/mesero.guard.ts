// core/guards/mesero.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const MeseroGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.getUsuarioActual();
  const token = authService.getToken();
  
  console.log('MeseroGuard - Usuario:', usuario);
  console.log('MeseroGuard - Token:', token);

  if (!token) {
    console.log('MeseroGuard - No hay token, redirigiendo a login-mesero');
    return router.parseUrl('/login-mesero');
  }

  if (usuario && usuario.rol === 'mesero') {
    console.log('MeseroGuard - Acceso permitido para mesero');
    return true;
  }

  // Si es admin, redirigir a su dashboard
  if (usuario && (usuario.rol === 'admin' || usuario.rol === 'cajero')) {
    console.log('MeseroGuard - Usuario es admin, redirigiendo a dashboard-admin');
    return router.parseUrl('/admin/dashboard-admin');
  }

  console.log('MeseroGuard - Redirigiendo a login-mesero');
  return router.parseUrl('/login-mesero');
};