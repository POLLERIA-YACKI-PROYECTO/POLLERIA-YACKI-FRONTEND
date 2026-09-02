// src/app/features/mesero/ventas-mesero/ventas-mesero.component.ts
import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VentaService } from '../../../core/services/venta.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-ventas-mesero',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './ventas-mesero.component.html',
  styleUrls: ['./ventas-mesero.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class VentasMeseroComponent implements OnInit {
  private authService = inject(AuthService);
  private ventaService = inject(VentaService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');
  loading = signal<boolean>(true);

  ventas = signal<any[]>([]);
  ventasLocal = signal<any[]>([]);
  ventasDelivery = signal<any[]>([]);
  resumen = signal<any>({});

  // Totales calculados
  totalLocal = computed(() => {
    return this.ventasLocal().reduce((sum, v) => sum + v.total, 0);
  });

  totalDelivery = computed(() => {
    return this.ventasDelivery().reduce((sum, v) => sum + v.total, 0);
  });

  totalGeneral = computed(() => {
    return this.totalLocal() + this.totalDelivery();
  });

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);

    // Obtener ventas del usuario actual
    this.ventaService.obtenerVentasPorUsuario(this.usuario().id).subscribe({
      next: (ventas) => {
        this.ventas.set(ventas);
        this.organizarVentas(ventas);
        this.cargarResumen();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.loading.set(false);
      }
    });
  }

  organizarVentas(ventas: any[]): void {
    const local = ventas.filter(v => v.tipo_entrega === 'local' || v.tipo_entrega === 'paraLlevar');
    const delivery = ventas.filter(v => v.tipo_entrega === 'delivery' || v.tipo_entrega === 'motorizada');

    this.ventasLocal.set(local);
    this.ventasDelivery.set(delivery);
  }

  cargarResumen(): void {
    this.ventaService.obtenerResumenPorUsuario(this.usuario().id).subscribe({
      next: (resumen) => {
        this.resumen.set(resumen);
      },
      error: (err) => {
        console.error('Error al cargar resumen:', err);
      }
    });
  }

  toggleTema(): void {
    this.temaOscuro.set(!this.temaOscuro());
  }

  toggleMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  seleccionarOpcion(opcion: string): void {
    this.opcionSeleccionada.set(opcion);
    this.menuAbierto.set(false);

    const rutas: { [key: string]: string } = {
      'carta': '/mesero/carta',
      'mesas': '/mesero/mesas',
      'pedidos': '/mesero/pedidos',
      'precios': '/mesero/precios',
      'ventas': '/mesero/ventas',
      'tickets': '/mesero/tickets',
      'dashboard': '/mesero/dashboard'
    };

    const ruta = rutas[opcion];
    if (ruta) {
      this.router.navigate([ruta]);
    }
  }

  getEstadoClass(estado: string): string {
    const clases: any = {
      'completada': 'estado-completada',
      'pendiente': 'estado-pendiente',
      'cancelada': 'estado-cancelada'
    };
    return clases[estado] || '';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      'completada': 'Completada',
      'pendiente': 'Pendiente',
      'cancelada': 'Cancelada'
    };
    return textos[estado] || estado;
  }

  getEstadoIcono(estado: string): string {
    const iconos: any = {
      'completada': '✅',
      'pendiente': '⏳',
      'cancelada': '❌'
    };
    return iconos[estado] || '📋';
  }

  getMetodoPagoIcono(metodo: string): string {
    const iconos: any = {
      'efectivo': '💵',
      'tarjeta': '💳',
      'yape': '📱',
      'plin': '📱',
      'transferencia': '🏦'
    };
    return iconos[metodo] || '💰';
  }

  getTipoEntregaLabel(tipo: string): string {
    const labels: any = {
      'local': 'Local',
      'delivery': 'Motorizado',
      'paraLlevar': 'Para Llevar',
      'motorizada': 'Motorizado'
    };
    return labels[tipo] || tipo;
  }

  getTipoEntregaIcono(tipo: string): string {
    const iconos: any = {
      'local': '🏠',
      'delivery': '🛵',
      'paraLlevar': '📦',
      'motorizada': '🛵'
    };
    return iconos[tipo] || '🏠';
  }

  verDetalle(id: number): void {
    alert(`📋 Ver detalle de venta #${id}`);
  }

  nuevaVenta(): void {
    this.router.navigate(['/mesero/pedidos']);
  }

  irCarta(): void {
    this.router.navigate(['/mesero/carta']);
  }

  irMesas(): void {
    this.router.navigate(['/mesero/mesas']);
  }

  irPedidos(): void {
    this.router.navigate(['/mesero/pedidos']);
  }

  irPrecios(): void {
    this.router.navigate(['/mesero/precios']);
  }

  irVentas(): void {
    this.router.navigate(['/mesero/ventas']);
  }

  irTicket(): void {
    this.router.navigate(['/mesero/tickets']);
  }

  irDashboard(): void {
    this.router.navigate(['/mesero/dashboard']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-mesero']);
  }
}
