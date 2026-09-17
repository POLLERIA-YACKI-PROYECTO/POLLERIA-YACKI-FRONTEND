// src/app/features/admin/ventas-admin/ventas-admin.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PedidoService } from '../../../core/services/pedido.service';
import { VentaService } from '../../../core/services/venta.service';
import { PedidoClienteService } from '../../../core/services/pedido-cliente.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-ventas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas-admin.component.html',
  styleUrls: ['./ventas-admin.component.scss']
})
export class VentasAdminComponent implements OnInit, OnDestroy {
  private pedidoService = inject(PedidoService);
  private ventaService = inject(VentaService);
  private pedidoClienteService = inject(PedidoClienteService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  private cargando = signal(false);
  private yaCargado = signal(false);

  usuario = signal<any>(null);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // Datos
  pedidosPendientes = signal<any[]>([]);
  pedidosPagados = signal<any[]>([]);
  ventasLocal = signal<any[]>([]);
  ventasDelivery = signal<any[]>([]);

  // Estadísticas
  totalPendientes = signal<number>(0);
  totalPagados = signal<number>(0);
  totalVentasLocal = signal<number>(0);
  totalVentasDelivery = signal<number>(0);
  totalRecaudado = signal<number>(0);

  // Métodos de pago
  metodosPago = ['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'];
  metodoSeleccionado = signal<string>('efectivo');

  // Modal de pago
  mostrarModalPago = signal<boolean>(false);
  pedidoEnPago = signal<any>(null);
  procesandoPago = signal<boolean>(false);
  pagoCompletado = signal<boolean>(false);
  mensajePago = signal<string>('');
  tipoPago = signal<string>('');
  mostrarMensajeExito = signal<boolean>(false);
  mostrarResumen = signal<boolean>(false);
  resultadoPago = signal<any>(null);

  // Modal de aviso (reemplaza alert)
  mostrarModalAviso = signal<boolean>(false);
  mensajeAviso = signal<string>('');
  tituloAviso = signal<string>('Atención');
  tipoAviso = signal<'warning' | 'error' | 'info'>('warning');

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      console.warn('VentasAdmin: sin sesión -> /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    this.usuario.set(this.authService.getUsuarioActual());

    if (!this.usuario() || this.usuario()?.rol !== 'admin') {
      console.warn('VentasAdmin: no es admin -> /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // MODAL DE AVISO (reemplaza alert)
  // ============================================
  mostrarAviso(
    mensaje: string,
    titulo: string = 'Atención',
    tipo: 'warning' | 'error' | 'info' = 'warning'
  ): void {
    this.mensajeAviso.set(mensaje);
    this.tituloAviso.set(titulo);
    this.tipoAviso.set(tipo);
    this.mostrarModalAviso.set(true);
  }

  cerrarModalAviso(): void {
    this.mostrarModalAviso.set(false);
    this.mensajeAviso.set('');
  }

  // ============================================
  // CARGAR DATOS (con forceRefresh opcional)
  // ============================================
  cargarDatos(forceRefresh: boolean = false): void {
    // Si NO es forceRefresh y ya está cargado, no hacer nada
    if (!forceRefresh && (this.cargando() || this.yaCargado())) return;

    this.cargando.set(true);
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      pedidosPendientes: this.pedidoService.obtenerPedidosPendientes(forceRefresh)
        .pipe(catchError(() => of([]))),
      pedidosWeb: this.pedidoClienteService.obtenerPendientes(forceRefresh)
        .pipe(catchError(() => of([]))),
      ventas: this.ventaService.obtenerVentas(forceRefresh)
        .pipe(catchError(() => of([])))
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ pedidosPendientes, pedidosWeb, ventas }) => {
          // 1. Combinar pedidos pendientes (mesero + web)
          const pendientesMesero = (pedidosPendientes || []).filter(
            (p: any) => p.pagado !== 1 && p.pagado !== true && p.estado !== 'cancelado'
          ).map((p: any) => ({
            ...p,
            usuario_nombre: p.usuario_nombre_completo || p.usuario_nombre || 'Desconocido',
            origen: 'pedido',
            id_unico: `P-${p.id}`
          }));

          const pendientesWeb = (pedidosWeb || []).map((p: any) => ({
            ...p,
            usuario_nombre: 'Cliente Web',
            origen: 'pedido_web',
            id_unico: `PC-${p.id}`
          }));

          const todosPendientes = [...pendientesMesero, ...pendientesWeb].sort((a, b) => {
            const fA = new Date(a.created_at).getTime();
            const fB = new Date(b.created_at).getTime();
            return fB - fA;
          });

          this.pedidosPendientes.set(todosPendientes);
          this.totalPendientes.set(todosPendientes.length);

          // 2. Procesar ventas
          const ventasCompletadas = Array.isArray(ventas) ? ventas : [];

          const ventasConNombre = ventasCompletadas.map((v: any) => {
            const esPedidoWeb =
              v.origen === 'pedido_web' ||
              (v.pedido_cliente_id !== null && v.pedido_cliente_id !== undefined);

            let nombreMostrar = 'Desconocido';
            if (esPedidoWeb) {
              nombreMostrar = 'Cliente Web';
            } else if (v.usuario_nombre_completo) {
              nombreMostrar = v.usuario_nombre_completo;
            } else if (v.usuario_nombre) {
              nombreMostrar = v.usuario_apellido
                ? `${v.usuario_nombre} ${v.usuario_apellido}`
                : v.usuario_nombre;
            } else if (v.usuario_rol === 'admin') {
              nombreMostrar = 'Admin';
            }

            return {
              ...v,
              usuario_nombre: nombreMostrar,
              origen: esPedidoWeb ? 'pedido_web' : 'venta',
              id_unico: esPedidoWeb
                ? `PC-${v.pedido_cliente_id || v.id}`
                : `V-${v.id}`
            };
          });

          // Eliminar duplicados
          const ventasUnicas = ventasConNombre.filter(
            (venta, index, self) =>
              index === self.findIndex(v => v.id_unico === venta.id_unico)
          );

          this.pedidosPagados.set(ventasUnicas);
          this.totalPagados.set(ventasUnicas.length);
          this.organizarVentas(ventasUnicas);
          this.totalRecaudado.set(this.calcularTotalRegistros(ventasUnicas));

          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('Ventas admin cargado:', ventasUnicas.length, 'ventas');
        },
        error: (error: any) => {
          console.error('Error ventas:', error);
          this.errorMessage.set('Error al cargar las ventas');
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(false);
        }
      });
  }

