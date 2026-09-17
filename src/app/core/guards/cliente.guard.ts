// src/app/core/guards/cliente.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const ClienteGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const usuario = authService.getUsuarioActual();

  console.log('🛡️ ClienteGuard:', {
    url: state.url,
    tieneToken: !!token,
    tieneUsuario: !!usuario,
    tipo: usuario?.tipo,
    rol: usuario?.rol
  });

  if (!token || !usuario) {
    console.warn('ClienteGuard: sin sesión → /login-cliente');
    return router.parseUrl('/login-cliente');
  }

  const esCliente = usuario.tipo === 'cliente' || usuario.rol === 'cliente';

  if (!esCliente) {
    console.warn('ClienteGuard: no es cliente → /login-cliente');
    return router.parseUrl('/login-cliente');
  }

  return true;
};   // ⬅ UN SOLO `};`, no dos