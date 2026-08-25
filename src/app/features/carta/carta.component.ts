import { Component, signal, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductoService } from '../../core/services/producto.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../shared/components/header/header.component';

@Component({
  selector: 'app-carta',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class CartaComponent implements OnInit {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private configService = inject(ConfiguracionService);
  private authService = inject(AuthService);
  private router = inject(Router);

  @Input() modoAdmin: boolean = false;

  categorias = signal<any[]>([]);
  productos = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  categoriaSeleccionada = signal<number | null>(null);
  configuracion = signal<any>({});
  loading = signal(true);
  usuario = signal<any>(null);
  puedeModificar = signal(false);

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario()) {
      this.router.navigate(['/login-mesero']);
      return;
    }
    
    const rol = this.usuario()?.rol;
    this.puedeModificar.set(rol === 'admin' || rol === 'mesero' || rol === 'cajero');
    this.cargarDatos();
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

    this.configService.obtenerConfiguracion().subscribe({
      next: (config) => this.configuracion.set(config),
      error: (err) => console.error('Error al cargar configuración:', err)
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

  toggleAgotado(productoId: number): void {
    if (!this.puedeModificar()) return;
    
    this.productoService.toggleDisponible(productoId).subscribe({
      next: (result) => {
        this.productosFiltrados.update(list =>
          list.map(p => p.id === productoId ? { ...p, agotado: result.agotado } : p)
        );
        this.productos.update(list =>
          list.map(p => p.id === productoId ? { ...p, agotado: result.agotado } : p)
        );
      },
      error: (err) => console.error('Error al cambiar estado:', err)
    });
  }

  // Método para agregar al pedido
  agregarAlPedido(producto: any): void {
    console.log('Agregar al pedido:', producto);
    // Aquí se implementará la lógica del carrito
    alert(`Producto agregado: ${producto.nombre} - S/ ${producto.precio}`);
  }

  // Método para ir al panel de administración
  irAdmin(): void {
    this.router.navigate(['/admin']);
  }

  // Método para cerrar sesión
  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-mesero']);
  }

  // Método para verificar si es administrador
  esAdmin(): boolean {
    const usuario = this.usuario();
    return usuario !== null && (usuario.rol === 'admin' || usuario.rol === 'cajero');
  }

  // Método para verificar el rol
  getRolClass(): string {
    return this.usuario()?.rol === 'admin' ? 'admin-mode' : 'mesero-mode';
  }

  // Método para obtener el nombre del usuario
  getNombreUsuario(): string {
    return this.usuario()?.nombre || 'Usuario';
  }
}