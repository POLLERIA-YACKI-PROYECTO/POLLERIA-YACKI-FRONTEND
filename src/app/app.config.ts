// src/app/app.config.ts
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,        // ⬅️ CAMBIO CLAVE
} from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
// ❌ NO importes RateLimitInterceptor

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),  // ✅ Nombre correcto en Angular 20
    provideRouter(routes),

    // ✅ Interceptores FUNCIONALES (obligatorio en zoneless)
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
  ],
};