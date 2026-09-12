// src/app/features/admin/historial-cliente/historial-cliente.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AuthService } from '../../../core/services/auth.service';

interface ClienteHistorial {
  id: number;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  tipo_cliente?: string;
  puntos?: number;
  fecha_registro: string;
  ultimo_acceso?: string;
  total_pedidos: number;
  total_gastado: number;
  ultima_compra?: string;
  estado_compra: 'compro' | 'no_compro';
}

interface Estadisticas {
  total_clientes: number;
  clientes_sin_compras: number;
  clientes_con_compras: number;
  total_logins: number;
  total_registros: number;
  actividad_hoy: number;
}

type Tab = 'todos' | 'con-compras' | 'sin-compras';

@Component({
  selector: 'app-historial-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent],
  templateUrl: './historial-cliente.component.html',
  styleUrls: ['./historial-cliente.component.scss'],
  host: { 'class': 'admin-mode' }
})
export class HistorialClienteComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/api/historial';

  // Usuario actual (para el header)
  usuario = signal<any>(null);

  // Estado
  temaOscuro = signal<boolean>(false);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  tabActual = signal<Tab>('todos');
  busqueda = signal<string>('');

  // Datos
  clientes = signal<ClienteHistorial[]>([]);
  clientesConCompras = signal<ClienteHistorial[]>([]);
  clientesSinCompras = signal<ClienteHistorial[]>([]);
  estadisticas = signal<Estadisticas | null>(null);

  // Computed
  clientesFiltrados = computed(() => {
    const term = this.busqueda().toLowerCase().trim();
    let lista: ClienteHistorial[] = [];

    switch (this.tabActual()) {
      case 'con-compras': lista = this.clientesConCompras(); break;
      case 'sin-compras': lista = this.clientesSinCompras(); break;
      default: lista = this.clientes();
    }

    if (!term) return lista;

    return lista.filter(c =>
      (c.nombre || '').toLowerCase().includes(term) ||
      (c.apellido || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.telefono || '').includes(term)
    );
  });

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    this.cargarTodo();
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }

  toggleTema(): void {
    this.temaOscuro.set(!this.temaOscuro());
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

 cargarTodo(): void {
  this.loading.set(true);
  this.error.set(null);

  this.http.get<any>(`${this.apiUrl}/resumen-completo`, { headers: this.getHeaders() })
    .subscribe({
      next: (data) => {
        this.estadisticas.set(data.estadisticas);
        this.clientes.set(data.clientes);
        this.clientesConCompras.set(data.clientesConCompras);
        this.clientesSinCompras.set(data.clientesSinCompras);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error historial:', err);

        let mensaje = 'No se pudo cargar el historial de clientes';
        if (err?.status === 429) {
          mensaje = 'Demasiadas peticiones. Espera un momento y reintenta.';
        } else if (err?.status === 401) {
          mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
        } else if (err?.status === 0) {
          mensaje = 'No se pudo conectar con el servidor.';
        }

        this.error.set(mensaje);
        this.loading.set(false);
      }
    });


    this.http.get<ClienteHistorial[]>(`${this.apiUrl}/clientes/con-compras`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => this.clientesConCompras.set(data),
        error: (err) => console.error('Error con compras:', err)
      });

    this.http.get<ClienteHistorial[]>(`${this.apiUrl}/clientes/sin-compras`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => this.clientesSinCompras.set(data),
        error: (err) => console.error('Error sin compras:', err)
      });
  }

  cambiarTab(tab: Tab): void {
    this.tabActual.set(tab);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  formatearPrecio(valor: number | string): string {
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    return `S/ ${(isNaN(num) ? 0 : num).toFixed(2)}`;
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '--';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getIniciales(cliente: ClienteHistorial): string {
    const n = (cliente.nombre || '').trim().charAt(0).toUpperCase();
    const a = (cliente.apellido || '').trim().charAt(0).toUpperCase();
    return `${n}${a}` || '?';
  }

  getAvatarColor(id: number): string {
    const colores = ['#c5302a', '#e67e22', '#16a085', '#2980b9', '#8e44ad', '#d35400', '#27ae60', '#c0392b'];
    return colores[id % colores.length];
  }

  totalClientesTexto(): string {
    const total = this.clientes().length;
    return total === 1 ? '1 cliente' : `${total} clientes`;
  }
}