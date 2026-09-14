// src/app/features/admin/dashboard-admin/dashboard-admin.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ProductoService } from '../../../core/services/producto.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { PedidoClienteService } from '../../../core/services/pedido-cliente.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss'],
})
export class DashboardAdminComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private productoService = inject(ProductoService);
  private usuarioService = inject(UsuarioService);
  private pedidoService = inject(PedidoService);
  private pedidoClienteService = inject(PedidoClienteService);
  private router = inject(Router);

  usuario = signal<any>(null);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  fechaActual = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  horaActual = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  stats = signal([
    {
      icon: 'productos',
      label: 'Productos Registrados',
      value: 0,
      color: '#c43129',
      bgColor: '#c4312920',
    },
    {
      icon: 'ventas',
      label: 'Ventas Hoy',
      value: 0,
      color: '#d6ad31',
      bgColor: '#d6ad3120',
    },
    {
      icon: 'pendientes',
      label: 'Pedidos Pendientes',
      value: 0,
      color: '#71492f',
      bgColor: '#71492f20',
    },
    {
      icon: 'ingresos',
      label: 'Ingresos Totales',
      value: 'S/ 0.00',
      color: '#432c1c',
      bgColor: '#432c1c20',
    },
    {
      icon: 'usuarios',
      label: 'Usuarios Activos',
      value: 0,
      color: '#c43129',
      bgColor: '#c4312920',
    },
    {
      icon: 'local',
      label: 'Ventas en Local',
      value: 0,
      color: '#71492f',
      bgColor: '#71492f20',
    },
  ]);

  resumenVentas = signal({
    totalVentas: 0,
    ventasLocal: 0,
    ventasDelivery: 0,
    totalRecaudado: 0,
    recaudadoLocal: 0,
    recaudadoDelivery: 0,
    ventasHoy: 0,
    recaudadoHoy: 0,
  });

  ventasRecientes = signal<any[]>([]);
  pedidosPendientes = signal<any[]>([]);

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'admin') {
      this.router.navigate(['/login-admin']);
      return;
    }
    this.cargarDatos();
  }

  // ============================================
  // CARGAR DATOS
  // ============================================
  cargarDatos(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    let solicitudesCompletadas = 0;
    const totalSolicitudes = 5;

    const verificarFinalizado = () => {
      solicitudesCompletadas++;
      if (solicitudesCompletadas >= totalSolicitudes) {
        this.loading.set(false);
      }
    };

    // 1. Productos
    this.productoService.obtenerProductos().subscribe({
      next: (productos) => {
        this.actualizarStat('productos', productos?.length || 0);
        verificarFinalizado();
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        verificarFinalizado();
      },
    });

    // 2. Usuarios
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        const activos = (usuarios || []).filter((u: any) => u.activo !== false);
        this.actualizarStat('usuarios', activos.length);
        verificarFinalizado();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        verificarFinalizado();
      },
    });

    // 3. Pedidos pendientes (mesero/admin)
    this.pedidoService.obtenerPedidosPendientes().subscribe({
      next: (pedidos) => {
        const pendientes = pedidos || [];
        this.pedidosPendientes.set(pendientes);
        verificarFinalizado();
      },
      error: (err) => {
        console.error('Error al cargar pedidos pendientes:', err);
        verificarFinalizado();
      },
    });

    // 4. Pedidos web pendientes (por confirmar)
    this.pedidoClienteService.obtenerPendientes().subscribe({
      next: (pedidosWeb) => {
        const pendientesWeb = pedidosWeb || [];
        const totalPendientes = this.pedidosPendientes().length + pendientesWeb.length;
        this.actualizarStat('pendientes', totalPendientes);
        verificarFinalizado();
      },
      error: (err) => {
        console.error('Error al cargar pedidos web pendientes:', err);
        verificarFinalizado();
      },
    });

    // 5. RESUMEN UNIFICADO (ventas + pedidos web confirmados)
    this.dashboardService.obtenerResumenUnificado().subscribe({
      next: (response) => {
        if (response?.success) {
          const { resumen, ventasRecientes: recientes } = response;

          // Actualizar stats
          this.actualizarStat('ventas', resumen.ventasHoy || 0);
          this.actualizarStat('ingresos', `S/ ${(resumen.totalRecaudado || 0).toFixed(2)}`);
          this.actualizarStat('local', resumen.ventasLocal || 0);

          // Actualizar resumen
          this.resumenVentas.set({
            totalVentas: resumen.totalVentas || 0,
            ventasLocal: resumen.ventasLocal || 0,
            ventasDelivery: resumen.ventasDelivery || 0,
            totalRecaudado: resumen.totalRecaudado || 0,
            recaudadoLocal: resumen.recaudadoLocal || 0,
            recaudadoDelivery: resumen.recaudadoDelivery || 0,
            ventasHoy: resumen.ventasHoy || 0,
            recaudadoHoy: resumen.recaudadoHoy || 0
          });

          // Actualizar ventas recientes
          const recientesFormateados = (recientes || []).map((v: any) => ({
            id: v.id,
            cliente: v.cliente_nombre || 'Consumidor Final',
            total: parseFloat(v.total) || 0,
            fecha: v.fecha ? this.formatearFecha(v.fecha) : '--',
            estado: v.estado || 'completada',
            tipo: v.tipo_entrega || 'local',
            origen: v.origen || 'venta'
          }));
          this.ventasRecientes.set(recientesFormateados);

          verificarFinalizado();
        } else {
          this.errorMessage.set('Error al cargar resumen');
          verificarFinalizado();
        }
      },
      error: (err) => {
        console.error('Error al cargar resumen unificado:', err);
        this.errorMessage.set('Error al cargar resumen de ventas');
        verificarFinalizado();
      }
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================
  formatearFecha(fecha: string): string {
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fecha;
    }
  }

  actualizarStat(icono: string, valor: any): void {
    this.stats.update((stats) =>
      stats.map((s) => (s.icon === icono ? { ...s, value: valor } : s))
    );
  }

  getEstadoClass(estado: string): string {
    const clases: any = {
      completada: 'estado-completada',
      Completada: 'estado-completada',
      pendiente: 'estado-pendiente',
      Pendiente: 'estado-pendiente',
      cancelada: 'estado-cancelada',
      Cancelada: 'estado-cancelada',
      entregado: 'estado-completada',
    };
    return clases[estado] || 'estado-pendiente';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      completada: 'Completada',
      Completada: 'Completada',
      pendiente: 'Pendiente',
      Pendiente: 'Pendiente',
      cancelada: 'Cancelada',
      Cancelada: 'Cancelada',
      entregado: 'Completada',
    };
    return textos[estado] || estado;
  }

  // Origen de la venta
  getOrigenLabel(origen: string): string {
    const labels: any = {
      venta: 'Mesero',
      pedido_web: 'Carta Web'
    };
    return labels[origen] || 'Mesero';
  }

  getOrigenClass(origen: string): string {
    return origen === 'pedido_web' ? 'origen-web' : 'origen-venta';
  }

  // Tipo de entrega
  getTipoLabel(tipo: string): string {
    const labels: any = {
      local: 'Local',
      delivery: 'Motorizado',
      motorizada: 'Motorizado',
      paraLlevar: 'Para Llevar'
    };
    return labels[tipo] || 'Local';
  }

  getTipoClass(tipo: string): string {
    if (tipo === 'delivery' || tipo === 'motorizada') return 'delivery';
    if (tipo === 'paraLlevar') return 'paraLlevar';
    return 'local';
  }

  refrescar(): void {
    this.cargarDatos();
  }
}