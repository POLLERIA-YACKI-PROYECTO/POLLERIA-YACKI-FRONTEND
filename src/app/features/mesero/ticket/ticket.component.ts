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

    this.pedidoService.obtenerPedidosPagadosMesero().subscribe({
      next: (pedidos: any[]) => {
        console.log('📝 Pedidos entregados del mesero (RAW):', pedidos);
        console.log('📝 Cantidad de pedidos entregados:', pedidos?.length || 0);
        
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
            usuario_nombre: p.usuario_nombre_completo || p.usuario_nombre || 'Mesero',
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
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Courier New', monospace;
                max-width: 300px;
                margin: 0 auto;
                padding: 20px;
                background: #fff;
                color: #333;
                font-size: 12px;
                line-height: 1.4;
              }
              .header {
                text-align: center;
                border-bottom: 2px dashed #333;
                padding-bottom: 10px;
                margin-bottom: 10px;
              }
              .header h1 {
                font-size: 20px;
                margin: 0;
                color: #c5302a;
              }
              .header .slogan {
                font-size: 11px;
                color: #666;
                margin: 2px 0;
              }
              .header .info-empresa {
                font-size: 10px;
                color: #888;
                margin: 2px 0;
              }
              .info {
                font-size: 11px;
                margin-bottom: 10px;
              }
              .info-line {
                display: flex;
                justify-content: space-between;
                padding: 2px 0;
              }
              .info-line strong {
                color: #222;
              }
              .separador {
                text-align: center;
                color: #ccc;
                margin: 6px 0;
                letter-spacing: 2px;
                font-size: 10px;
              }
              table {
                width: 100%;
                font-size: 11px;
                border-collapse: collapse;
                margin: 6px 0;
              }
              th {
                text-align: left;
                border-bottom: 1px dashed #333;
                padding: 4px 0;
                font-size: 10px;
                color: #666;
              }
              td {
                padding: 3px 0;
              }
              .text-right {
                text-align: right;
              }
              .total-line {
                display: flex;
                justify-content: space-between;
                padding: 2px 0;
              }
              .total-final {
                border-top: 2px dashed #333;
                padding-top: 8px;
                margin-top: 4px;
                font-size: 14px;
                font-weight: bold;
              }
              .total-final span:last-child {
                color: #c5302a;
              }
              .footer {
                text-align: center;
                font-size: 11px;
                color: #666;
                border-top: 2px dashed #333;
                padding-top: 10px;
                margin-top: 10px;
              }
              .footer p {
                margin: 2px 0;
              }
              .metodo-pago {
                background: #f0f0f0;
                padding: 2px 8px;
                border-radius: 4px;
                display: inline-block;
                font-size: 10px;
                font-weight: bold;
              }
              .observaciones {
                font-style: italic;
                color: #666;
                font-size: 10px;
                margin-top: 4px;
                padding: 4px 8px;
                background: #f9f9f9;
                border-radius: 4px;
                border-left: 3px solid #c5302a;
              }
              .total-items {
                font-size: 10px;
                color: #888;
                margin-top: 4px;
                text-align: right;
              }
              .no-print { display: none; }
              @media print {
                body { padding: 10px; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${contenido}
            <div class="footer">
              <p>¡Gracias por tu preferencia!</p>
              <p style="font-size:10px;color:#999;">Doña Yacki - Sabor que enamora</p>
              <p style="font-size:9px;color:#bbb;">Ticket generado el ${new Date().toLocaleString()}</p>
            </div>
            <div style="text-align:center;margin-top:12px;" class="no-print">
              <button onclick="window.print()" style="padding:8px 20px;background:#c5302a;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin:4px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px;">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M18 9H6"/>
                  <rect x="6" y="14" width="12" height="8"/>
                  <line x1="10" y1="17" x2="14" y2="17"/>
                  <line x1="10" y1="19" x2="14" y2="19"/>
                  <rect x="8" y="11" width="8" height="2"/>
                </svg>
                Imprimir
              </button>
              <button onclick="window.close()" style="padding:8px 20px;background:#666;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin:4px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px;">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Cerrar
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

    const fechaFormateada = ticket.fecha ? new Date(ticket.fecha).toLocaleString() : '--';

    return `
      <div class="header">
        <h1>Doña Yacki</h1>
        <p class="slogan">Sabor que enamora</p>
        <p class="info-empresa">Mz M2 Lt 33, Jardines de Chillón</p>
        <p class="info-empresa">Tel: 902 458 936</p>
      </div>

      <div class="info">
        <div class="info-line">
          <span><strong>Ticket #${ticket.id}</strong></span>
          <span>${fechaFormateada}</span>
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
            ${ticket.observaciones}
          </div>
        ` : ''}
      </div>

      <div class="separador">─────────────────</div>

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

      <div class="separador">─────────────────</div>

      <div style="text-align:right;">
        <div class="total-line">
          <span>Subtotal</span>
          <span>S/ ${ticket.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-line">
          <span>IGV (18%)</span>
          <span>S/ ${ticket.igv.toFixed(2)}</span>
        </div>
        <div class="total-line total-final">
          <span><strong>TOTAL</strong></span>
          <span><strong>S/ ${ticket.total.toFixed(2)}</strong></span>
        </div>
        <div class="total-items">
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