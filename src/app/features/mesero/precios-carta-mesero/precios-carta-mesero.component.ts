// src/app/features/mesero/precios-carta-mesero/precios-carta-mesero.component.ts
import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-precios-carta-mesero',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
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
  categoriaMenuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');
  loading = signal(true);

  categorias = signal<any[]>([]);
  productos = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  categoriaSeleccionada = signal<string>('todas');

  // ============ BUSCADOR ============
  terminoBusqueda = signal<string>('');
  buscadorActivo = signal<boolean>(false);
  resultadosBusqueda = signal<any[]>([]);

  // Computed para el nombre de la categoría seleccionada
  categoriaSeleccionadaNombre = computed(() => {
    if (this.categoriaSeleccionada() === 'todas') {
      return 'Todas las categorías';
    }
    const cat = this.categorias().find(c => c.id === parseInt(this.categoriaSeleccionada()));
    return cat ? cat.nombre : 'Seleccionar categoría';
  });

  // Contador de productos por categoría
  contarProductosPorCategoria = computed(() => {
    const conteo: any = {};
    this.productos().forEach(p => {
      const key = p.categoria_id?.toString() || 'sin';
      conteo[key] = (conteo[key] || 0) + 1;
    });
    return conteo;
  });

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
      next: (categorias: any[]) => {
        this.categorias.set(categorias);
      },
      error: (err: any) => console.error('Error al cargar categorías:', err)
    });

    this.productoService.obtenerProductos().subscribe({
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

  seleccionarCategoria(categoriaId: string): void {
    this.categoriaSeleccionada.set(categoriaId);
    this.categoriaMenuAbierto.set(false);
    // Limpiar búsqueda al cambiar categoría
    this.terminoBusqueda.set('');
    this.buscadorActivo.set(false);
    this.resultadosBusqueda.set([]);

    if (categoriaId === 'todas') {
      this.productosFiltrados.set(this.productos());
    } else {
      const filtrados = this.productos().filter(p => p.categoria_id === parseInt(categoriaId));
      this.productosFiltrados.set(filtrados);
    }
  }

  // ============================================
  // BUSCADOR EN TIEMPO REAL
  // ============================================
  buscarProductos(): void {
    const termino = this.terminoBusqueda().trim();

    if (!termino) {
      this.buscadorActivo.set(false);
      this.resultadosBusqueda.set([]);
      // Restaurar según categoría seleccionada
      if (this.categoriaSeleccionada() === 'todas') {
        this.productosFiltrados.set(this.productos());
      } else {
        const filtrados = this.productos().filter(p => p.categoria_id === parseInt(this.categoriaSeleccionada()));
        this.productosFiltrados.set(filtrados);
      }
      return;
    }

    this.buscadorActivo.set(true);

    // Buscar en todos los productos
    const todosLosProductos = this.productos();
    const resultados = this.productoService.buscarProductos(termino, todosLosProductos);

    this.resultadosBusqueda.set(resultados);
    this.productosFiltrados.set(resultados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
    this.buscadorActivo.set(false);
    this.resultadosBusqueda.set([]);
    // Restaurar según categoría seleccionada
    if (this.categoriaSeleccionada() === 'todas') {
      this.productosFiltrados.set(this.productos());
    } else {
      const filtrados = this.productos().filter(p => p.categoria_id === parseInt(this.categoriaSeleccionada()));
      this.productosFiltrados.set(filtrados);
    }
  }

  // Resaltar coincidencias en el texto
  resaltarCoincidencia(texto: string): string {
    const termino = this.terminoBusqueda().trim();
    if (!termino) return texto;

    const regex = new RegExp(`(${termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(regex, '<mark class="highlight">$1</mark>');
  }

  getIconoCategoria(categoriaId: number): string {
    const cat = this.categorias().find(c => c.id === categoriaId);
    return cat?.icono || '';
  }

  getCategoriaNombre(categoriaId: number): string {
    const cat = this.categorias().find(c => c.id === categoriaId);
    return cat?.nombre || 'Sin categoría';
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
