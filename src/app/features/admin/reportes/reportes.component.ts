// reportes.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { PedidoService } from '../../../core/services/pedido.service';
import { VentaService } from '../../../core/services/venta.service';
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
  private ventaService = inject(VentaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  reporteSeleccionado = signal('ventas');
  menuAbierto = signal(false);
  fechaInicio = signal('');
  fechaFin = signal('');
  
  pedidos = signal<any[]>([]);
  ventas = signal<any[]>([]);
  datosReporte = signal<any[]>([]);
  resumenReporte = signal<any>({});
  usuario = signal<any>(null);

  ventasLocal = signal<any[]>([]);
  ventasDelivery = signal<any[]>([]);
  pedidosPendientes = signal<any[]>([]);

  // ✅ Bandera para evitar recargas innecesarias
  private datosCargados = false;

  reportes = signal([
    { id: 'ventas', nombre: 'Reporte de Ventas' },
    { id: 'pendientes', nombre: 'Pedidos Pendientes' },
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
    
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    this.fechaInicio.set(sevenDaysAgo.toISOString().split('T')[0]);
    this.fechaFin.set(today.toISOString().split('T')[0]);
    
    this.cargarDatos();
  }

  toggleMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  seleccionarReporte(id: string): void {
    this.reporteSeleccionado.set(id);
    this.menuAbierto.set(false);
    this.generarReporte();
  }

  // ============================================
  // CARGA DE DATOS CON AUTO-ACTUALIZACIÓN
  // ============================================
  cargarDatos(): void {
    this.loading.set(true);
    
    let solicitudesCompletadas = 0;
    const totalSolicitudes = 3;
    const verificarFinalizado = () => {
      solicitudesCompletadas++;
      if (solicitudesCompletadas >= totalSolicitudes) {
        this.generarReporte();
        this.loading.set(false);
        this.datosCargados = true;
      }
    };

    // Cargar pedidos
    this.pedidoService.obtenerPedidos().subscribe({
      next: (pedidos: any[]) => {
        this.pedidos.set(pedidos || []);
        verificarFinalizado();
      },
      error: (err: any) => {
        console.error('Error al cargar pedidos:', err);
        verificarFinalizado();
      }
    });

    // Cargar ventas
    this.ventaService.obtenerVentas().subscribe({
      next: (ventas: any[]) => {
        const ventasArray = ventas || [];
        this.ventas.set(ventasArray);
        const local = ventasArray.filter((v: any) => v.tipo_entrega === 'local' || v.tipo_entrega === 'paraLlevar');
        const delivery = ventasArray.filter((v: any) => v.tipo_entrega === 'delivery' || v.tipo_entrega === 'motorizada');
        this.ventasLocal.set(local);
        this.ventasDelivery.set(delivery);
        verificarFinalizado();
      },
      error: (err: any) => {
        console.error('Error al cargar ventas:', err);
        verificarFinalizado();
      }
    });

    // Cargar pedidos pendientes
    this.pedidoService.obtenerPedidosPendientes().subscribe({
      next: (pendientes: any[]) => {
        this.pedidosPendientes.set(pendientes || []);
        verificarFinalizado();
      },
      error: (err: any) => {
        console.error('Error al cargar pedidos pendientes:', err);
        verificarFinalizado();
      }
    });
  }

  // ============================================
  // GENERAR REPORTE
  // ============================================
  generarReporte(): void {
    try {
      const tipo = this.reporteSeleccionado();
      const fechaInicio = this.fechaInicio();
      const fechaFin = this.fechaFin();
      
      let datos: any[] = [];
      let resumen: any = {};

      switch(tipo) {
        case 'ventas':
          const ventasFiltradas = this.ventas().filter((v: any) => {
            const fecha = new Date(v.fecha_venta).toISOString().split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin;
          });
          
          datos = ventasFiltradas.map((v: any) => ({
            id: v.id,
            fecha: v.fecha_venta ? new Date(v.fecha_venta).toLocaleString() : '--',
            cliente: v.cliente_nombre || v.cliente || 'Consumidor Final',
            items: v.items?.length || 0,
            usuario: v.usuario_nombre || 'Desconocido',
            total: parseFloat(v.total) || 0,
            tipo_entrega: v.tipo_entrega || 'local',
            estado: 'Pagado'
          }));
          
          const totalVentas = datos.length;
          const totalRecaudado = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas,
            totalRecaudado,
            promedio: totalVentas > 0 ? totalRecaudado / totalVentas : 0
          };
          break;

        case 'pendientes':
          const pendientesFiltrados = this.pedidosPendientes().filter((p: any) => {
            const fecha = new Date(p.created_at).toISOString().split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin;
          });
          
          datos = pendientesFiltrados.map((p: any) => ({
            id: p.id,
            fecha: p.created_at ? new Date(p.created_at).toLocaleString() : '--',
            cliente: p.cliente_nombre || p.cliente_nombre_real || 'Consumidor Final',
            items: p.items?.length || 0,
            usuario: p.usuario_nombre || 'Desconocido',
            total: parseFloat(p.total) || 0,
            tipo_entrega: p.tipo_entrega || 'local',
            estado: p.estado || 'pendiente'
          }));
          
          resumen = {
            totalVentas: datos.length,
            totalRecaudado: datos.reduce((sum, d) => sum + d.total, 0),
            promedio: datos.length > 0 ? datos.reduce((sum, d) => sum + d.total, 0) / datos.length : 0
          };
          break;

        case 'diario':
          const ventasDiarias = this.ventas().filter((v: any) => {
            const fecha = new Date(v.fecha_venta).toISOString().split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin;
          });
          
          const porDia: any = {};
          ventasDiarias.forEach((v: any) => {
            const fecha = v.fecha_venta ? new Date(v.fecha_venta).toISOString().split('T')[0] : '--';
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
            porDia[fecha].items += v.items?.length || 0;
            porDia[fecha].total += parseFloat(v.total) || 0;
          });
          datos = Object.values(porDia);
          
          const totalRecaudadoDiario = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: datos.length,
            totalRecaudado: totalRecaudadoDiario,
            promedio: datos.length > 0 ? totalRecaudadoDiario / datos.length : 0
          };
          break;

        case 'motorizada':
          const motorizadas = this.ventas().filter((v: any) => {
            const fecha = new Date(v.fecha_venta).toISOString().split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin && 
                   (v.tipo_entrega === 'delivery' || v.tipo_entrega === 'motorizada');
          });
          
          datos = motorizadas.map((v: any) => ({
            id: v.id,
            fecha: v.fecha_venta ? new Date(v.fecha_venta).toLocaleString() : '--',
            cliente: v.cliente_nombre || v.cliente || 'Delivery',
            items: v.items?.length || 0,
            usuario: 'Motorizado',
            total: parseFloat(v.total) || 0,
            tipo_entrega: v.tipo_entrega || 'delivery',
            estado: 'Pagado'
          }));
          
          const totalMotorizados = datos.length;
          const totalRecaudadoMotorizado = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: totalMotorizados,
            totalRecaudado: totalRecaudadoMotorizado,
            promedio: totalMotorizados > 0 ? totalRecaudadoMotorizado / totalMotorizados : 0
          };
          break;

        // ... otros casos (cajero, totales, pago, mozo, cliente)
        default:
          datos = [];
      }
      
      this.datosReporte.set(datos);
      this.resumenReporte.set(resumen);
      
    } catch (error) {
      console.error('Error al generar reporte:', error);
      this.datosReporte.set([]);
      this.resumenReporte.set({});
    }
  }

  // ============================================
  // MÉTODOS DE UTILIDAD
  // ============================================
  getTipoEntregaLabel(tipo: string): string {
    const labels: any = {
      'local': 'Local',
      'delivery': 'Motorizado',
      'paraLlevar': 'Para Llevar',
      'motorizada': 'Motorizado'
    };
    return labels[tipo] || 'Local';
  }

  getTipoEntregaClass(tipo: string): string {
    const clases: any = {
      'local': 'tipo-local',
      'delivery': 'tipo-delivery',
      'paraLlevar': 'tipo-local',
      'motorizada': 'tipo-delivery'
    };
    return clases[tipo] || 'tipo-local';
  }

  getEstadoClass(estado: string): string {
    const clases: any = {
      'pendiente': 'estado-pendiente',
      'preparando': 'estado-preparando',
      'listo': 'estado-listo',
      'entregado': 'estado-pagado',
      'Pagado': 'estado-pagado',
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
      'Pagado': 'Pagado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  }

  calcularTotal(): number {
    return this.datosReporte().reduce((sum, item) => sum + (item.total || 0), 0);
  }

  calcularItems(): number {
    return this.datosReporte().reduce((sum, item) => sum + (item.items || 0), 0);
  }

  // ============================================
  // EXPORTAR A PDF
  // ============================================
  exportarPDF(): void {
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
            <th>Tipo</th>
            <th>Total</th>
            <th>Estado</th>
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
          <td>${this.getTipoEntregaLabel(item.tipo_entrega) || 'Local'}</td>
          <td>S/ ${(item.total || 0).toFixed(2)}</td>
          <td>${item.estado || 'Pagado'}</td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
        <tfoot>
          <tr class="total">
            <td colspan="6"><strong>Total General</strong></td>
            <td colspan="2"><strong>S/ ${this.calcularTotal().toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>
    `;
    
    return html;
  }

  // ============================================
  // EXPORTAR A EXCEL
  // ============================================
  exportarExcel(): void {
    alert('📊 Exportando a Excel...');
  }

  // ✅ Método para recargar manualmente (si es necesario)
  recargarDatos(): void {
    this.cargarDatos();
  }
}