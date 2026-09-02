// src/app/features/mesero/ticket/ticket.component.ts
import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss'],
  host: { 'class': 'mesero-mode' }
})
export class TicketComponent implements OnInit {
  private authService = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(true);
  menuAbierto = signal<boolean>(false);
  opcionSeleccionada = signal<string>('');
  loading = signal<boolean>(true);

  tickets = signal<any[]>([]);
  ticketSeleccionado = signal<any>(null);
  mostrarDetalleTicket = signal<boolean>(false);

  // Estadísticas
  totalTickets = computed(() => this.tickets().length);
  totalRecaudado = computed(() => {
    return this.tickets().reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
  });

  // Fecha actual para el ticket
  fechaActual = new Date().toLocaleString();

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'mesero') {
      this.router.navigate(['/login-mesero']);
      return;
    }
    console.log('👤 Mesero logueado:', this.usuario());
    this.cargarTickets();
  }

  // ✅ CARGAR TODOS LOS PEDIDOS ENTREGADOS DEL MESERO
  cargarTickets(): void {
  this.loading.set(true);
  console.log('📝 Cargando tickets para mesero ID:', this.usuario()?.id);

  // ✅ Usar el método que trae los pedidos entregados del mesero
  this.pedidoService.obtenerPedidosPagadosMesero().subscribe({
    next: (pedidos: any[]) => {
      console.log('📝 Pedidos entregados del mesero (RAW):', pedidos);
      console.log('📝 Cantidad de pedidos entregados:', pedidos?.length || 0);
      
      // Mostrar detalles de cada pedido
      if (pedidos && pedidos.length > 0) {
        pedidos.forEach((p: any, index: number) => {
          console.log(`📝 Pedido entregado ${index + 1}: ID=${p.id}, Tipo=${p.tipo_entrega}, Cliente=${p.cliente_nombre}, Total=${p.total}, Pagado=${p.pagado}`);
        });
      }
      
      const ticketsFormateados = pedidos.map((p: any) => {
        let items = p.items;
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            items = [];
          }
        }

        const totalItems = items?.length || 0;
        
        return {
          id: p.id,
          cliente: p.cliente_nombre_real || p.cliente_nombre || 'Cliente',
          items: items || [],
          totalItems: totalItems,
          total: parseFloat(p.total) || 0,
          subtotal: parseFloat(p.subtotal) || 0,
          igv: parseFloat(p.igv) || 0,
          fecha: p.fecha_pago || p.created_at,
          tipo_entrega: p.tipo_entrega || 'local',
          metodo_pago: p.metodo_pago || 'efectivo',
          estado: p.estado || 'entregado',
          usuario_nombre: p.usuario_nombre || 'Desconocido',
          observaciones: p.observaciones || '',
          mesa: p.mesa_id || null,
          pagado: p.pagado || 0
        };
      });

      console.log('📝 Tickets formateados:', ticketsFormateados);
      console.log('📝 Cantidad de tickets:', ticketsFormateados.length);

      // Ordenar por fecha descendente (más reciente primero)
      ticketsFormateados.sort((a: any, b: any) => {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });

      this.tickets.set(ticketsFormateados);
      this.loading.set(false);
    },
    error: (err: any) => {
      console.error('Error al cargar tickets:', err);
      this.loading.set(false);
    }
  });
  }

  // ✅ Ver detalle del ticket
  verTicket(ticket: any): void {
    console.log('📋 Ver ticket:', ticket);
    this.ticketSeleccionado.set(ticket);
    this.mostrarDetalleTicket.set(true);
  }

  // ✅ Cerrar detalle
  cerrarDetalle(): void {
    this.mostrarDetalleTicket.set(false);
    this.ticketSeleccionado.set(null);
  }

  // ✅ Imprimir ticket
  imprimirTicket(): void {
    const ticket = this.ticketSeleccionado();
    if (!ticket) return;

    const contenido = this.generarContenidoTicket(ticket);
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(`
        <html>
          <head>
            <title>Ticket #${ticket.id}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                max-width: 300px;
                margin: 0 auto;
                padding: 20px;
                background: #fff;
                color: #333;
              }
              .header {
                text-align: center;
                border-bottom: 2px dashed #333;
                padding-bottom: 10px;
                margin-bottom: 10px;
              }
              .header h1 {
                font-size: 18px;
                margin: 0;
              }
              .header p {
                font-size: 11px;
                margin: 4px 0;
                color: #666;
              }
              .info {
                font-size: 12px;
                margin-bottom: 10px;
              }
              .info-line {
                display: flex;
                justify-content: space-between;
                padding: 2px 0;
              }
              table {
                width: 100%;
                font-size: 12px;
                border-collapse: collapse;
                margin: 10px 0;
              }
              th {
                text-align: left;
                border-bottom: 1px dashed #333;
                padding: 4px 0;
              }
              td {
                padding: 3px 0;
              }
              .text-right {
                text-align: right;
              }
              .total-line {
                border-top: 2px dashed #333;
                padding-top: 8px;
                margin-top: 8px;
                font-weight: bold;
                font-size: 14px;
              }
              .footer {
                text-align: center;
                font-size: 11px;
                color: #666;
                border-top: 2px dashed #333;
                padding-top: 10px;
                margin-top: 10px;
              }
              .metodo-pago {
                background: #f0f0f0;
                padding: 4px 8px;
                border-radius: 4px;
                display: inline-block;
                font-size: 11px;
              }
              .observaciones {
                font-style: italic;
                color: #666;
                font-size: 11px;
                margin-top: 6px;
                padding: 6px;
                background: #f9f9f9;
                border-radius: 4px;
              }
              @media print {
                body { padding: 10px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${contenido}
            <div class="footer">
              <p>¡Gracias por tu preferencia!</p>
              <p>Doña Yacki - Sabor que enamora</p>
              <p style="font-size:10px;color:#999;">Ticket generado el ${new Date().toLocaleString()}</p>
            </div>
            <div style="text-align:center;margin-top:10px;" class="no-print">
              <button onclick="window.print()" style="padding:8px 20px;background:#c5302a;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;">
                🖨️ Imprimir
              </button>
              <button onclick="window.close()" style="padding:8px 20px;background:#666;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin-left:8px;">
                ✕ Cerrar
              </button>
            </div>
          </body>
        </html>
      `);
      ventana.document.close();
    }
  }

  // ✅ Generar contenido del ticket
  generarContenidoTicket(ticket: any): string {
    const itemsHtml = ticket.items.map((item: any, index: number) => {
      const nombre = item.nombre || 'Producto';
      const cantidad = item.cantidad || 1;
      const precio = parseFloat(item.precio) || 0;
      const subtotal = precio * cantidad;
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${nombre}</td>
          <td class="text-right">${cantidad}</td>
          <td class="text-right">S/ ${precio.toFixed(2)}</td>
          <td class="text-right">S/ ${subtotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const tipoEntregaLabel = ticket.tipo_entrega === 'delivery' || ticket.tipo_entrega === 'motorizada' 
      ? 'Motorizado' 
      : 'Local';

    const metodoPagoLabels: Record<string, string> = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'yape': 'Yape',
      'plin': 'Plin',
      'transferencia': 'Transferencia'
    };
    const metodoPagoLabel = metodoPagoLabels[ticket.metodo_pago] || ticket.metodo_pago;

    return `
      <div class="header">
        <h1>🍗 Doña Yacki</h1>
        <p>Sabor que enamora</p>
        <p style="font-size:10px;">Mz M2 Lt 33, Jardines de Chillón</p>
        <p style="font-size:10px;">Tel: 902 458 936</p>
      </div>

      <div class="info">
        <div class="info-line">
          <span><strong>Ticket #${ticket.id}</strong></span>
          <span>${new Date(ticket.fecha).toLocaleString()}</span>
        </div>
        <div class="info-line">
          <span><strong>Cliente:</strong> ${ticket.cliente}</span>
          <span><strong>Mesa:</strong> ${ticket.mesa || '--'}</span>
        </div>
        <div class="info-line">
          <span><strong>Mesero:</strong> ${ticket.usuario_nombre}</span>
          <span><strong>Tipo:</strong> ${tipoEntregaLabel}</span>
        </div>
        <div class="info-line">
          <span><strong>Método:</strong> <span class="metodo-pago">${metodoPagoLabel}</span></span>
        </div>
        ${ticket.observaciones ? `
          <div class="observaciones">
            📝 ${ticket.observaciones}
          </div>
        ` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Producto</th>
            <th class="text-right">Cant</th>
            <th class="text-right">Precio</th>
            <th class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align:right;font-size:13px;">
        <div class="info-line">
          <span>Subtotal</span>
          <span>S/ ${ticket.subtotal.toFixed(2)}</span>
        </div>
        <div class="info-line">
          <span>IGV (18%)</span>
          <span>S/ ${ticket.igv.toFixed(2)}</span>
        </div>
        <div class="total-line">
          <span><strong>TOTAL</strong></span>
          <span><strong>S/ ${ticket.total.toFixed(2)}</strong></span>
        </div>
        <div style="font-size:11px;color:#666;margin-top:4px;">
          Total Items: ${ticket.totalItems}
        </div>
      </div>
    `;
  }

  // ✅ MÉTODOS DEL MENÚ
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

  // ✅ NAVEGACIÓN
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