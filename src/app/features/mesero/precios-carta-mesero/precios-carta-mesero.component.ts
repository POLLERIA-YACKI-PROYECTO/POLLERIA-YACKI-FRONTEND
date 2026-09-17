// src/app/features/mesero/precios-carta-mesero/precios-carta-mesero.component.ts
import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';
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
export class PreciosCartaMeseroComponent implements OnInit, OnDestroy {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  // Flags anti-duplicado
  private cargando = signal(false);
  private yaCargado = signal(false);

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

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    // Verificar autenticación primero
    if (!this.authService.isAuthenticated()) {
      console.warn('PreciosMesero: sin sesión -> /login-mesero');
      this.router.navigate(['/login-mesero']);
      return;
    }

    this.usuario.set(this.authService.getUsuarioActual());

    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      console.warn('PreciosMesero: no es mesero -> /login-mesero');
      this.router.navigate(['/login-mesero']);
      return;
    }

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // CARGAR DATOS (forkJoin paralelo)
  // ============================================
  cargarDatos(): void {
    if (this.cargando() || this.yaCargado()) return;

    this.cargando.set(true);
    this.loading.set(true);

    forkJoin({
      categorias: this.categoriaService.obtenerCategorias()
        .pipe(catchError(() => of([]))),
      productos: this.productoService.obtenerProductos()
        .pipe(catchError(() => of([])))
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ categorias, productos }) => {
          this.categorias.set(categorias || []);
          this.productos.set(productos || []);
          this.productosFiltrados.set(productos || []);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('Precios mesero cargado:', (productos || []).length, 'productos');
        },
        error: (err: any) => {
          console.error('Error al cargar datos:', err);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(false);
        }
      });
  }

  // ============================================
  // TOGGLES
  // ============================================
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

  // ============================================
  // CATEGORÍAS
  // ============================================
  seleccionarCategoria(categoriaId: string): void {
    this.categoriaSeleccionada.set(categoriaId);
    this.categoriaMenuAbierto.set(false);

    // Limpiar búsqueda al cambiar categoría
    this.terminoBusqueda.set('');
    this.buscadorActivo.set(false);
    this.resultadosBusqueda.set([]);

    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    const catId = this.categoriaSeleccionada();

    if (catId === 'todas') {
      this.productosFiltrados.set(this.productos());
    } else {
      const filtrados = this.productos().filter(p => p.categoria_id === parseInt(catId));
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
      this.aplicarFiltros();
      return;
    }

    this.buscadorActivo.set(true);

    const todosLosProductos = this.productos();
    const resultados = this.productoService.buscarProductos(termino, todosLosProductos);

    this.resultadosBusqueda.set(resultados);
    this.productosFiltrados.set(resultados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
    this.buscadorActivo.set(false);
    this.resultadosBusqueda.set([]);
    this.aplicarFiltros();
  }

  // Resaltar coincidencias en el texto
  resaltarCoincidencia(texto: string): string {
    const termino = this.terminoBusqueda().trim();
    if (!termino) return texto;

    const regex = new RegExp(`(${termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(regex, '<mark class="highlight">$1</mark>');
  }

  // ============================================
  // UTILIDADES
  // ============================================
  getIconoCategoria(categoriaId: number): string {
    const cat = this.categorias().find(c => c.id === categoriaId);
    return cat?.icono || '';
  }

  getCategoriaNombre(categoriaId: number): string {
    const cat = this.categorias().find(c => c.id === categoriaId);
    return cat?.nombre || 'Sin categoría';
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