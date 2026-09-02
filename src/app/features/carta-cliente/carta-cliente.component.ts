// src/app/features/carta-cliente/carta-cliente.component.ts
import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { CategoriaService } from '../../core/services/categoria.service';
import { ProductoService } from '../../core/services/producto.service';
import { PedidoService } from '../../core/services/pedido.service';
import { AuthService } from '../../core/services/auth.service';

// Interfaces
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
export class CartaClienteComponent implements OnInit, OnDestroy {
  private categoriaService = inject(CategoriaService);
  private productoService = inject(ProductoService);
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
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

  categoriasActivas = computed(() => {
    return this.categorias().filter(c => c.activo !== false);
  });

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
    // ✅ CARGAR DATOS SIN REQUERIR AUTENTICACIÓN
    // La carta de cliente es pública, no requiere login
    console.log('🔄 Iniciando carta de cliente...');
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones si es necesario
  }

  cargarDatos(): void {
    console.log('📥 Cargando datos...');
    this.loading.set(true);
    this.error.set(null);

    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        console.log('✅ Categorías cargadas:', categorias?.length || 0);
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
        console.error('❌ Error al cargar categorías:', err);
        this.error.set('Error al cargar el menú. Por favor, intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  cargarProductos(): void {
    console.log('📥 Cargando productos...');
    this.productoService.obtenerProductos().subscribe({
      next: (productos) => {
        console.log('✅ Productos cargados:', productos?.length || 0);
        this.productos.set(productos || []);
        this.filtrarProductos();
        this.loading.set(false);
        console.log('📋 Productos filtrados:', this.productosFiltrados().length);
      },
      error: (err) => {
        console.error('❌ Error al cargar productos:', err);
        this.error.set('Error al cargar los productos. Por favor, intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

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

  // ✅ MÉTODO PROCESAR PEDIDO CON IZIPAY - CORREGIDO
  procesarPedido(datosPago: any): void {
    console.log('📤 === PROCESANDO PEDIDO CON IZIPAY ===');
    console.log('📤 Datos de pago:', datosPago);

    // Verificar autenticación para hacer el pedido
    const token = this.authService.getToken();
    const usuario = this.authService.getUsuarioActual();

    if (!token || !usuario) {
      console.warn('⚠️ Usuario no autenticado, redirigiendo a login...');
      alert('⚠️ Debes iniciar sesión para realizar un pedido.');
      this.router.navigate(['/login-admin']);
      return;
    }

    console.log('👤 Usuario autenticado:', usuario);
    console.log('🔐 Token:', token?.substring(0, 20) + '...');

    this.cargandoPedido.set(true);

    // Verificar que el carrito no esté vacío
    if (this.carrito().length === 0) {
      alert('El carrito está vacío');
      this.cargandoPedido.set(false);
      return;
    }

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

    console.log('📤 Enviando pedido al backend:', pedido);

    // 1. Crear el pedido
    this.pedidoService.crearPedido(pedido).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta del servidor:', response);

        if (response && response.success) {
          const pedidoId = response.pedido?.id;

          if (pedidoId) {
            // 2. Redirigir a Izipay con el ID del pedido y el monto
            console.log('🔄 Redirigiendo a Izipay...');
            console.log('📝 Pedido ID:', pedidoId);
            console.log('💰 Monto:', this.total());
            console.log('📝 Método:', datosPago.metodo);

            // ✅ Redirigir a Izipay
            this.redirigirAIzipay(pedidoId, this.total(), datosPago.metodo);
          } else {
            console.warn('⚠️ No se recibió ID del pedido');
            this.finalizarPedido();
          }
        } else {
          console.error('❌ Respuesta inesperada:', response);
          this.cargandoPedido.set(false);
          const mensaje = response?.error || response?.message || 'Error al crear el pedido';
          alert('❌ ' + mensaje);
        }
      },
      error: (err: any) => {
        console.error('❌ Error al crear pedido:', err);
        console.error('❌ Detalle:', err.error);
        this.cargandoPedido.set(false);

        let mensaje = 'Error al procesar el pedido. Por favor, intenta nuevamente.';
        if (err.error?.error) {
          mensaje = err.error.error;
        } else if (err.error?.detalle) {
          mensaje = err.error.detalle;
        } else if (err.message) {
          mensaje = err.message;
        }
        alert('❌ ' + mensaje);
      }
    });
  }

  // ✅ REDIRIGIR A IZIPAY
  redirigirAIzipay(pedidoId: number, monto: number, metodo: string): void {
    console.log('🔄 === REDIRIGIENDO A IZIPAY ===');
    console.log('📝 Pedido ID:', pedidoId);
    console.log('💰 Monto:', monto);
    console.log('📝 Método:', metodo);

    // Construir URL de Izipay con los parámetros
    const izipayUrl = `https://izipay.pe/pago?pedido=${pedidoId}&monto=${monto.toFixed(2)}&metodo=${metodo}&nombre=Doña Yacki`;

    console.log('🔗 URL Izipay:', izipayUrl);

    // ✅ En producción, redirigir a Izipay
    // window.location.href = izipayUrl;

    // ⚠️ SIMULACIÓN - Para pruebas, simular que Izipay confirma el pago
    this.simularPagoIzipay(pedidoId);
  }

  // ✅ SIMULAR PAGO CON IZIPAY (para pruebas)
  simularPagoIzipay(pedidoId: number): void {
    console.log('🔄 Simulando pago con Izipay...');

    // Mostrar mensaje de espera
    alert('🔄 Redirigiendo a Izipay...\nEspera la confirmación del pago.');

    // Simular que Izipay confirma el pago después de 5 segundos
    setTimeout(() => {
      console.log('✅ Confirmación de pago recibida de Izipay');
      console.log('📝 Pedido ID:', pedidoId);

      // Marcar el pedido como pagado
      this.pedidoService.marcarPagado(pedidoId, 'izipay').subscribe({
        next: (response) => {
          console.log('✅ Pedido marcado como pagado:', response);
          this.finalizarPedido();
        },
        error: (err) => {
          console.error('❌ Error al marcar pedido como pagado:', err);
          // Si el pedido ya está pagado, igual finalizar
          if (err.status === 400 && err.error?.error?.includes('ya está pagado')) {
            console.log('ℹ️ El pedido ya estaba pagado');
            this.finalizarPedido();
          } else {
            this.cargandoPedido.set(false);
            alert('❌ Error al confirmar el pago. Por favor, contacta al administrador.');
          }
        }
      });
    }, 5000);
  }

  // ✅ FINALIZAR PEDIDO
  finalizarPedido(): void {
    console.log('✅ === PEDIDO FINALIZADO ===');
    this.cargandoPedido.set(false);
    this.mostrarModalPago.set(false);
    this.carrito.set([]);
    this.mostrarCarrito.set(false);
    alert('🎉 ¡Pedido realizado con éxito! Tu pedido está siendo preparado.');
  }

  // ✅ MÉTODOS DE UTILIDAD
  obtenerPrecioNumerico(precio: number | string): number {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    return isNaN(num) ? 0 : num;
  }

  formatearPrecio(precio: number | string): string {
    const num = this.obtenerPrecioNumerico(precio);
    return `S/ ${num.toFixed(2)}`;
  }

  // ✅ MÉTODO PARA MANEJAR ERROR DE IMAGEN DEL LOGO
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      const fallback = document.createElement('div');
      fallback.className = 'logo-fallback';
      fallback.textContent = 'DY';
      parent.insertBefore(fallback, img);
    }
  }

  irAdmin(): void {
    this.router.navigate(['/login-admin']);
  }

  // ✅ SVG Icons para categorías
  getCategoriaIcon(nombre: string): string {
    const icons: Record<string, string> = {
      'Brasas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 6 4 10 4 14c0 4 3 6 8 6s8-2 8-6c0-4-4-8-8-12z"/><path d="M12 18c-3 0-6-1-6-4"/></svg>`,
      'Broasters': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 6 4 10 4 14c0 4 3 6 8 6s8-2 8-6c0-4-4-8-8-12z"/><path d="M8 14c0 2 2 3 4 3s4-1 4-3"/></svg>`,
      'Mostro Brasa': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s2 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
      'Mostro Broaster': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s2 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
      'Piezas de Pollo': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 6 4 10 4 14c0 4 3 6 8 6s8-2 8-6c0-4-4-8-8-12z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
      'Alitas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 6 4 10 4 14c0 4 3 6 8 6s8-2 8-6c0-4-4-8-8-12z"/><path d="M8 14c0-2 2-3 4-3s4 1 4 3"/></svg>`,
      'Salchipapas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="16" height="12" rx="2"/><line x1="8" y1="4" x2="16" y2="4"/><line x1="6" y1="20" x2="18" y2="20"/></svg>`,
      'Hamburguesas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M6 12c0 2 2 4 6 4s6-2 6-4"/><path d="M8 8h.01"/><path d="M16 8h.01"/></svg>`,
      'Don Menú': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>`,
      'Adicionales': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
      'Chifa y Plancha': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 6 4 10 4 14c0 4 3 6 8 6s8-2 8-6c0-4-4-8-8-12z"/><path d="M8 14c0 2 2 3 4 3s4-1 4-3"/></svg>`,
      'Promos Brasa': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      'Gaseosas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 20l4-12h8l4 12"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/><line x1="14" y1="8" x2="14" y2="20"/></svg>`,
      'Cervezas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 20l4-12h8l4 12"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/><line x1="10" y1="8" x2="10" y2="20"/></svg>`,
      'Aguas': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M6 8h12"/><path d="M6 12h12"/><path d="M6 16h12"/></svg>`,
      'Infusiones': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16v8c0 3-3 4-8 4s-8-1-8-4V6z"/><path d="M8 6V4c0-1 1-2 4-2s4 1 4 2v2"/></svg>`,
      'Pepsi': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`,
      'Chicha/Maracuyá': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M6 8h12"/><path d="M6 12h12"/></svg>`
    };
    return icons[nombre] || icons['Brasas'];
  }
}
