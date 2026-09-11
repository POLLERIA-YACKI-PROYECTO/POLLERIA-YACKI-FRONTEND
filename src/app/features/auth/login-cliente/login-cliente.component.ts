import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-cliente.component.html',
  styleUrls: ['./login-cliente.component.scss']
})
export class LoginClienteComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9,11}$')]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  toggleMode(): void {
    this.isLoginMode.set(!this.isLoginMode());
    this.errorMessage.set('');
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Ingresa un correo y contraseña válidos.');
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.loginCliente({ email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/cliente/carta']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.error?.message || 'No pudimos iniciar sesión. Intenta nuevamente.'
        );
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.errorMessage.set('Completa todos los datos del registro.');
      return;
    }

    this.isLoading.set(true);
    const payload = this.registerForm.value;

    this.authService.registerCliente(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/cliente/carta']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.error?.message || 'No se pudo registrar. Intenta nuevamente.'
        );
      }
    });
  }
}
