// src/app/features/admin/carta-admin/carta-admin.component.ts
import { Component, signal, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-carta-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carta-admin.component.html',
  styleUrls: ['./carta-admin.component.scss'],
})
export class CartaAdminComponent implements OnInit {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('inputFile') inputFile!: ElementRef<HTMLInputElement>;

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

  // IMAGEN
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

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (this.usuario()?.rol !== 'admin' && this.usuario()?.rol !== 'cajero') {
      this.router.navigate(['/login-admin']);
      return;
    }
    this.cargarDatos();
  }

  toggleTema(): void {
    this.temaOscuro.set(!this.temaOscuro());
  }

  cargarDatos(): void {
    this.loading.set(true);

    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        if (categorias.length > 0 && this.nuevoProducto().categoria_id === 0) {
          this.nuevoProducto.update((p) => ({ ...p, categoria_id: categorias[0].id }));
        }
      },
      error: (err) => console.error('Error al cargar categorías:', err),
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
      },
    });
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
      const nombreMatch = producto.nombre?.toLowerCase().includes(termino) || false;
      const categoria = this.categorias().find((c) => c.id === producto.categoria_id);
      const categoriaMatch = categoria?.nombre?.toLowerCase().includes(termino) || false;

      let precioMatch = false;
      const precioNum = parseFloat(termino.replace('s/', '').replace('s', '').trim());
      if (!isNaN(precioNum)) {
        precioMatch = producto.precio === precioNum || producto.precio.toString().includes(termino);
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

  // OBTENER URL DE IMAGEN - CORREGIDO
  getImagenUrl(imagen: string | null | undefined): string {
    return this.productoService.getImagenUrl(imagen);
  }

  manejarErrorImagen(event: Event): void {
    const elemento = event.target as HTMLImageElement;

    const imagenPredeterminada = this.productoService.getImagenUrl('imagen.jpg');

    if (elemento.src === imagenPredeterminada || elemento.dataset['fallbackAplicado'] === 'true') {
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

  // Restaurar imagen por defecto (para el formulario - SIN PARÁMETROS)
  restaurarImagenDefault(): void {
    if (!this.productoEdit()) return;

    if (confirm('¿Restaurar la imagen por defecto para este producto?')) {
      this.productoService.restaurarImagenDefault(this.productoEdit().id).subscribe({
        next: () => {
          alert('Imagen por defecto restaurada');
          this.imagenPreview.set(null);
          this.imagenFile.set(null);
          this.nuevoProducto.update((p) => ({ ...p, imagen: 'imagen.jpg' }));
          this.cargarDatos();
        },
        error: (err) => {
          console.error('Error al restaurar imagen:', err);
          alert('Error al restaurar imagen');
        },
      });
    }
  }

  // Restaurar imagen por defecto (desde la tabla - CON PARÁMETRO)
  restaurarImagenDefaultProducto(producto: any): void {
    if (!producto) return;

    if (confirm(`¿Restaurar la imagen por defecto para "${producto.nombre}"?`)) {
      this.productoService.restaurarImagenDefault(producto.id).subscribe({
        next: () => {
          alert('Imagen por defecto restaurada');
          this.cargarDatos();
        },
        error: (err) => {
          console.error('Error al restaurar imagen:', err);
          alert('Error al restaurar imagen');
        },
      });
    }
  }

  // Eliminar imagen del producto (restaura la default)
  eliminarImagen(event: Event): void {
    event.stopPropagation();
    if (!this.productoEdit()) return;

    if (confirm('¿Eliminar esta imagen y restaurar la imagen por defecto?')) {
      this.productoService.eliminarImagen(this.productoEdit().id).subscribe({
        next: () => {
          this.imagenPreview.set(null);
          this.imagenFile.set(null);
          this.nuevoProducto.update((p) => ({ ...p, imagen: 'imagen.jpg' }));
          alert('Imagen eliminada, restaurada a la imagen por defecto');
          this.cargarDatos();
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
      this.productoService.actualizarProductoConImagen(this.productoEdit().id, formData).subscribe({
        next: () => {
          alert('Producto actualizado correctamente');
          this.cargarDatos();
          this.toggleFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar producto:', err);
          alert('Error al actualizar producto');
        },
      });
    } else {
      this.productoService.crearProductoConImagen(formData).subscribe({
        next: () => {
          alert('Producto creado correctamente');
          this.cargarDatos();
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
    this.productoService.toggleDisponible(producto.id).subscribe({
      next: (result) => {
        this.productos.update((list) =>
          list.map((p) => (p.id === producto.id ? { ...p, agotado: result.agotado } : p)),
        );
        this.filtrarProductos();
      },
      error: (err) => console.error('Error al cambiar estado:', err),
    });
  }

  eliminarProducto(id: number): void {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.productoService.eliminarProducto(id).subscribe({
        next: () => {
          alert('Producto eliminado correctamente');
          this.cargarDatos();
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          alert('Error al eliminar producto');
        },
      });
    }
  }

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
