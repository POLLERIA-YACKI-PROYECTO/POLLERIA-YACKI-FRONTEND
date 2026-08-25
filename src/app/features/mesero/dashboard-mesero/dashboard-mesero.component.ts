import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
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
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');
  
  // Control del mensaje de bienvenida
  mostrarBienvenida = signal<boolean>(false);
  esPrimeraVez = signal<boolean>(false);
  nombreUsuario = signal<string>('');
  mensajeBienvenida = signal<string>('');

  mesas = signal([
    { numero: 1, ocupada: false },
    { numero: 2, ocupada: false },
    { numero: 3, ocupada: true },
    { numero: 4, ocupada: false },
    { numero: 5, ocupada: false },
    { numero: 6, ocupada: true },
    { numero: 7, ocupada: false },
    { numero: 8, ocupada: false },
    { numero: 9, ocupada: true },
    { numero: 10, ocupada: false },
    { numero: 11, ocupada: false },
    { numero: 12, ocupada: true },
    { numero: 13, ocupada: false },
    { numero: 14, ocupada: false },
    { numero: 15, ocupada: true },
    { numero: 16, ocupada: false }
  ]);

  mesaSeleccionada = signal<number | null>(null);

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }

    // Verificar si es la primera vez que ingresa
    const nombre = this.usuario()?.nombre || 'Usuario';
    this.nombreUsuario.set(nombre);
    
    const claveVisita = `visitado_${this.usuario()?.id}`;
    const yaVisitado = localStorage.getItem(claveVisita);
    
    if (!yaVisitado) {
      this.esPrimeraVez.set(true);
      this.mensajeBienvenida.set(`Bienvenido ${nombre}`);
      localStorage.setItem(claveVisita, 'true');
      this.mostrarBienvenida.set(true);
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        this.mostrarBienvenida.set(false);
      }, 3000);
    } else {
      this.esPrimeraVez.set(false);
      this.mensajeBienvenida.set(`Gusto volver a verte ${nombre}`);
      this.mostrarBienvenida.set(true);
      
      // Ocultar mensaje después de 2 segundos
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
    
    switch(opcion) {
      case 'carta': this.irCarta(); break;
      case 'mesas': this.irMesas(); break;
      case 'pedidos': this.irPedidos(); break;
      case 'precios': this.irPrecios(); break;
      case 'ventas': this.irVentas(); break;
      case 'tickets': this.irTicket(); break;
    }
  }

  seleccionarMesa(numero: number): void {
    if (this.mesaSeleccionada() === numero) {
      this.mesaSeleccionada.set(null);
    } else {
      this.mesaSeleccionada.set(numero);
    }
  }

  toggleOcupada(numero: number): void {
    this.mesas.update(mesas => 
      mesas.map(m => 
        m.numero === numero ? { ...m, ocupada: !m.ocupada } : m
      )
    );
    this.mesaSeleccionada.set(null);
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

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-mesero']);
  }
}