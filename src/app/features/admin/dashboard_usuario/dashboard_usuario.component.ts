import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PedidoService } from '../../../core/services/pedido.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';

// --- Definición de tipos/interfaces ---
export type OrderStatus = 'pendiente_pago' | 'pagado' | 'en_preparacion' | 'entregado' | 'cancelado' | 'expirado';

export interface LiveOrder {
  id: number | string;
  orderCode?: string;
  status: OrderStatus;
  customerName?: string;
  total: number;
  [key: string]: any;
}

@Component({
  selector: 'app-dashboard-usuario',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard_usuario.component.html',
  styleUrl: './dashboard_usuario.component.scss',
})
export class DashboardUsuarioComponent implements OnInit, OnDestroy {
  orders = signal<LiveOrder[]>([]);
  loading = signal<boolean>(true);

  readonly statusFlow: OrderStatus[] = ['pendiente_pago', 'pagado', 'en_preparacion', 'entregado'];
  readonly statusLabels: Record<OrderStatus, string> = {
    pendiente_pago: 'Pendiente',
    pagado: 'Pagado (QR)',
    en_preparacion: 'En preparación',
    entregado: 'Entregado/Despachado',
    cancelado: 'Cancelado',
    expirado: 'Expirado',
  };

  private destroy$ = new Subject<void>();

  constructor(
    private orderService: PedidoService,
    private socketService: SocketService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.socketService.joinAdminDashboard();

    this.socketService
      .onNewOrder()
      .pipe(takeUntil(this.destroy$))
      .subscribe((o: LiveOrder) => {
        this.orders.update((list) => [o, ...list]);
      });

    this.socketService
      .onOrderUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe((updated: LiveOrder) => {
        this.orders.update((list) =>
          list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
        );
      });
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService.listLiveOrders().subscribe({
      next: (data: LiveOrder[]) => {
        this.orders.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  nextStatus(order: LiveOrder): void {
    const idx = this.statusFlow.indexOf(order.status);
    if (idx === -1 || idx === this.statusFlow.length - 1) return;
    const next = this.statusFlow[idx + 1];

    this.orderService.updateOrderStatus(order.id, next).subscribe((updated: LiveOrder) => {
      this.orders.update((list) =>
        list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
      );
    });
  }

  reprint(order: LiveOrder): void {
    this.orderService.reprintVoucher(order.id).subscribe((res: { pdfPath: string }) => {
      if (res?.pdfPath) {
        window.open(res.pdfPath, '_blank');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}