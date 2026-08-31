// pedidos-mesero.component.ts
import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-pedidos-mesero',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './pedidos-mesero.component.html',
  styleUrls: ['./pedidos-mesero.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class PedidosMeseroComponent implements OnInit {
  private authService = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private productoService = inject(ProductoService);
  private clienteService = inject(ClienteService);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);

  // Estados
  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');
  loading = signal<boolean>(true);
  cargandoProductos = signal<boolean>(false);

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

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }
    this.cargarDatos();
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================
  cargarDatos(): void {
    this.loading.set(true);
    
    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias: any[]) => {
        this.categorias.set(categorias);
        if (categorias.length > 0) {
          this.categoriaSeleccionada.set(categorias[0].id);
          this.cargarProductos(categorias[0].id);
        }
      },
      error: (err: any) => console.error('Error al cargar categorías:', err)
    });

    this.pedidoService.obtenerPedidos().subscribe({
      next: (pedidos: any[]) => {
        this.pedidos.set(pedidos);
        this.filtrarPedidosPorTipo();
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error al cargar pedidos:', err);
        this.loading.set(false);
      }
    });

    this.clienteService.obtenerClientes().subscribe({
      next: (clientes: any[]) => {
        this.clientes.set(clientes);
      },
      error: (err: any) => console.error('Error al cargar clientes:', err)
    });
  }

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

  cargarProductos(categoriaId: number): void {
    this.cargandoProductos.set(true);
    this.categoriaSeleccionada.set(categoriaId);
    
    this.productoService.obtenerPorCategoria(categoriaId).subscribe({
      next: (productos: any[]) => {
        this.productos.set(productos);
        this.productosFiltrados.set(productos);
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
  // MÉTODOS PARA ESTADOS DE PEDIDOS
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

  getEstadoIcono(estado: string): string {
    const iconos: any = {
      'pendiente': '⏳',
      'preparando': '🔪',
      'listo': '✅',
      'entregado': '📦',
      'cancelado': '❌'
    };
    return iconos[estado] || '📋';
  }

  getTipoEntregaIcono(tipo: string): string {
    const iconos: any = {
      'local': '🏠',
      'delivery': '🛵',
      'paraLlevar': '📦',
      'motorizada': '🛵'
    };
    return iconos[tipo] || '🏠';
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

  verDetalle(id: number): void {
    console.log(`📋 Ver detalle del pedido #${id}`);
    alert(`📋 Ver detalle del pedido #${id}`);
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
      c.nombre.toLowerCase().includes(termino) || 
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
      alert('Primero seleccione o agregue un cliente');
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

    if (itemExistente) {
      itemExistente.cantidad += cantidad;
      itemExistente.subtotal = itemExistente.precio * itemExistente.cantidad;
      this.itemsPedido.set([...itemsActuales]);
    } else {
      this.itemsPedido.update((items: any[]) => [...items, {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: cantidad,
        subtotal: producto.precio * cantidad
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
    if (this.itemsPedido().length === 0) {
      alert('Agregue al menos un producto al pedido');
      return;
    }

    const nombreCliente = this.clienteSeleccionado()?.nombre || this.nuevoCliente.nombre;
    if (!nombreCliente) {
      alert('Por favor seleccione o agregue un cliente');
      return;
    }

    let subtotal = 0;
    const itemsConPrecio = this.itemsPedido().map((item: any) => {
      const precio = typeof item.precio === 'string' ? parseFloat(item.precio) : item.precio;
      const cantidad = typeof item.cantidad === 'string' ? parseInt(item.cantidad) : item.cantidad;
      subtotal += precio * cantidad;
      return {
        id: item.id,
        nombre: item.nombre,
        precio: precio,
        cantidad: cantidad,
        subtotal: precio * cantidad
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
      observaciones: ''
    };

    if (!this.clienteSeleccionado() && this.nuevoCliente.nombre) {
      const nuevoClienteData = {
        nombre: this.nuevoCliente.nombre,
        apellido: this.nuevoCliente.apellido,
        dni: this.nuevoCliente.dni,
        telefono: this.nuevoCliente.telefono,
        email: this.nuevoCliente.email
      };

      this.clienteService.crearCliente(nuevoClienteData).subscribe({
        next: (clienteCreado: any) => {
          pedidoData.cliente_id = clienteCreado.id;
          pedidoData.cliente_nombre = clienteCreado.nombre;
          this.crearPedido(pedidoData);
        },
        error: (err: any) => {
          console.error('Error al crear cliente:', err);
          alert('Error al crear cliente');
        }
      });
    } else {
      this.crearPedido(pedidoData);
    }
  }

  crearPedido(pedidoData: any): void {
    this.pedidoService.crearPedido(pedidoData).subscribe({
      next: (response: any) => {
        alert('Pedido creado correctamente');
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (err: any) => {
        console.error('Error al crear pedido:', err);
        alert('Error al crear pedido: ' + (err.error?.detalle || err.message));
      }
    });
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================
  irCarta(): void {
    this.router.navigate(['/mesero/carta']);
  }

  irMesas(): void {
    this.router.navigate(['/mesero/mesas']);
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