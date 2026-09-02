// src/app/features/mesero/carta-mesero/carta-mesero.component.ts
import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-carta-mesero',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
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
  categoriaMenuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');

  categorias = signal<any[]>([]);
  productos = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  categoriaSeleccionada = signal<number | null>(null);
  configuracion = signal<any>({});
  loading = signal(true);
  usuario = signal<any>(null);

  // ============ BUSCADOR ============
  terminoBusqueda = signal<string>('');
  buscadorActivo = signal<boolean>(false);
  resultadosBusqueda = signal<any[]>([]);

  // Computed para el nombre de la categoría seleccionada
  categoriaSeleccionadaNombre = computed(() => {
    const cat = this.categorias().find(c => c.id === this.categoriaSeleccionada());
    return cat ? cat.nombre : 'Seleccionar categoría';
  });

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

  toggleCategoriaMenu(): void {
    this.categoriaMenuAbierto.set(!this.categoriaMenuAbierto());
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

  cargarDatos(): void {
    this.loading.set(true);

    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias: any[]) => {
        this.categorias.set(categorias);
        if (categorias.length > 0) {
          this.categoriaSeleccionada.set(categorias[0].id);
          this.cargarProductos(categorias[0].id);
        }
      },
      error: (err: any) => {
        console.error('Error al cargar categorías:', err);
        this.loading.set(false);
      }
    });

    this.configService.obtenerConfiguracion().subscribe({
      next: (config: any) => this.configuracion.set(config),
      error: (err: any) => console.error('Error al cargar configuración:', err)
    });
  }

  cargarProductos(categoriaId: number): void {
    this.loading.set(true);
    this.categoriaSeleccionada.set(categoriaId);
    this.categoriaMenuAbierto.set(false);
    // Limpiar búsqueda al cambiar categoría
    this.terminoBusqueda.set('');
    this.buscadorActivo.set(false);
    this.resultadosBusqueda.set([]);

    this.productoService.obtenerPorCategoria(categoriaId).subscribe({
      next: (productos: any[]) => {
        this.productos.set(productos);
        this.productosFiltrados.set(productos);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error al cargar productos:', err);
        this.loading.set(false);
      }
    });
  }

  seleccionarCategoria(categoriaId: number): void {
    if (this.categoriaSeleccionada() === categoriaId) {
      this.categoriaMenuAbierto.set(false);
      return;
    }
    this.cargarProductos(categoriaId);
  }

  contarProductosPorCategoria(categoriaId: number): number {
    return this.productos().filter(p => p.categoria_id === categoriaId).length;
  }

  // ============================================
  // BUSCADOR EN TIEMPO REAL
  // ============================================
  buscarProductos(): void {
    const termino = this.terminoBusqueda().trim();

    if (!termino) {
      this.buscadorActivo.set(false);
      this.resultadosBusqueda.set([]);
      this.productosFiltrados.set(this.productos());
      return;
    }

    this.buscadorActivo.set(true);

    // Buscar en todos los productos (no solo los de la categoría actual)
    const todosLosProductos = this.productos();
    const resultados = this.productoService.buscarProductos(termino, todosLosProductos);

    this.resultadosBusqueda.set(resultados);
    this.productosFiltrados.set(resultados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
    this.buscadorActivo.set(false);
    this.resultadosBusqueda.set([]);
    // Restaurar productos de la categoría actual
    if (this.categoriaSeleccionada() !== null) {
      this.cargarProductos(this.categoriaSeleccionada()!);
    } else {
      this.productosFiltrados.set(this.productos());
    }
  }

  // Resaltar coincidencias en el texto
  resaltarCoincidencia(texto: string): string {
    const termino = this.terminoBusqueda().trim();
    if (!termino) return texto;

    const regex = new RegExp(`(${termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(regex, '<mark class="highlight">$1</mark>');
  }

  // ============================================
  // AGREGAR AL PEDIDO
  // ============================================
  agregarAlPedido(producto: any): void {
    // Aquí iría la lógica para agregar al pedido
    alert(`Producto agregado: ${producto.nombre} - S/ ${producto.precio}`);
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================
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
