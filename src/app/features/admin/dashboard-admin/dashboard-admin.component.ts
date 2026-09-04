// src/app/features/admin/dashboard-admin/dashboard-admin.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';
import { VentaService } from '../../../core/services/venta.service';
import { ProductoService } from '../../../core/services/producto.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { PedidoService } from '../../../core/services/pedido.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  // ✅ CORREGIDO: template correcto
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss']
})
// ✅ CORREGIDO: nombre de clase correcto
export class DashboardAdminComponent implements OnInit {
  private authService = inject(AuthService);
  private ventaService = inject(VentaService);
  private productoService = inject(ProductoService);
  private usuarioService = inject(UsuarioService);
  private pedidoService = inject(PedidoService);
  private sanitizer = inject(DomSanitizer);

  auth = this.authService;

  usuario = signal<any>(null);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  orders = signal<any[]>([]);
  
  readonly statusLabels: Record<string, string> = {
    pendiente_pago: 'Pendiente Pago',
    pagado: 'Pagado',
    en_preparacion: 'En Preparación',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
    expirado: 'Expirado'
  };

  readonly statusFlow: string[] = ['pendiente_pago', 'pagado', 'en_preparacion', 'entregado'];

  fechaActual = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  horaActual = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  stats = signal([
    {
      icon: 'productos',
      label: 'Productos Registrados',
      value: 0,
      color: '#c43129',
      bgColor: '#c4312920'
    },
    {
      icon: 'ventas',
      label: 'Ventas Hoy',
      value: 0,
      color: '#d6ad31',
      bgColor: '#d6ad3120'
    },
    {
      icon: 'pendientes',
      label: 'Pedidos Pendientes',
      value: 0,
      color: '#71492f',
      bgColor: '#71492f20'
    },
    {
      icon: 'ingresos',
      label: 'Ingresos Totales',
      value: 'S/ 0.00',
      color: '#432c1c',
      bgColor: '#432c1c20'
    },
    {
      icon: 'usuarios',
      label: 'Usuarios Activos',
      value: 0,
      color: '#c43129',
      bgColor: '#c4312920'
    },
    {
      icon: 'local',
      label: 'Ventas en Local',
      value: 0,
      color: '#71492f',
      bgColor: '#71492f20'
    }
  ]);

  resumenVentas = signal({
    totalVentas: 0,
    ventasLocal: 0,
    ventasDelivery: 0,
    totalRecaudado: 0,
    recaudadoLocal: 0,
    recaudadoDelivery: 0
  });

