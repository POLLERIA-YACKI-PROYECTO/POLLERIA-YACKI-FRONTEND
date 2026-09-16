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
import { NotificationService } from '../../../core/services/notificacion.service';
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
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
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

  // ✅ Cache buster para las imágenes (se actualiza tras cada operación CRUD)
  cacheBuster = signal<number>(Date.now());

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
  // CACHE BUSTING
  // ============================================
  /**
   * Fuerza la recarga de TODAS las imágenes incrementando el cacheBuster.
   * Se llama después de cada operación CRUD exitosa.
   */
  private actualizarCacheBuster(): void {
    this.cacheBuster.set(Date.now());
  }

  // ============================================
  // CARGAR DATOS
  // ============================================
  cargarDatos(): void {
    if (this.cargando() || this.yaCargado()) return;

    this.cargando.set(true);
    this.loading.set(true);

    if (this.categoriasCargadas() && this.categorias().length > 0) {
      this.soloCargarProductos();
      return;
    }

    forkJoin({
      categorias: this.categoriaService.obtenerCategorias().pipe(catchError(() => of([]))),
      productos: this.productoService.obtenerProductos().pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ categorias, productos }) => {
          this.categorias.set(categorias || []);
          this.categoriasCargadas.set(true);
          this.productos.set(productos || []);
          this.productosFiltrados.set(productos || []);

          if (categorias?.length > 0 && this.nuevoProducto().categoria_id === 0) {
            this.nuevoProducto.update((p) => ({ ...p, categoria_id: categorias[0].id }));
          }

          // ✅ Actualizar cache buster al cargar datos frescos
          this.actualizarCacheBuster();

          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
        },
        error: () => {
          this.notificationService.error('No se pudieron cargar los productos.', 'Error');
          this.loading.set(false);
          this.cargando.set(false);
        },
      });
  }

  private soloCargarProductos(): void {
    this.productoService.obtenerProductos(true)
      .pipe(catchError(() => of([])), takeUntil(this.destroy$))
      .subscribe({
        next: (productos) => {
          this.productos.set(productos || []);
          this.productosFiltrados.set(productos || []);

          // ✅ Actualizar cache buster para forzar recarga de imágenes
          this.actualizarCacheBuster();

          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
        },
        error: () => {
          this.loading.set(false);
          this.cargando.set(false);
        },
      });
  }

  recargar(): void {
    this.productoService.limpiarCache();
    this.yaCargado.set(false);
    this.cargarDatos();
  }

  // ============================================
  // BÚSQUEDA
  // ============================================
  filtrarProductos(): void {
    const termino = this.terminoBusqueda().toLowerCase().trim();

    if (!termino) {
      this.productosFiltrados.set(this.productos());
      return;
    }

    const filtrados = this.productos().filter((producto) => {
      const nombreMatch = producto.nombre?.toLowerCase().includes(termino) || false;
      const categoria = this.categorias().find((c) => c.id === producto.categoria_id);
      const categoriaMatch = categoria?.nombre?.toLowerCase().includes(termino) || false;

      let precioMatch = false;
      const precioNum = parseFloat(termino.replace('s/', '').replace('s', '').trim());
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

      return nombreMatch || categoriaMatch || precioMatch || idMatch || estadoMatch;
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
        this.notificationService.error('El archivo debe ser una imagen.', 'Formato inválido');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        this.notificationService.error('La imagen no debe superar los 20 MB.', 'Archivo muy grande');
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

  /**
   * Genera la URL de la imagen usando el cacheBuster actual.
   * Se le puede pasar opcionalmente un producto para usar su `updated_at`
   * como versión específica.
   */
  getImagenUrl(imagen: string | null | undefined, producto?: any): string {
    // Si tenemos el producto y su updated_at, usarlo como versión
    const versionEspecifica = producto?.updated_at
      ? new Date(producto.updated_at).getTime()
      : undefined;

    // Si no, usar el cacheBuster global (que cambia tras cada operación)
    const version = versionEspecifica ?? this.cacheBuster();

    return this.productoService.getImagenUrl(imagen, version);
  }

  manejarErrorImagen(event: Event): void {
    const elemento = event.target as HTMLImageElement;
    const imagenPredeterminada = this.productoService.getImagenUrl('imagen.jpg');

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
      this.imagenPreview.set(this.getImagenUrl(this.productoEdit()?.imagen || null));
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
          this.notificationService.success(
            `Imagen de "${producto.nombre}" restaurada.`,
            'Imagen restaurada'
          );
          this.cerrarModalRestaurar();
          this.recargar();
        },
        error: () => {
          this.notificationService.error('No se pudo restaurar la imagen.', 'Error');
          this.cerrarModalRestaurar();
        },
      });
  }

  restaurarImagenDefault(): void {
    if (!this.productoEdit()) return;

    this.productoService
      .restaurarImagenDefault(this.productoEdit().id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Imagen restaurada correctamente.', 'Imagen restaurada');
          this.imagenPreview.set(null);
          this.imagenFile.set(null);
          this.nuevoProducto.update((p) => ({ ...p, imagen: 'imagen.jpg' }));
          this.recargar();
        },
        error: () => {
          this.notificationService.error('No se pudo restaurar la imagen.', 'Error');
        },
      });
  }

  eliminarImagen(event: Event): void {
    event.stopPropagation();
    if (!this.productoEdit()) return;

    this.productoService
      .eliminarImagen(this.productoEdit().id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.imagenPreview.set(null);
          this.imagenFile.set(null);
          this.nuevoProducto.update((p) => ({ ...p, imagen: 'imagen.jpg' }));
          this.notificationService.success('Imagen eliminada.', 'Imagen eliminada');
          this.recargar();
        },
        error: () => {
          this.notificationService.error('No se pudo eliminar la imagen.', 'Error');
        },
      });
  }

  // ============================================
  // CRUD
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
      // ✅ Pasar el producto para que use su updated_at como versión
      this.imagenPreview.set(this.getImagenUrl(producto.imagen, producto));
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
    const data = this.nuevoProducto();

    if (!data.nombre || data.precio <= 0) {
      this.notificationService.warning('Completa el nombre y el precio.', 'Campos incompletos');
      return;
    }

    if (!data.categoria_id) {
      this.notificationService.warning('Selecciona una categoría.', 'Categoría requerida');
      return;
    }

    const formData = new FormData();
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
            this.notificationService.success(
              `"${data.nombre}" se actualizó correctamente.`,
              'Producto actualizado'
            );
            // ✅ Cache buster se actualiza al recargar
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            let mensaje = 'No se pudo actualizar el producto.';
            if (err?.status === 401) mensaje = 'Tu sesión expiró. Inicia sesión nuevamente.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para editar productos.';
            else if (err?.error?.error) mensaje = err.error.error;
            this.notificationService.error(mensaje, 'Error al actualizar');
          },
        });
    } else {
      this.productoService
        .crearProductoConImagen(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success(
              `"${data.nombre}" se creó correctamente.`,
              'Producto creado'
            );
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            let mensaje = 'No se pudo crear el producto.';
            if (err?.status === 401) mensaje = 'Tu sesión expiró.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para crear productos.';
            else if (err?.error?.error) mensaje = err.error.error;
            this.notificationService.error(mensaje, 'Error al crear');
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
            list.map((p) => (p.id === producto.id ? { ...p, agotado: result.agotado } : p))
          );
          this.filtrarProductos();
          this.notificationService.info(
            `"${producto.nombre}" ahora está ${result.agotado ? 'agotado' : 'disponible'}.`,
            'Estado actualizado'
          );
        },
        error: () => {
          this.notificationService.error('No se pudo cambiar el estado.', 'Error');
        },
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
          this.notificationService.success(
            `"${producto.nombre}" se eliminó correctamente.`,
            'Producto eliminado'
          );
          this.cerrarModalEliminar();
          this.recargar();
        },
        error: (err) => {
          let mensaje = 'No se pudo eliminar el producto.';
          if (err?.status === 401) mensaje = 'Tu sesión expiró.';
          else if (err?.status === 403) mensaje = 'No tienes permisos.';
          else if (err?.status === 404) mensaje = 'El producto ya no existe.';
          else if (err?.error?.error) mensaje = err.error.error;
          this.notificationService.error(mensaje, 'Error al eliminar');
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