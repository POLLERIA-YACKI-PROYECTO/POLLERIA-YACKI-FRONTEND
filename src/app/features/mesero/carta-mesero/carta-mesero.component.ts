import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-carta-mesero',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './carta-mesero.component.html',
  styleUrls: ['./carta-mesero.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class CartaMeseroComponent implements OnInit {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private configService = inject(ConfiguracionService);
  private authService = inject(AuthService);
  private router = inject(Router);

  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');

  categorias = signal<any[]>([]);
  productos = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  categoriaSeleccionada = signal<number | null>(null);
  configuracion = signal<any>({});
  loading = signal(true);
  usuario = signal<any>(null);

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }
    this.cargarDatos();
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

  cargarDatos(): void {
    this.loading.set(true);
    
    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        if (categorias.length > 0) {
          this.categoriaSeleccionada.set(categorias[0].id);
          this.cargarProductos(categorias[0].id);
        }
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.loading.set(false);
      }
    });

    this.configService.obtenerConfiguracion().subscribe({
      next: (config) => this.configuracion.set(config),
      error: (err) => console.error('Error al cargar configuración:', err)
    });
  }

  cargarProductos(categoriaId: number): void {
    this.loading.set(true);
    this.categoriaSeleccionada.set(categoriaId);
    
    this.productoService.obtenerPorCategoria(categoriaId).subscribe({
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

  seleccionarCategoria(categoriaId: number): void {
    if (this.categoriaSeleccionada() === categoriaId) return;
    this.cargarProductos(categoriaId);
  }

  agregarAlPedido(producto: any): void {
    alert(`Producto agregado: ${producto.nombre} - S/ ${producto.precio}`);
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