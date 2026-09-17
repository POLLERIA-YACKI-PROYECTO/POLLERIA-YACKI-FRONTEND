// src/app/features/admin/mantenimiento/mantenimiento.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mantenimiento.component.html',
  styleUrls: ['./mantenimiento.component.scss']
})
export class MantenimientoComponent implements OnInit, OnDestroy {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  private cargando = signal(false);
  private yaCargado = signal(false);
  private categoriasCargadas = signal(false);

  productos = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  categorias = signal<any[]>([]);
  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(false);
  loading = signal(true);
  mostrarFormulario = signal(false);
  editando = signal(false);
  productoEdit = signal<any>(null);
  terminoBusqueda = signal<string>('');

  nuevoProducto = signal({
    nombre: '',
    precio: 0,
    categoria_id: 0,
    descripcion: '',
    stock: 0
  });

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    // Verificar autenticación primero
    if (!this.authService.isAuthenticated()) {
      console.warn('Mantenimiento: sin sesión -> /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    this.usuario.set(this.authService.getUsuarioActual());

    if (this.usuario()?.rol !== 'admin') {
      console.warn('Mantenimiento: no es admin -> /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTema(): void {
    this.temaOscuro.set(!this.temaOscuro());
  }

  // ============================================
  // CARGAR DATOS (categorías solo una vez)
  // ============================================
  cargarDatos(): void {
    if (this.cargando() || this.yaCargado()) return;

    this.cargando.set(true);
    this.loading.set(true);

    // Si las categorías ya están cargadas, solo pedir productos
    if (this.categoriasCargadas() && this.categorias().length > 0) {
      this.soloCargarProductos();
      return;
    }

    // Primera carga: categorías + productos
    forkJoin({
      categorias: this.categoriaService
        .obtenerCategorias()
        .pipe(catchError(() => of([]))),
      productos: this.productoService
        .obtenerProductos()
        .pipe(catchError(() => of([])))
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ categorias, productos }) => {
          this.categorias.set(categorias || []);
          this.categoriasCargadas.set(true);
          this.productos.set(productos || []);
          this.productosFiltrados.set(productos || []);

          if (categorias?.length > 0) {
            this.nuevoProducto.update(p => ({ ...p, categoria_id: categorias[0].id }));
          }

          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('Mantenimiento cargado:', (productos || []).length, 'productos');
        },
        error: (err) => {
          console.error('Error al cargar datos:', err);
          this.loading.set(false);
          this.cargando.set(false);
          // Resetear yaCargado para permitir reintento
          this.yaCargado.set(false);
        }
      });
  }

  // Solo productos (sin tocar categorías)
  private soloCargarProductos(): void {
    this.productoService
      .obtenerProductos(true)  // forceRefresh = true
      .pipe(
        catchError(() => of([])),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (productos) => {
          this.productos.set(productos || []);
          this.productosFiltrados.set(productos || []);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('Productos recargados (categorías cacheadas)');
        },
        error: (err) => {
          console.error('Error al recargar productos:', err);
          this.loading.set(false);
          this.cargando.set(false);
        }
      });
  }

  // RECARGAR (limpiando caché de productos)
  recargar(): void {
    this.productoService.limpiarCache();
    this.yaCargado.set(false);
    this.cargarDatos();
  }

  // ============================================
  // BÚSQUEDA Y FILTROS
  // ============================================
  filtrarProductos(): void {
    const termino = this.terminoBusqueda().toLowerCase().trim();

    if (!termino) {
      this.productosFiltrados.set(this.productos());
      return;
    }

    const filtrados = this.productos().filter(producto => {
      const nombreMatch = producto.nombre?.toLowerCase().includes(termino) || false;
      const categoria = this.categorias().find(c => c.id === producto.categoria_id);
      const categoriaMatch = categoria?.nombre?.toLowerCase().includes(termino) || false;

      let precioMatch = false;
      const precioNum = parseFloat(termino.replace('s/', '').replace('s', '').trim());
      if (!isNaN(precioNum)) {
        precioMatch = producto.precio === precioNum ||
                      producto.precio.toString().includes(termino.replace('s/', '').trim());
      }

      const idMatch = producto.id.toString().includes(termino);

      const stockNum = parseInt(termino);
      const stockMatch = !isNaN(stockNum) ? producto.stock === stockNum : false;

      return nombreMatch || categoriaMatch || precioMatch || idMatch || stockMatch;
    });

    this.productosFiltrados.set(filtrados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
    this.productosFiltrados.set(this.productos());
  }

  // ============================================
  // CRUD DE PRODUCTOS
  // ============================================
  toggleFormulario(): void {
    this.mostrarFormulario.set(!this.mostrarFormulario());
    if (!this.mostrarFormulario()) {
      this.editando.set(false);
      this.productoEdit.set(null);
      this.nuevoProducto.set({
        nombre: '',
        precio: 0,
        categoria_id: this.categorias()[0]?.id || 0,
        descripcion: '',
        stock: 0
      });
    }
  }

  editarProducto(producto: any): void {
    this.editando.set(true);
    this.productoEdit.set(producto);
    this.nuevoProducto.set({
      nombre: producto.nombre,
      precio: producto.precio,
      categoria_id: producto.categoria_id,
      descripcion: producto.descripcion || '',
      stock: producto.stock || 0
    });
    this.mostrarFormulario.set(true);
  }

  guardarProducto(): void {
    const data = this.nuevoProducto();

    if (!data.nombre || data.precio <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    if (this.editando()) {
      this.productoService.actualizarProducto(this.productoEdit().id, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Producto actualizado correctamente');
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            console.error('Error al actualizar producto:', err);
            let mensaje = 'Error al actualizar producto';
            if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
            else if (err?.status === 401) mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para actualizar productos.';
            else if (err?.status === 404) mensaje = 'El producto ya no existe.';
            else if (err?.error?.error) mensaje = err.error.error;
            alert(`${mensaje}`);
          }
        });
    } else {
      this.productoService.crearProducto(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Producto creado correctamente');
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            console.error('Error al crear producto:', err);
            let mensaje = 'Error al crear producto';
            if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
            else if (err?.status === 401) mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para crear productos.';
            else if (err?.error?.error) mensaje = err.error.error;
            alert(`${mensaje}`);
          }
        });
    }
  }

  eliminarProducto(id: number): void {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.productoService.eliminarProducto(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Producto eliminado correctamente');
            this.recargar();
          },
          error: (err) => {
            console.error('Error al eliminar producto:', err);
            let mensaje = 'Error al eliminar producto';
            if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
            else if (err?.status === 401) mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para eliminar productos.';
            else if (err?.status === 404) mensaje = 'El producto ya no existe.';
            else if (err?.error?.error) mensaje = err.error.error;
            alert(`${mensaje}`);
          }
        });
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================
  getNombreCategoria(id: number): string {
    const cat = this.categorias().find(c => c.id === id);
    return cat ? cat.nombre : 'Sin categoría';
  }

  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}