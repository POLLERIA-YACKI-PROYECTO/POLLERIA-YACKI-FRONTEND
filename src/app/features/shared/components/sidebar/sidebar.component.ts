// src/app/features/shared/components/sidebar/sidebar.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

// ✅ Iconos como constantes FUERA del componente (se evalúan 1 sola vez)
const ICONS: Record<string, string> = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  ventas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  pedidos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
  carta: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 8h8v8H8z"/><path d="M8 12h8"/><path d="M4 4v2"/><path d="M20 4v2"/><path d="M4 20v-2"/><path d="M20 20v-2"/><circle cx="12" cy="16" r="1"/></svg>`,
  personal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  historial: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  reportes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2"/><circle cx="12" cy="16" r="5"/><path d="M12 11v5"/><path d="M9 13l3 3 3-3"/></svg>`,
};

// ✅ Menú con SVG pre-computado (NO hay que llamar a getIconSvg en el template)
interface MenuItem {
  icon: string;
  iconSvg: string;
  label: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: 'dashboard', iconSvg: ICONS['dashboard'], label: 'Dashboard', route: '/admin/dashboard-admin' },
  { icon: 'ventas', iconSvg: ICONS['ventas'], label: 'Ventas', route: '/admin/ventas-admin' },
  { icon: 'pedidos', iconSvg: ICONS['pedidos'], label: 'Pedidos Clientes', route: '/admin/pedidos-clientes' },
  { icon: 'carta', iconSvg: ICONS['carta'], label: 'Carta / Productos', route: '/admin/carta-admin' },
  { icon: 'personal', iconSvg: ICONS['personal'], label: 'Personal', route: '/admin/personal' },
  { icon: 'historial', iconSvg: ICONS['historial'], label: 'Historial Clientes', route: '/admin/historial-cliente' },
  { icon: 'reportes', iconSvg: ICONS['reportes'], label: 'Reportes', route: '/admin/reportes' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  // ✅ Signal con items pre-computados (NO recalcula en cada CD)
  menuItems = signal<MenuItem[]>(MENU_ITEMS);
}