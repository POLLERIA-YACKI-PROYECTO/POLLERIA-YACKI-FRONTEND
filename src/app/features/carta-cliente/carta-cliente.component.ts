// src/app/features/carta-cliente/carta-cliente.component.ts
import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, timeout, of, Subject, takeUntil } from 'rxjs';

// Services
import { ProductoService } from '../../core/services/producto.service';
import { PedidoClienteService } from '../../core/services/pedido-cliente.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notificacion.service';

// Interfaces
import { Producto, ItemCarrito } from '../../core/models/interfaces';

// Components
import { ProductoCardComponent } from './components/producto-card/producto-card.component';
import { CarritoLateralComponent } from './components/carrito-lateral/carrito-lateral.component';
import { ModalPagoComponent } from './components/modal-pago/modal-pago.component';
import { CategoriasNavComponent } from './components/categorias-nav/categorias-nav.component';
import { ConfirmDialogComponent } from '../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-carta-cliente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductoCardComponent,
    CarritoLateralComponent,
    ModalPagoComponent,
    CategoriasNavComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './carta-cliente.component.html',
  styleUrls: ['./carta-cliente.component.scss']
})
export class CartaClienteComponent implements OnInit, OnDestroy {
  private productoService = inject(ProductoService);
  private pedidoClienteService = inject(PedidoClienteService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  private cargando = signal(false);
  private yaCargado = signal(false);

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

  pedidoCreadoId = signal<number | null>(null);

  clienteActual = signal<any>(this.authService.getUsuarioActual());

  mostrarConfirmVaciar = signal(false);

  totalItems = computed(() =>
    this.carrito().reduce((sum, item) => sum + item.cantidad, 0)
  );

  subtotal = computed(() =>
    this.carrito().reduce((sum, item) => {
      const precio = this.obtenerPrecioNumerico(item.producto.precio);
      return sum + precio * item.cantidad;
    }, 0)
  );

  // SIN IGV: el total es igual al subtotal
  total = computed(() => this.subtotal());

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      console.warn('CartaCliente: sin sesion -> /login-cliente');
      this.router.navigate(['/login-cliente']);
      return;
    }

    if (!this.authService.isCliente()) {
      console.warn('CartaCliente: no es cliente -> /login-cliente');
      this.router.navigate(['/login-cliente']);
      return;
    }

    this.cargarProductos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // TRACK BY
  // ============================================
  trackByProductoId(index: number, producto: any): any {
    return producto?.id ?? index;
  }

