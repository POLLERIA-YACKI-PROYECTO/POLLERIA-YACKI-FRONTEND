// precios-admin.component.ts
import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-precios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './precios-admin.component.html',
  styleUrls: ['./precios-admin.component.scss'],
  host: { 'class': 'admin-mode' }
})
export class PreciosAdminComponent implements OnInit {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(false);
  loading = signal(true);
  editando = signal<number | null>(null);

  categorias = signal<any[]>([]);
  productos = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  categoriaSeleccionada = signal<number | null>(null);
  categoriaMenuAbierto = signal<boolean>(false);

  // Para editar precio
  precioEdit = signal<number>(0);

  // Computed para el nombre de la categoría seleccionada
  categoriaSeleccionadaNombre = computed(() => {
    const cat = this.categorias().find(c => c.id === this.categoriaSeleccionada());
    return cat ? cat.nombre : 'Seleccionar categoría';
  });

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'admin') {
      this.router.navigate(['/login-admin']);
      return;
    }
    this.cargarDatos();
  }

  toggleTema(): void {
    this.temaOscuro.set(!this.temaOscuro());
  }

  toggleCategoriaMenu(): void {
    this.categoriaMenuAbierto.set(!this.categoriaMenuAbierto());
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
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.loading.set(false);
      }
    });
  }

  cargarProductos(categoriaId: number): void {
    this.loading.set(true);
    this.categoriaSeleccionada.set(categoriaId);
    this.categoriaMenuAbierto.set(false);
    
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
    if (this.categoriaSeleccionada() === categoriaId) {
      this.categoriaMenuAbierto.set(false);
      return;
    }
    this.cargarProductos(categoriaId);
  }

  contarProductosPorCategoria(categoriaId: number): number {
    // Aquí deberías tener un conteo real de productos por categoría
    // Si no lo tienes, puedes calcularlo desde tu servicio
    return 0;
  }

  editarPrecio(producto: any): void {
    this.editando.set(producto.id);
    this.precioEdit.set(producto.precio);
  }

  guardarPrecio(productoId: number): void {
    const producto = this.productos().find(p => p.id === productoId);
    if (!producto) return;

    this.productoService.actualizarProducto(productoId, {
      ...producto,
      precio: this.precioEdit()
    }).subscribe({
      next: () => {
        this.editando.set(null);
        this.cargarProductos(this.categoriaSeleccionada()!);
        alert('Precio actualizado correctamente');
      },
      error: (err) => {
        console.error('Error al actualizar precio:', err);
        alert('Error al actualizar el precio');
      }
    });
  }

  cancelarEdicion(): void {
    this.editando.set(null);
  }

  getIconoCategoria(categoriaId: number): string {
    const cat = this.categorias().find(c => c.id === categoriaId);
    return cat?.icono || '🍗';
  }

  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}