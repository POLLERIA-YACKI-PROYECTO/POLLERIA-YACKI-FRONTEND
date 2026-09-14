// src/app/core/interceptors/rate-limit.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, shareReplay, timeout } from 'rxjs/operators';

@Injectable()
export class RateLimitInterceptor implements HttpInterceptor {
  private pendingRequests = new Map<string, Observable<HttpEvent<any>>>();

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Solo deduplicar GETs simultáneos
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    const cacheKey = `${req.method}:${req.urlWithParams}`;
    const existing = this.pendingRequests.get(cacheKey);
    if (existing) {
      return existing;
    }

    const request$ = next.handle(req).pipe(
      timeout(15000), // si el backend no responde en 15s, falla en lugar de colgarse
      finalize(() => this.pendingRequests.delete(cacheKey)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.pendingRequests.set(cacheKey, request$);
    return request$;
  }
}