  // ============================================
  // CARGAR PRODUCTOS
  // ============================================
  cargarProductos(): void {
    if (this.cargando() || this.yaCargado()) return;

    this.cargando.set(true);
    this.loading.set(true);
    this.error.set(null);

    this.productoService
      .obtenerProductos()
      .pipe(
        timeout(8000),
        catchError((err) => {
          console.warn('Error al cargar productos:', err?.message);
          this.error.set('Error al cargar productos. Por favor, intente nuevamente.');
          this.loading.set(false);
          this.cargando.set(false);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (productos) => {
          this.productos.set(productos || []);
          this.filtrarProductos();
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('Carta cliente cargada:', (productos || []).length, 'productos');
        },
        error: (err) => {
          console.error('Error al cargar productos:', err);
          this.error.set('Error al cargar los productos. Por favor, intente nuevamente.');
          this.loading.set(false);
          this.cargando.set(false);
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

  onBusquedaChange(valor: string): void {
    this.busqueda.set(valor);
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

  eliminarDelCarrito(index: number): void {
    const carritoActual = [...this.carrito()];
    if (index < 0 || index >= carritoActual.length) return;

    const item = carritoActual[index];
    if (item.cantidad > 1) {
      item.cantidad--;
      this.carrito.set(carritoActual);
    } else {
      carritoActual.splice(index, 1);
      this.carrito.set(carritoActual);
    }
  }

  vaciarCarrito(): void {
    if (this.carrito().length === 0) return;
    this.mostrarConfirmVaciar.set(true);
  }

  confirmarVaciarCarrito(): void {
    this.carrito.set([]);
    this.mostrarCarrito.set(false);
    this.mostrarConfirmVaciar.set(false);

    this.notificationService.success(
      'El carrito se vacio correctamente.',
      'Carrito vaciado'
    );
  }

  cancelarVaciarCarrito(): void {
    this.mostrarConfirmVaciar.set(false);
  }

  toggleCarrito(): void {
    this.mostrarCarrito.set(!this.mostrarCarrito());
  }

  // ============================================
  // PAGO
  // ============================================
  abrirModalPago(): void {
    if (this.carrito().length === 0) {
      this.notificationService.warning(
        'El carrito esta vacio. Agrega productos antes de continuar.',
        'Carrito vacio'
      );
      return;
    }
    this.pedidoCreadoId.set(null);
    this.mostrarModalPago.set(true);
  }

  cerrarModalPago(): void {
    this.mostrarModalPago.set(false);
    this.pedidoCreadoId.set(null);
  }

  // ============================================
  // PROCESAR PEDIDO (SIN IGV)
  // ============================================
  procesarPedido(datosPago: any): void {
    const token = this.authService.getToken();
    const usuario = this.authService.getUsuarioActual();

    if (!token || !usuario) {
      this.notificationService.error(
        'Debes iniciar sesion como cliente para realizar un pedido.',
        'Sesion requerida'
      );
      this.router.navigate(['/login-cliente']);
      return;
    }

    if (!this.authService.isCliente()) {
      this.notificationService.error(
        'Esta seccion es para clientes. Inicia sesion como cliente.',
        'Acceso denegado'
      );
      this.router.navigate(['/login-cliente']);
      return;
    }

    if (this.carrito().length === 0) {
      this.notificationService.warning('El carrito esta vacio', 'Carrito vacio');
      return;
    }

    if (
      (datosPago.tipoEntrega || 'delivery') === 'delivery' &&
      !datosPago.direccion?.trim()
    ) {
      this.notificationService.warning(
        'Para delivery debes ingresar la direccion de entrega.',
        'Direccion requerida'
      );
      this.cargandoPedido.set(false);
      return;
    }

    this.cargandoPedido.set(true);

    const clienteId = usuario?.id;
    const clienteIdValido =
      typeof clienteId === 'number' && Number.isFinite(clienteId) && clienteId > 0
        ? clienteId
        : null;

    const totalPedido = this.total();

    const pedido = {
      cliente_id: clienteIdValido,
      cliente_nombre: datosPago.clienteNombre || usuario.nombre || 'Cliente',
      cliente_telefono: datosPago.telefono || usuario.telefono || '',
      cliente_direccion: datosPago.direccion || usuario.direccion || null,
      cliente_referencia: datosPago.referencia || '',
      items: this.carrito().map((item) => ({
        producto_id: item.producto.id,
        nombre: item.producto.nombre,
        precio: this.obtenerPrecioNumerico(item.producto.precio),
        cantidad: item.cantidad,
        subtotal: this.obtenerPrecioNumerico(item.producto.precio) * item.cantidad
      })),
      subtotal: totalPedido,
      igv: 0,
      total: totalPedido,
      tipo_entrega: datosPago.tipoEntrega || 'delivery',
      metodo_pago: datosPago.metodo || 'efectivo',
      tipo_transferencia: datosPago.tipoTransferencia || null,
      observaciones: datosPago.observaciones || ''
    };

    this.pedidoClienteService.crearPedido(pedido)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response?.success !== false) {
            const pedidoId = response?.pedido?.id;

            if (pedidoId) {
              this.pedidoCreadoId.set(pedidoId);
              this.cargandoPedido.set(false);
            } else {
              this.finalizarPedido();
            }
          } else {
            this.cargandoPedido.set(false);
            this.notificationService.error(
              response?.detalle || response?.error || 'Error desconocido',
              'Error al crear pedido'
            );
          }
        },
        error: (err: any) => {
          console.error('Error al crear pedido:', err);
          this.cargandoPedido.set(false);
          let mensaje =
            err?.error?.detalle ||
            err?.error?.error ||
            err?.error?.message;

          if (!mensaje) {
            if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
            else if (err?.status === 401) mensaje = 'Sesion expirada. Vuelve a iniciar sesion.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para crear pedidos.';
            else if (err?.status === 429) mensaje = 'Demasiadas peticiones. Espera un momento.';
            else mensaje = `Error al procesar el pedido (${err?.status || 'sin respuesta'}).`;
          }

          this.notificationService.error(mensaje, 'Error al procesar pedido');
        }
      });
  }

  // ============================================
  // SUBIR COMPROBANTE
  // ============================================
  subirComprobante(evento: { pedidoId: number; archivo: File }): void {
    this.cargandoPedido.set(true);

    this.pedidoClienteService
      .subirComprobante(evento.pedidoId, evento.archivo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cargandoPedido.set(false);
          this.mostrarExitoPendienteValidacion();
        },
        error: (err) => {
          console.error('Error al subir comprobante:', err);
          this.cargandoPedido.set(false);
          this.notificationService.error(
            'Error al subir el comprobante. Intenta nuevamente.',
            'Error'
          );
        }
      });
  }

  // ============================================
  // CONFIRMAR EFECTIVO / MAQUINA
  // ============================================
  confirmarEfectivo(evento: { pedidoId: number }): void {
    this.mostrarExitoPendienteValidacion();
  }

  confirmarMaquina(evento: { pedidoId: number }): void {
    this.mostrarExitoPendienteValidacion();
  }

  // ============================================
  // EXITO
  // ============================================
  private mostrarExitoPendienteValidacion(): void {
    this.cargandoPedido.set(false);
    this.mostrarModalPago.set(false);
    this.pedidoCreadoId.set(null);
    this.carrito.set([]);
    this.mostrarCarrito.set(false);

    this.notificationService.success(
      'El cajero verificara tu pago y confirmara el pedido.',
      'Pedido registrado'
    );

    this.router.navigate(['/cliente/carta']);
  }

  finalizarPedido(): void {
    this.cargandoPedido.set(false);
    this.mostrarModalPago.set(false);
    this.pedidoCreadoId.set(null);
    this.carrito.set([]);
    this.mostrarCarrito.set(false);

    this.notificationService.success(
      'Tu pedido ha sido procesado correctamente.',
      'Pedido realizado'
    );

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

  // ============================================
  // NAVEGACION
  // ============================================
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