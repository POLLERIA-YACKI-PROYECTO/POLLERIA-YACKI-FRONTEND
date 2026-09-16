// src/app/features/admin/pedidos-clientes-admin/pedidos-clientes-admin.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PedidoClienteService } from '../../../core/services/pedido-cliente.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notificacion.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-pedidos-clientes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos-clientes-admin.component.html',
  styleUrls: ['./pedidos-clientes-admin.component.scss']
})
export class PedidosClientesAdminComponent implements OnInit, OnDestroy {
  private pedidoClienteService = inject(PedidoClienteService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  private cargando = signal(false);
  private yaCargado = signal(false);

  loading = signal<boolean>(true);
  pedidos = signal<any[]>([]);
  pedidosFiltrados = signal<any[]>([]);

  filtroEstado = signal<string>('todos');
  filtroMetodoPago = signal<string>('todos');
  busqueda = signal<string>('');

  totalPedidos = signal<number>(0);
  totalPendientes = signal<number>(0);
  totalPagados = signal<number>(0);
  totalRecaudado = signal<number>(0);

  metodosPago = ['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'];
  estados = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];

  // Modal verificación
  mostrarModalVerificacion = signal<boolean>(false);
  pedidoSeleccionado = signal<any>(null);
  tipoEntregaSeleccionado = signal<string>('local');
  confirmando = signal<boolean>(false);

  // Modal confirmar pago
  mostrarModalConfirmarPago = signal<boolean>(false);
  procesandoPago = signal<boolean>(false);

  // Visor de imagen
  mostrarVisorImagen = signal<boolean>(false);
  imagenVisorUrl = signal<string>('');
  cargandoImagen = signal<boolean>(false);
  errorImagen = signal<boolean>(false);

  // Modal rechazo
  mostrarModalRechazo = signal<boolean>(false);
  motivoRechazo = signal<string>('');
  rechazando = signal<boolean>(false);

  // Modal eliminar
  mostrarModalEliminar = signal<boolean>(false);
  pedidoAEliminar = signal<any>(null);
  eliminando = signal<boolean>(false);

