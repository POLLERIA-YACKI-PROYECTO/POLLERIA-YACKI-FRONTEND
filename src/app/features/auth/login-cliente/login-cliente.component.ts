// src/app/features/cliente/login-cliente/login-cliente.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-cliente.component.html',
  styleUrls: ['./login-cliente.component.scss']
})
export class LoginClienteComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  loginForm: FormGroup;
  registerForm: FormGroup;

  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  currentYear = new Date().getFullYear();

  currentUser = signal<any>(null);

  // Estado de verificacion por correo
  mostrarVerificacion = signal(false);
  emailPendiente = signal('');
  codigoVerificacion = signal('');
  reenviando = signal(false);

  private sesionActivaEnEstaVista = signal(false);
  isLoggedIn = computed(() => this.sesionActivaEnEstaVista());

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.sesionActivaEnEstaVista.set(false);
    this.currentUser.set(null);
    this.isLoginMode.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.mostrarVerificacion.set(false);
    this.emailPendiente.set('');
    this.codigoVerificacion.set('');
    this.loginForm.reset();
    this.registerForm.reset();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // MODO LOGIN/REGISTRO
  // ============================================
  toggleMode(): void {
    if (this.isLoading()) return;
    this.isLoginMode.set(!this.isLoginMode());
    this.errorMessage.set('');
    this.successMessage.set('');
    this.mostrarVerificacion.set(false);
    this.emailPendiente.set('');
    this.codigoVerificacion.set('');
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  // ============================================
  // LOGIN
  // ============================================
  onLogin(): void {
    if (this.isLoading()) return;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage.set('Ingresa un correo y contrasena validos.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.loginCliente({ email, password })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.sesionActivaEnEstaVista.set(true);
          this.currentUser.set(this.authService.getUsuarioActual());
          this.router.navigate(['/cliente/carta']);
        },
        error: (error) => {
          this.isLoading.set(false);

          // Si el backend pide verificar correo
          if (error?.error?.requiereVerificacion) {
            this.emailPendiente.set(email);
            this.mostrarVerificacion.set(true);
            this.errorMessage.set(error?.error?.message || 'Debes verificar tu correo.');
            return;
          }

          this.errorMessage.set(this.obtenerMensajeError(error, 'login'));
        }
      });
  }

  // ============================================
  // REGISTRO
  // ============================================
  onRegister(): void {
    if (this.isLoading()) return;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage.set('Completa correctamente todos los campos.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = this.registerForm.value;

    this.authService.registerCliente(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);

          if (res?.requiereVerificacion) {
            this.emailPendiente.set(payload.email);
            this.mostrarVerificacion.set(true);
            this.successMessage.set(res.message || 'Codigo enviado. Revisa tu correo.');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(this.obtenerMensajeError(error, 'register'));
        }
      });
  }

  // ============================================
  // VERIFICAR CODIGO
  // ============================================
  onVerificarCodigo(): void {
    const codigo = this.codigoVerificacion().trim();

    if (!codigo || codigo.length !== 6) {
      this.errorMessage.set('Ingresa el codigo de 6 digitos.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.verificarCodigo(this.emailPendiente(), codigo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.sesionActivaEnEstaVista.set(true);
          this.currentUser.set(this.authService.getUsuarioActual());
          this.router.navigate(['/cliente/carta']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error?.error?.message || 'Codigo invalido.');
        }
      });
  }

  // ============================================
  // REENVIAR CODIGO
  // ============================================
  onReenviarCodigo(): void {
    if (this.reenviando()) return;

    this.reenviando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.reenviarCodigo(this.emailPendiente())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.reenviando.set(false);
          this.successMessage.set('Te enviamos un nuevo codigo.');
        },
        error: (error) => {
          this.reenviando.set(false);
          this.errorMessage.set(error?.error?.message || 'No se pudo reenviar el codigo.');
        }
      });
  }

  // ============================================
  // VOLVER AL REGISTRO
  // ============================================
  volverAlRegistro(): void {
    this.mostrarVerificacion.set(false);
    this.emailPendiente.set('');
    this.codigoVerificacion.set('');
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoginMode.set(false);
  }

  // ============================================
  // MENSAJES DE ERROR
  // ============================================
  private obtenerMensajeError(error: any, contexto: 'login' | 'register'): string {
    if (error?.error?.message) return error.error.message;
    if (error?.error?.error) return error.error.error;

    switch (error?.status) {
      case 0:
        return 'No se pudo conectar con el servidor. Verifica tu conexion.';
      case 400:
        return contexto === 'login'
          ? 'Correo o contrasena incorrectos.'
          : 'Los datos ingresados no son validos.';
      case 401:
        return 'Correo o contrasena incorrectos.';
      case 403:
        return 'Acceso denegado.';
      case 404:
        return 'Correo o contrasena incorrectos.';
      case 409:
        return 'Ya existe una cuenta con ese correo. Intenta iniciar sesion.';
      case 429:
        return 'Demasiados intentos. Espera un momento antes de reintentar.';
      case 500:
      case 502:
      case 503:
        return contexto === 'login'
          ? 'Error del servidor, intenta mas tarde.'
          : 'El servidor no puede registrar clientes en este momento. Revisa que la API y la base de datos esten activas.';
      default:
        return contexto === 'login'
          ? 'No pudimos iniciar sesion. Verifica tus datos e intenta nuevamente.'
          : 'No se pudo completar el registro. Intenta nuevamente.';
    }
  }

  // ============================================
  // NAVEGACION
  // ============================================
  irACarta(): void {
    this.router.navigate(['/cliente/carta']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.sesionActivaEnEstaVista.set(false);
    this.currentUser.set(null);
    this.isLoginMode.set(true);
    this.mostrarVerificacion.set(false);
    this.emailPendiente.set('');
    this.codigoVerificacion.set('');
    this.loginForm.reset();
    this.registerForm.reset();
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // ============================================
  // INPUT TELEFONO
  // ============================================
  onTelefonoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '').slice(0, 9);
    input.value = limpio;
    this.registerForm.get('telefono')?.setValue(limpio, { emitEvent: false });
  }

  // ============================================
  // INPUT CODIGO
  // ============================================
  onCodigoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = limpio;
    this.codigoVerificacion.set(limpio);
  }
}