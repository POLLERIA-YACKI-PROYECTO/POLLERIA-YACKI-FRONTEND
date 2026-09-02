// src/app/features/mesero/dashboard-mesero/dashboard-mesero.component.ts
import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MesaService, Mesa } from '../../../core/services/mesa.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-dashboard-mesero',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './dashboard-mesero.component.html',
  styleUrls: ['./dashboard-mesero.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class DashboardMeseroComponent implements OnInit {
  private authService = inject(AuthService);
  private mesaService = inject(MesaService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');

  mostrarBienvenida = signal<boolean>(false);
  esPrimeraVez = signal<boolean>(false);
  nombreUsuario = signal<string>('');
  mensajeBienvenida = signal<string>('');

  mesas = this.mesaService.getMesasSignal();
  mesaSeleccionada = this.mesaService.getMesaSeleccionadaSignal();

  totalMesas = signal<number>(16);
  mesasOcupadas = signal<number>(0);
  mesasLibres = signal<number>(0);

  constructor() {
    effect(() => {
      const mesas = this.mesas();
      this.totalMesas.set(mesas.length);
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

    this.mesaService.cargarMesas();

    const nombre = this.usuario()?.nombre || 'Usuario';
    this.nombreUsuario.set(nombre);

    const claveVisita = `visitado_${this.usuario()?.id}`;
    const yaVisitado = localStorage.getItem(claveVisita);

    if (!yaVisitado) {
      this.esPrimeraVez.set(true);
      this.mensajeBienvenida.set(`Bienvenido ${nombre}`);
      localStorage.setItem(claveVisita, 'true');
      this.mostrarBienvenida.set(true);

      setTimeout(() => {
        this.mostrarBienvenida.set(false);
      }, 3000);
    } else {
      this.esPrimeraVez.set(false);
      this.mensajeBienvenida.set(`Gusto volver a verte ${nombre}`);
      this.mostrarBienvenida.set(true);

      setTimeout(() => {
        this.mostrarBienvenida.set(false);
      }, 2000);
    }
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
  }

  toggleOcupada(numero: number, event: Event): void {
    event.stopPropagation();
    const mesa = this.mesas().find(m => m.numero === numero);
    if (mesa) {
      if (mesa.ocupada) {
        if (confirm(`¿Liberar mesa ${numero} - Cliente: ${mesa.cliente}?`)) {
          this.mesaService.liberarMesa(numero);
        }
      } else {
        const cliente = prompt('Ingrese nombre del cliente:', `Mesa ${numero}`);
        if (cliente !== null) {
          this.mesaService.ocuparMesa(numero, cliente || `Mesa ${numero}`);
        }
      }
    }
    this.mesaService.seleccionarMesa(numero);
  }

  // NAVEGACIÓN CORREGIDA
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

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-mesero']);
  }
}
