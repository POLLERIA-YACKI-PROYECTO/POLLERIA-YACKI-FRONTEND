// src/app/core/services/base-api.service.ts
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import {
  tap,
  shareReplay,
  catchError,
  retryWhen,
  mergeMap,
  finalize,
} from 'rxjs/operators';

export abstract class BaseApiService {
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly enCurso = new Map<string, Observable<any>>();
  private readonly bloqueadoHasta = new Map<string, number>();
  private readonly TTL_DEFAULT = 5 * 60 * 1000;
  private readonly BLOQUEO_429_MS = 30 * 1000;

  constructor(protected http: HttpClient) {}

  protected getCached<T>(
    url: string,
    options: {
      ttl?: number;
      forceRefresh?: boolean;
      params?: HttpParams;
      headers?: HttpHeaders;
    } = {}
  ): Observable<T> {
    const { ttl = this.TTL_DEFAULT, forceRefresh = false, params, headers } = options;
    const key = `${url}?${params?.toString() || ''}`;

    // 1. Bloqueo por 429
    const bloqueadoHasta = this.bloqueadoHasta.get(key) || 0;
    if (Date.now() < bloqueadoHasta) {
      return throwError(() => ({ status: 429, message: 'Rate limit (bloqueado)' }));
    }

    // 2. Caché
    if (!forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < ttl) {
        return of(cached.data as T);
      }
    }

    // 3. Petición en curso → reutilizar
    const existente = this.enCurso.get(key);
    if (existente) {
      return existente as Observable<T>;
    }

    // 4. Nueva petición
    const req$ = this.http.get<T>(url, { params, headers }).pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error, index) => {
            if ((error?.status === 429 || error?.status === 503) && index < 2) {
              return timer(Math.pow(2, index) * 1000);
            }
            return throwError(() => error);
          })
        )
      ),
      tap((data) => {
        this.cache.set(key, { data, timestamp: Date.now() });
      }),
      catchError((error) => {
        if (error?.status === 429) {
          this.bloqueadoHasta.set(key, Date.now() + this.BLOQUEO_429_MS);
          console.warn(`🚫 429 en ${url}. Bloqueado por 30s.`);
        }
        return throwError(() => error);
      }),
      finalize(() => {
        this.enCurso.delete(key);
      }),
      // ✅ refCount: true → la suscripción HTTP se cierra cuando no hay suscriptores
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.enCurso.set(key, req$);
    return req$;
  }

  protected mutate<T>(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    body?: any,
    headers?: HttpHeaders
  ): Observable<T> {
    return this.http.request<T>(method, url, { body, headers });
  }

  limpiarCache(url?: string): void {
    if (url) {
      for (const key of Array.from(this.cache.keys())) {
        if (key.startsWith(url)) this.cache.delete(key);
      }
      for (const key of Array.from(this.enCurso.keys())) {
        if (key.startsWith(url)) this.enCurso.delete(key);
      }
      for (const key of Array.from(this.bloqueadoHasta.keys())) {
        if (key.startsWith(url)) this.bloqueadoHasta.delete(key);
      }
    } else {
      this.cache.clear();
      this.enCurso.clear();
      this.bloqueadoHasta.clear();
    }
  }
}