// src/app/components/reportes/reportes.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReporteService } from '../../../core/services/reporte.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  loading = signal(false);
  reporteSeleccionado = signal('ventas');
  menuAbierto = signal(false);
  fechaInicio = signal('2026-01-01'); // Valor por defecto
  fechaFin = signal(new Date().toISOString().split('T')[0]); // Fecha actual
  
  datosReporte = signal<any[]>([]);
  resumenReporte = signal<any>({});

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

  private reporteService = inject(ReporteService);

  nombreReporte = computed(() => {
    const found = this.reportes().find(r => r.id === this.reporteSeleccionado());
    return found ? found.nombre : 'Reporte';
  });

  ngOnInit(): void {
    // Establecer fechas por defecto (últimos 7 días)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    this.fechaInicio.set(sevenDaysAgo.toISOString().split('T')[0]);
    this.fechaFin.set(today.toISOString().split('T')[0]);
    this.generarReporte();
  }

  toggleMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  seleccionarReporte(id: string): void {
    this.reporteSeleccionado.set(id);
    this.menuAbierto.set(false);
    this.generarReporte();
  }

  async generarReporte(): Promise<void> {
    this.loading.set(true);
    
    try {
      const tipo = this.reporteSeleccionado();
      const fechaInicio = this.fechaInicio();
      const fechaFin = this.fechaFin();

      let datos: any[] = [];
      let resumen: any = {};

      switch(tipo) {
        case 'ventas':
        case 'totales':
        case 'pago':
        case 'cliente':
        case 'motorizada':
          // Usar el endpoint de ventas
          const ventasData = await this.reporteService
            .getReporteVentas(fechaInicio, fechaFin)
            .toPromise();
          
          if (ventasData) {
            resumen = ventasData.resumen;
            
            // Transformar según el tipo de reporte
            switch(tipo) {
              case 'ventas':
                datos = ventasData.detalle.map((v: any) => ({
                  id: v.id,
                  fecha: v.fecha_venta || v.fecha,
                  cliente: v.cliente_nombre || 'Cliente General',
                  items: v.items?.length || 0,
                  usuario: v.usuario_nombre || 'Sistema',
                  total: v.total
                }));
                break;
                
              case 'totales':
                // Agrupar por fecha
                const agrupadoPorFecha: any = {};
                ventasData.detalle.forEach((v: any) => {
                  const fecha = v.fecha_venta || v.fecha;
                  if (!agrupadoPorFecha[fecha]) {
                    agrupadoPorFecha[fecha] = {
                      id: Object.keys(agrupadoPorFecha).length + 1,
                      fecha: fecha,
                      cliente: 'Total del día',
                      items: 0,
                      usuario: 'Sistema',
                      total: 0
                    };
                  }
                  agrupadoPorFecha[fecha].items += v.items?.length || 0;
                  agrupadoPorFecha[fecha].total += v.total;
                });
                datos = Object.values(agrupadoPorFecha);
                break;
                
              case 'pago':
                // Agrupar por método de pago
                const porPago: any = {};
                ventasData.detalle.forEach((v: any) => {
                  const metodo = v.metodo_pago || 'Otro';
                  if (!porPago[metodo]) {
                    porPago[metodo] = {
                      id: Object.keys(porPago).length + 1,
                      fecha: 'Resumen',
                      cliente: metodo,
                      items: 0,
                      usuario: 'Sistema',
                      total: 0
                    };
                  }
                  porPago[metodo].items += v.items?.length || 0;
                  porPago[metodo].total += v.total;
                });
                datos = Object.values(porPago);
                break;
                
              case 'cliente':
                // Agrupar por cliente
                const porCliente: any = {};
                ventasData.detalle.forEach((v: any) => {
                  const cliente = v.cliente_nombre || 'Cliente General';
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
                  porCliente[cliente].items += v.items?.length || 0;
                  porCliente[cliente].total += v.total;
                });
                datos = Object.values(porCliente);
                break;
                
              case 'motorizada':
                // Filtrar ventas motorizadas
                datos = ventasData.detalle
                  .filter((v: any) => v.tipo_entrega === 'motorizada' || v.motorizado_id)
                  .map((v: any) => ({
                    id: v.id,
                    fecha: v.fecha_venta || v.fecha,
                    cliente: v.cliente_nombre || 'Delivery',
                    items: v.items?.length || 0,
                    usuario: 'Motorizado',
                    total: v.total
                  }));
                break;
            }
          }
          break;
          
        case 'diario':
        case 'cajero':
        case 'mozo':
          // Usar el endpoint de diario cajero
          const diarioData = await this.reporteService
            .getReporteDiarioCajero(fechaFin)
            .toPromise();
          
          if (diarioData) {
            resumen = diarioData.resumen || {};
            
            if (tipo === 'diario' || tipo === 'cajero') {
              // Datos por usuario (cajero)
              datos = diarioData.porUsuario.map((u: any) => ({
                id: u.usuario_id,
                fecha: diarioData.fecha,
                cliente: u.usuario_nombre,
                items: u.cantidad,
                usuario: u.usuario_nombre,
                total: u.total
              }));
            } else if (tipo === 'mozo') {
              // Filtrar solo mozos (puedes ajustar según tu lógica)
              datos = diarioData.porUsuario
                .filter((u: any) => u.usuario_nombre.includes('Mozo') || u.rol === 'mozo')
                .map((u: any) => ({
                  id: u.usuario_id,
                  fecha: diarioData.fecha,
                  cliente: u.usuario_nombre,
                  items: u.cantidad,
                  usuario: u.usuario_nombre,
                  total: u.total
                }));
            }
          }
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
    // Aquí puedes implementar la exportación a Excel con librerías como xlsx
    alert('📊 Exportando a Excel...');
  }
}