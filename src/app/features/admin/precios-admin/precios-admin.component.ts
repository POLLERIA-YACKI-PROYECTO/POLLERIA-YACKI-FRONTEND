// src/app/features/admin/precios-admin/precios-admin.component.ts
import {
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';
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
export class PreciosAdminComponent implements OnInit, OnDestroy {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  private cargando = signal(false);
  private yaCargado = signal(false);
  private categoriasCargadas = signal(false);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(false);
  loading = signal(true);
  editando = signal<number | null>(null);

  categorias = signal<any[]>([]);
  productos = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  categoriaSeleccionada = signal<number | null>(null);
  categoriaMenuAbierto = signal<boolean>(false);

  precioEdit = signal<number>(0);

  categoriaSeleccionadaNombre = computed(() => {
    const cat = this.categorias().find(c => c.id === this.categoriaSeleccionada());
    return cat ? cat.nombre : 'Seleccionar categoría';
  });

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    // Verificar autenticación primero
    if (!this.authService.isAuthenticated()) {
      console.warn('PreciosAdmin: sin sesión -> /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    this.usuario.set(this.authService.getUsuarioActual());

    if (!this.usuario() || this.usuario()?.rol !== 'admin') {
      console.warn('PreciosAdmin: no es admin -> /login-admin');
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

  toggleCategoriaMenu(): void {
    this.categoriaMenuAbierto.set(!this.categoriaMenuAbierto());
  }

  // ============================================
  // CARGAR DATOS (categorías cacheadas)
  // ============================================
  cargarDatos(): void {
    if (this.cargando() || this.yaCargado()) return;

    this.cargando.set(true);
    this.loading.set(true);

    // Si las categorías ya están cargadas, solo recargar productos
    if (this.categoriasCargadas() && this.categorias().length > 0) {
      const catActual = this.categoriaSeleccionada() || this.categorias()[0].id;
      this.cargarProductos(catActual);
      this.cargando.set(false);
      this.yaCargado.set(true);
      return;
    }

    // Primera carga: solo categorías
    this.categoriaService.obtenerCategorias()
      .pipe(
        catchError(() => of([])),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (categorias) => {
          this.categorias.set(categorias || []);
          this.categoriasCargadas.set(true);

          if (categorias?.length > 0) {
            this.categoriaSeleccionada.set(categorias[0].id);
            this.cargarProductos(categorias[0].id);
          } else {
            this.loading.set(false);
            this.cargando.set(false);
          }

          this.yaCargado.set(true);
          console.log('Precios admin cargado:', (categorias || []).length, 'categorías');
        },
        error: (err) => {
          console.error('Error al cargar categorías:', err);
          this.loading.set(false);
          this.cargando.set(false);
          // Resetear yaCargado para permitir reintento
          this.yaCargado.set(false);
        }
      });
  }

  recargar(): void {
    this.productoService.limpiarCache();
    this.categoriaService.limpiarCache();
    this.categoriasCargadas.set(false);
    this.yaCargado.set(false);
    this.cargarDatos();
  }

  // ============================================
  // CARGAR PRODUCTOS DE UNA CATEGORÍA
  // ============================================
  cargarProductos(categoriaId: number): void {
    this.loading.set(true);
    this.categoriaSeleccionada.set(categoriaId);
    this.categoriaMenuAbierto.set(false);

    this.productoService.obtenerPorCategoria(categoriaId)
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
        },
        error: (err) => {
          console.error('Error al cargar productos:', err);
          this.productos.set([]);
          this.productosFiltrados.set([]);
          this.loading.set(false);
          this.cargando.set(false);
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
    // Retornar el conteo real si es la categoría seleccionada
    if (this.categoriaSeleccionada() === categoriaId) {
      return this.productos().length;
    }
    return 0;
  }

  // ============================================
  // EDITAR PRECIO
  // ============================================
  editarPrecio(producto: any): void {
    this.editando.set(producto.id);
    this.precioEdit.set(producto.precio);
  }

  guardarPrecio(productoId: number): void {
    const producto = this.productos().find(p => p.id === productoId);
    if (!producto) return;

    const nuevoPrecio = this.precioEdit();
    if (nuevoPrecio <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    this.productoService.actualizarProducto(productoId, {
      ...producto,
      precio: nuevoPrecio
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editando.set(null);
          // Actualizar localmente sin recargar toda la lista
          this.productos.update(list =>
            list.map(p => p.id === productoId ? { ...p, precio: nuevoPrecio } : p)
          );
          this.productosFiltrados.update(list =>
            list.map(p => p.id === productoId ? { ...p, precio: nuevoPrecio } : p)
          );
          alert('Precio actualizado correctamente');
        },
        error: (err) => {
          console.error('Error al actualizar precio:', err);
          let mensaje = 'Error al actualizar el precio';
          if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
          else if (err?.status === 401) mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
          else if (err?.status === 403) mensaje = 'No tienes permisos para actualizar precios.';
          else if (err?.error?.error) mensaje = err.error.error;
          alert(`${mensaje}`);
        }
      });
  }

  cancelarEdicion(): void {
    this.editando.set(null);
  }

  // ============================================
  // UTILIDADES
  // ============================================
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