// src/app/features/mesero/pedidos-mesero/pedidos-mesero.component.ts
import { Component, signal, inject, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Subject, takeUntil, timeout, catchError, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { PedidoDetalleComponent } from '../pedido-detalle/pedido-detalle.component';

@Component({
  selector: 'app-pedidos-mesero',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, PedidoDetalleComponent],
  templateUrl: './pedidos-mesero.component.html',
  styleUrls: ['./pedidos-mesero.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class PedidosMeseroComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private productoService = inject(ProductoService);
  private clienteService = inject(ClienteService);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  // ✅ Flags anti-duplicado
  private cargando = signal(false);
  private yaCargado = signal(false);
  private categoriasCargadas = signal(false);

  // Estados
  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');
  loading = signal<boolean>(true);
  cargandoProductos = signal<boolean>(false);
  guardandoPedido = signal<boolean>(false);

  // ✅ Modal de éxito
  mostrarModalExito = signal<boolean>(false);
  mensajeExito = signal<string>('');
  pedidoCreado = signal<any>(null);

  // ✅ Modal de aviso (reemplaza alert)
  mostrarModalAviso = signal<boolean>(false);
  mensajeAviso = signal<string>('');
  tituloAviso = signal<string>('Atención');
  tipoAviso = signal<'warning' | 'error' | 'info'>('warning');

  // Datos
  pedidos = signal<any[]>([]);
  pedidosFiltrados = signal<any[]>([]);
  pedidosLocal = signal<any[]>([]);
  pedidosDelivery = signal<any[]>([]);
  categorias = signal<any[]>([]);
  productos = signal<any[]>([]);
  productosFiltrados = signal<any[]>([]);
  clientes = signal<any[]>([]);
  clientesEncontrados = signal<any[]>([]);
  categoriaSeleccionada = signal<number | null>(null);

  // Estado del pedido actual
  itemsPedido = signal<any[]>([]);
  clienteSeleccionado = signal<any>(null);
  busquedaCliente = signal<string>('');
  mostrarModalPedido = signal<boolean>(false);
  mostrarModalProductos = signal<boolean>(false);
  tipoEntrega = signal<string>('local');
  filtroTipo = signal<string>('todos');

  // Modal Detalle Pedido
  pedidoSeleccionado = signal<any>(null);
  mostrarDetalle = signal<boolean>(false);

  totalPedido = computed(() => {
    return this.itemsPedido().reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  });

  // Nuevo cliente
  nuevoCliente = {
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: ''
  };

  // Para seleccionar producto
  cantidadProducto = signal<number>(1);
  productoSeleccionado = signal<any>(null);

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      console.warn('🛡️ PedidosMesero: sin sesión → /login-mesero');
      this.router.navigate(['/login-mesero']);
      return;
    }

    this.usuario.set(this.authService.getUsuarioActual());

    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      console.warn('🛡️ PedidosMesero: no es mesero → /login-mesero');
      this.router.navigate(['/login-mesero']);
      return;
    }

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // MODAL DE AVISO (reemplaza alert)
  // ============================================
  mostrarAviso(
    mensaje: string,
    titulo: string = 'Atención',
    tipo: 'warning' | 'error' | 'info' = 'warning'
  ): void {
    this.mensajeAviso.set(mensaje);
    this.tituloAviso.set(titulo);
    this.tipoAviso.set(tipo);
    this.mostrarModalAviso.set(true);
  }

  cerrarModalAviso(): void {
    this.mostrarModalAviso.set(false);
    this.mensajeAviso.set('');
  }

  // ============================================
  // VALIDACIÓN DE CAMPOS NUMÉRICOS
  // ============================================
  private soloDigitos(valor: any, maxLength: number): string {
    const soloNumeros = String(valor ?? '').replace(/\D/g, '');
    return soloNumeros.slice(0, maxLength);
  }

  private soloLetras(valor: any, maxLength: number): string {
    const soloLetras = String(valor ?? '')
      .replace(/[0-9]/g, '')
      .slice(0, maxLength);
    return soloLetras;
  }

  onNombreInput(event: any): void {
    const valor = this.soloLetras(event.target.value, 50);
    this.nuevoCliente.nombre = valor;
    event.target.value = valor;
  }

  onApellidoInput(event: any): void {
    const valor = this.soloLetras(event.target.value, 50);
    this.nuevoCliente.apellido = valor;
    event.target.value = valor;
  }

  onDniInput(event: any): void {
    const valor = this.soloDigitos(event.target.value, 8);
    this.nuevoCliente.dni = valor;
    event.target.value = valor;
  }

  onTelefonoInput(event: any): void {
    const valor = this.soloDigitos(event.target.value, 9);
    this.nuevoCliente.telefono = valor;
    event.target.value = valor;
  }

  onEmailInput(event: any): void {
    const valor = String(event.target.value ?? '').trim().slice(0, 80);
    this.nuevoCliente.email = valor;
    event.target.value = valor;
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================
  cargarDatos(): void {
    if (this.cargando() || this.yaCargado()) return;

    this.cargando.set(true);
    this.loading.set(true);

    forkJoin({
      categorias: this.categoriaService.obtenerCategorias()
        .pipe(timeout(10000), catchError(() => of([]))),
      pedidos: this.pedidoService.obtenerPedidos()
        .pipe(timeout(10000), catchError(() => of([]))),
      clientes: this.clienteService.obtenerClientes()
        .pipe(timeout(10000), catchError(() => of([])))
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ categorias, pedidos, clientes }) => {
          this.categorias.set(categorias || []);
          this.categoriasCargadas.set(true);

          if (categorias?.length > 0) {
            this.categoriaSeleccionada.set(categorias[0].id);
            this.cargarProductos(categorias[0].id);
          }

          const pedidosParseados = this.parsearPedidos(pedidos || []);
          this.pedidos.set(pedidosParseados);
          this.filtrarPedidosPorTipo();

          this.clientes.set(clientes || []);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('✅ Pedidos mesero cargado:', pedidosParseados.length, 'pedidos');
        },
        error: (err: any) => {
          console.error('Error al cargar datos:', err);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(false);
        }
      });
  }

  private parsearPedidos(pedidos: any[]): any[] {
    return pedidos.map((p: any) => {
      if (p.items && typeof p.items === 'string') {
        try {
          p.items = JSON.parse(p.items);
        } catch (e) {
          p.items = [];
        }
      } else if (!Array.isArray(p.items)) {
        p.items = [];
      }
      return p;
    });
  }

  recargarDatos(): void {
    this.pedidoService.limpiarCachePedidos();
    this.yaCargado.set(false);
    this.cargarDatos();
  }

  // ============================================
  // FILTRADO DE PEDIDOS
  // ============================================
  filtrarPedidosPorTipo(): void {
    const pedidos = this.pedidos();
    this.pedidosLocal.set(pedidos.filter(p => p.tipo_entrega === 'local' || p.tipo_entrega === 'paraLlevar'));
    this.pedidosDelivery.set(pedidos.filter(p => p.tipo_entrega === 'delivery' || p.tipo_entrega === 'motorizada'));

    if (this.filtroTipo() === 'local') {
      this.pedidosFiltrados.set(this.pedidosLocal());
    } else if (this.filtroTipo() === 'delivery') {
      this.pedidosFiltrados.set(this.pedidosDelivery());
    } else {
      this.pedidosFiltrados.set(pedidos);
    }
  }

  seleccionarTipoEntrega(tipo: string): void {
    this.tipoEntrega.set(tipo);
  }

  cambiarFiltroTipo(tipo: string): void {
    this.filtroTipo.set(tipo);
    this.filtrarPedidosPorTipo();
  }

  // ============================================
  // PRODUCTOS
  // ============================================
  cargarProductos(categoriaId: number): void {
    this.cargandoProductos.set(true);
    this.categoriaSeleccionada.set(categoriaId);

    this.productoService.obtenerPorCategoria(categoriaId)
      .pipe(
        catchError(() => of([])),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (productos: any[]) => {
          this.productos.set(productos || []);
          this.productosFiltrados.set(productos || []);
          this.cargandoProductos.set(false);
        },
        error: (err: any) => {
          console.error('Error al cargar productos:', err);
          this.cargandoProductos.set(false);
        }
      });
  }

  seleccionarCategoria(categoriaId: number): void {
    if (this.categoriaSeleccionada() === categoriaId) return;
    this.cargarProductos(categoriaId);
  }

  // ============================================
  // ESTADOS
  // ============================================
  getEstadoClass(estado: string): string {
    const clases: any = {
      'pendiente': 'estado-pendiente',
      'preparando': 'estado-preparando',
      'listo': 'estado-listo',
      'entregado': 'estado-entregado',
      'cancelado': 'estado-cancelado'
    };
    return clases[estado] || 'estado-pendiente';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      'pendiente': 'Pendiente',
      'preparando': 'Preparando',
      'listo': 'Listo',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  }

  getEstadoSvg(estado: string): string {
    const svgs: any = {
      'pendiente': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      'preparando': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6v6l4 2"/></svg>`,
      'listo': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
      'entregado': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      'cancelado': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    };
    return svgs[estado] || svgs['pendiente'];
  }

  getTipoEntregaSvg(tipo: string): string {
    const svgs: any = {
      'local': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      'delivery': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="15" height="13" rx="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/></svg>`,
      'paraLlevar': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      'motorizada': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="15" height="13" rx="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/></svg>`
    };
    return svgs[tipo] || svgs['local'];
  }

  getTipoEntregaLabel(tipo: string): string {
    const labels: any = {
      'local': 'Local',
      'delivery': 'Motorizado',
      'paraLlevar': 'Para Llevar',
      'motorizada': 'Motorizado'
    };
    return labels[tipo] || 'Local';
  }

  // ============================================
  // VER DETALLE
  // ============================================
  verDetalle(pedido: any): void {
    const pedidoCopia = JSON.parse(JSON.stringify(pedido));

    if (pedidoCopia.items) {
      if (typeof pedidoCopia.items === 'string') {
        try {
          pedidoCopia.items = JSON.parse(pedidoCopia.items);
        } catch (e) {
          pedidoCopia.items = [];
        }
      } else if (!Array.isArray(pedidoCopia.items)) {
        pedidoCopia.items = [];
      }
    } else {
      pedidoCopia.items = [];
    }

    pedidoCopia.cliente_nombre = pedidoCopia.cliente_nombre_real || pedidoCopia.cliente_nombre || 'Cliente';
    pedidoCopia.usuario_nombre = pedidoCopia.usuario_nombre_completo || pedidoCopia.usuario_nombre || 'Mesero';
    pedidoCopia.created_at = pedidoCopia.created_at || pedidoCopia.fecha || new Date().toISOString();

    this.pedidoSeleccionado.set(pedidoCopia);
    this.mostrarDetalle.set(true);
  }

  cerrarDetalle(): void {
    this.mostrarDetalle.set(false);
    this.pedidoSeleccionado.set(null);
  }

  actualizarEstadoPedido(event: { id: number, estado: string }): void {
    this.pedidoService.cambiarEstado(event.id, event.estado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mostrarAviso(
            `Pedido #${event.id} actualizado a "${this.getEstadoTexto(event.estado)}"`,
            'Estado actualizado',
            'info'
          );
          this.cerrarDetalle();
          this.recargarDatos();
        },
        error: (err) => {
          console.error('Error al actualizar estado:', err);
          this.mostrarAviso(
            'Error al actualizar el estado del pedido',
            'Error',
            'error'
          );
        }
      });
  }

  // ============================================
  // MENÚ Y NAVEGACIÓN
  // ============================================
  toggleTema(): void {
    this.temaOscuro.set(!this.temaOscuro());
  }

  toggleMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  seleccionarOpcion(opcion: string): void {
    this.opcionSeleccionada.set(opcion);
    this.menuAbierto.set(false);

    const rutas: { [key: string]: string } = {
      'carta': '/mesero/carta',
      'mesas': '/mesero/mesas',
      'pedidos': '/mesero/pedidos',
      'precios': '/mesero/precios',
      'ventas': '/mesero/ventas',
      'tickets': '/mesero/tickets',
      'dashboard': '/mesero/dashboard'
    };

    const ruta = rutas[opcion];
    if (ruta) {
      this.router.navigate([ruta]);
    }
  }

  // ============================================
  // MODALES
  // ============================================
  abrirModalNuevoPedido(): void {
    this.itemsPedido.set([]);
    this.clienteSeleccionado.set(null);
    this.busquedaCliente.set('');
    this.nuevoCliente = { nombre: '', apellido: '', dni: '', telefono: '', email: '' };
    this.clientesEncontrados.set([]);
    this.tipoEntrega.set('local');
    this.mostrarModalPedido.set(true);
  }

  cerrarModal(): void {
    this.mostrarModalPedido.set(false);
    this.mostrarModalProductos.set(false);
  }

  // ============================================
  // CLIENTES
  // ============================================
  buscarClientes(): void {
    const termino = this.busquedaCliente().toLowerCase().trim();
    if (!termino) {
      this.clientesEncontrados.set([]);
      return;
    }

    const encontrados = this.clientes().filter((c: any) =>
      c.nombre?.toLowerCase().includes(termino) ||
      (c.dni && c.dni.includes(termino))
    );
    this.clientesEncontrados.set(encontrados.slice(0, 5));
  }

  seleccionarCliente(cliente: any): void {
    this.clienteSeleccionado.set(cliente);
    this.busquedaCliente.set(cliente.nombre + ' ' + (cliente.apellido || ''));
    this.clientesEncontrados.set([]);
  }

  limpiarCliente(): void {
    this.clienteSeleccionado.set(null);
    this.busquedaCliente.set('');
  }

  // ============================================
  // AGREGAR PRODUCTOS
  // ============================================
  abrirModalProductos(): void {
    if (!this.clienteSeleccionado() && !this.nuevoCliente.nombre) {
      this.mostrarAviso(
        'Primero seleccione o agregue un cliente',
        'Cliente requerido',
        'warning'
      );
      return;
    }
    this.productoSeleccionado.set(null);
    this.cantidadProducto.set(1);
    this.mostrarModalProductos.set(true);
  }

  seleccionarProducto(producto: any): void {
    this.productoSeleccionado.set(producto);
    this.cantidadProducto.set(1);
  }

  agregarProductoAlPedido(): void {
    const producto = this.productoSeleccionado();
    if (!producto) return;

    const cantidad = this.cantidadProducto();
    const itemsActuales = this.itemsPedido();
    const itemExistente = itemsActuales.find((i: any) => i.id === producto.id);
    const precio = typeof producto.precio === 'string' ? parseFloat(producto.precio) : producto.precio;

    if (itemExistente) {
      itemExistente.cantidad += cantidad;
      itemExistente.subtotal = itemExistente.precio * itemExistente.cantidad;
      this.itemsPedido.set([...itemsActuales]);
    } else {
      this.itemsPedido.update((items: any[]) => [...items, {
        id: producto.id,
        nombre: producto.nombre,
        precio: precio,
        cantidad: cantidad,
        subtotal: precio * cantidad
      }]);
    }

    this.productoSeleccionado.set(null);
    this.cantidadProducto.set(1);
    this.mostrarModalProductos.set(false);
  }

  eliminarItemPedido(index: number): void {
    this.itemsPedido.update((items: any[]) => items.filter((_: any, i: number) => i !== index));
  }

  actualizarCantidad(index: number, cantidad: number): void {
    if (cantidad < 1) {
      this.eliminarItemPedido(index);
      return;
    }
    const items = this.itemsPedido();
    items[index].cantidad = cantidad;
    items[index].subtotal = items[index].precio * cantidad;
    this.itemsPedido.set([...items]);
  }

  // ============================================
  // GUARDAR PEDIDO
  // ============================================
  guardarPedido(): void {
    if (this.guardandoPedido()) return;

    if (this.itemsPedido().length === 0) {
      this.mostrarAviso(
        'Agregue al menos un producto al pedido',
        'Pedido vacío',
        'warning'
      );
      return;
    }

    // ✅ Validar nuevo cliente si se está creando uno
    if (!this.clienteSeleccionado() && this.nuevoCliente.nombre) {
      const nombre = (this.nuevoCliente.nombre || '').trim();
      const dni = (this.nuevoCliente.dni || '').trim();
      const telefono = (this.nuevoCliente.telefono || '').trim();
      const email = (this.nuevoCliente.email || '').trim();

      if (nombre.length < 2) {
        this.mostrarAviso('El nombre debe tener al menos 2 caracteres', 'Nombre inválido', 'warning');
        return;
      }

      if (dni && dni.length !== 8) {
        this.mostrarAviso('El DNI debe tener exactamente 8 dígitos', 'DNI inválido', 'warning');
        return;
      }

      if (telefono && (telefono.length < 7 || telefono.length > 9)) {
        this.mostrarAviso('El teléfono debe tener entre 7 y 9 dígitos', 'Teléfono inválido', 'warning');
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.mostrarAviso('El correo electrónico no es válido', 'Email inválido', 'warning');
        return;
      }

      // Asignar valores limpios
      this.nuevoCliente.nombre = nombre;
      this.nuevoCliente.dni = dni;
      this.nuevoCliente.telefono = telefono;
      this.nuevoCliente.email = email;
    }

    const nombreCliente = this.clienteSeleccionado()?.nombre || this.nuevoCliente.nombre;
    if (!nombreCliente) {
      this.mostrarAviso(
        'Por favor seleccione o agregue un cliente',
        'Cliente requerido',
        'warning'
      );
      return;
    }

    let subtotal = 0;
    const itemsConPrecio = this.itemsPedido().map((item: any) => {
      const precio = typeof item.precio === 'string' ? parseFloat(item.precio) : Number(item.precio);
      const cantidad = typeof item.cantidad === 'string' ? parseInt(item.cantidad) : Number(item.cantidad);
      const subtotalItem = precio * cantidad;
      subtotal += subtotalItem;

      return {
        id: Number(item.id),
        nombre: String(item.nombre).trim(),
        precio: Number(precio),
        cantidad: Number(cantidad),
        subtotal: Number(subtotalItem)
      };
    });

    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const pedidoData: any = {
      usuario_id: this.usuario().id,
      cliente_id: this.clienteSeleccionado()?.id || null,
      cliente_nombre: nombreCliente,
      items: itemsConPrecio,
      subtotal: subtotal,
      igv: igv,
      total: total,
      tipo: 'local',
      tipo_entrega: this.tipoEntrega(),
      observaciones: '',
      pagado: 0
    };

    this.guardandoPedido.set(true);
    this.loading.set(true);

    if (!this.clienteSeleccionado() && this.nuevoCliente.nombre) {
      const nuevoClienteData = {
        nombre: this.nuevoCliente.nombre,
        apellido: this.nuevoCliente.apellido,
        dni: this.nuevoCliente.dni,
        telefono: this.nuevoCliente.telefono,
        email: this.nuevoCliente.email
      };

      this.clienteService.crearCliente(nuevoClienteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (clienteCreado: any) => {
            pedidoData.cliente_id = clienteCreado.id;
            pedidoData.cliente_nombre = clienteCreado.nombre || nombreCliente;
            this.crearPedido(pedidoData);
          },
          error: (err: any) => {
            console.error('Error al crear cliente:', err);
            this.loading.set(false);
            this.guardandoPedido.set(false);
            this.mostrarAviso(
              'Error al crear el cliente. Intente nuevamente.',
              'Error',
              'error'
            );
          }
        });
    } else {
      this.crearPedido(pedidoData);
    }
  }

  crearPedido(pedidoData: any): void {
    this.pedidoService.crearPedido(pedidoData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Pedido creado:', response);
          this.loading.set(false);
          this.guardandoPedido.set(false);
          this.cerrarModal();

          this.pedidoCreado.set(response.pedido || response);
          this.mensajeExito.set(`Pedido #${response.pedido?.id || 'creado'} correctamente`);
          this.mostrarModalExito.set(true);

          setTimeout(() => {
            this.recargarDatos();
          }, 500);
        },
        error: (err: any) => {
          console.error('Error al crear pedido:', err);
          this.loading.set(false);
          this.guardandoPedido.set(false);
          this.mostrarAviso(
            'Error al crear pedido: ' + (err.error?.detalle || err.message || 'Intente nuevamente'),
            'Error',
            'error'
          );
        }
      });
  }

  cerrarModalExito(): void {
    this.mostrarModalExito.set(false);
    this.pedidoCreado.set(null);
    this.mensajeExito.set('');
  }

  // ============================================
  // NAVEGACIÓN POR RUTAS
  // ============================================
  irCarta(): void {
    this.router.navigate(['/mesero/carta']);
  }

  irMesas(): void {
    this.router.navigate(['/mesero/mesas']);
  }

  irPedidos(): void {
    this.router.navigate(['/mesero/pedidos']);
  }

  irPrecios(): void {
    this.router.navigate(['/mesero/precios']);
  }

  irVentas(): void {
    this.router.navigate(['/mesero/ventas']);
  }

  irTicket(): void {
    this.router.navigate(['/mesero/tickets']);
  }

  irDashboard(): void {
    this.router.navigate(['/mesero/dashboard']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-mesero']);
  }
}