  private cacheBuster = signal<number>(Date.now());

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login-admin']);
      return;
    }
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/login-admin']);
      return;
    }
    this.cargarPedidos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // CARGAR PEDIDOS
  // ============================================
  cargarPedidos(): void {
    if (this.cargando() || this.yaCargado()) return;

    this.cargando.set(true);
    this.loading.set(true);

    this.pedidoClienteService.obtenerTodos(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pedidos) => {
          const lista = Array.isArray(pedidos) ? pedidos : [];
          this.pedidos.set(lista);
          this.pedidosFiltrados.set(lista);
          this.calcularEstadisticas(lista);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('✅ Pedidos clientes cargados:', lista.length);
        },
        error: (err) => {
          console.error('Error al cargar pedidos:', err);
          this.pedidos.set([]);
          this.pedidosFiltrados.set([]);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(false);
          this.notificationService.error('No se pudieron cargar los pedidos.', 'Error');
        }
      });
  }

  recargar(): void {
    this.yaCargado.set(false);
    this.cacheBuster.set(Date.now());
    this.cargarPedidos();
  }

  calcularEstadisticas(pedidos: any[]): void {
    this.totalPedidos.set(pedidos.length);
    this.totalPendientes.set(pedidos.filter(p => !p.pagado && p.estado !== 'cancelado').length);
    this.totalPagados.set(pedidos.filter(p => p.pagado === 1 || p.pagado === true).length);
    this.totalRecaudado.set(
      pedidos
        .filter(p => p.pagado === 1 || p.pagado === true)
        .reduce((sum, p) => sum + Number(p.total || 0), 0)
    );
  }

  aplicarFiltros(): void {
    let filtrados = [...this.pedidos()];

    const estado = this.filtroEstado();
    if (estado !== 'todos') filtrados = filtrados.filter(p => p.estado === estado);

    const metodo = this.filtroMetodoPago();
    if (metodo !== 'todos') filtrados = filtrados.filter(p => p.metodo_pago === metodo);

    const search = this.busqueda().toLowerCase().trim();
    if (search) {
      filtrados = filtrados.filter(
        p =>
          p.cliente_nombre?.toLowerCase().includes(search) ||
          p.cliente_dni?.toLowerCase().includes(search) ||
          String(p.id).includes(search)
      );
    }

    this.pedidosFiltrados.set(filtrados);
  }

  onFiltroChange(): void {
    this.aplicarFiltros();
  }

  // ============================================
  // MODAL VERIFICACIÓN
  // ============================================
  abrirVerificacion(pedido: any): void {
    if (pedido.pagado) {
      this.notificationService.info('Este pedido ya está confirmado.', 'Aviso');
      return;
    }
    if (pedido.estado === 'cancelado') {
      this.notificationService.info('Este pedido está cancelado.', 'Aviso');
      return;
    }

    this.pedidoSeleccionado.set(pedido);
    this.tipoEntregaSeleccionado.set(pedido.tipo_entrega || 'local');
    this.mostrarModalVerificacion.set(true);
  }

  cerrarModal(): void {
    if (this.confirmando()) return;
    this.mostrarModalVerificacion.set(false);
    this.pedidoSeleccionado.set(null);
  }

  // ============================================
  // URL DEL COMPROBANTE
  // ============================================
  obtenerUrlComprobante(pedido: any): string {
    if (!pedido?.comprobante_pago) return '';

    const baseUrl = environment.apiUrl.replace('/api', '');
    const ruta = pedido.comprobante_pago.startsWith('/')
      ? pedido.comprobante_pago
      : `/${pedido.comprobante_pago}`;

    return `${baseUrl}${ruta}?v=${this.cacheBuster()}`;
  }

  // ============================================
  // VISOR DE IMAGEN
  // ============================================
  verComprobante(pedido: any): void {
    if (!pedido?.comprobante_pago) {
      this.notificationService.warning('Este pedido no tiene comprobante adjunto.', 'Sin comprobante');
      return;
    }

    const url = this.obtenerUrlComprobante(pedido);
    this.imagenVisorUrl.set(url);
    this.errorImagen.set(false);
    this.cargandoImagen.set(true);
    this.mostrarVisorImagen.set(true);
  }

  cerrarVisor(): void {
    this.mostrarVisorImagen.set(false);
    this.imagenVisorUrl.set('');
    this.cargandoImagen.set(false);
    this.errorImagen.set(false);
  }

  onImagenCargada(): void {
    this.cargandoImagen.set(false);
    this.errorImagen.set(false);
  }

  onErrorImagen(): void {
    this.cargandoImagen.set(false);
    this.errorImagen.set(true);
  }

  // ============================================
  // CONFIRMAR PAGO
  // ============================================
  abrirModalConfirmarPago(): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido) return;
    this.mostrarModalConfirmarPago.set(true);
  }

  cerrarModalConfirmarPago(): void {
    if (this.procesandoPago()) return;
    this.mostrarModalConfirmarPago.set(false);
  }

  confirmarPago(): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido) return;

    if (this.procesandoPago()) return;

    const tipoEntrega = this.tipoEntregaSeleccionado();
    const tipoLabel = tipoEntrega === 'delivery' ? 'Motorizado' : 'Local';

    this.procesandoPago.set(true);

    this.pedidoClienteService.confirmarPago(pedido.id, tipoEntrega)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.procesandoPago.set(false);
          this.mostrarModalConfirmarPago.set(false);
          this.notificationService.success(
            `Pedido #${pedido.id} confirmado como ${tipoLabel}. Venta #${response.venta_id} creada.`,
            'Pago confirmado'
          );
          this.cerrarModal();
          this.recargar();
        },
        error: (err: any) => {
          console.error('Error al confirmar pago:', err);
          this.procesandoPago.set(false);

          let mensaje = 'Error al confirmar el pago';
          if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
          else if (err?.status === 401) mensaje = 'Sesión expirada.';
          else if (err?.status === 403) mensaje = 'No tienes permisos.';
          else if (err?.status === 409) mensaje = 'Este pedido ya fue confirmado.';
          else if (err?.status === 500) mensaje = 'Error interno del servidor.';
          else if (err?.error?.error) mensaje = err.error.error;
          else if (err?.error?.message) mensaje = err.error.message;

          this.notificationService.error(mensaje, 'Error');
        }
      });
  }

  // ============================================
  // MODAL RECHAZO
  // ============================================
  abrirModalRechazo(): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido) return;

    this.motivoRechazo.set('No se recibió el pago');
    this.mostrarModalRechazo.set(true);
  }

  cerrarModalRechazo(): void {
    if (this.rechazando()) return;
    this.mostrarModalRechazo.set(false);
    this.motivoRechazo.set('');
  }

  confirmarRechazo(): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido) return;

    const motivo = this.motivoRechazo().trim();
    if (!motivo) {
      this.notificationService.warning('Ingresa el motivo del rechazo.', 'Motivo requerido');
      return;
    }

    if (this.rechazando()) return;

    this.rechazando.set(true);

    this.pedidoClienteService.rechazarPago(pedido.id, motivo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.rechazando.set(false);
          this.mostrarModalRechazo.set(false);
          this.motivoRechazo.set('');
          this.notificationService.info(
            `Pedido #${pedido.id} rechazado: ${motivo}`,
            'Pedido rechazado'
          );
          this.cerrarModal();
          this.recargar();
        },
        error: (err: any) => {
          console.error('Error al rechazar:', err);
          this.rechazando.set(false);

          let mensaje = 'Error al rechazar el pedido';
          if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
          else if (err?.status === 401) mensaje = 'Sesión expirada.';
          else if (err?.status === 403) mensaje = 'No tienes permisos.';
          else if (err?.error?.error) mensaje = err.error.error;

          this.notificationService.error(mensaje, 'Error');
        }
      });
  }

  // ============================================
  // MODAL ELIMINAR
  // ============================================
  abrirModalEliminar(pedido: any): void {
    this.pedidoAEliminar.set(pedido);
    this.mostrarModalEliminar.set(true);
  }

  cerrarModalEliminar(): void {
    if (this.eliminando()) return;
    this.mostrarModalEliminar.set(false);
    this.pedidoAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const pedido = this.pedidoAEliminar();
    if (!pedido) return;

    if (this.eliminando()) return;

    this.eliminando.set(true);

    this.pedidoClienteService.eliminarPedido(pedido.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.eliminando.set(false);
          this.mostrarModalEliminar.set(false);
          this.pedidoAEliminar.set(null);
          this.notificationService.success(
            `Pedido #${pedido.id} eliminado correctamente.`,
            'Pedido eliminado'
          );
          this.recargar();
        },
        error: (err: any) => {
          console.error('Error al eliminar pedido:', err);
          this.eliminando.set(false);

          let mensaje = 'Error al eliminar el pedido';
          if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
          else if (err?.status === 401) mensaje = 'Sesión expirada.';
          else if (err?.status === 403) mensaje = 'No tienes permisos para eliminar.';
          else if (err?.status === 404) mensaje = 'El pedido ya no existe.';
          else if (err?.error?.error) mensaje = err.error.error;

          this.notificationService.error(mensaje, 'Error');
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
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

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

  getTipoEntregaLabel(tipo: string): string {
    const labels: any = {
      'local': 'Local',
      'delivery': 'Motorizado',
      'paraLlevar': 'Para Llevar',
      'motorizada': 'Motorizado'
    };
    return labels[tipo] || 'Local';
  }

  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }
}