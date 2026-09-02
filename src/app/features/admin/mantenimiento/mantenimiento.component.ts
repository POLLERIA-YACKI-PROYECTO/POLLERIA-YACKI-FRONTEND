// src/app/features/admin/mantenimiento/mantenimiento.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
export class MantenimientoComponent implements OnInit {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);

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

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (this.usuario()?.rol !== 'admin') {
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
        if (categorias.length > 0) {
          this.nuevoProducto.update(p => ({ ...p, categoria_id: categorias[0].id }));
        }
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
      // Buscar por nombre
      const nombreMatch = producto.nombre.toLowerCase().includes(termino);

      // Buscar por categoría
      const categoria = this.categorias().find(c => c.id === producto.categoria_id);
      const categoriaMatch = categoria?.nombre.toLowerCase().includes(termino) || false;

      // Buscar por precio (si el término es numérico)
      let precioMatch = false;
      const precioNum = parseFloat(termino.replace('s/', '').replace('s', '').trim());
      if (!isNaN(precioNum)) {
        precioMatch = producto.precio === precioNum ||
                      producto.precio.toString().includes(termino.replace('s/', '').trim());
      }

      // Buscar por ID
      const idMatch = producto.id.toString().includes(termino);

      // Buscar por stock
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
    if (!this.nuevoProducto().nombre || this.nuevoProducto().precio <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    if (this.editando()) {
      this.productoService.actualizarProducto(this.productoEdit().id, this.nuevoProducto()).subscribe({
        next: () => {
          alert('Producto actualizado correctamente');
          this.cargarDatos();
          this.toggleFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar producto:', err);
          alert('Error al actualizar producto');
        }
      });
    } else {
      this.productoService.crearProducto(this.nuevoProducto()).subscribe({
        next: () => {
          alert('Producto creado correctamente');
          this.cargarDatos();
          this.toggleFormulario();
        },
        error: (err) => {
          console.error('Error al crear producto:', err);
          alert('Error al crear producto');
        }
      });
    }
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
        }
      });
    }
  }

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
