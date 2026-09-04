// src/app/features/carta-cliente/carta-cliente.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, timeout, of } from 'rxjs';

// Services
import { ProductoService } from '../../core/services/producto.service';
import { PedidoService } from '../../core/services/pedido.service';
import { AuthService } from '../../core/services/auth.service';

// Interfaces
import { Producto, ItemCarrito } from '../../core/models/interfaces';

// Components
import { ProductoCardComponent } from './components/producto-card/producto-card.component';
import { CarritoLateralComponent } from './components/carrito-lateral/carrito-lateral.component';
import { ModalPagoComponent } from './components/modal-pago/modal-pago.component';
import { CategoriasNavComponent } from './components/categorias-nav/categorias-nav.component';

@Component({
  selector: 'app-carta-cliente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductoCardComponent,
    CarritoLateralComponent,
    ModalPagoComponent,
    CategoriasNavComponent
  ],
  templateUrl: './carta-cliente.component.html',
  styleUrls: ['./carta-cliente.component.scss']
})
export class CartaClienteComponent implements OnInit {
  private productoService = inject(ProductoService);
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals
  loading = signal(true);
  error = signal<string | null>(null);
  productos = signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  categoriaSeleccionada = signal<number>(1); // Por defecto: Brasas
  carrito = signal<ItemCarrito[]>([]);
  mostrarCarrito = signal(false);
  mostrarModalPago = signal(false);
  cargandoPedido = signal(false);
  busqueda = signal('');

  // Computed properties
  totalItems = computed(() => {
    return this.carrito().reduce((sum, item) => sum + item.cantidad, 0);
  });

  subtotal = computed(() => {
    return this.carrito().reduce((sum, item) => {
      const precio = this.obtenerPrecioNumerico(item.producto.precio);
      return sum + (precio * item.cantidad);
    }, 0);
  });

  igv = computed(() => this.subtotal() * 0.18);
  total = computed(() => this.subtotal() + this.igv());