  // ============================================
  // RECARGAR FORZANDO (limpia caché y vuelve a pedir al backend)
  // ============================================
  recargar(): void {
    console.log('Recargando datos (forzando caché)...');

    // Limpiar cachés de todos los servicios
    this.pedidoService.limpiarCachePedidos?.();
    this.pedidoClienteService.limpiarCachePedidos?.();
    this.ventaService.limpiarCacheVentas?.();

    // Resetear flags y forzar recarga
    this.yaCargado.set(false);
    this.cargando.set(false);

    // Llamar con forceRefresh = true
    this.cargarDatos(true);
  }

  // Alias para el botón "Actualizar" del HTML
  recargarDatos(): void {
    console.log('Botón Actualizar presionado');
    this.recargar();
  }

  // ============================================
  // ORGANIZAR VENTAS
  // ============================================
  private normalizarTipoEntrega(valor: unknown): string {
    return String(valor || 'local').trim().toLowerCase();
  }

  private esVentaLocal(valor: unknown): boolean {
    const tipo = this.normalizarTipoEntrega(valor);
    return tipo === 'local' || tipo === 'parallevar' || tipo === 'para_llevar';
  }

  private esVentaMotorizada(valor: unknown): boolean {
    const tipo = this.normalizarTipoEntrega(valor);
    return tipo === 'delivery' || tipo === 'motorizada' || tipo === 'motorizado';
  }

  private numeroSeguro(valor: unknown): number {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
  }

  private calcularTotalRegistros(registros: any[]): number {
    return registros.reduce(
      (total, registro) => total + this.numeroSeguro(registro?.total),
      0
    );
  }

  organizarVentas(ventas: any[]): void {
    const registros = Array.isArray(ventas) ? ventas : [];
    const local = registros.filter(venta =>
      this.esVentaLocal(venta.tipo_entrega || venta.tipo)
    );
    const delivery = registros.filter(venta =>
      this.esVentaMotorizada(venta.tipo_entrega || venta.tipo)
    );

    this.ventasLocal.set(local);
    this.ventasDelivery.set(delivery);
    this.totalVentasLocal.set(local.length);
    this.totalVentasDelivery.set(delivery.length);
  }

