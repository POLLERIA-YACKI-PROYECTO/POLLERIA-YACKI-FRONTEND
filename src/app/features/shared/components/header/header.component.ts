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

  logoUrl = 'assets/images/logo.png';

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2332CD32;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23228B22;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="500" height="500" rx="250" fill="url(%23grad)"/%3E%3Ccircle cx="250" cy="250" r="180" fill="white" opacity="0.95"/%3E%3Ctext x="250" y="310" font-size="180" text-anchor="middle" fill="%23228B22" font-family="Arial" font-weight="bold"%3E🐔%3C/text%3E%3Ctext x="250" y="430" font-size="40" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" letter-spacing="2"%3EPOLLERIA YAKI%3C/text%3E%3C/svg%3E';
  }
}