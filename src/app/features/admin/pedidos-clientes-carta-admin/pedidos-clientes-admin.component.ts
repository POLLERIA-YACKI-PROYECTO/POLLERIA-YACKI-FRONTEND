// src/app/features/admin/pedidos-clientes-admin/pedidos-clientes-admin.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoClienteService } from '../../../core/services/pedido-cliente.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-pedidos-clientes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos-clientes-admin.component.html',
  styleUrls: ['./pedidos-clientes-admin.component.scss']
})
export class PedidosClientesAdminComponent implements OnInit {
  private pedidoClienteService = inject(PedidoClienteService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal<boolean>(true);
  pedidos = signal<any[]>([]);
  pedidosFiltrados = signal<any[]>([]);

  // Filtros
  filtroEstado = signal<string>('todos');
  filtroMetodoPago = signal<string>('todos');
  busqueda = signal<string>('');

  // Estadísticas
  totalPedidos = signal<number>(0);
  totalPendientes = signal<number>(0);
  totalPagados = signal<number>(0);
  totalRecaudado = signal<number>(0);

  metodosPago = ['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'];
  estados = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];
  tiposEntrega = [
    { id: 'local', label: 'Local' },
    { id: 'delivery', label: 'Motorizado' },
    { id: 'paraLlevar', label: 'Para Llevar' }
  ];

  // ✅ Modal de verificación
  mostrarModalVerificacion = signal<boolean>(false);
  pedidoSeleccionado = signal<any>(null);
  tipoEntregaSeleccionado = signal<string>('local');
  confirmando = signal<boolean>(false);

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/login-admin']);
      return;
    }
    this.cargarPedidos();
  }

  // ============================================
  // CARGAR PEDIDOS
  // ============================================
  cargarPedidos(): void {
    this.loading.set(true);
    this.pedidoClienteService.obtenerTodos().subscribe({
      next: (pedidos) => {
        const lista = Array.isArray(pedidos) ? pedidos : [];
        this.pedidos.set(lista);
        this.pedidosFiltrados.set(lista);
        this.calcularEstadisticas(lista);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
        this.pedidos.set([]);
        this.pedidosFiltrados.set([]);
        this.loading.set(false);
      }
    });
  }

  calcularEstadisticas(pedidos: any[]): void {
    this.totalPedidos.set(pedidos.length);
    this.totalPendientes.set(
      pedidos.filter(p => !p.pagado && p.estado !== 'cancelado').length
    );
    this.totalPagados.set(
      pedidos.filter(p => p.pagado === 1 || p.pagado === true).length
    );
    this.totalRecaudado.set(
      pedidos
        .filter(p => p.pagado === 1 || p.pagado === true)
        .reduce((sum, p) => sum + Number(p.total || 0), 0)
    );
  }

  aplicarFiltros(): void {
    let filtrados = [...this.pedidos()];

    const estado = this.filtroEstado();
    if (estado !== 'todos') {
      filtrados = filtrados.filter(p => p.estado === estado);
    }

    const metodo = this.filtroMetodoPago();
    if (metodo !== 'todos') {
      filtrados = filtrados.filter(p => p.metodo_pago === metodo);
    }

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
  // ✅ ABRIR MODAL DE VERIFICACIÓN
  // ============================================
  abrirVerificacion(pedido: any): void {
    if (pedido.pagado) {
      alert('Este pedido ya está confirmado');
      return;
    }
    if (pedido.estado === 'cancelado') {
      alert('Este pedido está cancelado');
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
  // ✅ VER COMPROBANTE EN NUEVA PESTAÑA
  // ============================================
  verComprobante(pedido: any): void {
    if (!pedido.comprobante_pago) {
      alert('Este pedido no tiene comprobante adjunto');
      return;
    }

    const baseUrl = environment.apiUrl.replace('/api', '');
    const url = `${baseUrl}${pedido.comprobante_pago}`;
    window.open(url, '_blank');
  }

  // ============================================
  // ✅ CONFIRMAR PAGO Y CREAR VENTA
  // ============================================
  confirmarPago(): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido) return;

    const tipoEntrega = this.tipoEntregaSeleccionado();
    const tipoLabel = tipoEntrega === 'delivery' ? 'Motorizado' : 'Local';

    if (!confirm(
      `¿Confirmar pago del pedido #${pedido.id}?\n\n` +
      `Cliente: ${pedido.cliente_nombre}\n` +
      `Método: ${this.getMetodoPagoLabel(pedido.metodo_pago)}\n` +
      `Total: S/ ${Number(pedido.total).toFixed(2)}\n` +
      `Tipo de entrega: ${tipoLabel}\n\n` +
      `✅ Se creará una VENTA automáticamente.`
    )) return;

    this.confirmando.set(true);

    this.pedidoClienteService.confirmarPago(pedido.id, tipoEntrega).subscribe({
      next: (response) => {
        this.confirmando.set(false);
        alert(
          `✅ Pago confirmado\n\n` +
          `Pedido #${pedido.id} confirmado como ${tipoLabel}.\n` +
          `Venta #${response.venta_id} creada automáticamente.`
        );
        this.cerrarModal();
        this.cargarPedidos();
      },
      error: (err) => {
        console.error('Error al confirmar pago:', err);
        this.confirmando.set(false);
        alert(err?.error?.error || 'Error al confirmar el pago');
      }
    });
  }

  // ============================================
  // ✅ RECHAZAR PAGO
  // ============================================
  rechazarPago(): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido) return;

    const motivo = prompt(
      `Motivo del rechazo del pedido #${pedido.id}:`,
      'No se recibió el pago'
    );

    if (motivo === null) return;

    this.confirmando.set(true);

    this.pedidoClienteService.rechazarPago(pedido.id, motivo || 'No especificado').subscribe({
      next: () => {
        this.confirmando.set(false);
        alert('❌ Pedido rechazado');
        this.cerrarModal();
        this.cargarPedidos();
      },
      error: (err) => {
        console.error('Error al rechazar:', err);
        this.confirmando.set(false);
        alert(err?.error?.error || 'Error al rechazar el pedido');
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