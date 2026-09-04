import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PedidoService } from '../../../core/services/pedido.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';

export type OrderStatus = 'pendiente_pago' | 'pagado' | 'en_preparacion' | 'entregado' | 'cancelado' | 'expirado';

export interface LiveOrder {
  id: number | string;
  orderCode?: string;
  codigo?: string;
  status: OrderStatus;
  estado?: string;
  customerName?: string;
  cliente?: string;
  total: number;
  monto_total?: number;
  [key: string]: any; // ✅ AÑADIR para propiedades dinámicas
}

@Component({
  selector: 'app-dashboard-usuario',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard_usuario.component.html',
  styleUrls: ['./dashboard_usuario.component.scss'],
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

    // ✅ CORREGIDO: usar any
    this.socketService
      .onNewOrder()
      .pipe(takeUntil(this.destroy$))
      .subscribe((o: any) => {
        this.orders.update((list) => [o as LiveOrder, ...list]);
      });

    // ✅ CORREGIDO: usar any
    this.socketService
      .onOrderUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe((updated: any) => {
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

    // ✅ CORREGIDO: convertir a number
    this.orderService.updateOrderStatus(Number(order.id), next).subscribe((updated: LiveOrder) => {
      this.orders.update((list) =>
        list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
      );
    });
  }

  reprint(order: LiveOrder): void {
    // ✅ CORREGIDO: convertir a number
    this.orderService.reprintVoucher(Number(order.id)).subscribe((res: { pdfPath: string }) => {
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