import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() usuario: any = null;
  @Output() logout = new EventEmitter<void>();

  // Logo según rol
  get logoUrl(): string {
    if (this.usuario && (this.usuario.rol === 'admin' || this.usuario.rol === 'cajero')) {
      return 'assets/images/logoadmin.png';
    }
    return 'assets/images/logo.png';
  }

  get titulo(): string {
    if (this.usuario && (this.usuario.rol === 'admin' || this.usuario.rol === 'cajero')) {
      return 'Polleria Yacky - Admin';
    }
    return 'Polleria Yacky';
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (this.usuario && (this.usuario.rol === 'admin' || this.usuario.rol === 'cajero')) {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"%3E%3Crect width="500" height="500" rx="250" fill="%235e412f"/%3E%3Ctext x="250" y="320" font-size="200" text-anchor="middle" fill="%23e9bd6e" font-family="Arial" font-weight="bold"%3E👑%3C/text%3E%3C/svg%3E';
    } else {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"%3E%3Crect width="500" height="500" rx="250" fill="%23000000"/%3E%3Ctext x="250" y="320" font-size="200" text-anchor="middle" fill="%23ffffda" font-family="Arial" font-weight="bold"%3E🍗%3C/text%3E%3C/svg%3E';
    }
  }
}