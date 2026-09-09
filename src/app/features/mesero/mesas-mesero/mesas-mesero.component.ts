// src/app/features/mesero/mesas-mesero/mesas-mesero.component.ts
import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MesaService, Mesa } from '../../../core/services/mesa.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-mesas-mesero',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
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

  totalMesas = signal<number>(0);
  mesasOcupadas = signal<number>(0);
  mesasLibres = signal<number>(0);

  // ✅ Modal para ocupar mesa
  mostrarModalOcupar = signal<boolean>(false);
  nombreCliente = signal<string>('');
  cantidadPersonas = signal<number>(1);
  mesaAOcupar = signal<number | null>(null);

  // ✅ Modal para confirmar liberación
  mostrarModalLiberar = signal<boolean>(false);
  mesaALiberar = signal<number | null>(null);
  clienteALiberar = signal<string>('');

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

  // ✅ ABRIR MODAL PARA OCUPAR MESA
  abrirModalOcupar(): void {
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

    this.mesaAOcupar.set(num);
    this.nombreCliente.set('');
    this.cantidadPersonas.set(1);
    this.mostrarModalOcupar.set(true);
  }

  // ✅ OCUPAR MESA CON LOS DATOS DEL MODAL
  ocuparMesa(): void {
    const num = this.mesaAOcupar();
    if (num === null) return;

    const cliente = this.nombreCliente().trim();
    if (!cliente) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }

    this.mesaService.ocuparMesa(num, cliente, this.cantidadPersonas());
    this.mostrarModalOcupar.set(false);
    this.mesaAOcupar.set(null);
    this.nombreCliente.set('');
    this.cantidadPersonas.set(1);
  }

  // ✅ CERRAR MODAL OCUPAR
  cerrarModalOcupar(): void {
    this.mostrarModalOcupar.set(false);
    this.mesaAOcupar.set(null);
    this.nombreCliente.set('');
    this.cantidadPersonas.set(1);
  }

  // ✅ ABRIR MODAL DE CONFIRMACIÓN PARA LIBERAR MESA
  abrirModalLiberar(): void {
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

    this.mesaALiberar.set(num);
    this.clienteALiberar.set(mesa.cliente || 'Cliente');
    this.mostrarModalLiberar.set(true);
  }

  // ✅ LIBERAR MESA (CONFIRMADO)
  confirmarLiberarMesa(): void {
    const num = this.mesaALiberar();
    if (num === null) return;

    this.mesaService.liberarMesa(num);
    this.mesaService.seleccionarMesa(num);
    this.mostrarModalLiberar.set(false);
    this.mesaALiberar.set(null);
    this.clienteALiberar.set('');
  }

  // ✅ CERRAR MODAL LIBERAR
  cerrarModalLiberar(): void {
    this.mostrarModalLiberar.set(false);
    this.mesaALiberar.set(null);
    this.clienteALiberar.set('');
  }

  // NAVEGACIÓN
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