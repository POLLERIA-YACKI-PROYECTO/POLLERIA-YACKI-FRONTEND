// reportes.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { PedidoService } from '../../../core/services/pedido.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  reporteSeleccionado = signal('ventas');
  menuAbierto = signal(false);
  fechaInicio = signal('');
  fechaFin = signal('');
  
  pedidos = signal<any[]>([]);
  datosReporte = signal<any[]>([]);
  resumenReporte = signal<any>({});
  usuario = signal<any>(null);

  reportes = signal([
    { id: 'ventas', nombre: 'Reporte de Ventas' },
    { id: 'diario', nombre: 'Venta Diaria' },
    { id: 'cajero', nombre: 'Diario de Cajero' },
    { id: 'totales', nombre: 'Ventas Totales' },
    { id: 'pago', nombre: 'Forma de Pago' },
    { id: 'mozo', nombre: 'Ventas por Mozo' },
    { id: 'cliente', nombre: 'Ventas por Cliente' },
    { id: 'motorizada', nombre: 'Venta Motorizada' }
  ]);

  nombreReporte = computed(() => {
    const found = this.reportes().find(r => r.id === this.reporteSeleccionado());
    return found ? found.nombre : 'Reporte';
  });

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    
    // Fechas por defecto (últimos 7 días)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    this.fechaInicio.set(sevenDaysAgo.toISOString().split('T')[0]);
    this.fechaFin.set(today.toISOString().split('T')[0]);
    
    this.cargarPedidos();
  }

  toggleMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  seleccionarReporte(id: string): void {
    this.reporteSeleccionado.set(id);
    this.menuAbierto.set(false);
    this.generarReporte();
  }

  cargarPedidos(): void {
    this.loading.set(true);
    
    this.pedidoService.obtenerPedidos().subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.generarReporte();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
        this.loading.set(false);
      }
    });
  }

  generarReporte(): void {
    this.loading.set(true);
    
    try {
      const tipo = this.reporteSeleccionado();
      const fechaInicio = this.fechaInicio();
      const fechaFin = this.fechaFin();
      
      // Filtrar pedidos por fecha
      let pedidosFiltrados = this.pedidos().filter(p => {
        const fecha = new Date(p.created_at).toISOString().split('T')[0];
        return fecha >= fechaInicio && fecha <= fechaFin;
      });

      let datos: any[] = [];
      let resumen: any = {};

      switch(tipo) {
        case 'ventas':
          // Reporte de ventas - todos los pedidos
          datos = pedidosFiltrados.map((p: any) => ({
            id: p.id,
            fecha: p.created_at ? new Date(p.created_at).toLocaleString() : '--',
            cliente: p.cliente_nombre || p.cliente_nombre_real || 'Consumidor Final',
            items: p.items?.length || 0,
            usuario: p.usuario_nombre || 'Desconocido',
            total: p.total || 0,
            estado: p.estado || 'pendiente'
          }));
          
          const totalVentas = datos.length;
          const totalRecaudado = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas,
            totalRecaudado,
            promedio: totalVentas > 0 ? totalRecaudado / totalVentas : 0
          };
          break;

        case 'diario':
          // Venta diaria - agrupar por día
          const porDia: any = {};
          pedidosFiltrados.forEach((p: any) => {
            const fecha = p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '--';
            if (!porDia[fecha]) {
              porDia[fecha] = {
                id: Object.keys(porDia).length + 1,
                fecha: fecha,
                cliente: 'Total del día',
                items: 0,
                usuario: 'Sistema',
                total: 0
              };
            }
            porDia[fecha].items += p.items?.length || 0;
            porDia[fecha].total += p.total || 0;
          });
          datos = Object.values(porDia);
          
          const totalRecaudadoDiario = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: datos.length,
            totalRecaudado: totalRecaudadoDiario,
            promedio: datos.length > 0 ? totalRecaudadoDiario / datos.length : 0
          };
          break;

        case 'cajero':
          // Diario de cajero - agrupar por usuario (cajero)
          const porUsuario: any = {};
          pedidosFiltrados.forEach((p: any) => {
            const usuario = p.usuario_nombre || 'Desconocido';
            if (!porUsuario[usuario]) {
              porUsuario[usuario] = {
                id: Object.keys(porUsuario).length + 1,
                fecha: 'Resumen',
                cliente: usuario,
                items: 0,
                usuario: usuario,
                total: 0
              };
            }
            porUsuario[usuario].items += p.items?.length || 0;
            porUsuario[usuario].total += p.total || 0;
          });
          datos = Object.values(porUsuario);
          
          const totalRecaudadoCajero = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: datos.length,
            totalRecaudado: totalRecaudadoCajero,
            promedio: datos.length > 0 ? totalRecaudadoCajero / datos.length : 0
          };
          break;

        case 'totales':
          // Ventas totales - resumen general
          const totalItems = pedidosFiltrados.reduce((sum, p) => sum + (p.items?.length || 0), 0);
          const totalGeneral = pedidosFiltrados.reduce((sum, p) => sum + (p.total || 0), 0);
          
          datos = [{
            id: 1,
            fecha: `${fechaInicio} - ${fechaFin}`,
            cliente: 'RESUMEN GENERAL',
            items: totalItems,
            usuario: 'Sistema',
            total: totalGeneral
          }];
          
          resumen = {
            totalVentas: pedidosFiltrados.length,
            totalRecaudado: totalGeneral,
            promedio: pedidosFiltrados.length > 0 ? totalGeneral / pedidosFiltrados.length : 0
          };
          break;

        case 'pago':
          // Forma de pago - agrupar por método de pago (por ahora mostramos por estado)
          const porEstado: any = {};
          pedidosFiltrados.forEach((p: any) => {
            const estado = p.estado || 'pendiente';
            if (!porEstado[estado]) {
              porEstado[estado] = {
                id: Object.keys(porEstado).length + 1,
                fecha: 'Resumen',
                cliente: estado === 'entregado' ? 'Pagado' : estado,
                items: 0,
                usuario: 'Sistema',
                total: 0
              };
            }
            porEstado[estado].items += p.items?.length || 0;
            porEstado[estado].total += p.total || 0;
          });
          datos = Object.values(porEstado);
          
          const totalRecaudadoPago = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: datos.length,
            totalRecaudado: totalRecaudadoPago,
            promedio: datos.length > 0 ? totalRecaudadoPago / datos.length : 0
          };
          break;

        case 'mozo':
          // Ventas por mozo - solo pedidos de meseros
          const porMozo: any = {};
          const pedidosMozo = pedidosFiltrados.filter(p => p.usuario_rol === 'mesero' || p.estado === 'entregado');
          pedidosMozo.forEach((p: any) => {
            const usuario = p.usuario_nombre || 'Desconocido';
            if (!porMozo[usuario]) {
              porMozo[usuario] = {
                id: Object.keys(porMozo).length + 1,
                fecha: 'Resumen',
                cliente: usuario,
                items: 0,
                usuario: usuario,
                total: 0
              };
            }
            porMozo[usuario].items += p.items?.length || 0;
            porMozo[usuario].total += p.total || 0;
          });
          datos = Object.values(porMozo);
          
          const totalRecaudadoMozo = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: datos.length,
            totalRecaudado: totalRecaudadoMozo,
            promedio: datos.length > 0 ? totalRecaudadoMozo / datos.length : 0
          };
          break;

        case 'cliente':
          // Ventas por cliente - agrupar por cliente
          const porCliente: any = {};
          pedidosFiltrados.forEach((p: any) => {
            const cliente = p.cliente_nombre || p.cliente_nombre_real || 'Consumidor Final';
            if (!porCliente[cliente]) {
              porCliente[cliente] = {
                id: Object.keys(porCliente).length + 1,
                fecha: 'Resumen',
                cliente: cliente,
                items: 0,
                usuario: 'Sistema',
                total: 0
              };
            }
            porCliente[cliente].items += p.items?.length || 0;
            porCliente[cliente].total += p.total || 0;
          });
          datos = Object.values(porCliente);
          
          const totalRecaudadoCliente = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: datos.length,
            totalRecaudado: totalRecaudadoCliente,
            promedio: datos.length > 0 ? totalRecaudadoCliente / datos.length : 0
          };
          break;

        case 'motorizada':
          // Venta motorizada - pedidos tipo delivery
          const pedidosMotorizados = pedidosFiltrados.filter(p => p.tipo === 'delivery' || p.tipo === 'motorizada');
          datos = pedidosMotorizados.map((p: any) => ({
            id: p.id,
            fecha: p.created_at ? new Date(p.created_at).toLocaleString() : '--',
            cliente: p.cliente_nombre || p.cliente_nombre_real || 'Delivery',
            items: p.items?.length || 0,
            usuario: 'Motorizado',
            total: p.total || 0
          }));
          
          const totalMotorizados = datos.length;
          const totalRecaudadoMotorizado = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: totalMotorizados,
            totalRecaudado: totalRecaudadoMotorizado,
            promedio: totalMotorizados > 0 ? totalRecaudadoMotorizado / totalMotorizados : 0
          };
          break;

        default:
          datos = [];
      }
      
      this.datosReporte.set(datos);
      this.resumenReporte.set(resumen);
      
    } catch (error) {
      console.error('Error al generar reporte:', error);
      this.datosReporte.set([]);
      this.resumenReporte.set({});
    } finally {
      this.loading.set(false);
    }
  }

  calcularTotal(): number {
    return this.datosReporte().reduce((sum, item) => sum + (item.total || 0), 0);
  }

  calcularItems(): number {
    return this.datosReporte().reduce((sum, item) => sum + (item.items || 0), 0);
  }

  getEstadoClass(estado: string): string {
    const clases: any = {
      'pendiente': 'estado-pendiente',
      'preparando': 'estado-preparando',
      'listo': 'estado-listo',
      'entregado': 'estado-pagado',
      'cancelado': 'estado-cancelado'
    };
    return clases[estado] || 'estado-pendiente';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      'pendiente': 'Pendiente',
      'preparando': 'Preparando',
      'listo': 'Listo',
      'entregado': 'Pagado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  }

  exportarPDF(): void {
    // Mantener la misma funcionalidad
    this.loading.set(true);
    
    setTimeout(() => {
      const contenido = this.generarContenidoReporte();
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(`
          <html>
            <head>
              <title>${this.nombreReporte()}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                h1 { color: #5e412f; border-bottom: 2px solid #ce8329; padding-bottom: 10px; }
                .resumen { background: #f5f0e8; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .resumen-item { display: inline-block; margin-right: 30px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #5e412f; color: #e9bd6e; padding: 10px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                .total { background: #f5f0e8; font-weight: bold; }
                .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
              </style>
            </head>
            <body>
              <h1>${this.nombreReporte()}</h1>
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Período:</strong> ${this.fechaInicio() || 'N/A'} - ${this.fechaFin() || 'N/A'}</p>
              ${this.generarResumenHTML()}
              ${contenido}
              <div class="footer">
                <p>Polleria Yacky - Sistema de Administración</p>
                <p>Reporte generado el ${new Date().toLocaleString()}</p>
              </div>
            </body>
          </html>
        `);
        ventana.document.close();
        ventana.print();
      }
      this.loading.set(false);
    }, 500);
  }

  generarResumenHTML(): string {
    const resumen = this.resumenReporte();
    if (!resumen.totalVentas && !resumen.totalRecaudado) return '';
    
    return `
      <div class="resumen">
        <div class="resumen-item">
          <strong>Total Ventas:</strong> ${resumen.totalVentas || 0}
        </div>
        <div class="resumen-item">
          <strong>Total Recaudado:</strong> S/ ${(resumen.totalRecaudado || 0).toFixed(2)}
        </div>
        <div class="resumen-item">
          <strong>Promedio:</strong> S/ ${(resumen.promedio || 0).toFixed(2)}
        </div>
      </div>
    `;
  }

  generarContenidoReporte(): string {
    if (this.datosReporte().length === 0) {
      return '<p style="text-align:center;color:#888;">No hay datos disponibles</p>';
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Items</th>
            <th>Usuario</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    this.datosReporte().forEach(item => {
      html += `
        <tr>
          <td>${item.id || '-'}</td>
          <td>${item.fecha || '-'}</td>
          <td>${item.cliente || '-'}</td>
          <td>${item.items || 0}</td>
          <td>${item.usuario || '-'}</td>
          <td>S/ ${(item.total || 0).toFixed(2)}</td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
        <tfoot>
          <tr class="total">
            <td colspan="5"><strong>Total General</strong></td>
            <td><strong>S/ ${this.calcularTotal().toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>
    `;
    
    return html;
  }

  exportarExcel(): void {
    alert('📊 Exportando a Excel...');
  }
}