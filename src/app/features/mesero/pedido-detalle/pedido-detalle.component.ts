// pedido-detalle.component.ts - COMPLETO CORREGIDO

import { Component, Input, Output, EventEmitter, signal, computed, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedido-detalle.component.html',
  styleUrls: ['./pedido-detalle.component.scss']
})
export class PedidoDetalleComponent implements OnChanges {
  @Input() pedido: any = null;
  @Input() visible = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() actualizarEstado = new EventEmitter<{ id: number, estado: string }>();

  // ✅ Estado interno para los items
  itemsInternos = signal<any[]>([]);
  clienteNombre = signal<string>('Cliente');
  usuarioNombre = signal<string>('Desconocido');
  fechaPedido = signal<string>('');
  totalItemsCount = signal<number>(0);

  // Estados disponibles
  estadosDisponibles = [
    { value: 'pendiente', label: 'Pendiente', class: 'estado-pendiente' },
    { value: 'preparando', label: 'Preparando', class: 'estado-preparando' },
    { value: 'listo', label: 'Listo', class: 'estado-listo' },
    { value: 'entregado', label: 'Entregado', class: 'estado-entregado' },
    { value: 'cancelado', label: 'Cancelado', class: 'estado-cancelado' }
  ];

  // ✅ Computed properties con datos internos
  totalItems = computed(() => this.itemsInternos().length);
  itemsPedido = computed(() => this.itemsInternos());
  
  subtotal = computed(() => {
    return this.itemsInternos().reduce((sum: number, item: any) => {
      const precio = typeof item.precio === 'string' ? parseFloat(item.precio) : (item.precio || 0);
      const cantidad = typeof item.cantidad === 'string' ? parseInt(item.cantidad) : (item.cantidad || 1);
      return sum + (precio * cantidad);
    }, 0);
  });

  igv = computed(() => this.subtotal() * 0.18);
  total = computed(() => this.subtotal() + this.igv());

  // ✅ Cuando cambia el pedido, procesar los datos
  ngOnChanges(): void {
    if (this.pedido) {
      this.procesarPedido();
    }
  }

  // ✅ Procesar el pedido al recibirlo
  private procesarPedido(): void {
    console.log('🔄 Procesando pedido en detalle:', this.pedido);
    
    // Extraer items
    let items = this.pedido.items || [];
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        console.error('Error al parsear items:', e);
        items = [];
      }
    }
    if (!Array.isArray(items)) {
      items = [];
    }
    
    this.itemsInternos.set(items);
    this.totalItemsCount.set(items.length);
    
    // Cliente
    this.clienteNombre.set(
      this.pedido.cliente_nombre_real || 
      this.pedido.cliente_nombre || 
      'Cliente'
    );
    
    // Usuario
    this.usuarioNombre.set(
      this.pedido.usuario_nombre || 
      'Desconocido'
    );
    
    // Fecha
    if (this.pedido.created_at) {
      this.fechaPedido.set(this.pedido.created_at);
    } else {
      this.fechaPedido.set(new Date().toISOString());
    }
    
    console.log('✅ Items procesados:', this.itemsInternos());
    console.log('✅ Total items:', this.totalItemsCount());
  }

  // ✅ MÉTODOS EXISTENTES
  getEstadoClass(estado: string): string {
    const clases: any = {
      'pendiente': 'estado-pendiente',
      'preparando': 'estado-preparando',
      'listo': 'estado-listo',
      'entregado': 'estado-entregado',
      'cancelado': 'estado-cancelado'
    };
    return clases[estado] || 'estado-pendiente';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      'pendiente': 'Pendiente',
      'preparando': 'Preparando',
      'listo': 'Listo',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  }

  getEstadoSvg(estado: string): string {
    const svgs: any = {
      'pendiente': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
      'preparando': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/></svg>`,
      'listo': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
      'entregado': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="15" height="13" rx="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/></svg>`,
      'cancelado': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    };
    return svgs[estado] || svgs['pendiente'];
  }

  getTipoEntregaLabel(tipo: string): string {
    const labels: any = {
      'local': 'Local',
      'delivery': 'Motorizado',
      'paraLlevar': 'Para Llevar',
      'motorizada': 'Motorizado'
    };
    return labels[tipo] || 'Local';
  }

  getTipoEntregaIcono(tipo: string): string {
    const iconos: any = {
      'local': '🏠',
      'delivery': '🛵',
      'paraLlevar': '📦',
      'motorizada': '🛵'
    };
    return iconos[tipo] || '🏠';
  }

  formatearFecha(fecha: string): string {
    try {
      if (!fecha) return '--/--/----';
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return '--/--/----';
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--/--/----';
    }
  }

  formatearPrecio(precio: number | string): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : (precio || 0);
    return `S/ ${num.toFixed(2)}`;
  }

  cambiarEstado(estado: string): void {
    if (!this.pedido) return;
    if (confirm(`¿Cambiar estado a "${this.getEstadoTexto(estado)}"?`)) {
      this.actualizarEstado.emit({ id: this.pedido.id, estado });
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  onModalClick(event: Event): void {
    event.stopPropagation();
  }
}