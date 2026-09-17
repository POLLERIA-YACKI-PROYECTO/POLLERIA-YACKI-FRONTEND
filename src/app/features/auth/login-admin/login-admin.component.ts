// src/app/features/auth/login-admin/login-admin.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-admin.component.html',
  styleUrls: ['./login-admin.component.scss']
})
export class LoginAdminComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Subject para limpiar en destroy
  private destroy$ = new Subject<void>();

  loginForm!: FormGroup;
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  mostrarBienvenida = signal<boolean>(false);
  nombreUsuario = signal<string>('');

  logoUrl = 'assets/images/logoadmin.png';

  constructor() {
    this.loginForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]]
    });
  }

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    // Si ya está autenticado como admin/cajero, redirigir
    if (this.authService.isAuthenticated()) {
      const usuario = this.authService.getUsuarioActual();
      if (usuario && (usuario.rol === 'admin' || usuario.rol === 'cajero')) {
        console.log('Ya autenticado -> /admin/dashboard-admin');
        this.router.navigate(['/admin/dashboard-admin']);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // MANEJO DE IMAGEN
  // ============================================
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"%3E%3Crect width="500" height="500" rx="250" fill="%235e412f"/%3E%3Ctext x="250" y="320" font-size="180" text-anchor="middle" fill="%23e9bd6e" font-family="Arial" font-weight="bold"%3E%3C/text%3E%3C/svg%3E';
  }

  // ============================================
  // SUBMIT LOGIN
  // ============================================
  onSubmit(): void {
    if (this.isLoading()) return;  // Guarda contra doble submit

    if (this.loginForm.invalid) {
      this.errorMessage.set('Por favor ingrese un DNI válido (8 dígitos)');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const dni = this.loginForm.get('dni')?.value;

    this.authService.loginAdmin(dni)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isLoading.set(false);
          // Extraer nombre del response (puede venir en response.nombre o response.usuario.nombre)
          const nombre = response?.nombre || response?.usuario?.nombre || 'Admin';
          this.nombreUsuario.set(nombre);
          this.mostrarBienvenida.set(true);

          setTimeout(() => {
            this.router.navigate(['/admin/dashboard-admin']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(this.obtenerMensajeError(error));
        }
      });
  }

  // ============================================
  // MENSAJES DE ERROR
  // ============================================
  private obtenerMensajeError(error: any): string {
    if (error?.error?.message) return error.error.message;
    if (error?.error?.error) return error.error.error;

    if (error?.message &&
        typeof error.message === 'string' &&
        !error.message.includes('Http failure')) {
      return error.message;
    }

    switch (error?.status) {
      case 0: return 'No se pudo conectar con el servidor';
      case 400: return 'DNI inválido o incorrecto';
      case 401: return 'DNI inválido o incorrecto';
      case 403: return 'Acceso denegado. Se requiere rol de administrador o cajero';
      case 404: return 'DNI inválido o incorrecto';
      case 429: return 'Demasiados intentos. Espera un momento antes de reintentar.';
      case 500:
      case 502:
      case 503: return 'Error del servidor, intente más tarde';
      default: return 'DNI inválido o incorrecto';
    }
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================
  irLoginMesero(): void {
    this.router.navigate(['/login-mesero']);
  }
}