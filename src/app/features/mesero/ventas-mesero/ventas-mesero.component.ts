// src/app/features/mesero/ventas-mesero/ventas-mesero.component.ts
import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VentaService } from '../../../core/services/venta.service';
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
  private ventaService = inject(VentaService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');
  loading = signal<boolean>(true);

  // Datos de ventas
  ventas = signal<any[]>([]);
  ventasLocal = signal<any[]>([]);
  ventasDelivery = signal<any[]>([]);

  // Estadísticas
  totalVentas = computed(() => this.ventas().length);
  totalVentasLocal = computed(() => this.ventasLocal().length);
  totalVentasDelivery = computed(() => this.ventasDelivery().length);

  totalRecaudado = computed(() => {
    return this.ventas().reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  });

  totalRecaudadoLocal = computed(() => {
    return this.ventasLocal().reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  });

  totalRecaudadoDelivery = computed(() => {
    return this.ventasDelivery().reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  });

  // Promedios
  promedioVenta = computed(() => {
    const total = this.totalVentas();
    return total > 0 ? this.totalRecaudado() / total : 0;
  });

  // Últimas 10 ventas
  ventasRecientes = computed(() => {
    return this.ventas().slice(0, 10);
  });

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);

    this.ventaService.obtenerVentasPorUsuario(this.usuario().id).subscribe({
      next: (ventas: any[]) => {
        // Parsear items de cada venta
        const ventasParseadas = ventas.map((v: any) => {
          if (v.items && typeof v.items === 'string') {
            try {
              v.items = JSON.parse(v.items);
            } catch (e) {
              v.items = [];
            }
          }
          return v;
        });
        this.ventas.set(ventasParseadas);
        this.organizarVentas(ventasParseadas);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.loading.set(false);
      }
    });
  }

  organizarVentas(ventas: any[]): void {
    const local = ventas.filter(v => 
      v.tipo_entrega === 'local' || 
      v.tipo_entrega === 'paraLlevar' ||
      v.tipo_entrega === 'local'
    );
    const delivery = ventas.filter(v => 
      v.tipo_entrega === 'delivery' || 
      v.tipo_entrega === 'motorizada'
    );

    this.ventasLocal.set(local);
    this.ventasDelivery.set(delivery);
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

    const rutas: { [key: string]: string } = {
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

  // ✅ MÉTODOS PARA SVG
  getEstadoSvg(estado: string): string {
    const svgs: any = {
      'completada': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg>`,
      'pendiente': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
      'cancelada': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    };
    return svgs[estado] || svgs['pendiente'];
  }

  getEstadoClass(estado: string): string {
    const clases: any = {
      'completada': 'estado-completada',
      'pendiente': 'estado-pendiente',
      'cancelada': 'estado-cancelada'
    };
    return clases[estado] || '';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      'completada': 'Completada',
      'pendiente': 'Pendiente',
      'cancelada': 'Cancelada'
    };
    return textos[estado] || estado;
  }

  getMetodoPagoSvg(metodo: string): string {
    const svgs: any = {
      'efectivo': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 6v2M12 16v2M8 10h2M14 10h2M8 14h8"/></svg>`,
      'tarjeta': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
      'yape': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
      'plin': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
      'transferencia': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></svg>`
    };
    return svgs[metodo] || svgs['efectivo'];
  }

  getMetodoPagoLabel(metodo: string): string {
    const labels: any = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'yape': 'Yape',
      'plin': 'Plin',
      'transferencia': 'Transferencia'
    };
    return labels[metodo] || metodo;
  }

  getTipoEntregaSvg(tipo: string): string {
    const svgs: any = {
      'local': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      'delivery': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="1" y="4" width="15" height="13" rx="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/></svg>`,
      'paraLlevar': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      'motorizada': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="1" y="4" width="15" height="13" rx="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/></svg>`
    };
    return svgs[tipo] || svgs['local'];
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

  formatearPrecio(valor: number | string): string {
    const num = typeof valor === 'string' ? parseFloat(valor) : (valor || 0);
    return `S/ ${num.toFixed(2)}`;
  }

  verDetalle(id: number): void {
    alert(`📋 Ver detalle de venta #${id}`);
  }

  nuevaVenta(): void {
    this.router.navigate(['/mesero/pedidos']);
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