// src/app/features/admin/admin.component.ts
import {
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../shared/components/header/header.component';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  host: { 'class': 'admin-mode' }
})
export class AdminComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(false);

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    // ✅ Verificar autenticación primero
    if (!this.authService.isAuthenticated()) {
      console.warn('🛡️ Admin: sin sesión → /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    const usuario = this.authService.getUsuarioActual();
    this.usuario.set(usuario);

    if (!usuario) {
      console.warn('🛡️ Admin: usuario no encontrado → /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    const rol = usuario?.rol;
    if (rol !== 'admin' && rol !== 'cajero') {
      console.warn('🛡️ Admin: rol no permitido → /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    // ✅ Cargar tema guardado
    const temaGuardado = localStorage.getItem('tema-oscuro');
    if (temaGuardado === 'true') {
      this.temaOscuro.set(true);
    }

    console.log('✅ Admin cargado:', usuario.nombre || usuario.email);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // TEMA
  // ============================================
  toggleTema(): void {
    const nuevoTema = !this.temaOscuro();
    this.temaOscuro.set(nuevoTema);
    localStorage.setItem('tema-oscuro', String(nuevoTema));
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================
  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}