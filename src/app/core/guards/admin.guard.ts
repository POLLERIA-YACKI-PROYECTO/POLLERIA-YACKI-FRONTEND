// src/app/core/guards/admin.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.getUsuarioActual();
  const token = authService.getToken();
  
  console.log('AdminGuard - Usuario:', usuario);
  console.log('AdminGuard - Token:', token);

  // Si no hay token, redirigir al login de admin
  if (!token) {
    console.log('AdminGuard - No hay token, redirigiendo a login-admin');
    return router.parseUrl('/login-admin');
  }

  // ✅ CORREGIDO: usuario.rol → usuario.role
  if (usuario && (usuario.role === 'admin' || usuario.role === 'cajero')) {
    console.log('AdminGuard - Acceso permitido para admin/cajero');
    return true;
  }

  // ✅ CORREGIDO: usuario.rol → usuario.role
  if (usuario && usuario.role === 'mesero') {
    console.log('AdminGuard - Usuario es mesero, redirigiendo a dashboard-mesero');
    return router.parseUrl('/mesero/dashboard');
  }

  console.log('AdminGuard - Redirigiendo a login-admin');
  return router.parseUrl('/login-admin');
};