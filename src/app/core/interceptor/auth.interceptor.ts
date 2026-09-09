// src/app/core/interceptors/rate-limit.interceptor.ts
import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError, of, timer } from 'rxjs';
import { catchError, retry, tap, switchMap } from 'rxjs/operators';

@Injectable()
export class RateLimitInterceptor implements HttpInterceptor {
  private pendingRequests: Map<string, { count: number, resetTime: number }> = new Map();
  private readonly MAX_REQUESTS = 10; // Máximo de peticiones por ventana
  private readonly WINDOW_MS = 1000; // Ventana de 1 segundo

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = req.url;
    const now = Date.now();

    // Limpiar registros antiguos
    this.cleanupOldEntries(now);

    // Verificar si estamos en rate limiting
    const entry = this.pendingRequests.get(url) || { count: 0, resetTime: now + this.WINDOW_MS };
    
    if (entry.count >= this.MAX_REQUESTS && now < entry.resetTime) {
      // Si excedimos el límite, esperar y reintentar
      const waitTime = entry.resetTime - now + 100;
      console.warn(`⏳ Rate limit excedido para ${url}, esperando ${waitTime}ms`);
      
      return timer(waitTime).pipe(
        switchMap(() => {
          // Reintentar después de esperar
          return this.intercept(req, next);
        })
      );
    }

    // Incrementar contador
    entry.count++;
    this.pendingRequests.set(url, entry);

    return next.handle(req).pipe(
      retry({
        count: 3,
        delay: (error: HttpErrorResponse) => {
          if (error.status === 429) {
            const retryAfter = parseInt(error.headers.get('Retry-After') || '2', 10);
            console.warn(`⏳ Rate limit (429), reintentando después de ${retryAfter}s`);
            return timer(retryAfter * 1000);
          }
          return throwError(() => error);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 429) {
          console.error('❌ Demasiadas peticiones, espera un momento...');
          // Reducir el contador para la siguiente ventana
          const entry = this.pendingRequests.get(url);
          if (entry) {
            entry.count = Math.max(0, entry.count - 1);
          }
        }
        return throwError(() => error);
      }),
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            // Reducir contador después de respuesta exitosa
            const entry = this.pendingRequests.get(url);
            if (entry) {
              entry.count = Math.max(0, entry.count - 1);
            }
          }
        },
        error: () => {
          // Reducir contador en caso de error
          const entry = this.pendingRequests.get(url);
          if (entry) {
            entry.count = Math.max(0, entry.count - 1);
          }
        }
      })
    );
  }

  private cleanupOldEntries(now: number): void {
    for (const [key, value] of this.pendingRequests) {
      if (now > value.resetTime) {
        this.pendingRequests.delete(key);
      }
    }
  }
}