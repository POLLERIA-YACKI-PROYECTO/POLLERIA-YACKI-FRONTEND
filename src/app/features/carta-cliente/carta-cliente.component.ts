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
  categoriaSeleccionada = signal<number>(1);
  carrito = signal<ItemCarrito[]>([]);
  mostrarCarrito = signal(false);
  mostrarModalPago = signal(false);
  cargandoPedido = signal(false);
  busqueda = signal('');

  // Cliente actual
  clienteActual = signal<any>(this.authService.getUsuarioActual());

  // Computed
  totalItems = computed(() =>
    this.carrito().reduce((sum, item) => sum + item.cantidad, 0)
  );

  subtotal = computed(() =>
    this.carrito().reduce((sum, item) => {
      const precio = this.obtenerPrecioNumerico(item.producto.precio);
      return sum + precio * item.cantidad;
    }, 0)
  );

  igv = computed(() => this.subtotal() * 0.18);
  total = computed(() => this.subtotal() + this.igv());

  productosFiltradosPorBusqueda = computed(() => {
    const search = this.busqueda().toLowerCase().trim();
    const productos = this.productosFiltrados();

    if (!search) return productos;

    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(search) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(search))
    );
  });

  ngOnInit(): void {
    // Verificar sesión de cliente
    if (!this.authService.isCliente()) {
      this.router.navigate(['/login-cliente']);
      return;
    }
    this.cargarProductos();
  }

  // ============================================
  // CARGAR PRODUCTOS
  // ============================================
  cargarProductos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productoService
      .obtenerProductos()
      .pipe(
        timeout(5000),
        catchError((err) => {
          console.warn('Error al cargar productos:', err?.message);
          this.error.set('Error al cargar productos. Por favor, intente nuevamente.');
          this.loading.set(false);
          return of([]);
        })
      )
      .subscribe({
        next: (productos) => {
          this.productos.set(productos || []);
          this.filtrarProductos();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar productos:', err);
          this.error.set('Error al cargar los productos. Por favor, intente nuevamente.');
          this.loading.set(false);
        }
      });
  }

  // ============================================
  // FILTRADO
  // ============================================
  filtrarProductos(): void {
    const catId = this.categoriaSeleccionada();
    const search = this.busqueda().toLowerCase().trim();

    let filtrados = this.productos().filter(
      (p) => p.disponible !== false && p.agotado !== true
    );

    if (catId) {
      filtrados = filtrados.filter((p) => p.categoria_id === catId);
    }

    if (search) {
      filtrados = filtrados.filter(
        (p) =>
          p.nombre.toLowerCase().includes(search) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(search))
      );
    }

    this.productosFiltrados.set(filtrados);
  }

  onCategoriaChange(categoriaId: number): void {
    this.categoriaSeleccionada.set(categoriaId);
    this.filtrarProductos();
  }

  // ============================================
  // CARRITO
  // ============================================
  agregarAlCarrito(producto: Producto): void {
    const carritoActual = this.carrito();
    const itemExistente = carritoActual.find(
      (item) => item.producto.id === producto.id
    );

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
    const itemExistente = carritoActual.find(
      (item) => item.producto.id === productoId
    );

    if (!itemExistente) return;

    if (itemExistente.cantidad > 1) {
      itemExistente.cantidad--;
      this.carrito.set([...carritoActual]);
    } else {
      this.carrito.set(
        carritoActual.filter((item) => item.producto.id !== productoId)
      );
    }
  }

  vaciarCarrito(): void {
    if (this.carrito().length === 0) return;
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
      this.carrito.set([]);
      this.mostrarCarrito.set(false);
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
      alert('Debes iniciar sesión como cliente para realizar un pedido.');
      this.router.navigate(['/login-cliente']);
      return;
    }

    if (!this.authService.isCliente()) {
      alert('Esta sección es para clientes. Inicia sesión como cliente.');
      this.router.navigate(['/login-cliente']);
      return;
    }

    if (this.carrito().length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (
      (datosPago.tipoEntrega || 'local') === 'delivery' &&
      !datosPago.direccion?.trim()
    ) {
      alert('Para delivery debes ingresar la dirección de entrega.');
      this.cargandoPedido.set(false);
      return;
    }

    this.cargandoPedido.set(true);

    const pedido = {
      cliente_id: usuario.id,
      items: this.carrito().map((item) => ({
        id: item.producto.id,
        nombre: item.producto.nombre,
        precio: this.obtenerPrecioNumerico(item.producto.precio),
        cantidad: item.cantidad,
        subtotal:
          this.obtenerPrecioNumerico(item.producto.precio) * item.cantidad
      })),
      subtotal: this.subtotal(),
      igv: this.igv(),
      total: this.total(),
      tipo_entrega: datosPago.tipoEntrega || 'local',
      metodo_pago: datosPago.metodo || 'efectivo',
      pagado: false,
      cliente_nombre: datosPago.clienteNombre || usuario.nombre || 'Cliente',
      telefono: datosPago.telefono || usuario.telefono || '',
      direccion_entrega: datosPago.direccion || usuario.direccion || null,
      referencia: datosPago.referencia || '',
      observaciones: datosPago.observaciones || '',
      estado: 'pendiente',
      fecha: new Date().toISOString()
    };

    this.pedidoService.crearPedidoCliente(pedido).subscribe({
      next: (response: any) => {
        if (response?.success !== false) {
          this.finalizarPedido();
        } else {
          this.cargandoPedido.set(false);
          alert(
            'Error al crear el pedido: ' +
              (response?.error || 'Error desconocido')
          );
        }
      },
      error: (err: any) => {
        console.error('Error al crear pedido:', err);
        this.cargandoPedido.set(false);
        alert('Error al procesar el pedido. Por favor, intenta nuevamente.');
      }
    });
  }

  finalizarPedido(): void {
    this.cargandoPedido.set(false);
    this.mostrarModalPago.set(false);
    this.carrito.set([]);
    this.mostrarCarrito.set(false);
    alert('¡Pedido realizado con éxito! Tu pedido está siendo preparado.');
    // Se queda en la carta (no hay ruta de historial activa)
    this.router.navigate(['/cliente/carta']);
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

  irLoginCliente(): void {
    this.router.navigate(['/login-cliente']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-cliente']);
  }
}