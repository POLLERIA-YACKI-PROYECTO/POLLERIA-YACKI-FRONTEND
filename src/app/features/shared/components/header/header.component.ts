// src/app/features/shared/components/header/header.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  //  OnPush: el header solo cambia cuando cambia `usuario`
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  @Input() usuario: any = null;
  @Output() logout = new EventEmitter<void>();

  // ============================================
  // GETTERS DE ROL
  // ============================================
  get esAdmin(): boolean {
    return !!this.usuario &&
      (this.usuario.rol === 'admin' || this.usuario.rol === 'cajero');
  }

  get esMesero(): boolean {
    return !!this.usuario && this.usuario.rol === 'mesero';
  }

  get esCliente(): boolean {
    return !!this.usuario &&
      (this.usuario.tipo === 'cliente' || this.usuario.rol === 'cliente');
  }

  // ============================================
  // LOGO Y TÍTULO
  // ============================================
  get logoUrl(): string {
    if (this.esAdmin) return 'assets/images/logoadmin.png';
    return 'assets/images/logo.png';
  }

  get titulo(): string {
    if (this.esAdmin) return 'Polleria Yacki · Admin';
    if (this.esMesero) return 'Polleria Yacki · Mesero';
    if (this.esCliente) return 'Polleria Yacki';
    return 'Polleria Yacki';
  }

  get nombreMostrar(): string {
    if (!this.usuario) return 'Usuario';
    return this.usuario.nombre || this.usuario.email || 'Usuario';
  }

  get rolBadge(): string {
    if (this.esAdmin) return 'Admin';
    if (this.esMesero) return 'Mesero';
    if (this.esCliente) return 'Cliente';
    return '';
  }

  // ============================================
  // MANEJO DE IMAGEN
  // ============================================
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;

    if (this.esAdmin) {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"%3E%3Crect width="500" height="500" rx="250" fill="%235e412f"/%3E%3Ctext x="250" y="320" font-size="200" text-anchor="middle" fill="%23e9bd6e" font-family="Arial" font-weight="bold"%3E%3C/text%3E%3C/svg%3E';
    } else {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"%3E%3Crect width="500" height="500" rx="250" fill="%23000000"/%3E%3Ctext x="250" y="320" font-size="200" text-anchor="middle" fill="%23ffffda" font-family="Arial" font-weight="bold"%3E%3C/text%3E%3C/svg%3E';
    }
  }

  // ============================================
  // ACCIÓN DE LOGOUT
  // ============================================
  onLogout(): void {
    this.logout.emit();
  }
}