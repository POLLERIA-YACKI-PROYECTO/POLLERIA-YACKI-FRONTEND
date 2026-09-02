// src/app/features/mesero/ticket/ticket.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VentaService } from '../../../core/services/venta.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class TicketComponent implements OnInit {
  private authService = inject(AuthService);
  private ventaService = inject(VentaService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');
  loading = signal<boolean>(true);

  tickets = signal<any[]>([]);

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }
    this.cargarTickets();
  }

  cargarTickets(): void {
    this.loading.set(true);
    this.ventaService.obtenerVentas().subscribe({
      next: (ventas) => {
        const tickets = ventas.map(v => ({
          id: `T-${String(v.id).padStart(3, '0')}`,
          mesa: v.mesa_id || 'N/A',
          cliente: v.cliente || 'Consumidor Final',
          total: v.total,
          fecha: v.fecha_venta ? new Date(v.fecha_venta).toLocaleString() : '--',
          items: v.items?.length || 0,
          venta_id: v.id
        }));
        this.tickets.set(tickets);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar tickets:', err);
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

  verTicket(id: string): void {
    console.log(`📋 Ver ticket ${id}`);
    alert(`📋 Ver ticket ${id}`);
  }

  // ✅ NAVEGACIÓN CORREGIDA
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

  // ✅ MÉTODO AGREGADO - Cerrar sesión
  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-mesero']);
  }
}
