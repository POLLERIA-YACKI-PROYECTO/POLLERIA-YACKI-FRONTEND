// dashboard-admin.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VentaService } from '../../../core/services/venta.service';
import { ProductoService } from '../../../core/services/producto.service';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss']
})
export class DashboardAdminComponent implements OnInit {
  private authService = inject(AuthService);
  private ventaService = inject(VentaService);
  private productoService = inject(ProductoService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  usuario = signal<any>(null);
  loading = signal<boolean>(true);
  
  // Fecha actual formateada
  fechaActual = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Hora actual
  horaActual = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  stats = signal([
    { 
      icon: 'productos',
      label: 'Productos', 
      value: 0, 
      color: '#ce8329',
      bgColor: '#ce832920'
    },
    { 
      icon: 'ventas',
      label: 'Ventas Hoy', 
      value: 0, 
      color: '#5e412f',
      bgColor: '#5e412f20'
    },
    { 
      icon: 'ingresos',
      label: 'Ingresos Totales', 
      value: 'S/ 0.00', 
      color: '#2e7d32',
      bgColor: '#2e7d3220'
    },
    { 
      icon: 'usuarios',
      label: 'Usuarios Activos', 
      value: 0, 
      color: '#1565c0',
      bgColor: '#1565c020'
    }
  ]);

  ventasRecientes = signal<any[]>([]);
  ventasHoy = signal<any[]>([]);
  totalVentasHoy = signal<number>(0);
  totalIngresosHoy = signal<number>(0);

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'admin') {
      this.router.navigate(['/login-admin']);
      return;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    
    // Cargar productos
    this.productoService.obtenerProductos().subscribe({
      next: (productos) => {
        this.actualizarStat('productos', productos.length);
      },
      error: (err) => console.error('Error al cargar productos:', err)
    });

    // Cargar ventas
    this.ventaService.obtenerVentas().subscribe({
      next: (ventas) => {
        const hoy = new Date().toISOString().split('T')[0];
        const ventasHoy = ventas.filter(v => v.fecha_venta?.startsWith(hoy));
        
        // Ventas de hoy
        this.ventasHoy.set(ventasHoy);
        this.totalVentasHoy.set(ventasHoy.length);
        this.actualizarStat('ventas', ventasHoy.length);
        
        // Total ingresos
        const total = ventas.reduce((sum, v) => sum + (v.total || 0), 0);
        const totalHoy = ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0);
        this.totalIngresosHoy.set(totalHoy);
        this.actualizarStat('ingresos', `S/ ${total.toFixed(2)}`);
        
        // Ventas recientes (últimas 10)
        const recientes = ventas.slice(-10).reverse().map(v => ({
          id: v.id,
          cliente: v.cliente || 'Consumidor Final',
          total: v.total || 0,
          fecha: v.fecha_venta ? this.formatearFecha(v.fecha_venta) : '--',
          estado: v.estado || 'completada'
        }));
        this.ventasRecientes.set(recientes);
        
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.loading.set(false);
      }
    });

    // Cargar usuarios
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        this.actualizarStat('usuarios', usuarios.length);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.loading.set(false);
      }
    });
  }

  formatearFecha(fecha: string): string {
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  actualizarStat(icono: string, valor: any): void {
    this.stats.update(stats => 
      stats.map(s => 
        s.icon === icono ? { ...s, value: valor } : s
      )
    );
  }

  getEstadoClass(estado: string): string {
    const clases: any = {
      'completada': 'estado-completada',
      'Completada': 'estado-completada',
      'pendiente': 'estado-pendiente',
      'Pendiente': 'estado-pendiente',
      'cancelada': 'estado-cancelada',
      'Cancelada': 'estado-cancelada'
    };
    return clases[estado] || 'estado-pendiente';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      'completada': 'Completada',
      'Completada': 'Completada',
      'pendiente': 'Pendiente',
      'Pendiente': 'Pendiente',
      'cancelada': 'Cancelada',
      'Cancelada': 'Cancelada'
    };
    return textos[estado] || estado;
  }

  getIconSvg(icon: string): string {
    const icons: any = {
      'productos': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16v16H4z"/>
          <path d="M8 8h8v8H8z"/>
          <path d="M8 12h8"/>
          <path d="M12 4v4"/>
          <path d="M12 16v4"/>
        </svg>
      `,
      'ventas': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <circle cx="16" cy="15" r="1"/>
          <circle cx="8" cy="15" r="1"/>
        </svg>
      `,
      'ingresos': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v2M12 16v2M8 10h2M14 10h2M8 14h8"/>
        </svg>
      `,
      'usuarios': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      `
    };
    return icons[icon] || icons['productos'];
  }

  // Método para refrescar datos
  refrescar(): void {
    this.cargarDatos();
  }
}