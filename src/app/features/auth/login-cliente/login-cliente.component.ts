// src/app/features/cliente/login-cliente/login-cliente.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-cliente.component.html',
  styleUrls: ['./login-cliente.component.scss']
})
export class LoginClienteComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  registerForm: FormGroup;

  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  currentYear = new Date().getFullYear();

  currentUser = signal<any>(this.authService.getUsuarioActual());
  isLoggedIn = computed(() => !!this.currentUser());

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
    // Si ya hay sesión de cliente, redirigir directo a la carta
    if (this.authService.isCliente() && this.authService.getToken()) {
      console.log('✅ Sesión de cliente ya activa → /cliente/carta');
      this.router.navigate(['/cliente/carta']);
    }
  }

  toggleMode(): void {
    if (this.isLoading()) return;
    this.isLoginMode.set(!this.isLoginMode());
    this.errorMessage.set('');
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
      this.errorMessage.set('Ingresa un correo y contraseña válidos.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.loginCliente({ email, password }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.currentUser.set(this.authService.getUsuarioActual());
        console.log('✅ Login exitoso → /cliente/carta');
        this.router.navigate(['/cliente/carta']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.error?.message ||
            'No pudimos iniciar sesión. Verifica tus datos e intenta nuevamente.'
        );
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

    const payload = this.registerForm.value;

    this.authService.registerCliente(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.currentUser.set(this.authService.getUsuarioActual());
        console.log('✅ Registro exitoso → /cliente/carta');
        this.router.navigate(['/cliente/carta']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.error?.message ||
            'No se pudo completar el registro. Intenta nuevamente.'
        );
      }
    });
  }

  irACarta(): void {
    this.router.navigate(['/cliente/carta']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.currentUser.set(null);
    this.isLoginMode.set(true);
    this.loginForm.reset();
    this.registerForm.reset();
  }
  onTelefonoInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  // Solo números, máximo 9 dígitos
  const limpio = input.value.replace(/\D/g, '').slice(0, 9);
  input.value = limpio;
  this.registerForm.get('telefono')?.setValue(limpio, { emitEvent: false });
}
}