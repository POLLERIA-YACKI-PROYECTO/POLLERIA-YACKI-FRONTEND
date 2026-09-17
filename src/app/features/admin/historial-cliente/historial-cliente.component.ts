// src/app/features/admin/historial-cliente/historial-cliente.component.ts
import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface ClienteHistorial {
  id: number;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  dni?: string;
  tipo_cliente?: string;
  puntos?: number;
  fecha_registro: string;
  ultimo_acceso?: string;
  total_pedidos: number;
  total_gastado: number;
  ultima_compra?: string;
  estado_compra: 'compro' | 'no_compro';
}

interface CompraDetalle {
  origen: 'venta' | 'pedido_cliente';
  id: number;
  items: any[];
  subtotal: number;
  igv: number;
  total: number;
  metodo_pago: string;
  tipo_entrega: string;
  estado: string;
  fecha: string;
  cliente_nombre: string;
  vendedor_nombre?: string;
  vendedor_apellido?: string;
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
export class HistorialClienteComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Usar environment en vez de hardcodear la URL
  private apiUrl = `${environment.apiUrl}/historial`;

  // Protección anti-saturación
  private destroy$ = new Subject<void>();
  private cargando = signal(false);
  private yaCargado = signal(false);

  usuario = signal<any>(null);
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

  // Modal de detalle
  mostrarModalDetalle = signal<boolean>(false);
  clienteSeleccionado = signal<ClienteHistorial | null>(null);
  comprasDetalle = signal<CompraDetalle[]>([]);
  cargandoCompras = signal<boolean>(false);

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
      (c.telefono || '').includes(term) ||
      (c.dni || '').includes(term)
    );
  });

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    // Verificar autenticación primero
    if (!this.authService.isAuthenticated()) {
      console.warn('HistorialCliente: sin sesión -> /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    if (!this.authService.isAdmin()) {
      console.warn('HistorialCliente: no es admin -> /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    this.usuario.set(this.authService.getUsuarioActual());
    this.cargarTodo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }

  toggleTema(): void {
    this.temaOscuro.set(!this.temaOscuro());
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken() || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // ============================================
  // CARGAR DATOS
  // ============================================
  cargarTodo(): void {
    if (this.cargando() || this.yaCargado()) return;

    this.cargando.set(true);
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(`${this.apiUrl}/resumen-completo`, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.estadisticas.set(data.estadisticas);
          this.clientes.set(data.clientes || []);
          this.clientesConCompras.set(data.clientesConCompras || []);
          this.clientesSinCompras.set(data.clientesSinCompras || []);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('Historial cliente cargado:', (data.clientes || []).length, 'clientes');
        },
        error: (err) => {
          console.error('Error historial:', err);

          let mensaje = 'No se pudo cargar el historial de clientes';
          if (err?.status === 429) mensaje = 'Demasiadas peticiones. Espera un momento.';
          else if (err?.status === 401) mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
          else if (err?.status === 403) mensaje = 'No tienes permisos para ver el historial.';
          else if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
          else if (err?.error?.error) mensaje = err.error.error;

          this.error.set(mensaje);
          this.loading.set(false);
          this.cargando.set(false);
          // Resetear yaCargado para permitir reintento
          this.yaCargado.set(false);
        }
      });
  }

  recargar(): void {
    this.yaCargado.set(false);
    this.cargarTodo();
  }

  // ============================================
  // VER DETALLE DE COMPRAS
  // ============================================
  verDetalleCompras(cliente: ClienteHistorial): void {
    if (this.cargandoCompras()) return;  // Evita doble click

    this.clienteSeleccionado.set(cliente);
    this.mostrarModalDetalle.set(true);
    this.cargandoCompras.set(true);
    this.comprasDetalle.set([]);

    this.http.get<CompraDetalle[]>(
      `${this.apiUrl}/cliente/${cliente.id}/compras`,
      { headers: this.getHeaders() }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (compras) => {
          this.comprasDetalle.set(compras || []);
          this.cargandoCompras.set(false);
        },
        error: (err) => {
          console.error('Error al cargar compras:', err);
          this.comprasDetalle.set([]);
          this.cargandoCompras.set(false);
        }
      });
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle.set(false);
    this.clienteSeleccionado.set(null);
    this.comprasDetalle.set([]);
  }

  // ============================================
  // TABS Y BÚSQUEDA
  // ============================================
  cambiarTab(tab: Tab): void {
    this.tabActual.set(tab);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  // ============================================
  // UTILIDADES
  // ============================================
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

  getMetodoPagoLabel(metodo: string): string {
    const labels: Record<string, string> = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'yape': 'Yape',
      'plin': 'Plin',
      'transferencia': 'Transferencia'
    };
    return labels[metodo] || metodo;
  }

  getTipoEntregaLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'local': 'Local',
      'delivery': 'Delivery',
      'paraLlevar': 'Para Llevar',
      'motorizada': 'Motorizado'
    };
    return labels[tipo] || tipo;
  }
}