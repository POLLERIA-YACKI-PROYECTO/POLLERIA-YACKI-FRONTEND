import { Component, signal, inject, OnInit } from '@angular/core';
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

  // Para editar precio
  precioEdit = signal<number>(0);

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

  cargarDatos(): void {
    this.loading.set(true);
    
    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        if (categorias.length > 0) {
          this.categoriaSeleccionada.set(categorias[0].id);
          this.cargarProductos(categorias[0].id);
        }
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
    if (this.categoriaSeleccionada() === categoriaId) return;
    this.cargarProductos(categoriaId);
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

  getIconSvg(categoriaId: number): string {
    const icons: any = {
      1: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v4"/>
          <path d="M12 14v4"/>
          <line x1="6" y1="12" x2="10" y2="12"/>
          <line x1="14" y1="12" x2="18" y2="12"/>
        </svg>
      `,
      2: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16v16H4z"/>
          <path d="M8 8h8v8H8z"/>
          <path d="M8 12h8"/>
          <path d="M12 4v4"/>
          <path d="M12 16v4"/>
        </svg>
      `,
      3: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v2M12 16v2M8 10h2M14 10h2M8 14h8"/>
        </svg>
      `
    };
    return icons[categoriaId] || icons[1];
  }

  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }

  irCartaAdmin(): void {
    this.router.navigate(['/admin/carta-admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}