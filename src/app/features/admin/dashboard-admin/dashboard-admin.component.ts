// src/app/features/admin/dashboard-admin/dashboard-admin.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, of, catchError } from 'rxjs';
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
export class DashboardAdminComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private productoService = inject(ProductoService);
  private usuarioService = inject(UsuarioService);
  private pedidoService = inject(PedidoService);
  private pedidoClienteService = inject(PedidoClienteService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  private cargando = signal(false);
  private yaCargado = signal(false);

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
    { icon: 'productos', label: 'Productos Registrados', value: 0, color: '#c43129', bgColor: '#c4312920' },
    { icon: 'ventas', label: 'Ventas Hoy', value: 0, color: '#d6ad31', bgColor: '#d6ad3120' },
    { icon: 'pendientes', label: 'Pedidos Pendientes', value: 0, color: '#71492f', bgColor: '#71492f20' },
    { icon: 'ingresos', label: 'Ingresos Totales', value: 'S/ 0.00', color: '#432c1c', bgColor: '#432c1c20' },
    { icon: 'usuarios', label: 'Usuarios Activos', value: 0, color: '#c43129', bgColor: '#c4312920' },
    { icon: 'local', label: 'Ventas en Local', value: 0, color: '#71492f', bgColor: '#71492f20' },
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    if (this.cargando() || this.yaCargado()) return;

    this.cargando.set(true);
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      productos: this.productoService
        .obtenerProductos()
        .pipe(catchError(() => of([]))),
      usuarios: this.usuarioService
        .obtenerUsuarios()
        .pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ productos, usuarios }) => {
          const totalProductos = Array.isArray(productos) ? productos.length : 0;
          this.actualizarStat('productos', totalProductos);

          const activos = (usuarios || []).filter((u: any) => u.activo !== false);
          this.actualizarStat('usuarios', activos.length);

          this.cargarFase2();
        },
        error: (err) => {
          console.error('Error en fase 1 del dashboard:', err);
          this.errorMessage.set('Error al cargar datos del dashboard');
          this.loading.set(false);
          this.cargando.set(false);
        },
      });
  }

  private cargarFase2(): void {
    forkJoin({
      pedidosPendientes: this.pedidoService
        .obtenerPedidosPendientes()
        .pipe(catchError(() => of([]))),
      pedidosWeb: this.pedidoClienteService
        .obtenerPendientes()
        .pipe(catchError(() => of([]))),
      resumen: this.dashboardService
        .obtenerResumenUnificado()
        .pipe(catchError(() => of(null))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ pedidosPendientes, pedidosWeb, resumen }) => {
          // ==========================================
          // PEDIDOS PENDIENTES
          // ==========================================
          const pendientesMesero = (pedidosPendientes || []).map((p: any) => ({
            ...p,
            id_unico: `P-${p.id}`,
            origen: 'pedido',
          }));

          const pendientesWeb = (pedidosWeb || []).map((p: any) => ({
            ...p,
            id_unico: `PC-${p.id}`,
            origen: 'pedido_web',
          }));

          const todosPendientes = [...pendientesMesero, ...pendientesWeb];
          const pendientesUnicos = this.deduplicarPorIdUnico(todosPendientes);

          this.pedidosPendientes.set(pendientesUnicos);
          this.actualizarStat('pendientes', pendientesUnicos.length);

          // ==========================================
          // RESUMEN UNIFICADO
          // ==========================================
          if (resumen?.success) {
            const { resumen: r, ventasRecientes: recientes } = resumen;

            this.actualizarStat('ventas', r.ventasHoy || 0);
            this.actualizarStat('ingresos', `S/ ${(r.totalRecaudado || 0).toFixed(2)}`);
            this.actualizarStat('local', r.ventasLocal || 0);

            this.resumenVentas.set({
              totalVentas: r.totalVentas || 0,
              ventasLocal: r.ventasLocal || 0,
              ventasDelivery: r.ventasDelivery || 0,
              totalRecaudado: r.totalRecaudado || 0,
              recaudadoLocal: r.recaudadoLocal || 0,
              recaudadoDelivery: r.recaudadoDelivery || 0,
              ventasHoy: r.ventasHoy || 0,
              recaudadoHoy: r.recaudadoHoy || 0,
            });

            // ==========================================
            // VENTAS RECIENTES: deduplicar
            // ==========================================
            const recientesFormateados = (recientes || []).map((v: any) => {
              const pedidoClienteId =
                v.pedido_cliente_id !== null &&
                v.pedido_cliente_id !== undefined &&
                v.pedido_cliente_id !== ''
                  ? Number(v.pedido_cliente_id)
                  : null;

              const esWeb = v.origen === 'pedido_web' || pedidoClienteId !== null;

              return {
                id: v.id,
                id_unico: pedidoClienteId !== null
                  ? `PC-${pedidoClienteId}`
                  : `V-${v.id}`,
                cliente: v.cliente_nombre || 'Consumidor Final',
                total: parseFloat(v.total) || 0,
                fecha: (v.fecha || v.fecha_venta || v.created_at)
                  ? this.formatearFecha(v.fecha || v.fecha_venta || v.created_at)
                  : '--',
                estado: v.estado || 'completada',
                tipo: v.tipo_entrega || 'local',
                origen: esWeb ? 'pedido_web' : 'venta',
              };
            });

            // Regla de oro: agrupar por pedido_cliente_id; si hay venta real,
            // descartar el pedido web duplicado.
            const mapaRecientes = new Map<string, any>();
            recientesFormateados.forEach((r: any) => {
              if (!mapaRecientes.has(r.id_unico)) {
                mapaRecientes.set(r.id_unico, r);
                return;
              }
              const existente = mapaRecientes.get(r.id_unico)!;
              const existenteEsVenta = String(existente.id_unico).startsWith('V-');
              const nuevoEsVenta = String(r.id_unico).startsWith('V-');
              if (nuevoEsVenta && !existenteEsVenta) {
                mapaRecientes.set(r.id_unico, r);
              }
            });

            this.ventasRecientes.set(Array.from(mapaRecientes.values()));
          }

          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
        },
        error: (err) => {
          console.error('Error en fase 2 del dashboard:', err);
          this.loading.set(false);
          this.cargando.set(false);
        },
      });
  }

  private deduplicarPorIdUnico<T extends { id_unico?: string | number }>(lista: T[]): T[] {
    const mapa = new Map<string | number, T>();

    lista.forEach(item => {
      const key = item.id_unico ?? '';
      if (key === '') return;

      if (!mapa.has(key)) {
        mapa.set(key, item);
        return;
      }

      const existente = mapa.get(key)!;
      const esVentaExistente = String(existente.id_unico).startsWith('V-');
      const esVentaNueva = String(item.id_unico).startsWith('V-');

      if (esVentaNueva && !esVentaExistente) {
        mapa.set(key, item);
      }
    });

    return Array.from(mapa.values());
  }

  recargar(): void {
    this.productoService.limpiarCache();
    this.usuarioService.limpiarCache();
    this.pedidoService.limpiarCachePedidos();
    this.pedidoClienteService.limpiarCachePedidos();
    this.yaCargado.set(false);
    this.cargando.set(false);
    this.cargarDatos();
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

  getOrigenLabel(origen: string): string {
    const labels: any = {
      venta: 'Mesero',
      pedido_web: 'Carta Web',
    };
    return labels[origen] || 'Mesero';
  }

  getOrigenClass(origen: string): string {
    return origen === 'pedido_web' ? 'origen-web' : 'origen-venta';
  }

  getTipoLabel(tipo: string): string {
    const labels: any = {
      local: 'Local',
      delivery: 'Motorizado',
      motorizada: 'Motorizado',
      paraLlevar: 'Para Llevar',
    };
    return labels[tipo] || 'Local';
  }

  getTipoClass(tipo: string): string {
    if (tipo === 'delivery' || tipo === 'motorizada') return 'delivery';
    if (tipo === 'paraLlevar') return 'paraLlevar';
    return 'local';
  }

  refrescar(): void {
    this.recargar();
  }
}