  // ============================================
  // MODAL DE PAGO
  // ============================================
  abrirModalPago(pedido: any): void {
    if (!pedido || !pedido.id) {
      this.mostrarAviso('Pedido inválido. Intente nuevamente.', 'Error', 'error');
      return;
    }

    if (this.estaPagado(pedido)) {
      this.mostrarAviso('Este pedido ya está pagado.', 'Pedido ya pagado', 'info');
      this.recargar();
      return;
    }

    this.pagoCompletado.set(false);
    this.procesandoPago.set(false);
    this.mostrarMensajeExito.set(false);
    this.mostrarResumen.set(false);
    this.mensajePago.set('');
    this.tipoPago.set('');
    this.resultadoPago.set(null);

    this.pedidoEnPago.set(pedido);
    this.metodoSeleccionado.set(pedido.metodo_pago || 'efectivo');
    this.mostrarModalPago.set(true);
  }

  cerrarModalPago(): void {
    if (this.procesandoPago()) return;

    this.mostrarModalPago.set(false);
    this.pedidoEnPago.set(null);
    this.procesandoPago.set(false);
    this.pagoCompletado.set(false);
    this.mostrarMensajeExito.set(false);
    this.mostrarResumen.set(false);
    this.mensajePago.set('');
    this.tipoPago.set('');
    this.resultadoPago.set(null);
  }

