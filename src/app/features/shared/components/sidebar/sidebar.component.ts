// shared/components/sidebar/sidebar.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  menuItems = signal([
    { 
      icon: 'dashboard',
      label: 'Dashboard', 
      route: '/admin/dashboard-admin'
    },
    { 
      icon: 'ventas',
      label: 'Ventas', 
      route: '/admin/ventas-admin'
    },
    { 
      icon: 'carta',
      label: 'Carta', 
      route: '/admin/carta-admin'
    },
    { 
      icon: 'precios',
      label: 'Precios', 
      route: '/admin/precios-admin'
    },
    { 
      icon: 'mantenimiento',
      label: 'Mantenimiento', 
      route: '/admin/mantenimiento'
    },
    { 
      icon: 'personal',
      label: 'Personal', 
      route: '/admin/personal'
    },
    { 
      icon: 'reportes',
      label: 'Reportes', 
      route: '/admin/reportes'
    }
  ]);

  getIconSvg(icon: string): string {
    const icons: any = {
      'dashboard': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      `,
      'ventas': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <line x1="2" y1="11" x2="22" y2="11"/>
          <line x1="2" y1="16" x2="22" y2="16"/>
          <circle cx="16" cy="13" r="1"/>
          <circle cx="8" cy="18" r="1"/>
        </svg>
      `,
      'carta': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16v16H4z"/>
          <path d="M8 8h8v8H8z"/>
          <path d="M8 12h8"/>
          <path d="M12 4v4"/>
          <path d="M12 16v4"/>
        </svg>
      `,
      'precios': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v2M12 16v2M8 10h2M14 10h2M8 14h8"/>
        </svg>
      `,
      'mantenimiento': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      `,
      'personal': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      `,
      'reportes': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16v16H4z"/>
          <path d="M8 8h8v8H8z"/>
          <path d="M8 12h8"/>
          <path d="M4 4L8 8"/>
          <path d="M20 4L16 8"/>
          <path d="M4 20L8 16"/>
          <path d="M20 20L16 16"/>
        </svg>
      `
    };
    return icons[icon] || icons['dashboard'];
  }
}