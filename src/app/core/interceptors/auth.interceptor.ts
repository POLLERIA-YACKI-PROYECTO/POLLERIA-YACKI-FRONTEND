// src/app/core/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    // Rutas públicas que no requieren token
    const publicRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/categorias',
      '/api/configuracion',
      '/api/health'
    ];

    const isPublicRoute = publicRoutes.some(route => req.url.includes(route));
    const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);

    // Para rutas públicas con métodos seguros, no agregar token
    if (isPublicRoute && isSafeMethod) {
      return next.handle(req);
    }

    // Para el resto de rutas, agregar token si existe
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