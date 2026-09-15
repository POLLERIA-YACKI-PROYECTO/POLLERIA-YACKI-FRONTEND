// src/app/core/interceptors/rate-limit.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { finalize, shareReplay, timeout, retryWhen, mergeMap } from 'rxjs/operators';

@Injectable()
export class RateLimitInterceptor implements HttpInterceptor {
  // Mapa de peticiones GET en vuelo (deduplicación)
  private pendingRequests = new Map<string, Observable<HttpEvent<any>>>();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo deduplicar GETs
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    const cacheKey = `${req.method}:${req.urlWithParams}`;
    const existing = this.pendingRequests.get(cacheKey);

    if (existing) {
      return existing;
    }

    const request$ = next.handle(req).pipe(
      timeout(20000), // 20s máximo
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error, index) => {
            // Reintentar solo en errores 429 (rate limit) o 503
            if (
              (error instanceof HttpErrorResponse &&
                (error.status === 429 || error.status === 503)) &&
              index < 2
            ) {
              const delay = Math.pow(2, index) * 1000; // backoff exponencial
              console.warn(`⏳ Reintentando en ${delay}ms...`);
              return timer(delay);
            }
            return throwError(() => error);
          })
        )
      ),
      finalize(() => {
        // ✅ Limpieza GARANTIZADA en cualquier caso (éxito, error, unsubscribe)
        this.pendingRequests.delete(cacheKey);
      }),
      // ✅ shareReplay CON refCount: se libera cuando no hay suscriptores
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.pendingRequests.set(cacheKey, request$);
    return request$;
  }
}