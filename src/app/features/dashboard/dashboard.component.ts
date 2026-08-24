import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MesaService } from '../../core/services/mesa.service';

// IMPORTACIÓN CORRECTA - Usar @ para rutas absolutas
import { HeaderComponent } from '../shared/components/header/header.component';
import { MesaComponent } from '../shared/components/mesa/mesa.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, MesaComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
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
      this.mesaService.seleccionarMesa(0);
    } else {
      this.mesaSeleccionada.set(numero);
      this.mesaService.seleccionarMesa(numero);
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
      'paraLlevar': 'Para Llevar',
      'ultimas': 'Ultimas',
      'precios': 'Precios',
      'delivery': 'Delivery',
      'verTickets': 'Ver Tickets',
      'porPagar': 'Por Pagar',
      'marcarEntrega': 'Marcar Entrega',
      'administrar': 'Administrar',
      'cerrarCaja': 'Cerrar Caja',
      'cerrarCajaFinal': 'Cerrar Caja Final',
      'otrosIngresos': 'Otros Ingresos',
      'reservas': 'Reservas',
      'salir': 'Salir del Sistema'
    };
    return nombres[opcion] || 'Seleccionar Acción';
  }

  seleccionarOpcion(opcion: string): void {
    this.opcionSeleccionada.set(opcion);
    this.panelAbierto.set(false);
    
    switch(opcion) {
      case 'paraLlevar': this.paraLlevar(); break;
      case 'ultimas': this.ultimas(); break;
      case 'precios': this.precios(); break;
      case 'delivery': this.delivery(); break;
      case 'verTickets': this.verTickets(); break;
      case 'porPagar': this.porPagar(); break;
      case 'marcarEntrega': this.marcarEntrega(); break;
      case 'administrar': this.administrar(); break;
      case 'cerrarCaja': this.cerrarCajaIndividual(); break;
      case 'cerrarCajaFinal': this.cerrarCajaFinal(); break;
      case 'otrosIngresos': this.otrosIngresos(); break;
      case 'reservas': this.reservas(); break;
      case 'salir': this.salir(); break;
    }
  }

  solicitarGasto(): void { console.log('Solicitar gasto'); }
  paraLlevar(): void { console.log('Para llevar'); }
  ultimas(): void { console.log('Ultimas'); }
  precios(): void { console.log('Precios'); }
  delivery(): void { console.log('Delivery'); }
  verTickets(): void { console.log('Ver tickets'); }
  porPagar(): void { console.log('Por pagar'); }
  marcarEntrega(): void { console.log('Marcar entrega'); }
  salir(): void { this.cerrarSesion(); }
  cerrarCajaFinal(): void { console.log('Cerrar caja final'); }
  administrar(): void { console.log('Administrar'); }
  cerrarCajaIndividual(): void { console.log('Cerrar caja individual'); }
  otrosIngresos(): void { console.log('Otros ingresos'); }
  reservas(): void { console.log('Reservas'); }
}