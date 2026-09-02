// src/app/features/auth/login-mesero/login-mesero.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-mesero',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-mesero.component.html',
  styleUrls: ['./login-mesero.component.scss']
})
export class LoginMeseroComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm!: FormGroup;
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  mostrarBienvenida = signal<boolean>(false);
  nombreUsuario = signal<string>('');

  logoUrl = 'assets/images/logo.png';

  constructor() {
    this.loginForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]]
    });
  }

  ngOnInit(): void {
    const usuario = this.authService.getUsuarioActual();
    if (usuario && usuario.rol === 'mesero') {
      // ✅ CORREGIDO: Redirigir a /mesero/dashboard
      this.router.navigate(['/mesero/dashboard']);
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"%3E%3Crect width="500" height="500" rx="250" fill="%23000000"/%3E%3Ccircle cx="250" cy="250" r="170" fill="%23ffffda" opacity="0.9"/%3E%3Ctext x="250" y="320" font-size="200" text-anchor="middle" fill="%23ffffda" font-family="Arial" font-weight="bold"%3E%3C/text%3E%3C/svg%3E';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Por favor ingrese un DNI válido (8 dígitos)');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const dni = this.loginForm.get('dni')?.value;

    this.authService.loginMesero(dni).subscribe({
      next: (usuario) => {
        this.isLoading.set(false);
        this.nombreUsuario.set(usuario.nombre);
        this.mostrarBienvenida.set(true);

        setTimeout(() => {
          // ✅ CORREGIDO: Redirigir a /mesero/dashboard
          this.router.navigate(['/mesero/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Error al iniciar sesión');
      }
    });
  }

  irLoginAdmin(): void {
    this.router.navigate(['/login-admin']);
  }
}
