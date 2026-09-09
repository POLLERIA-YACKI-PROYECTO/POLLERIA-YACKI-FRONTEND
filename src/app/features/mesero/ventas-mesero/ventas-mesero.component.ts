// src/app/features/mesero/ventas-mesero/ventas-mesero.component.ts
import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-ventas-mesero',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './ventas-mesero.component.html',
  styleUrls: ['./ventas-mesero.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class VentasMeseroComponent implements OnInit {
  private authService = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');
  loading = signal<boolean>(true);

  ventas = signal<any[]>([]);
  ventasRecientes = signal<any[]>([]);

  totalVentas = computed(() => this.ventas().length);
  totalVentasLocal = computed(() => this.ventas().filter(v => v.tipo_entrega === 'local' || v.tipo_entrega === 'paraLlevar').length);
  totalVentasDelivery = computed(() => this.ventas().filter(v => v.tipo_entrega === 'delivery' || v.tipo_entrega === 'motorizada').length);

  totalRecaudado = computed(() => {
    return this.ventas().reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  });

  totalRecaudadoLocal = computed(() => {
    return this.ventas()
      .filter(v => v.tipo_entrega === 'local' || v.tipo_entrega === 'paraLlevar')
      .reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  });

  totalRecaudadoDelivery = computed(() => {
    return this.ventas()
      .filter(v => v.tipo_entrega === 'delivery' || v.tipo_entrega === 'motorizada')
      .reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  });

  promedioVenta = computed(() => {
    const total = this.totalVentas();
    return total > 0 ? this.totalRecaudado() / total : 0;
  });

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.loading.set(true);
    
    this.pedidoService.obtenerPedidosPagadosMesero().subscribe({
      next: (pedidos: any[]) => {
        console.log('📝 Pedidos entregados del mesero:', pedidos);
        
        const ventasFormateadas = pedidos.map((p: any) => {
          let items = p.items;
          if (typeof items === 'string') {
            try {
              items = JSON.parse(items);
            } catch (e) {
              items = [];
            }
          }
          
          return {
            id: p.id,
            cliente_nombre: p.cliente_nombre_real || p.cliente_nombre || 'Consumidor Final',
            items: items || [],
            total: parseFloat(p.total) || 0,
            subtotal: parseFloat(p.subtotal) || 0,
            igv: parseFloat(p.igv) || 0,
            tipo_entrega: p.tipo_entrega || 'local',
            metodo_pago: p.metodo_pago || 'efectivo',
            estado: p.estado || 'completada',
            fecha_venta: p.fecha_pago || p.created_at,
            created_at: p.created_at,
            usuario_nombre: p.usuario_nombre_completo || p.usuario_nombre || 'Mesero',
            observaciones: p.observaciones || '',
            mesa_id: p.mesa_id || null
          };
        });

        // Ordenar por fecha descendente
        ventasFormateadas.sort((a: any, b: any) => {
          return new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime();
        });

        this.ventas.set(ventasFormateadas);
        this.ventasRecientes.set(ventasFormateadas.slice(0, 20));
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error al cargar ventas:', err);
        this.loading.set(false);
      }
    });
  }

  // ============================================
  // FORMATO
  // ============================================
  formatearPrecio(valor: number): string {
    return `S/ ${valor.toFixed(2)}`;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '--';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // ============================================
  // TIPO ENTREGA
  // ============================================
  getTipoEntregaLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'local': 'Local',
      'paraLlevar': 'Para Llevar',
      'delivery': 'Motorizado',
      'motorizada': 'Motorizado'
    };
    return labels[tipo] || 'Local';
  }

  getTipoEntregaSvg(tipo: string): string {
    if (tipo === 'delivery' || tipo === 'motorizada') {
      return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="15" height="13" rx="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/></svg>`;
    }
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
  }

  // ============================================
  // MÉTODO PAGO
  // ============================================
  getMetodoPagoLabel(metodo: string): string {
    const labels: Record<string, string> = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'yape': 'Yape',
      'plin': 'Plin',
      'transferencia': 'Transferencia'
    };
    return labels[metodo] || metodo;
  }

  getMetodoPagoSvg(metodo: string): string {
    const svgs: Record<string, string> = {
      'efectivo': `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v2M12 16v2M8 10h2M14 10h2M8 14h8"/></svg>`,
      'tarjeta': `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
      'yape': `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
      'plin': `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6v6l4 2"/></svg>`,
      'transferencia': `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18"/><path d="M18 7l5 5-5 5"/><path d="M6 7l-5 5 5 5"/></svg>`
    };
    return svgs[metodo] || svgs['efectivo'];
  }

  // ============================================
  // ESTADO
  // ============================================
  getEstadoTexto(estado: string): string {
    const textos: Record<string, string> = {
      'completada': 'Completada',
      'pendiente': 'Pendiente',
      'cancelada': 'Cancelada'
    };
    return textos[estado] || estado;
  }

  getEstadoClass(estado: string): string {
    const clases: Record<string, string> = {
      'completada': 'estado-completada',
      'pendiente': 'estado-pendiente',
      'cancelada': 'estado-cancelada'
    };
    return clases[estado] || 'estado-pendiente';
  }

  getEstadoSvg(estado: string): string {
    const svgs: Record<string, string> = {
      'completada': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
      'pendiente': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      'cancelada': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    };
    return svgs[estado] || svgs['pendiente'];
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================
  nuevaVenta(): void {
    this.router.navigate(['/mesero/pedidos']);
  }

  toggleTema(): void {
    this.temaOscuro.set(!this.temaOscuro());
  }

  toggleMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  seleccionarOpcion(opcion: string): void {
    this.opcionSeleccionada.set(opcion);
    this.menuAbierto.set(false);

    const rutas: Record<string, string> = {
      'carta': '/mesero/carta',
      'mesas': '/mesero/mesas',
      'pedidos': '/mesero/pedidos',
      'precios': '/mesero/precios',
      'ventas': '/mesero/ventas',
      'tickets': '/mesero/tickets',
      'dashboard': '/mesero/dashboard'
    };

    const ruta = rutas[opcion];
    if (ruta) {
      this.router.navigate([ruta]);
    }
  }

  irCarta(): void {
    this.router.navigate(['/mesero/carta']);
  }

  irMesas(): void {
    this.router.navigate(['/mesero/mesas']);
  }

  irPedidos(): void {
    this.router.navigate(['/mesero/pedidos']);
  }

  irPrecios(): void {
    this.router.navigate(['/mesero/precios']);
  }

  irVentas(): void {
    this.router.navigate(['/mesero/ventas']);
  }

  irTicket(): void {
    this.router.navigate(['/mesero/tickets']);
  }

  irDashboard(): void {
    this.router.navigate(['/mesero/dashboard']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-mesero']);
  }
}