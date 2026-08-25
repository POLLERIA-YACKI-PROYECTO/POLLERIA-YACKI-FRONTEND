import { Component, signal, inject, OnInit } from '@angular/core';
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

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.loading.set(true);
    this.ventaService.obtenerVentas().subscribe({
      next: (ventas) => {
        this.ventas.set(ventas);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.loading.set(false);
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
    
    switch(opcion) {
      case 'carta': this.irCarta(); break;
      case 'mesas': this.irMesas(); break;
      case 'pedidos': this.irPedidos(); break;
      case 'precios': this.irPrecios(); break;
      case 'ventas': this.irVentas(); break;
      case 'tickets': this.irTicket(); break;
      case 'dashboard': this.irDashboard(); break;
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

  calcularTotal(): number {
    return this.ventas().reduce((sum, v) => sum + v.total, 0);
  }

  calcularPromedio(): number {
    const total = this.calcularTotal();
    return this.ventas().length > 0 ? total / this.ventas().length : 0;
  }

  resumenPagos(): any[] {
    const resumen: any = {};
    this.ventas().forEach(v => {
      if (!resumen[v.metodo_pago]) {
        resumen[v.metodo_pago] = { metodo: v.metodo_pago, total: 0, cantidad: 0 };
      }
      resumen[v.metodo_pago].total += v.total;
      resumen[v.metodo_pago].cantidad += 1;
    });
    return Object.values(resumen);
  }

  nuevaVenta(): void {
    alert('🆕 Abrir formulario de nueva venta');
  }

  verDetalle(id: number): void {
    alert(`📋 Ver detalle de venta #${id}`);
  }

  irCarta(): void {
    this.router.navigate(['/carta-mesero']);
  }

  irMesas(): void {
    this.router.navigate(['/mesas-mesero']);
  }

  irPedidos(): void {
    this.router.navigate(['/pedidos-mesero']);
  }

  irPrecios(): void {
    this.router.navigate(['/precios-carta-mesero']);
  }

  irVentas(): void {
    this.router.navigate(['/ventas-mesero']);
  }

  irTicket(): void {
    this.router.navigate(['/ticket']);
  }

  irDashboard(): void {
    this.router.navigate(['/dashboard-mesero']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-mesero']);
  }
}