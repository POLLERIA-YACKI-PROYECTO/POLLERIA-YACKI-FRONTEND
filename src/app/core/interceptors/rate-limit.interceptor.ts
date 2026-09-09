// src/app/core/interceptors/rate-limit.interceptor.ts
import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, finalize, share, take, switchMap } from 'rxjs/operators';

@Injectable()
export class RateLimitInterceptor implements HttpInterceptor {
  private pendingRequests = new Map<string, Observable<HttpEvent<any>>>();
  private requestTimestamps: number[] = [];
  private readonly MAX_REQUESTS_PER_SECOND = 30;
  private readonly WINDOW_MS = 1000;
  private isWaiting = false;
  private authRetryCount = 0;
  private readonly MAX_AUTH_RETRIES = 5;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ✅ EXCLUIR RUTAS DE AUTENTICACIÓN DEL RATE LIMIT
    const authRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/login-admin',
      '/api/auth/login-mesero',
      '/api/auth/login-cajero'
    ];
    
    const isAuthRoute = authRoutes.some(route => req.url.includes(route));
    
    // ✅ Si es una ruta de autenticación, NO aplicar rate limit
    if (isAuthRoute) {
      console.log(`🔓 Auth - Sin rate limit: ${req.method} ${req.url}`);
      return next.handle(req).pipe(
        retry({
          count: 3,
          delay: (error: HttpErrorResponse) => {
            if (error.status === 429) {
              this.authRetryCount++;
              const waitTime = Math.min(3000 * this.authRetryCount, 10000);
              console.warn(`⏳ Auth rate limit, reintentando ${this.authRetryCount}/${this.MAX_AUTH_RETRIES} después de ${waitTime}ms`);
              return timer(waitTime);
            }
            return throwError(() => error);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 429) {
            console.warn(`⏳ Auth rate limit excedido después de ${this.authRetryCount} intentos`);
            this.authRetryCount = 0;
            // Si es login, esperar 5 segundos y reintentar
            if (req.url.includes('/login')) {
              return timer(5000).pipe(
                switchMap(() => {
                  console.log(`🔄 Reintentando auth después de espera: ${req.url}`);
                  return this.intercept(req, next);
                })
              );
            }
          }
          this.authRetryCount = 0;
          return throwError(() => error);
        }),
        finalize(() => {
          this.authRetryCount = 0;
        })
      );
    }

    // Si no es auth, aplicar rate limit normal
    const now = Date.now();
    
    // Limpiar timestamps antiguos
    this.requestTimestamps = this.requestTimestamps.filter(t => now - t < this.WINDOW_MS);
    
    // Si excedemos el límite, esperar
    if (this.requestTimestamps.length >= this.MAX_REQUESTS_PER_SECOND && !this.isWaiting) {
      this.isWaiting = true;
      const waitTime = this.WINDOW_MS - (now - this.requestTimestamps[0]) + 100;
      console.warn(`⏳ Rate limit, esperando ${waitTime}ms para: ${req.url}`);
      
      return timer(waitTime).pipe(
        take(1),
        switchMap(() => {
          this.isWaiting = false;
          return this.intercept(req, next);
        })
      );
    }

    // Registrar timestamp
    this.requestTimestamps.push(now);

    // Cache para peticiones GET duplicadas
    const cacheKey = `${req.method}:${req.url}`;
    if (req.method === 'GET' && this.pendingRequests.has(cacheKey)) {
      console.log(`📦 Usando petición en caché para: ${req.url}`);
      return this.pendingRequests.get(cacheKey)!;
    }

    const request$ = next.handle(req).pipe(
      retry({
        count: 2,
        delay: (error: HttpErrorResponse) => {
          if (error.status === 429) {
            const retryAfter = parseInt(error.headers.get('Retry-After') || '2', 10);
            console.warn(`⏳ Rate limit (429), reintentando después de ${retryAfter}s para: ${req.url}`);
            return timer(retryAfter * 1000);
          }
          return throwError(() => error);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 429) {
          console.warn(`⏳ Demasiadas peticiones para: ${req.url}`);
          this.requestTimestamps = this.requestTimestamps.filter(t => Date.now() - t < this.WINDOW_MS);
          
          if (req.method === 'GET') {
            return timer(2000).pipe(
              switchMap(() => {
                console.log(`🔄 Reintentando GET: ${req.url}`);
                return this.intercept(req, next);
              })
            );
          }
        }
        return throwError(() => error);
      }),
      finalize(() => {
        if (req.method === 'GET') {
          setTimeout(() => {
            this.pendingRequests.delete(cacheKey);
          }, 3000);
        }
      }),
      share()
    );

    if (req.method === 'GET') {
      this.pendingRequests.set(cacheKey, request$);
    }

    return request$;
  }
}