import { Component, signal, inject, OnInit } from '@angular/core';
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
  styleUrls: ['./carta-admin.component.scss']
})
export class CartaAdminComponent implements OnInit {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  productos = signal<any[]>([]);
  categorias = signal<any[]>([]);
  loading = signal(true);
  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(false);
  
  mostrarFormulario = signal(false);
  productoEdit = signal<any>(null);
  editando = signal(false);

  nuevoProducto = signal({
    categoria_id: 0,
    nombre: '',
    precio: 0,
    descripcion: '',
    stock: 0
  });

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (this.usuario()?.rol !== 'admin') {
      this.router.navigate(['/carta-mesero']);
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
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.loading.set(false);
      }
    });
  }

  toggleFormulario(): void {
    this.mostrarFormulario.set(!this.mostrarFormulario());
    if (!this.mostrarFormulario()) {
      this.editando.set(false);
      this.productoEdit.set(null);
      this.nuevoProducto.set({ categoria_id: this.categorias()[0]?.id || 0, nombre: '', precio: 0, descripcion: '', stock: 0 });
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

  toggleAgotado(producto: any): void {
    this.productoService.toggleDisponible(producto.id).subscribe({
      next: (result) => {
        this.productos.update(list =>
          list.map(p => p.id === producto.id ? { ...p, agotado: result.agotado } : p)
        );
      },
      error: (err) => console.error('Error al cambiar estado:', err)
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
        }
      });
    }
  }

  getNombreCategoria(id: number): string {
    const cat = this.categorias().find(c => c.id === id);
    return cat ? cat.nombre : 'Sin categoría';
  }

  irCartaMesero(): void {
    this.router.navigate(['/carta-mesero']);
  }

  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}