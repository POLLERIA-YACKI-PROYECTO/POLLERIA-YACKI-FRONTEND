// src/app/features/carta-cliente/components/categorias-nav/categorias-nav.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CategoriaNav {
  id: number;
  nombre: string;
  icono: string;
}

// ✅ CATEGORÍAS FIJAS EN EL FRONTEND
const CATEGORIAS_FIJAS: CategoriaNav[] = [
  { id: 1, nombre: 'Brasas', icono: '🍗' },
  { id: 2, nombre: 'Broasters', icono: '🍗' },
  { id: 3, nombre: 'Mostro Brasa', icono: '🍗' },
  { id: 4, nombre: 'Mostro Broaster', icono: '🍗' },
  { id: 5, nombre: 'Piezas de Pollo', icono: '🍗' },
  { id: 6, nombre: 'Alitas', icono: '🍗' },
  { id: 7, nombre: 'Salchipapas', icono: '🌭' },
  { id: 8, nombre: 'Hamburguesas', icono: '🍔' },
  { id: 9, nombre: 'Don Menú', icono: '🍗' },
  { id: 10, nombre: 'Adicionales', icono: '🍟' },
  { id: 11, nombre: 'Chifa y Plancha', icono: '🍚' },
  { id: 12, nombre: 'Promos Brasa', icono: '🔥' },
  { id: 13, nombre: 'Gaseosas', icono: '🥤' },
  { id: 14, nombre: 'Cervezas', icono: '🍺' },
  { id: 15, nombre: 'Aguas', icono: '💧' },
  { id: 16, nombre: 'Infusiones', icono: '☕' },
  { id: 17, nombre: 'Pepsi', icono: '🥤' },
  { id: 18, nombre: 'Chicha/Maracuyá', icono: '🧃' }
];

@Component({
  selector: 'app-categorias-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categorias-nav.component.html',
  styleUrls: ['./categorias-nav.component.scss']
})
export class CategoriasNavComponent {
  @Input() categoriaSeleccionada: number = 1;
  @Output() categoriaChange = new EventEmitter<number>();

  categorias = CATEGORIAS_FIJAS;
  dropdownAbierto = signal(false);

  get categoriaActual(): CategoriaNav | undefined {
    return this.categorias.find(c => c.id === this.categoriaSeleccionada);
  }

  seleccionarCategoria(id: number): void {
    this.categoriaSeleccionada = id;
    this.categoriaChange.emit(id);
    this.cerrarDropdown();
  }

  toggleDropdown(): void {
    this.dropdownAbierto.set(!this.dropdownAbierto());
  }

  cerrarDropdown(): void {
    this.dropdownAbierto.set(false);
  }

  // ✅ SVG Icons para categorías
  getCategoriaIcon(nombre: string): string {
    const icons: Record<string, string> = {
      'Brasas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 4 10 4 14c0 4 3 6 8 6s8-2 8-6c0-4-4-8-8-12z"/><path d="M12 18c-3 0-6-1-6-4"/></svg>`,
      'Broasters': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 4 10 4 14c0 4 3 6 8 6s8-2 8-6c0-4-4-8-8-12z"/><path d="M8 14c0 2 2 3 4 3s4-1 4-3"/><path d="M10 8l2 2 2-2"/></svg>`,
      'Mostro Brasa': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s2 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M12 4v2"/></svg>`,
      'Mostro Broaster': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s2 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M8 6l4-4 4 4"/></svg>`,
      'Piezas de Pollo': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 4 10 4 14c0 4 3 6 8 6s8-2 8-6c0-4-4-8-8-12z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>`,
      'Alitas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 4 10 4 14c0 4 3 6 8 6s8-2 8-6c0-4-4-8-8-12z"/><path d="M8 14c0-2 2-3 4-3s4 1 4 3"/><path d="M12 14v4"/></svg>`,
      'Salchipapas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><line x1="8" y1="4" x2="16" y2="4"/><line x1="6" y1="20" x2="18" y2="20"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="12"/></svg>`,
      'Hamburguesas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M6 12c0 2 2 4 6 4s6-2 6-4"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="8" r="1"/><path d="M6 8h12"/></svg>`,
      'Don Menú': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
      'Adicionales': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
      'Chifa y Plancha': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 4 10 4 14c0 4 3 6 8 6s8-2 8-6c0-4-4-8-8-12z"/><path d="M8 14c0 2 2 3 4 3s4-1 4-3"/><path d="M12 6v4"/></svg>`,
      'Promos Brasa': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><circle cx="12" cy="12" r="2"/></svg>`,
      'Gaseosas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20l4-12h8l4 12"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/><line x1="14" y1="8" x2="14" y2="20"/><line x1="6" y1="12" x2="18" y2="12"/></svg>`,
      'Cervezas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20l4-12h8l4 12"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/><line x1="10" y1="8" x2="10" y2="20"/><line x1="14" y1="8" x2="14" y2="20"/></svg>`,
      'Aguas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="18" y2="16"/><circle cx="12" cy="22" r="1"/></svg>`,
      'Infusiones': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v8c0 3-3 4-8 4s-8-1-8-4V6z"/><path d="M8 6V4c0-1 1-2 4-2s4 1 4 2v2"/><path d="M4 10h16"/></svg>`,
      'Pepsi': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 8l8 8"/><path d="M16 8l-8 8"/></svg>`,
      'Chicha/Maracuyá': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="18" y2="16"/><path d="M8 2l4 4 4-4"/></svg>`
    };
    return icons[nombre] || icons['Brasas'];
  }
}