// src/app/core/interceptors/auth.interceptor.ts
import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    // Rutas públicas que NO requieren token
    const publicRoutes = [
      '/api/auth/login',
      '/api/auth/login-admin',
      '/api/auth/login-mesero',
      '/api/auth/cliente/login',
      '/api/auth/cliente/register',
      '/api/health',
      '/api/categorias',
      '/api/configuracion'
    ];

    const isPublicRoute = publicRoutes.some((route) =>
      req.url.includes(route)
    );

    // Si es pública, no agregar token
    if (isPublicRoute) {
      return next.handle(req);
    }

    // Si hay token, clonar request con Authorization
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(cloned);
    }

    return next.handle(req);
  }
}