  // ============================================
  // CONFIRMAR PAGO (con recarga inmediata)
  // ============================================
  confirmarPago(): void {
    const pedido = this.pedidoEnPago();
    if (!pedido) return;

    if (this.procesandoPago()) return;

    const metodo = this.metodoSeleccionado();
    if (!metodo) {
      this.mostrarAviso('Seleccione un método de pago.', 'Método requerido', 'warning');
      return;
    }

    this.procesandoPago.set(true);
    this.mensajePago.set('Procesando pago...');
    this.tipoPago.set('procesando');

    // Detección de origen más robusta
    const esPedidoWeb =
      pedido.origen === 'pedido_web' ||
      String(pedido.id_unico || '').startsWith('PC-') ||
      (pedido.pedido_cliente_id !== null && pedido.pedido_cliente_id !== undefined);

    console.log('Procesando pago:', {
      id: pedido.id,
      origen: pedido.origen,
      id_unico: pedido.id_unico,
      esPedidoWeb,
      tipo_entrega: pedido.tipo_entrega
    });

    const request$ = esPedidoWeb
      ? this.pedidoClienteService.confirmarPago(pedido.id, pedido.tipo_entrega)
      : this.pedidoService.marcarPagado(pedido.id, metodo);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && (response.success === true || response.pedido)) {
            this.procesandoPago.set(false);
            this.pagoCompletado.set(true);
            this.mostrarMensajeExito.set(true);
            this.mostrarResumen.set(true);
            this.mensajePago.set('¡Pago completado con éxito!');
            this.tipoPago.set('exito');
            this.resultadoPago.set({
              pedidoId: pedido.id,
              total: pedido.total,
              metodo: metodo,
              tipoEntrega: pedido.tipo_entrega,
              cliente: pedido.cliente_nombre || pedido.cliente_nombre_real || 'Cliente'
            });

            // RECARGA INMEDIATA (mueve el pedido de "Pendientes" a "Ventas")
            console.log('Recargando después del pago exitoso...');
            this.recargar();

            // Cerrar el modal después de 3 segundos
            setTimeout(() => {
              this.cerrarModalPago();
            }, 3000);
          } else {
            this.procesandoPago.set(false);
            this.mensajePago.set('Respuesta inesperada del servidor.');
            this.tipoPago.set('error');
          }
        },
        error: (err: any) => {
          console.error('Error completo:', err);
          console.error('Status:', err?.status);
          console.error('URL:', err?.url);
          console.error('Body:', err?.error);

          this.procesandoPago.set(false);
          this.tipoPago.set('error');

          let mensaje = 'Error al procesar el pago.';
          let titulo = 'Error';

          if (err?.status === 0) {
            mensaje = 'No se pudo conectar con el servidor. Verifique que el backend esté activo.';
          } else if (err?.status === 401) {
            mensaje = 'Sesión expirada. Vuelva a iniciar sesión.';
          } else if (err?.status === 403) {
            mensaje = 'No tiene permisos para procesar pagos.';
          } else if (err?.status === 404) {
            mensaje = `El endpoint no existe: ${err?.url || 'desconocido'}. Contacte al administrador del sistema.`;
            titulo = 'Endpoint no encontrado';
          } else if (err?.status === 500) {
            mensaje = err?.error?.detalle || err?.error?.sqlMessage || err?.error?.error || 'Error interno del servidor.';
            titulo = 'Error del servidor';
          } else if (err?.error) {
            mensaje = err.error.error || err.error.detalle || err.error.message || mensaje;
          }

          // Caso especial: pedido ya pagado
          if (err.status === 400 && String(mensaje).toLowerCase().includes('ya')) {
            this.mensajePago.set('Este pedido ya estaba pagado.');
            this.tipoPago.set('info');
            setTimeout(() => {
              this.cerrarModalPago();
              this.recargar();
            }, 2000);
            return;
          }

          this.mensajePago.set(mensaje);
          this.mostrarAviso(mensaje, titulo, 'error');
        }
      });
  }

  // ============================================
  // RECHAZAR PAGO (opcional)
  // ============================================
  rechazarPago(): void {
    const pedido = this.pedidoEnPago();
    if (!pedido) return;

    if (this.procesandoPago()) return;

    this.procesandoPago.set(true);
    this.mensajePago.set('Rechazando pago...');
    this.tipoPago.set('procesando');

    const esPedidoWeb = pedido.origen === 'pedido_web';

    const request$ = esPedidoWeb
      ? this.pedidoClienteService.rechazarPago(pedido.id, 'Pago no verificado')
      : this.pedidoService.cambiarEstado(pedido.id, 'cancelado');

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.procesandoPago.set(false);
          this.mensajePago.set('Pago rechazado');
          this.tipoPago.set('info');

          // RECARGA INMEDIATA
          this.recargar();

          setTimeout(() => {
            this.cerrarModalPago();
          }, 2000);
        },
        error: (err: any) => {
          console.error('Error al rechazar:', err);
          this.procesandoPago.set(false);
          this.tipoPago.set('error');
          this.mensajePago.set(err?.error?.error || 'Error al rechazar el pago');
        }
      });
  }

  // ============================================
  // UTILIDADES DE ESTADO
  // ============================================
  estaPagado(pedido: any): boolean {
    return pedido.pagado === 1 || pedido.pagado === true;
  }

  estaCancelado(pedido: any): boolean {
    return pedido.estado === 'cancelado';
  }

  mostrarBotonPago(pedido: any): boolean {
    return !this.estaPagado(pedido) &&
           !this.estaCancelado(pedido) &&
           (pedido.estado === 'pendiente' || pedido.estado === 'preparando' || pedido.estado === 'listo');
  }

  getEstadoPedidoClass(pedido: any): string {
    if (this.estaPagado(pedido)) return 'estado-pagado';
    if (this.estaCancelado(pedido)) return 'estado-cancelado';
    return this.getEstadoClass(pedido.estado);
  }

  getEstadoPedidoTexto(pedido: any): string {
    if (this.estaPagado(pedido)) return 'Pagado';
    if (this.estaCancelado(pedido)) return 'Cancelado';
    return this.getEstadoTexto(pedido.estado);
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

  getTipoEntregaSvg(tipo: string): SafeHtml {
    const icons: any = {
      'local': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      'delivery': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="1" y="4" width="15" height="13" rx="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/></svg>`,
      'paraLlevar': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      'motorizada': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="1" y="4" width="15" height="13" rx="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/></svg>`
    };
    return this.sanitizer.bypassSecurityTrustHtml(icons[tipo] || icons['local']);
  }

  getEstadoClass(estado: string): string {
    const clases: any = {
      'pendiente': 'estado-pendiente',
      'preparando': 'estado-preparando',
      'listo': 'estado-listo',
      'entregado': 'estado-pagado',
      'pagado': 'estado-pagado',
      'cancelado': 'estado-cancelado'
    };
    return clases[estado] || 'estado-pendiente';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      'pendiente': 'Pendiente',
      'preparando': 'Preparando',
      'listo': 'Listo',
      'entregado': 'Pagado',
      'pagado': 'Pagado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
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

  getMetodoPagoSvg(metodo: string): SafeHtml {
    const icons: any = {
      'efectivo': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M12 6v2M12 16v2M8 10h2M14 10h2M8 14h8"/></svg>`,
      'tarjeta': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
      'yape': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
      'plin': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6v6l4 2"/></svg>`,
      'transferencia': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 12h18"/><path d="M18 7l5 5-5 5"/><path d="M6 7l-5 5 5 5"/></svg>`
    };
    return this.sanitizer.bypassSecurityTrustHtml(icons[metodo] || icons['efectivo']);
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

  totalPorTipo(ventas: any[]): number {
    return this.calcularTotalRegistros(
      Array.isArray(ventas) ? ventas : []
    );
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================
  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}