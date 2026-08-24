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

  // Usar directamente la imagen con ruta absoluta
  get logoUrl(): string {
    return '/assets/images/logo.png';
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // SVG de respaldo con el pollito
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"%3E%3Crect width="500" height="500" rx="250" fill="%2332CD32"/%3E%3Ccircle cx="250" cy="250" r="170" fill="white" opacity="0.9"/%3E%3Ctext x="250" y="310" font-size="200" text-anchor="middle" fill="%23228B22" font-family="Arial" font-weight="bold"%3E🐔%3C/text%3E%3C/svg%3E';
  }
}