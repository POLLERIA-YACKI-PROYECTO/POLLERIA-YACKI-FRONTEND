// src/app/features/admin/carta-admin/carta-admin.component.ts
import {
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-carta-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carta-admin.component.html',
  styleUrls: ['./carta-admin.component.scss'],
})
export class CartaAdminComponent implements OnInit, OnDestroy {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // ✅ Subject para cancelar suscripciones
  private destroy$ = new Subject<void>();

  // ✅ Flags para evitar cargas duplicadas
  private cargando = signal(false);
  private yaCargado = signal(false);
  private categoriasCargadas = signal(false);

  @ViewChild('inputFile') inputFile!: ElementRef<HTMLInputElement>;
  @ViewChild('formularioProducto') formularioProducto?: ElementRef<HTMLElement>;

  productos = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  categorias = signal<any[]>([]);
  loading = signal(true);
  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(false);
  terminoBusqueda = signal<string>('');

  mostrarFormulario = signal(false);
  productoEdit = signal<any>(null);
  editando = signal(false);

  mostrarModalEliminar = signal(false);
  productoAEliminar = signal<any>(null);

  mostrarModalRestaurar = signal(false);
  productoARestaurar = signal<any>(null);

  imagenPreview = signal<string | null>(null);
  imagenFile = signal<File | null>(null);

