// src/app/features/admin/dashboard-admin/dashboard-admin.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VentaService } from '../../../core/services/venta.service';
import { ProductoService } from '../../../core/services/producto.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { PedidoService } from '../../../core/services/pedido.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss'],
})
export class DashboardAdminComponent implements OnInit {
  private authService = inject(AuthService);
  private ventaService = inject(VentaService);
  private productoService = inject(ProductoService);
  private usuarioService = inject(UsuarioService);
  private pedidoService = inject(PedidoService);
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
      },
    });

    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        this.actualizarStat('usuarios', usuarios?.length || 0);
        verificarFinalizado();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        verificarFinalizado();
      },
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
      },
    });

    this.ventaService.obtenerVentas().subscribe({
      next: (ventas) => {
        const ventasArray = ventas || [];
        const hoy = this.obtenerFechaLocal(new Date());

        const ventasHoy = ventasArray.filter((venta: any) => {
          const fechaVenta = this.obtenerFechaVentaLocal(venta.fecha_venta);

          return fechaVenta === hoy;
        });

        this.actualizarStat('ventas', ventasHoy.length);

        const total = ventasArray.reduce((sum: number, v: any) => {
          const totalVenta = parseFloat(v.total) || 0;
          return sum + totalVenta;
        }, 0);

        this.actualizarStat('ingresos', `S/ ${total.toFixed(2)}`);

        const local = ventasArray.filter(
          (v: any) => v.tipo_entrega === 'local' || v.tipo_entrega === 'paraLlevar',
        );
        const delivery = ventasArray.filter(
          (v: any) => v.tipo_entrega === 'delivery' || v.tipo_entrega === 'motorizada',
        );

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
          recaudadoDelivery: totalDelivery,
        });

        const recientes = ventasArray
          .slice(-10)
          .reverse()
          .map((v: any) => ({
            id: v.id,
            cliente: v.cliente_nombre || v.cliente || 'Consumidor Final',
            total: parseFloat(v.total) || 0,
            fecha: v.fecha_venta ? this.formatearFecha(v.fecha_venta) : '--',
            estado: v.estado || 'completada',
            tipo: v.tipo_entrega || 'local',
          }));
        this.ventasRecientes.set(recientes);
        verificarFinalizado();
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.errorMessage.set('Error al cargar ventas');
        verificarFinalizado();
      },
    });
  }

  private obtenerFechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();

    const mes = String(fecha.getMonth() + 1).padStart(2, '0');

    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private obtenerFechaVentaLocal(valor: unknown): string | null {
    if (!valor) {
      return null;
    }

    const texto = String(valor).trim();

    const coincidencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (coincidencia) {
      return `${coincidencia[1]}-` + `${coincidencia[2]}-` + `${coincidencia[3]}`;
    }

    const fecha = new Date(texto);

    if (Number.isNaN(fecha.getTime())) {
      return null;
    }

    return this.obtenerFechaLocal(fecha);
  }

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
    this.stats.update((stats) => stats.map((s) => (s.icon === icono ? { ...s, value: valor } : s)));
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

  refrescar(): void {
    this.cargarDatos();
  }
}
