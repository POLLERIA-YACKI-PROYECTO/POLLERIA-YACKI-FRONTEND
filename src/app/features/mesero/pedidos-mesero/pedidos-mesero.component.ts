import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-pedidos-mesero',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './pedidos-mesero.component.html',
  styleUrls: ['./pedidos-mesero.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class PedidosMeseroComponent implements OnInit {
  private authService = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');
  loading = signal<boolean>(true);

  pedidos = signal<any[]>([]);

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.loading.set(true);
    this.pedidoService.obtenerPedidos().subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
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
      'pendiente': 'estado-pendiente',
      'preparando': 'estado-preparando',
      'listo': 'estado-listo',
      'entregado': 'estado-entregado',
      'cancelado': 'estado-cancelado'
    };
    return clases[estado] || 'estado-pendiente';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      'pendiente': 'Pendiente',
      'preparando': 'Preparando',
      'listo': 'Listo',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  }

  getEstadoIcono(estado: string): string {
    const iconos: any = {
      'pendiente': '⏳',
      'preparando': '🔪',
      'listo': '✅',
      'entregado': '📦',
      'cancelado': '❌'
    };
    return iconos[estado] || '📋';
  }

  verDetalle(id: number): void {
    console.log('Ver detalle del pedido:', id);
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