import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MesaService } from '../../../core/services/mesa.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-mesas-mesero',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './mesas-mesero.component.html',
  styleUrls: ['./mesas-mesero.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class MesasMeseroComponent implements OnInit {
  private authService = inject(AuthService);
  private mesaService = inject(MesaService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');

  mesas = signal<number[]>(Array.from({ length: 16 }, (_, i) => i + 1));
  mesaSeleccionada = signal<number | null>(null);
  mesasEstado = signal<{ [key: number]: { ocupada: boolean; cliente: string } }>({});

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }

    const estadoInicial: any = {};
    this.mesas().forEach(num => {
      estadoInicial[num] = {
        ocupada: [4, 7, 9, 12, 15].includes(num),
        cliente: [4, 7, 9, 12, 15].includes(num) ? `Cliente ${num}` : ''
      };
    });
    this.mesasEstado.set(estadoInicial);
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

  seleccionarMesa(numero: number): void {
    if (this.mesaSeleccionada() === numero) {
      this.mesaSeleccionada.set(null);
    } else {
      this.mesaSeleccionada.set(numero);
    }
  }

  ocuparMesa(): void {
    const num = this.mesaSeleccionada();
    if (num === null) {
      alert('Primero seleccione una mesa');
      return;
    }
    
    const estadoActual = this.mesasEstado();
    if (!estadoActual[num]) {
      estadoActual[num] = { ocupada: false, cliente: '' };
    }
    
    if (estadoActual[num].ocupada) {
      alert(`La mesa ${num} ya está ocupada`);
      return;
    }
    
    const cliente = prompt('Ingrese nombre del cliente:') || `Mesa ${num}`;
    this.mesasEstado.update(estado => ({
      ...estado,
      [num]: { ocupada: true, cliente }
    }));
    this.mesaSeleccionada.set(null);
  }

  liberarMesa(): void {
    const num = this.mesaSeleccionada();
    if (num === null) {
      alert('Primero seleccione una mesa');
      return;
    }
    
    const estadoActual = this.mesasEstado();
    if (!estadoActual[num] || !estadoActual[num].ocupada) {
      alert(`La mesa ${num} ya está libre`);
      return;
    }
    
    if (confirm(`¿Liberar mesa ${num} - Cliente: ${estadoActual[num].cliente}?`)) {
      this.mesasEstado.update(estado => ({
        ...estado,
        [num]: { ocupada: false, cliente: '' }
      }));
      this.mesaSeleccionada.set(null);
    }
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