import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MesaService } from '../../core/services/mesa.service';
import { HeaderComponent } from '../shared/components/header/header.component';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.scss']
})
export class VentasComponent implements OnInit {
  private authService = inject(AuthService);
  private mesaService = inject(MesaService);
  private router = inject(Router);

  mesas = signal<number[]>(Array.from({ length: 10 }, (_, i) => i + 1));
  mesaSeleccionada = signal<number | null>(null);
  usuario = signal<any>(null);
  panelAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario()) {
      this.router.navigate(['/login']);
    }
  }

  seleccionarMesa(numero: number): void {
    if (this.mesaSeleccionada() === numero) {
      this.mesaSeleccionada.set(null);
    } else {
      this.mesaSeleccionada.set(numero);
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  togglePanel(): void {
    this.panelAbierto.set(!this.panelAbierto());
  }

  obtenerNombreOpcion(opcion: string): string {
    const nombres: { [key: string]: string } = {
      'solicitarGasto': 'Solicitar Gasto',
      'paraLlevar': 'Para Llevar',
      'ultimas': 'Ultimas',
      'precios': 'Precios',
      'delivery': 'Delivery',
      'verTickets': 'Ver Tickets',
      'porPagar': 'Por Pagar',
      'marcarEntrega': 'Marcar Entrega',
      'cerrarCaja': 'Cerrar Caja',
      'cerrarCajaFinal': 'Cerrar Caja Final',
      'otrosIngresos': 'Otros Ingresos',
      'reservas': 'Reservas'
    };
    return nombres[opcion] || 'Seleccionar Acción';
  }

  seleccionarOpcion(opcion: string): void {
    this.opcionSeleccionada.set(opcion);
    this.panelAbierto.set(false);
    console.log('Opción seleccionada:', opcion);
  }

  irAdmin(): void {
    this.router.navigate(['/admin']);
  }

  solicitarGasto(): void { console.log('Solicitar gasto'); }
  paraLlevar(): void { console.log('Para llevar'); }
  ultimas(): void { console.log('Ultimas'); }
  precios(): void { console.log('Precios'); }
  delivery(): void { console.log('Delivery'); }
  verTickets(): void { console.log('Ver tickets'); }
  porPagar(): void { console.log('Por pagar'); }
  marcarEntrega(): void { console.log('Marcar entrega'); }
  cerrarCaja(): void { console.log('Cerrar caja'); }
  cerrarCajaFinal(): void { console.log('Cerrar caja final'); }
  otrosIngresos(): void { console.log('Otros ingresos'); }
  reservas(): void { console.log('Reservas'); }
}