  productosFiltradosPorBusqueda = computed(() => {
    const search = this.busqueda().toLowerCase().trim();
    const productos = this.productosFiltrados();

    if (!search) return productos;

    return productos.filter(p =>
      p.nombre.toLowerCase().includes(search) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(search))
    );
  });

  ngOnInit(): void {
    this.cargarProductos();
  }

  // ============================================
  // CARGAR PRODUCTOS DESDE EL BACKEND
  // ============================================
  cargarProductos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productoService.obtenerProductos()
      .pipe(
        timeout(5000),
        catchError((err) => {
          console.warn('⚠️ Error al cargar productos:', err.message);
          this.error.set('Error al cargar productos. Por favor, intente nuevamente.');
          this.loading.set(false);
          return of([]);
        })
      )
      .subscribe({
        next: (productos) => {
          console.log('📦 Productos cargados:', productos?.length || 0);
          this.productos.set(productos || []);
          this.filtrarProductos();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('❌ Error al cargar productos:', err);
          this.error.set('Error al cargar los productos. Por favor, intente nuevamente.');
          this.loading.set(false);
        }
      });
  }

  // ============================================
  // FILTRADO POR CATEGORÍA
  // ============================================
  filtrarProductos(): void {
    const catId = this.categoriaSeleccionada();
    const search = this.busqueda().toLowerCase().trim();

    let filtrados = this.productos().filter(p =>
      p.disponible !== false &&
      p.agotado !== true
    );

    if (catId) {
      filtrados = filtrados.filter(p => p.categoria_id === catId);
    }

    if (search) {
      filtrados = filtrados.filter(p =>
        p.nombre.toLowerCase().includes(search) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(search))
      );
    }

    this.productosFiltrados.set(filtrados);
  }

  // ✅ Cuando se selecciona una categoría desde el nav
  onCategoriaChange(categoriaId: number): void {
    this.categoriaSeleccionada.set(categoriaId);
    this.filtrarProductos();
  }

  // ============================================
  // CARRITO
  // ============================================
  agregarAlCarrito(producto: Producto): void {
    const carritoActual = this.carrito();
    const itemExistente = carritoActual.find(item => item.producto.id === producto.id);

    if (itemExistente) {
      itemExistente.cantidad++;
      this.carrito.set([...carritoActual]);
    } else {
      this.carrito.set([...carritoActual, { producto, cantidad: 1 }]);
    }

    this.mostrarCarrito.set(true);
  }

  eliminarDelCarrito(productoId: number): void {
    const carritoActual = this.carrito();
    const itemExistente = carritoActual.find(item => item.producto.id === productoId);

    if (itemExistente) {
      if (itemExistente.cantidad > 1) {
        itemExistente.cantidad--;
        this.carrito.set([...carritoActual]);
      } else {
        this.carrito.set(carritoActual.filter(item => item.producto.id !== productoId));
      }
    }
  }

  vaciarCarrito(): void {
    if (this.carrito().length > 0) {
      if (confirm('¿Estás seguro de vaciar el carrito?')) {
        this.carrito.set([]);
        this.mostrarCarrito.set(false);
      }
    }
  }

  toggleCarrito(): void {
    this.mostrarCarrito.set(!this.mostrarCarrito());
  }

  // ============================================
  // PAGO
  // ============================================
  abrirModalPago(): void {
    if (this.carrito().length === 0) {
      alert('El carrito está vacío. Agrega productos antes de continuar.');
      return;
    }
    this.mostrarModalPago.set(true);
  }

  cerrarModalPago(): void {
    this.mostrarModalPago.set(false);
  }

  procesarPedido(datosPago: any): void {
    const token = this.authService.getToken();
    const usuario = this.authService.getUsuarioActual();

    if (!token || !usuario) {
      alert('Debes iniciar sesión para realizar un pedido.');
      this.router.navigate(['/login-admin']);
      return;
    }

    if (this.carrito().length === 0) {
      alert('El carrito está vacío');
      return;
    }

    this.cargandoPedido.set(true);

    const pedido = {
      items: this.carrito().map(item => ({
        id: item.producto.id,
        nombre: item.producto.nombre,
        precio: this.obtenerPrecioNumerico(item.producto.precio),
        cantidad: item.cantidad,
        subtotal: this.obtenerPrecioNumerico(item.producto.precio) * item.cantidad
      })),
      subtotal: this.subtotal(),
      igv: this.igv(),
      total: this.total(),
      tipo_entrega: datosPago.tipoEntrega || 'local',
      metodo_pago: datosPago.metodo || 'efectivo',
      pagado: false,
      cliente_nombre: datosPago.clienteNombre || 'Cliente',
      observaciones: datosPago.observaciones || '',
      estado: 'pendiente'
    };

    this.pedidoService.crearPedido(pedido).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          const pedidoId = response.pedido?.id;
          if (pedidoId) {
            this.redirigirAIzipay(pedidoId, this.total(), datosPago.metodo);
          } else {
            this.finalizarPedido();
          }
        } else {
          this.cargandoPedido.set(false);
          alert('Error al crear el pedido: ' + (response?.error || 'Error desconocido'));
        }
      },
      error: (err: any) => {
        console.error('Error al crear pedido:', err);
        this.cargandoPedido.set(false);
        alert('Error al procesar el pedido. Por favor, intenta nuevamente.');
      }
    });
  }

  redirigirAIzipay(pedidoId: number, monto: number, metodo: string): void {
    this.simularPagoIzipay(pedidoId);
  }

  simularPagoIzipay(pedidoId: number): void {
    setTimeout(() => {
      this.pedidoService.marcarPagado(pedidoId, 'izipay').subscribe({
        next: () => {
          this.finalizarPedido();
        },
        error: (err) => {
          if (err.status === 400 && err.error?.error?.includes('ya está pagado')) {
            this.finalizarPedido();
          } else {
            this.cargandoPedido.set(false);
            alert('Error al confirmar el pago. Por favor, contacta al administrador.');
          }
        }
      });
    }, 3000);
  }

  finalizarPedido(): void {
    this.cargandoPedido.set(false);
    this.mostrarModalPago.set(false);
    this.carrito.set([]);
    this.mostrarCarrito.set(false);
    alert('¡Pedido realizado con éxito! Tu pedido está siendo preparado.');
  }

  // ============================================
  // UTILIDADES
  // ============================================
  obtenerPrecioNumerico(precio: number | string): number {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    return isNaN(num) ? 0 : num;
  }

  formatearPrecio(precio: number | string): string {
    const num = this.obtenerPrecioNumerico(precio);
    return `S/ ${num.toFixed(2)}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-logo.png';
    img.onerror = null;
  }

  irAdmin(): void {
    this.router.navigate(['/login-admin']);
  }
}