// src/app/features/shared/components/sidebar/sidebar.component.ts
import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface SidebarItem {
  icon: 'dashboard' | 'ventas' | 'carta' | 'personal' | 'historial' | 'reportes';
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  readonly menuItems = signal<SidebarItem[]>([
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
      label: 'Carta / Productos',
      route: '/admin/carta-admin'
    },
    {
      icon: 'personal',
      label: 'Personal',
      route: '/admin/personal'
    },
    {
      icon: 'historial',
      label: 'Historial Clientes',
      route: '/admin/historial-cliente'
    },
    {
      icon: 'reportes',
      label: 'Reportes',
      route: '/admin/reportes'
    }
  ]);
}
