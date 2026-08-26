// precios-carta-mesero.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-precios-carta-mesero',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './precios-carta-mesero.component.html',
  styleUrls: ['./precios-carta-mesero.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class PreciosCartaMeseroComponent implements OnInit {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');
  loading = signal(true);

  categorias = signal<any[]>([]);
  productos = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  categoriaSeleccionada = signal<string>('todas');

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    
    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        const todas = { id: 'todas', nombre: 'Todas' };
        this.categorias.set([todas, ...categorias]);
      },
      error: (err) => console.error('Error al cargar categorías:', err)
    });

    this.productoService.obtenerProductos().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.productosFiltrados.set(productos);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.loading.set(false);
      }
    });
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

  seleccionarCategoria(categoriaId: string): void {
    this.categoriaSeleccionada.set(categoriaId);
    if (categoriaId === 'todas') {
      this.productosFiltrados.set(this.productos());
    } else {
      const filtrados = this.productos().filter(p => p.categoria_id === parseInt(categoriaId));
      this.productosFiltrados.set(filtrados);
    }
  }

  getIconoCategoria(categoriaId: number): string {
    const cat = this.categorias().find(c => c.id === categoriaId);
    return cat?.icono || '🍗';
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