  nuevoProducto = signal({
    categoria_id: 0,
    nombre: '',
    precio: 0,
    descripcion: '',
    stock: 0,
    imagen: null as string | null,
  });

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (this.usuario()?.rol !== 'admin' && this.usuario()?.rol !== 'cajero') {
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
  // ✅ CARGAR DATOS (CATEGORÍAS SOLO UNA VEZ)
  // ============================================
  cargarDatos(): void {
    if (this.cargando() || this.yaCargado()) {
      console.log('⚠️ Carta admin ya cargada o cargando, evitando duplicado');
      return;
    }

    this.cargando.set(true);
    this.loading.set(true);

    // ✅ Si las categorías ya están cargadas, solo pedir productos
    if (this.categoriasCargadas() && this.categorias().length > 0) {
      this.soloCargarProductos();
      return;
    }

    // ✅ Primera carga: categorías + productos
    forkJoin({
      categorias: this.categoriaService
        .obtenerCategorias()
        .pipe(catchError(() => of([]))),
      productos: this.productoService
        .obtenerProductos()
        .pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ categorias, productos }) => {
          this.categorias.set(categorias || []);
          this.categoriasCargadas.set(true);
          this.productos.set(productos || []);
          this.productosFiltrados.set(productos || []);

          if (categorias?.length > 0 && this.nuevoProducto().categoria_id === 0) {
            this.nuevoProducto.update((p) => ({
              ...p,
              categoria_id: categorias[0].id,
            }));
          }

          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('✅ Carta admin cargada correctamente');
        },
        error: (err) => {
          console.error('Error al cargar datos:', err);
          this.loading.set(false);
          this.cargando.set(false);
        },
      });
  }

  // ✅ Solo productos (sin tocar categorías)
  private soloCargarProductos(): void {
    this.productoService
      .obtenerProductos(true)  // forceRefresh = true para traer datos frescos
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
          console.log('✅ Productos recargados (categorías cacheadas)');
        },
        error: (err) => {
          console.error('Error al recargar productos:', err);
          this.loading.set(false);
          this.cargando.set(false);
        },
      });
  }

  // ✅ RECARGAR (solo cuando se solicita explícitamente)
  recargar(): void {
    // Limpiar caché de productos (categorías se mantienen)
    this.productoService.limpiarCache();
    this.yaCargado.set(false);
    this.cargarDatos();
  }

  // ✅ RECARGAR SOLO PRODUCTOS (para operaciones CRUD)
  private recargarProductos(): void {
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

    const filtrados = this.productos().filter((producto) => {
      const nombreMatch =
        producto.nombre?.toLowerCase().includes(termino) || false;
      const categoria = this.categorias().find(
        (c) => c.id === producto.categoria_id
      );
      const categoriaMatch =
        categoria?.nombre?.toLowerCase().includes(termino) || false;

      let precioMatch = false;
      const precioNum = parseFloat(
        termino.replace('s/', '').replace('s', '').trim()
      );
      if (!isNaN(precioNum)) {
        precioMatch =
          producto.precio === precioNum ||
          producto.precio.toString().includes(termino);
      }

      const idMatch = producto.id?.toString().includes(termino) || false;
      const estadoMatch =
        termino === 'agotado'
          ? producto.agotado === true
          : termino === 'disponible'
          ? producto.agotado === false
          : false;

      return (
        nombreMatch || categoriaMatch || precioMatch || idMatch || estadoMatch
      );
    });

    this.productosFiltrados.set(filtrados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
    this.productosFiltrados.set(this.productos());
  }

  // ============================================
  // IMAGEN
  // ============================================
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona una imagen válida');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        alert('La imagen no debe superar los 20 MB');
        return;
      }

      this.imagenFile.set(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagenPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  getImagenUrl(imagen: string | null | undefined): string {
    return this.productoService.getImagenUrl(imagen);
  }

  manejarErrorImagen(event: Event): void {
    const elemento = event.target as HTMLImageElement;
    const imagenPredeterminada =
      this.productoService.getImagenUrl('imagen.jpg');

    if (
      elemento.src === imagenPredeterminada ||
      elemento.dataset['fallbackAplicado'] === 'true'
    ) {
      return;
    }

    elemento.dataset['fallbackAplicado'] = 'true';
    elemento.src = imagenPredeterminada;
  }

  limpiarImagenSeleccionada(event?: Event): void {
    event?.stopPropagation();
    this.imagenFile.set(null);

    if (this.editando()) {
      this.imagenPreview.set(
        this.getImagenUrl(this.productoEdit()?.imagen || null)
      );
    } else {
      this.imagenPreview.set(null);
    }

    if (this.inputFile?.nativeElement) {
      this.inputFile.nativeElement.value = '';
    }
  }

  esImagenDefault(imagen: string | null): boolean {
    return this.productoService.esImagenDefault(imagen);
  }

  // ============================================
  // MODAL RESTAURAR IMAGEN
  // ============================================
  abrirModalRestaurar(producto: any): void {
    this.productoARestaurar.set(producto);
    this.mostrarModalRestaurar.set(true);
  }

  cerrarModalRestaurar(): void {
    this.mostrarModalRestaurar.set(false);
    this.productoARestaurar.set(null);
  }

  confirmarRestaurar(): void {
    const producto = this.productoARestaurar();
    if (!producto) return;

    this.productoService
      .restaurarImagenDefault(producto.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Imagen por defecto restaurada correctamente');
          this.cerrarModalRestaurar();
          this.recargar();
        },
        error: (err) => {
          console.error('Error al restaurar imagen:', err);
          alert('Error al restaurar imagen');
          this.cerrarModalRestaurar();
        },
      });
  }

  restaurarImagenDefault(): void {
    if (!this.productoEdit()) return;

    if (confirm('¿Restaurar la imagen por defecto para este producto?')) {
      this.productoService
        .restaurarImagenDefault(this.productoEdit().id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Imagen por defecto restaurada');
            this.imagenPreview.set(null);
            this.imagenFile.set(null);
            this.nuevoProducto.update((p) => ({ ...p, imagen: 'imagen.jpg' }));
            this.recargar();
          },
          error: (err) => {
            console.error('Error al restaurar imagen:', err);
            alert('Error al restaurar imagen');
          },
        });
    }
  }

  eliminarImagen(event: Event): void {
    event.stopPropagation();
    if (!this.productoEdit()) return;

    if (confirm('¿Eliminar esta imagen y restaurar la imagen por defecto?')) {
      this.productoService
        .eliminarImagen(this.productoEdit().id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.imagenPreview.set(null);
            this.imagenFile.set(null);
            this.nuevoProducto.update((p) => ({ ...p, imagen: 'imagen.jpg' }));
            alert('Imagen eliminada, restaurada a la imagen por defecto');
            this.recargar();
          },
          error: (err) => {
            console.error('Error al eliminar imagen:', err);
            alert('Error al eliminar imagen');
          },
        });
    }
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
        categoria_id: this.categorias()[0]?.id || 0,
        nombre: '',
        precio: 0,
        descripcion: '',
        stock: 0,
        imagen: null,
      });
      this.imagenPreview.set(null);
      this.imagenFile.set(null);
    }
  }

  editarProducto(producto: any): void {
    this.editando.set(true);
    this.productoEdit.set(producto);
    this.nuevoProducto.set({
      categoria_id: producto.categoria_id,
      nombre: producto.nombre,
      precio: producto.precio,
      descripcion: producto.descripcion || '',
      stock: producto.stock || 0,
      imagen: producto.imagen || null,
    });
    if (producto.imagen && producto.imagen !== 'imagen.jpg') {
      this.imagenPreview.set(this.getImagenUrl(producto.imagen));
    } else {
      this.imagenPreview.set(null);
    }
    this.mostrarFormulario.set(true);
    setTimeout(() =>
      this.formularioProducto?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    );
  }

  guardarProducto(): void {
    if (!this.nuevoProducto().nombre || this.nuevoProducto().precio <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    if (!this.nuevoProducto().categoria_id) {
      alert('Por favor seleccione una categoría');
      return;
    }

    const formData = new FormData();
    const data = this.nuevoProducto();
    formData.append('nombre', data.nombre);
    formData.append('precio', data.precio.toString());
    formData.append('categoria_id', data.categoria_id.toString());
    formData.append('descripcion', data.descripcion || '');
    formData.append('stock', data.stock?.toString() || '0');

    if (this.imagenFile()) {
      formData.append('imagen', this.imagenFile()!);
    }

    if (this.editando()) {
      this.productoService
        .actualizarProductoConImagen(this.productoEdit().id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Producto actualizado correctamente');
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            console.error('Error al actualizar producto:', err);
            alert(
              err?.error?.error ||
                err?.error?.message ||
                (err?.status === 401
                  ? 'Tu sesión expiró. Cierra sesión e inicia nuevamente.'
                  : err?.status === 403
                  ? 'No tienes permisos para editar productos.'
                  : `Error al actualizar producto (${
                      err?.status || 'sin respuesta'
                    })`)
            );
          },
        });
    } else {
      this.productoService
        .crearProductoConImagen(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Producto creado correctamente');
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            console.error('Error al crear producto:', err);
            alert('Error al crear producto');
          },
        });
    }
  }

  toggleAgotado(producto: any): void {
    this.productoService
      .toggleDisponible(producto.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.productos.update((list) =>
            list.map((p) =>
              p.id === producto.id ? { ...p, agotado: result.agotado } : p
            )
          );
          this.filtrarProductos();
        },
        error: (err) => console.error('Error al cambiar estado:', err),
      });
  }

  // ============================================
  // MODAL ELIMINAR
  // ============================================
  abrirModalEliminar(producto: any): void {
    this.productoAEliminar.set(producto);
    this.mostrarModalEliminar.set(true);
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar.set(false);
    this.productoAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const producto = this.productoAEliminar();
    if (!producto) return;

    this.productoService
      .eliminarProducto(producto.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Producto eliminado correctamente');
          this.cerrarModalEliminar();
          this.recargar();
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          alert('Error al eliminar producto');
          this.cerrarModalEliminar();
        },
      });
  }

  // ============================================
  // UTILIDADES
  // ============================================
  getNombreCategoria(id: number): string {
    const cat = this.categorias().find((c) => c.id === id);
    return cat ? cat.nombre : 'Sin categoría';
  }

  irCartaMesero(): void {
    this.router.navigate(['/mesero/carta']);
  }

  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}