// src/app/features/admin/ventas-admin/ventas-admin.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PedidoService } from '../../../core/services/pedido.service';
import { VentaService } from '../../../core/services/venta.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

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
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

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

  // Modal de pago - MEJORADO
  mostrarModalPago = signal<boolean>(false);
  pedidoEnPago = signal<any>(null);
  procesandoPago = signal<boolean>(false);
  pagoCompletado = signal<boolean>(false);
  mensajePago = signal<string>('');
  tipoPago = signal<string>('');
  mostrarMensajeExito = signal<boolean>(false);

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'admin') {
      this.router.navigate(['/login-admin']);
      return;
    }
    console.log('👤 Usuario admin:', this.usuario());
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    // Cargar pedidos pendientes
    this.pedidoService.obtenerPedidosPendientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pedidos: any[]) => {
          const pendientes = (Array.isArray(pedidos) ? pedidos : []).filter(
            pedido =>
              pedido.pagado !== 1 &&
              pedido.pagado !== true &&
              pedido.estado !== 'cancelado' &&
              pedido.estado !== 'cancelada'
          );

          const pendientesConNombre = pendientes.map(p => ({
            ...p,
            usuario_nombre: p.usuario_nombre_completo || p.usuario_nombre || 'Desconocido'
          }));

          this.pedidosPendientes.set(pendientesConNombre);
          this.totalPendientes.set(pendientesConNombre.length);
          this.checkLoading();
        },
        error: (error: any) => {
          console.error('Error al cargar pedidos pendientes:', error);
          this.pedidosPendientes.set([]);
          this.totalPendientes.set(0);
          this.checkLoading();
        }
      });

    // Cargar ventas
    this.ventaService.obtenerVentas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ventas: any[]) => {
          const ventasCompletadas = Array.isArray(ventas) ? ventas : [];

          const ventasConNombre = ventasCompletadas.map(v => ({
            ...v,
            usuario_nombre: v.usuario_nombre_completo || v.usuario_nombre || 'Desconocido'
          }));

          this.pedidosPagados.set(ventasConNombre);
          this.totalPagados.set(ventasConNombre.length);
          this.organizarVentas(ventasConNombre);
          this.totalRecaudado.set(this.calcularTotalRegistros(ventasConNombre));
          this.checkLoading();
        },
        error: (error: any) => {
          console.error('Error al cargar ventas:', error);
          this.pedidosPagados.set([]);
          this.ventasLocal.set([]);
          this.ventasDelivery.set([]);
          this.totalPagados.set(0);
          this.totalVentasLocal.set(0);
          this.totalVentasDelivery.set(0);
          this.totalRecaudado.set(0);
          this.errorMessage.set('Error al cargar las ventas');
          this.checkLoading();
        }
      });
  }

  private checkLoading(): void {
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }

  private normalizarTipoEntrega(valor: unknown): string {
    return String(valor || 'local').trim().toLowerCase();
  }

  private esVentaLocal(valor: unknown): boolean {
    const tipo = this.normalizarTipoEntrega(valor);
    return (
      tipo === 'local' ||
      tipo === 'parallevar' ||
      tipo === 'para_llevar' ||
      tipo === 'para llevar'
    );
  }

  private esVentaMotorizada(valor: unknown): boolean {
    const tipo = this.normalizarTipoEntrega(valor);
    return (
      tipo === 'delivery' ||
      tipo === 'motorizada' ||
      tipo === 'motorizado'
    );
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

  // ✅ ABRIR MODAL DE PAGO
  abrirModalPago(pedido: any): void {
    if (!pedido || !pedido.id) {
      alert('Error: Pedido inválido');
      return;
    }

    if (this.estaPagado(pedido)) {
      alert('ℹ️ Este pedido ya está pagado');
      this.cargarDatos();
      return;
    }

    // Resetear estados
    this.pagoCompletado.set(false);
    this.procesandoPago.set(false);
    this.mostrarMensajeExito.set(false);
    this.mensajePago.set('');
    this.tipoPago.set('');

    this.pedidoEnPago.set(pedido);
    this.metodoSeleccionado.set('efectivo');
    this.mostrarModalPago.set(true);
  }

  // ✅ CERRAR MODAL DE PAGO
  cerrarModalPago(): void {
    this.mostrarModalPago.set(false);
    this.pedidoEnPago.set(null);
    this.procesandoPago.set(false);
    this.pagoCompletado.set(false);
    this.mostrarMensajeExito.set(false);
    this.mensajePago.set('');
    this.tipoPago.set('');
  }

  // ✅ CONFIRMAR PAGO DESDE EL MODAL
  confirmarPago(): void {
    const pedido = this.pedidoEnPago();
    if (!pedido) return;

    const metodo = this.metodoSeleccionado();
    if (!metodo) {
      alert('Seleccione un método de pago');
      return;
    }

    // Mostrar estado de procesamiento
    this.procesandoPago.set(true);
    this.mensajePago.set('Procesando pago...');
    this.tipoPago.set('procesando');

    this.pedidoService.marcarPagado(pedido.id, metodo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Respuesta del servidor:', response);

          if (response && response.success === true) {
            // Pago completado con éxito
            this.procesandoPago.set(false);
            this.pagoCompletado.set(true);
            this.mostrarMensajeExito.set(true);
            this.mensajePago.set('¡Pago completado con éxito!');
            this.tipoPago.set('exito');

            const tipoTexto = this.getTipoEntregaLabel(pedido.tipo_entrega);
            const metodoTexto = this.getMetodoPagoLabel(metodo);

            // Esperar 2 segundos antes de cerrar automáticamente
            setTimeout(() => {
              this.cerrarModalPago();
              this.cargarDatos();
            }, 2500);

          } else {
            // Respuesta inesperada
            this.procesandoPago.set(false);
            this.mensajePago.set('Error: Respuesta inesperada del servidor');
            this.tipoPago.set('error');
          }
        },
        error: (err: any) => {
          console.error('❌ Error:', err);
          this.procesandoPago.set(false);
          this.tipoPago.set('error');

          let mensaje = 'Error al procesar el pago';
          if (err.error) {
            mensaje = err.error.error || err.error.detalle || err.error.message || mensaje;
          }

          if (err.status === 400 && mensaje.includes('ya está pagado')) {
            this.mensajePago.set('Este pedido ya estaba pagado');
            this.tipoPago.set('info');
            setTimeout(() => {
              this.cerrarModalPago();
              this.cargarDatos();
            }, 2000);
          } else {
            this.mensajePago.set(mensaje);
          }
        }
      });
  }

  // ✅ MÉTODOS DE VERIFICACIÓN
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
    if (this.estaPagado(pedido)) return '✅ Pagado';
    if (this.estaCancelado(pedido)) return '❌ Cancelado';
    return this.getEstadoTexto(pedido.estado);
  }

  // ✅ MÉTODOS DE UTILIDAD
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

  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }

  recargarDatos(): void {
    console.log('🔄 Recargando datos manualmente...');
    this.cargarDatos();
  }
}