  ventasRecientes = signal<any[]>([]);
  pedidosPendientes = signal<any[]>([]);

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    this.cargarDatos();
    this.cargarPedidosVivo();
  }

  cargarPedidosVivo(): void {
    this.pedidoService.obtenerPedidosPendientes().subscribe({
      next: (pedidos) => {
        this.orders.set(pedidos || []);
      },
      error: (err) => {
        console.error('Error al cargar pedidos en vivo:', err);
      }
    });
  }

  nextStatus(order: any): void {
    const idx = this.statusFlow.indexOf(order.status || order['estado']);
    if (idx === -1 || idx === this.statusFlow.length - 1) return;
    const next = this.statusFlow[idx + 1];
    
    this.pedidoService.updateOrderStatus(Number(order.id), next).subscribe({
      next: (updated: any) => {
        this.orders.update((list) =>
          list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
        );
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
      }
    });
  }

  reprint(order: any): void {
    this.pedidoService.reprintVoucher(Number(order.id)).subscribe({
      next: (res: any) => {
        if (res?.pdfPath) {
          window.open(res.pdfPath, '_blank');
        }
      },
      error: (err) => {
        console.error('Error al reimprimir:', err);
      }
    });
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    let solicitudesCompletadas = 0;
    const totalSolicitudes = 4;
    const verificarFinalizado = () => {
      solicitudesCompletadas++;
      if (solicitudesCompletadas >= totalSolicitudes) {
        this.loading.set(false);
      }
    };

    this.productoService.obtenerProductos().subscribe({
      next: (productos) => {
        this.actualizarStat('productos', productos?.length || 0);
        verificarFinalizado();
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.errorMessage.set('Error al cargar productos');
        verificarFinalizado();
      }
    });

    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        this.actualizarStat('usuarios', usuarios?.length || 0);
        verificarFinalizado();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        verificarFinalizado();
      }
    });

    this.pedidoService.obtenerPedidosPendientes().subscribe({
      next: (pedidos) => {
        this.pedidosPendientes.set(pedidos || []);
        this.actualizarStat('pendientes', pedidos?.length || 0);
        verificarFinalizado();
      },
      error: (err) => {
        console.error('Error al cargar pedidos pendientes:', err);
        verificarFinalizado();
      }
    });

    this.ventaService.obtenerVentas().subscribe({
      next: (ventas) => {
        const ventasArray = ventas || [];
        const hoy = new Date().toISOString().split('T')[0];
        const ventasHoy = ventasArray.filter((v: any) => v.fecha_venta?.startsWith(hoy));

        this.actualizarStat('ventas', ventasHoy.length);

        const total = ventasArray.reduce((sum: number, v: any) => {
          const totalVenta = parseFloat(v.total) || 0;
          return sum + totalVenta;
        }, 0);

        this.actualizarStat('ingresos', `S/ ${total.toFixed(2)}`);

        const local = ventasArray.filter((v: any) => v.tipo_entrega === 'local' || v.tipo_entrega === 'paraLlevar');
        const delivery = ventasArray.filter((v: any) => v.tipo_entrega === 'delivery' || v.tipo_entrega === 'motorizada');

        const totalLocal = local.reduce((sum: number, v: any) => {
          const totalVenta = parseFloat(v.total) || 0;
          return sum + totalVenta;
        }, 0);

        const totalDelivery = delivery.reduce((sum: number, v: any) => {
          const totalVenta = parseFloat(v.total) || 0;
          return sum + totalVenta;
        }, 0);

        this.actualizarStat('local', local.length);

        this.resumenVentas.set({
          totalVentas: ventasArray.length,
          ventasLocal: local.length,
          ventasDelivery: delivery.length,
          totalRecaudado: total,
          recaudadoLocal: totalLocal,
          recaudadoDelivery: totalDelivery
        });

        const recientes = ventasArray.slice(-10).reverse().map((v: any) => ({
          id: v.id,
          cliente: v.cliente_nombre || v.cliente || 'Consumidor Final',
          total: parseFloat(v.total) || 0,
          fecha: v.fecha_venta ? this.formatearFecha(v.fecha_venta) : '--',
          estado: v.estado || 'completada',
          tipo: v.tipo_entrega || 'local'
        }));
        this.ventasRecientes.set(recientes);
        verificarFinalizado();
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.errorMessage.set('Error al cargar ventas');
        verificarFinalizado();
      }
    });
  }

  formatearFecha(fecha: string): string {
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  actualizarStat(icono: string, valor: any): void {
    this.stats.update(stats =>
      stats.map(s =>
        s.icon === icono ? { ...s, value: valor } : s
      )
    );
  }

  getEstadoClass(estado: string): string {
    const clases: any = {
      'completada': 'estado-completada',
      'Completada': 'estado-completada',
      'pendiente': 'estado-pendiente',
      'Pendiente': 'estado-pendiente',
      'cancelada': 'estado-cancelada',
      'Cancelada': 'estado-cancelada',
      'entregado': 'estado-completada'
    };
    return clases[estado] || 'estado-pendiente';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      'completada': 'Completada',
      'Completada': 'Completada',
      'pendiente': 'Pendiente',
      'Pendiente': 'Pendiente',
      'cancelada': 'Cancelada',
      'Cancelada': 'Cancelada',
      'entregado': 'Completada'
    };
    return textos[estado] || estado;
  }

  getEstadoSvg(estado: string): SafeHtml {
    const svgs: any = {
      'completada': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
      'Completada': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
      'pendiente': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
      'Pendiente': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
      'cancelada': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      'Cancelada': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      'entregado': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`
    };
    return this.sanitizer.bypassSecurityTrustHtml(svgs[estado] || svgs['pendiente']);
  }

  getIconSvg(icon: string): SafeHtml {
    const icons: any = {
      'productos': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      'ventas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><line x1="2" y1="12" x2="22" y2="12"/><circle cx="16" cy="15" r="1"/><circle cx="8" cy="15" r="1"/></svg>`,
      'pendientes': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
      'ingresos': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v2M12 16v2M8 10h2M14 10h2M8 14h8"/></svg>`,
      'usuarios': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      'local': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
    };
    return this.sanitizer.bypassSecurityTrustHtml(icons[icon] || icons['productos']);
  }

  getTipoSvg(tipo: string): SafeHtml {
    const icons: any = {
      'local': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      'delivery': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="1" y="4" width="15" height="13" rx="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/></svg>`,
      'paraLlevar': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`
    };
    return this.sanitizer.bypassSecurityTrustHtml(icons[tipo] || icons['local']);
  }

  getTipoIcono(tipo: string): string {
    const iconos: any = {
      'local': '🏠',
      'delivery': '🛵',
      'paraLlevar': '📦',
      'motorizada': '🛵'
    };
    return iconos[tipo] || '🏠';
  }

  refrescar(): void {
    this.cargarDatos();
    this.cargarPedidosVivo();
  }

  logout(): void {
    this.authService.logout();
  }
}