// src/app/features/admin/pedidos-clientes-admin/pedidos-clientes-admin.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoClienteService } from '../../../core/services/pedido-cliente.service';
import { AuthService } from '../../../core/services/auth.service';

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

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/login-admin']);
      return;
    }
    this.cargarPedidos();
  }

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
      'delivery': 'Delivery',
      'paraLlevar': 'Para Llevar',
      'motorizada': 'Motorizado'
    };
    return labels[tipo] || 'Local';
  }

  verDetalle(pedido: any): void {
    const items = pedido.items || [];
    const itemsTexto = items
      .map((i: any) => `  • ${i.cantidad}x ${i.nombre} - S/ ${Number(i.subtotal || i.precio * i.cantidad).toFixed(2)}`)
      .join('\n');

    alert(
      `📋 PEDIDO #${pedido.id}\n\n` +
      `👤 Cliente: ${pedido.cliente_nombre}\n` +
      `📞 Teléfono: ${pedido.cliente_telefono || 'N/A'}\n` +
      `📍 Dirección: ${pedido.cliente_direccion || 'N/A'}\n` +
      `📝 Referencia: ${pedido.cliente_referencia || 'N/A'}\n` +
      `🚚 Tipo: ${this.getTipoEntregaLabel(pedido.tipo_entrega)}\n` +
      `💳 Método: ${this.getMetodoPagoLabel(pedido.metodo_pago)}\n` +
      `✅ Pagado: ${pedido.pagado ? 'SÍ' : 'NO'}\n` +
      `📅 Fecha: ${this.formatearFecha(pedido.created_at)}\n\n` +
      `🛒 PRODUCTOS:\n${itemsTexto}\n\n` +
      `💰 Subtotal: S/ ${Number(pedido.subtotal).toFixed(2)}\n` +
      `🧾 IGV: S/ ${Number(pedido.igv).toFixed(2)}\n` +
      `💵 TOTAL: S/ ${Number(pedido.total).toFixed(2)}`
    );
  }

  marcarPagado(pedido: any): void {
    if (pedido.pagado) {
      alert('Este pedido ya está pagado');
      return;
    }
    if (confirm(`¿Confirmar pago del pedido #${pedido.id}?`)) {
      this.pedidoClienteService
        .marcarPagado(pedido.id, pedido.metodo_pago)
        .subscribe({
          next: () => {
            alert('Pago confirmado');
            this.cargarPedidos();
          },
          error: (err) => {
            console.error(err);
            alert('Error al confirmar pago');
          }
        });
    }
  }

  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }
}