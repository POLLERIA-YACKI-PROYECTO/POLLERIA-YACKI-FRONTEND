// mesas-mesero.component.ts
import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MesaService, Mesa } from '../../../core/services/mesa.service';
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

  mesas = this.mesaService.getMesasSignal();
  mesaSeleccionada = this.mesaService.getMesaSeleccionadaSignal();
  selectedMesa = signal<Mesa | null>(null);

  totalMesas = signal<number>(16);
  mesasOcupadas = signal<number>(0);
  mesasLibres = signal<number>(0);

  constructor() {
    effect(() => {
      const mesas = this.mesas();
      this.mesasOcupadas.set(mesas.filter(m => m.ocupada).length);
      this.mesasLibres.set(mesas.filter(m => !m.ocupada).length);
    });
  }

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }
  }

  getMesaByNumero(numero: number): Mesa | undefined {
    return this.mesas().find(m => m.numero === numero);
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

  seleccionarMesa(numero: number): void {
    this.mesaService.seleccionarMesa(numero);
    const mesa = this.mesas().find(m => m.numero === numero);
    this.selectedMesa.set(mesa || null);
  }

  ocuparMesa(): void {
    const num = this.mesaSeleccionada();
    if (num === null) {
      alert('Primero seleccione una mesa');
      return;
    }
    
    const mesa = this.mesas().find(m => m.numero === num);
    if (mesa?.ocupada) {
      alert(`La mesa ${num} ya está ocupada`);
      return;
    }
    
    const cliente = prompt('Ingrese nombre del cliente:') || `Mesa ${num}`;
    this.mesaService.ocuparMesa(num, cliente);
    this.mesaService.seleccionarMesa(num);
  }

  liberarMesa(): void {
    const num = this.mesaSeleccionada();
    if (num === null) {
      alert('Primero seleccione una mesa');
      return;
    }
    
    const mesa = this.mesas().find(m => m.numero === num);
    if (!mesa?.ocupada) {
      alert(`La mesa ${num} ya está libre`);
      return;
    }
    
    if (confirm(`¿Liberar mesa ${num} - Cliente: ${mesa.cliente}?`)) {
      this.mesaService.liberarMesa(num);
      this.mesaService.seleccionarMesa(num);
    }
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