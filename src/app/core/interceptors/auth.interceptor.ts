// src/app/core/interceptors/auth.interceptor.ts
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  //  Rutas que NO deben llevar token (evita errores 401 en login)
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/login-admin',
    '/api/auth/login-mesero',
    '/api/auth/cliente/login',
    '/api/auth/cliente/register',
    '/api/health',
    '/api/docs',
    '/api/docs.json',
  ];

  const isPublicRoute = publicRoutes.some((route) => req.url.includes(route));

  // Si hay token, SIEMPRE agregarlo (incluso a categorías/configuración)
  //    Así el backend identifica al usuario en el rate limit
  if (token && !isPublicRoute) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};