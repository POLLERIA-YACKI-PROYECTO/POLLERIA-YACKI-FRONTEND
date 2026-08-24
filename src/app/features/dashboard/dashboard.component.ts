import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MesaService } from '../../core/services/mesa.service';
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

  solicitarGasto(): void {
    console.log('Solicitar gasto');
  }

  paraLlevar(): void {
    console.log('Para llevar');
  }

  ultimas(): void {
    console.log('Últimas');
  }

  precios(): void {
    console.log('Precios');
  }

  delivery(): void {
    console.log('Delivery');
  }

  verTickets(): void {
    console.log('Ver tickets');
  }

  porPagar(): void {
    console.log('Por pagar');
  }

  marcarEntrega(): void {
    console.log('Marcar entrega');
  }

  salir(): void {
    this.cerrarSesion();
  }

  cerrarCajaFinal(): void {
    console.log('Cerrar caja final');
  }

  administrar(): void {
    console.log('Administrar');
  }

  cerrarCajaIndividual(): void {
    console.log('Cerrar caja individual');
  }

  otrosIngresos(): void {
    console.log('Otros ingresos');
  }

  reservas(): void {
    console.log('Reservas');
  }
}