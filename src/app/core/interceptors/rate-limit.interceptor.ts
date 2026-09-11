// src/app/core/interceptors/rate-limit.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, timer, of } from 'rxjs';
import {
  catchError,
  retry,
  finalize,
  shareReplay,
  switchMap
} from 'rxjs/operators';

@Injectable()
export class RateLimitInterceptor implements HttpInterceptor {
  // ============================================
  // CONFIGURACIÓN
  // ============================================
  private readonly MAX_REQUESTS_PER_WINDOW = 30;
  private readonly WINDOW_MS = 1000;
  private readonly MAX_GET_RETRIES = 2;
  private readonly MAX_AUTH_RETRIES = 3;
  private readonly AUTH_BASE_DELAY_MS = 2000;
  private readonly AUTH_MAX_DELAY_MS = 10000;
  private readonly GET_CACHE_TTL_MS = 3000;

  // ============================================
  // ESTADO INTERNO
  // ============================================
  private requestTimestamps: number[] = [];
  private pendingRequests = new Map<string, Observable<HttpEvent<any>>>();
  private isThrottling = false;

  // ============================================
  // INTERCEPTOR PRINCIPAL
  // ============================================
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // --------------------------------------------
    // 1. RUTAS DE AUTENTICACIÓN → SIN RATE LIMIT
    // --------------------------------------------
    if (this.isAuthRoute(req.url)) {
      return this.handleAuthRequest(req, next);
    }

    // --------------------------------------------
    // 2. RATE LIMIT LOCAL (cliente)
    // --------------------------------------------
    if (this.isThrottling) {
      return this.waitAndRetry(req, next);
    }

    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < this.WINDOW_MS
    );

    if (this.requestTimestamps.length >= this.MAX_REQUESTS_PER_WINDOW) {
      this.isThrottling = true;
      const oldest = this.requestTimestamps[0];
      const waitTime = this.WINDOW_MS - (now - oldest) + 100;

      console.warn(
        `⏳ Rate limit local alcanzado. Esperando ${waitTime}ms antes de: ${req.url}`
      );

      return this.waitAndRetry(req, next, waitTime);
    }

    this.requestTimestamps.push(now);

    // --------------------------------------------
    // 3. CACHÉ DE GET DUPLICADOS
    // --------------------------------------------
    const cacheKey = `${req.method}:${req.urlWithParams}`;
    if (req.method === 'GET' && this.pendingRequests.has(cacheKey)) {
      console.log(`📦 Usando petición en caché para: ${req.url}`);
      return this.pendingRequests.get(cacheKey)!;
    }

    // --------------------------------------------
    // 4. HANDLE NORMAL + RETRY EN 429
    // --------------------------------------------
    const request$ = next.handle(req).pipe(
      retry({
        count: this.MAX_GET_RETRIES,
        delay: (error: HttpErrorResponse) => {
          if (error.status === 429) {
            const retryAfter = this.parseRetryAfter(error, 2);
            console.warn(
              `⏳ 429 recibido. Reintentando en ${retryAfter}s: ${req.url}`
            );
            return timer(retryAfter * 1000);
          }
          return throwError(() => error);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 429) {
          console.warn(`🚫 Rate limit excedido definitivamente: ${req.url}`);
          // Limpiar throttling para no bloquear futuras peticiones
          this.isThrottling = false;
        }
        return throwError(() => error);
      }),
      finalize(() => {
        if (req.method === 'GET') {
          // Limpiar caché con delay para permitir dedupe de peticiones simultáneas
          setTimeout(() => {
            this.pendingRequests.delete(cacheKey);
          }, this.GET_CACHE_TTL_MS);
        }
      }),
      // shareReplay(1) solo cachea el último valor y no rompe en errores
      shareReplay({ bufferSize: 1, refCount: true })
    );

    if (req.method === 'GET') {
      this.pendingRequests.set(cacheKey, request$);
    }

    return request$;
  }

  // ============================================
  // AUTH REQUEST HANDLER
  // ============================================
  private handleAuthRequest(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log(`🔓 Auth - Sin rate limit: ${req.method} ${req.url}`);

    return next.handle(req).pipe(
      retry({
        count: this.MAX_AUTH_RETRIES,
        delay: (error: HttpErrorResponse, retryCount: number) => {
          if (error.status !== 429) {
            return throwError(() => error);
          }

          // Backoff exponencial acotado
          const delay = Math.min(
            this.AUTH_BASE_DELAY_MS * Math.pow(2, retryCount - 1),
            this.AUTH_MAX_DELAY_MS
          );

          console.warn(
            `⏳ Auth 429. Reintento ${retryCount}/${this.MAX_AUTH_RETRIES} en ${delay}ms: ${req.url}`
          );

          return timer(delay);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 429) {
          console.warn(
            `🚫 Auth rate limit excedido tras ${this.MAX_AUTH_RETRIES} intentos: ${req.url}`
          );
        }
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // ESPERAR Y REINTENTAR (throttling local)
  // ============================================
  private waitAndRetry(
    req: HttpRequest<any>,
    next: HttpHandler,
    waitTime?: number
  ): Observable<HttpEvent<any>> {
    const delay =
      waitTime ?? this.WINDOW_MS + 100;

    return timer(delay).pipe(
      switchMap(() => {
        this.isThrottling = false;
        // Re-evaluar la petición después de esperar
        return this.intercept(req, next);
      })
    );
  }

  // ============================================
  // HELPERS
  // ============================================
  private isAuthRoute(url: string): boolean {
    const authRoutes = [
      '/api/auth/login',
      '/api/auth/login-admin',
      '/api/auth/login-mesero',
      '/api/auth/login-cajero',
      '/api/auth/register',
      '/api/auth/cliente/login',
      '/api/auth/cliente/register'
    ];
    return authRoutes.some((route) => url.includes(route));
  }

  private parseRetryAfter(error: HttpErrorResponse, fallback: number): number {
    const header = error.headers.get('Retry-After');
    if (!header) return fallback;

    const seconds = parseInt(header, 10);
    return isNaN(seconds) || seconds < 1 ? fallback : seconds;
  }
}