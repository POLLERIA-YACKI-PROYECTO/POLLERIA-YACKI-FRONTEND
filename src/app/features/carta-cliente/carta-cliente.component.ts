// src/app/features/carta-cliente/carta-cliente.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { CategoriaService } from '../../core/services/categoria.service';
import { ProductoService } from '../../core/services/producto.service';
import { PedidoService } from '../../core/services/pedido.service';

// ✅ Interfaces desde core/models
import { Categoria, Producto, ItemCarrito } from '../../core/models/interfaces';

// Components
import { ProductoCardComponent } from './components/producto-card/producto-card.component';
import { CarritoLateralComponent } from './components/carrito-lateral/carrito-lateral.component';
import { ModalPagoComponent } from './components/modal-pago/modal-pago.component';

@Component({
  selector: 'app-carta-cliente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductoCardComponent,
    CarritoLateralComponent,
    ModalPagoComponent
  ],
  templateUrl: './carta-cliente.component.html',
  styleUrls: ['./carta-cliente.component.scss']
})
export class CartaClienteComponent implements OnInit {
  private categoriaService = inject(CategoriaService);
  private productoService = inject(ProductoService);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  categorias = signal<Categoria[]>([]);
  productos = signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  categoriaSeleccionada = signal<number | null>(null);
  carrito = signal<ItemCarrito[]>([]);
  mostrarCarrito = signal(false);
  mostrarModalPago = signal(false);
  cargandoPedido = signal(false);

  obtenerPrecioNumerico(precio: number | string): number {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    return isNaN(num) ? 0 : num;
  }

  totalItems = computed(() => {
    return this.carrito().reduce((sum, item) => sum + item.cantidad, 0);
  });

  subtotal = computed(() => {
    return this.carrito().reduce((sum, item) => {
      const precio = this.obtenerPrecioNumerico(item.producto.precio);
      return sum + (precio * item.cantidad);
    }, 0);
  });

  igv = computed(() => {
    return this.subtotal() * 0.18;
  });

  total = computed(() => {
    return this.subtotal() + this.igv();
  });

  categoriasActivas = computed(() => {
    return this.categorias().filter(c => c.activo !== false);
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias || []);
        if (categorias && categorias.length > 0) {
          const primeraActiva = categorias.find(c => c.activo !== false);
          if (primeraActiva) {
            this.categoriaSeleccionada.set(primeraActiva.id);
          }
        }
        this.cargarProductos();
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.error.set('Error al cargar el menú. Por favor, intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  cargarProductos(): void {
    this.productoService.obtenerProductos().subscribe({
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

  filtrarProductos(): void {
    const catId = this.categoriaSeleccionada();
    if (catId) {
      const filtrados = this.productos().filter(p => 
        p.categoria_id === catId && 
        p.disponible !== false &&
        p.agotado !== true
      );
      this.productosFiltrados.set(filtrados);
    } else {
      this.productosFiltrados.set(
        this.productos().filter(p => 
          p.disponible !== false && 
          p.agotado !== true
        )
      );
    }
  }

  seleccionarCategoria(categoriaId: number): void {
    this.categoriaSeleccionada.set(categoriaId);
    this.filtrarProductos();
    if (window.innerWidth < 768) {
      this.mostrarCarrito.set(false);
    }
  }

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

    const btn = document.querySelector(`[data-producto-id="${producto.id}"]`);
    if (btn) {
      btn.classList.add('agregado');
      setTimeout(() => btn.classList.remove('agregado'), 500);
    }
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
      tipo: 'local',
      tipo_entrega: 'local',
      metodo_pago: datosPago.metodo,
      pagado: true,
      cliente_nombre: datosPago.clienteNombre || 'Cliente',
      observaciones: datosPago.observaciones || '',
      estado: 'pendiente'
    };

    console.log('📤 Enviando pedido:', pedido);

    this.pedidoService.crearPedido(pedido).subscribe({
      next: (response) => {
        console.log('✅ Pedido creado:', response);
        this.cargandoPedido.set(false);
        this.mostrarModalPago.set(false);
        this.carrito.set([]);
        this.mostrarCarrito.set(false);
        alert('🎉 ¡Pedido realizado con éxito! Tu pedido está siendo preparado.');
      },
      error: (err) => {
        console.error('❌ Error al crear pedido:', err);
        this.cargandoPedido.set(false);
        alert('❌ Error al procesar el pedido. Por favor, intente nuevamente.');
      }
    });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/default-product.png';
  }

  formatearPrecio(precio: number | string): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    if (isNaN(num)) return 'S/ 0.00';
    return `S/ ${num.toFixed(2)}`;
  }

  irAdmin(): void {
    this.router.navigate(['/login-admin']);
  }
}