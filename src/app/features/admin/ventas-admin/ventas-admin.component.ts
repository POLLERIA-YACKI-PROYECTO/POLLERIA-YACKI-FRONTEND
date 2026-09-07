// src/app/features/admin/ventas-admin/ventas-admin.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PedidoService } from '../../../core/services/pedido.service';
import { VentaService } from '../../../core/services/venta.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

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

  // Bandera para evitar múltiples clics
  private pagando = false;
  private subscriptions: Subscription[] = [];

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
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.pagando = false;

    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions = [];

    let solicitudesCompletadas = 0;
    const totalSolicitudes = 2;

    const verificarFinalizado = (): void => {
      solicitudesCompletadas++;

      if (solicitudesCompletadas >= totalSolicitudes) {
        this.loading.set(false);
      }
    };

    const solicitudPendientes = this.pedidoService
      .obtenerPedidosPendientes()
      .subscribe({
        next: (pedidos: any[]) => {
          const pendientes = (Array.isArray(pedidos) ? pedidos : []).filter(
            pedido =>
              pedido.pagado !== 1 &&
              pedido.pagado !== true &&
              pedido.estado !== 'cancelado' &&
              pedido.estado !== 'cancelada'
          );

          this.pedidosPendientes.set(pendientes);
          this.totalPendientes.set(pendientes.length);
          verificarFinalizado();
        },
        error: (error: any) => {
          console.error('Error al cargar pedidos pendientes:', error);
          this.pedidosPendientes.set([]);
          this.totalPendientes.set(0);
          verificarFinalizado();
        }
      });

    this.subscriptions.push(solicitudPendientes);

    const solicitudVentas = this.ventaService
      .obtenerVentas()
      .subscribe({
        next: (ventas: any[]) => {
          const ventasCompletadas = Array.isArray(ventas) ? ventas : [];

          this.pedidosPagados.set(ventasCompletadas);
          this.totalPagados.set(ventasCompletadas.length);
          this.organizarVentas(ventasCompletadas);
          this.totalRecaudado.set(
            this.calcularTotalRegistros(ventasCompletadas)
          );

          verificarFinalizado();
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
          verificarFinalizado();
        }
      });

    this.subscriptions.push(solicitudVentas);
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

  // ✅ MÉTODO PAGAR CORREGIDO
  marcarPagado(pedido: any): void {
    if (this.pagando) {
      console.log('⏳ Ya hay una operación en curso, espere...');
      return;
    }

    if (!pedido || !pedido.id) {
      alert('Error: Pedido inválido');
      return;
    }

    if (this.estaPagado(pedido)) {
      alert('ℹ️ Este pedido ya está pagado');
      this.cargarDatos();
      return;
    }

    const metodo = this.metodoSeleccionado();
    if (!metodo) {
      alert('Seleccione un método de pago');
      return;
    }

    console.log('💰 === INICIANDO PAGO ===');
    console.log('💰 Pedido ID:', pedido.id);
    console.log('💰 Método de pago:', metodo);
    console.log('💰 Tipo de entrega:', pedido.tipo_entrega);

    if (!confirm(`¿Confirmar pago del pedido #${pedido.id}?`)) {
      return;
    }

    this.pagando = true;
    this.loading.set(true);

    const sub = this.pedidoService.marcarPagado(pedido.id, metodo).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta del servidor:', response);

        if (response && response.success === true) {
          const tipoEntrega = response.tipo_entrega || 'local';
          const tipoTexto = tipoEntrega === 'delivery' || tipoEntrega === 'motorizada' ? 'Motorizado' : 'Local';

          alert(`✅ Pedido #${pedido.id} pagado correctamente
Tipo: ${tipoTexto}
Método: ${this.getMetodoPagoLabel(metodo)}`);

          // Recargar datos
          setTimeout(() => {
            this.cargarDatos();
          }, 300);
        } else {
          console.warn('⚠️ Respuesta inesperada:', response);
          this.cargarDatos();
        }
      },
      error: (err: any) => {
        console.error('❌ Error:', err);

        let mensaje = 'Error al marcar pedido como pagado';
        if (err.error) {
          mensaje = err.error.error || err.error.detalle || err.error.message || mensaje;
        }

        if (err.status === 400 && mensaje.includes('ya está pagado')) {
          alert('ℹ️ El pedido ya estaba pagado. Actualizando datos...');
          this.cargarDatos();
        } else {
          alert('❌ ' + mensaje);
          this.pagando = false;
          this.loading.set(false);
        }
      }
    });
    this.subscriptions.push(sub);
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
