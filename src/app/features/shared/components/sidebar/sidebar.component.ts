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
      icon: '📋', 
      label: 'Carta', 
      route: '/admin/carta-admin'
    },
    { 
      icon: '📦', 
      label: 'Mantenimiento', 
      route: '/admin/mantenimiento'
    },
    { 
      icon: '🛒', 
      label: 'Compras', 
      route: '/admin/compras'
    },
    { 
      icon: '📤', 
      label: 'Descargos', 
      route: '/admin/descargos'
    },
    { 
      icon: '👤', 
      label: 'Personal', 
      route: '/admin/personal'
    },
    { 
      icon: '📊', 
      label: 'Reportes', 
      route: '/admin/reportes'
    }
  ]);
}