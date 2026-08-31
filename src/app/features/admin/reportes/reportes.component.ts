// reportes.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../../core/services/pedido.service';
import { VentaService } from '../../../core/services/venta.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

// ============================================
// CATÁLOGO DE REPORTES (escalable: agregar aquí)
// ============================================
const TIPOS_REPORTE: { id: string; nombre: string }[] = [
  { id: 'ventas', nombre: 'Reporte de Ventas' },
  { id: 'pendientes', nombre: 'Pedidos Pendientes' },
  { id: 'diario', nombre: 'Venta Diaria' },
  { id: 'cajero', nombre: 'Diario de Cajero' },
  { id: 'totales', nombre: 'Ventas Totales' },
  { id: 'pago', nombre: 'Forma de Pago' },
  { id: 'mozo', nombre: 'Ventas por Mozo' },
  { id: 'cliente', nombre: 'Ventas por Cliente' },
  { id: 'motorizada', nombre: 'Venta Motorizada' }
];

// ============================================
// MAPAS DE PRESENTACIÓN (Local / Motorizado)
// ============================================
const ETIQUETA_TIPO: Record<string, string> = {
  'local': 'Local',
  'delivery': 'Motorizado',
  'paraLlevar': 'Para Llevar',
  'motorizada': 'Motorizado'
};

const CLASE_TIPO: Record<string, string> = {
  'local': 'tipo-local',
  'delivery': 'tipo-delivery',
  'paraLlevar': 'tipo-local',
  'motorizada': 'tipo-delivery'
};

const TEXTO_ESTADO: Record<string, string> = {
  'pendiente': 'Pendiente',
  'preparando': 'Preparando',
  'listo': 'Listo',
  'entregado': 'Pagado',
  'Pagado': 'Pagado',
  'cancelado': 'Cancelado'
};

const CLASE_ESTADO: Record<string, string> = {
  'pendiente': 'estado-pendiente',
  'preparando': 'estado-preparando',
  'listo': 'estado-listo',
  'entregado': 'estado-pagado',
  'Pagado': 'estado-pagado',
  'cancelado': 'estado-cancelado'
};

// ============================================
// MODELO DE FILA (estáticos: se calculan una vez por fila)
// ============================================
interface FilaReporte {
  id: any;
  fecha: string;
  cliente: string;
  items: number;
  usuario: string;
  total: number;
  tipo_entrega: string;
  estado: string;
  tipo_texto: string;
  tipo_clase: string;
  estado_texto: string;
  estado_clase: string;
}

interface DesgloseTipo {
  cantidad: number;
  total: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  datosReporte = signal<FilaReporte[]>([]);
  resumenReporte = signal<any>({});
  usuario = signal<any>(null);

  ventasLocal = signal<any[]>([]);
  ventasDelivery = signal<any[]>([]);
  pedidosPendientes = signal<any[]>([]);

  // Lista estática de reportes disponibles (no muta)
  reportes = TIPOS_REPORTE;

  nombreReporte = computed(() => {
    const found = TIPOS_REPORTE.find(r => r.id === this.reporteSeleccionado());
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
  // CARGA DE DATOS
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
      }
    };

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

      let datos: FilaReporte[] = [];
      let resumen: any = {};

      switch (tipo) {
        case 'ventas':
          const ventasFiltradas = this.ventas().filter((v: any) => {
            const fecha = new Date(v.fecha_venta).toISOString().split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin;
          });

          datos = ventasFiltradas.map((v: any) => this.armarFila({
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
            promedio: totalVentas > 0 ? totalRecaudado / totalVentas : 0,
            local: this.desglosePorTipo(ventasFiltradas).local,
            motorizado: this.desglosePorTipo(ventasFiltradas).motorizado
          };
          break;

        case 'pendientes':
          const pendientesFiltrados = this.pedidosPendientes().filter((p: any) => {
            const fecha = new Date(p.created_at).toISOString().split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin;
          });

          datos = pendientesFiltrados.map((p: any) => this.armarFila({
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
            promedio: datos.length > 0 ? datos.reduce((sum, d) => sum + d.total, 0) / datos.length : 0,
            local: this.desglosePorTipo(pendientesFiltrados).local,
            motorizado: this.desglosePorTipo(pendientesFiltrados).motorizado
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
          datos = Object.values(porDia).map((d: any) => this.armarFila(d));

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

          datos = motorizadas.map((v: any) => this.armarFila({
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
            promedio: totalMotorizados > 0 ? totalRecaudadoMotorizado / totalMotorizados : 0,
            motorizado: { cantidad: totalMotorizados, total: totalRecaudadoMotorizado }
          };
          break;

        case 'cajero':
          const ventasCajero = this.ventas().filter((v: any) => {
            const fecha = new Date(v.fecha_venta).toISOString().split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin;
          });

          const porDiaCajero: any = {};
          ventasCajero.forEach((v: any) => {
            const fecha = v.fecha_venta ? new Date(v.fecha_venta).toISOString().split('T')[0] : '--';
            const metodo = v.metodo_pago || 'efectivo';
            if (!porDiaCajero[fecha]) {
              porDiaCajero[fecha] = { fecha, total: 0, transacciones: 0 };
            }
            porDiaCajero[fecha].total += parseFloat(v.total) || 0;
            porDiaCajero[fecha].transacciones += 1;
          });

          datos = Object.entries(porDiaCajero)
            .sort((a: any, b: any) => a[1].fecha.localeCompare(b[1].fecha))
            .map(([fecha, info]: any) => this.armarFila({
              id: fecha,
              fecha: info.fecha,
              cliente: 'Total del día',
              items: info.transacciones,
              usuario: 'Cajero',
              total: info.total,
              tipo_entrega: 'local',
              estado: 'Pagado'
            }));

          const totalCajero = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: datos.length,
            totalRecaudado: totalCajero,
            promedio: datos.length > 0 ? totalCajero / datos.length : 0
          };
          break;

        case 'totales':
          const ventasTotales = this.ventas().filter((v: any) => {
            const fecha = new Date(v.fecha_venta).toISOString().split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin;
          });

          const desgloseTotales = this.desglosePorTipo(ventasTotales);
          const totalLocal = desgloseTotales.local.total;
          const totalMotion = desgloseTotales.motorizado.total;

          datos = [
            this.armarFila({
              id: 1,
              fecha: 'Local',
              cliente: 'Ventas en la pollería',
              items: desgloseTotales.local.cantidad,
              usuario: 'Sistema',
              total: totalLocal,
              tipo_entrega: 'local',
              estado: 'Pagado'
            }),
            this.armarFila({
              id: 2,
              fecha: 'Motorizado',
              cliente: 'Ventas por motorizado',
              items: desgloseTotales.motorizado.cantidad,
              usuario: 'Sistema',
              total: totalMotion,
              tipo_entrega: 'delivery',
              estado: 'Pagado'
            })
          ];

          const totalVentasTodos = ventasTotales.length;
          const totalRecaudadoTodos = totalLocal + totalMotion;
          resumen = {
            totalVentas: totalVentasTodos,
            totalRecaudado: totalRecaudadoTodos,
            promedio: totalVentasTodos > 0 ? totalRecaudadoTodos / totalVentasTodos : 0,
            local: desgloseTotales.local,
            motorizado: desgloseTotales.motorizado
          };
          break;

        case 'pago':
          const ventasPago = this.ventas().filter((v: any) => {
            const fecha = new Date(v.fecha_venta).toISOString().split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin;
          });

          const etiquetasMetodo: any = {
            'efectivo': 'Efectivo',
            'tarjeta': 'Tarjeta',
            'yape': 'Yape',
            'plin': 'Plin',
            'transferencia': 'Transferencia',
            'izipay': 'Tarjeta (Izipay)'
          };

          const porMetodo: any = {};
          ventasPago.forEach((v: any) => {
            const metodo = v.metodo_pago || 'efectivo';
            if (!porMetodo[metodo]) {
              porMetodo[metodo] = { total: 0, cantidad: 0 };
            }
            porMetodo[metodo].total += parseFloat(v.total) || 0;
            porMetodo[metodo].cantidad += 1;
          });

          datos = Object.entries(porMetodo).map(([metodo, info]: any, i) => this.armarFila({
            id: i + 1,
            fecha: etiquetasMetodo[metodo] || metodo,
            cliente: 'Forma de pago',
            items: info.cantidad,
            usuario: 'Sistema',
            total: info.total,
            tipo_entrega: 'local',
            estado: 'Pagado'
          }));

          const totalPago = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: datos.reduce((sum, d) => sum + d.items, 0),
            totalRecaudado: totalPago,
            promedio: datos.length > 0 ? totalPago / datos.length : 0
          };
          break;

        case 'mozo':
          const ventasMozo = this.ventas().filter((v: any) => {
            const fecha = new Date(v.fecha_venta).toISOString().split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin;
          });

          const porMozo: any = {};
          ventasMozo.forEach((v: any) => {
            const nombre = v.usuario_nombre || 'Desconocido';
            if (!porMozo[nombre]) {
              porMozo[nombre] = { total: 0, cantidad: 0 };
            }
            porMozo[nombre].total += parseFloat(v.total) || 0;
            porMozo[nombre].cantidad += 1;
          });

          datos = Object.entries(porMozo)
            .sort((a: any, b: any) => b[1].total - a[1].total)
            .map(([nombre, info]: any, i) => this.armarFila({
              id: i + 1,
              fecha: nombre,
              cliente: 'Mesero',
              items: info.cantidad,
              usuario: nombre,
              total: info.total,
              tipo_entrega: 'local',
              estado: 'Pagado'
            }));

          const totalMozo = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: datos.reduce((sum, d) => sum + d.items, 0),
            totalRecaudado: totalMozo,
            promedio: datos.length > 0 ? totalMozo / datos.length : 0
          };
          break;

        case 'cliente':
          const ventasCliente = this.ventas().filter((v: any) => {
            const fecha = new Date(v.fecha_venta).toISOString().split('T')[0];
            return fecha >= fechaInicio && fecha <= fechaFin;
          });

          const porCliente: any = {};
          ventasCliente.forEach((v: any) => {
            const nombre = v.cliente_nombre_real || v.cliente_nombre || 'Consumidor Final';
            if (!porCliente[nombre]) {
              porCliente[nombre] = { total: 0, cantidad: 0 };
            }
            porCliente[nombre].total += parseFloat(v.total) || 0;
            porCliente[nombre].cantidad += 1;
          });

          datos = Object.entries(porCliente)
            .sort((a: any, b: any) => b[1].total - a[1].total)
            .map(([nombre, info]: any, i) => this.armarFila({
              id: i + 1,
              fecha: nombre,
              cliente: nombre,
              items: info.cantidad,
              usuario: 'Cliente',
              total: info.total,
              tipo_entrega: 'local',
              estado: 'Pagado'
            }));

          const totalCliente = datos.reduce((sum, d) => sum + d.total, 0);
          resumen = {
            totalVentas: datos.reduce((sum, d) => sum + d.items, 0),
            totalRecaudado: totalCliente,
            promedio: datos.length > 0 ? totalCliente / datos.length : 0
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
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================
  // Desglose Local vs Motorizado sobre registros en crudo
  private desglosePorTipo(registros: any[]): { local: DesgloseTipo; motorizado: DesgloseTipo } {
    const local: DesgloseTipo = { cantidad: 0, total: 0 };
    const motorizado: DesgloseTipo = { cantidad: 0, total: 0 };

    registros.forEach((r: any) => {
      const tipo = r.tipo_entrega || 'local';
      const suma = parseFloat(r.total) || 0;
      if (tipo === 'local' || tipo === 'paraLlevar') {
        local.cantidad++;
        local.total += suma;
      } else {
        motorizado.cantidad++;
        motorizado.total += suma;
      }
    });

    return { local, motorizado };
  }

  // Construye una fila con sus campos de presentación calculados una sola vez
  private armarFila(origen: any): FilaReporte {
    const tipo = origen.tipo_entrega || 'local';
    const estado = origen.estado || 'Pagado';
    return {
      id: origen.id,
      fecha: origen.fecha || '--',
      cliente: origen.cliente || 'Consumidor Final',
      items: origen.items || 0,
      usuario: origen.usuario || '-',
      total: parseFloat(origen.total) || 0,
      tipo_entrega: tipo,
      estado: estado,
      tipo_texto: ETIQUETA_TIPO[tipo] || 'Local',
      tipo_clase: CLASE_TIPO[tipo] || 'tipo-local',
      estado_texto: TEXTO_ESTADO[estado] || estado,
      estado_clase: CLASE_ESTADO[estado] || 'estado-pendiente'
    };
  }

  calcularTotal(): number {
    return this.datosReporte().reduce((sum, item) => sum + item.total, 0);
  }

  // ============================================
  // EXPORTAR A PDF (imprimir del navegador)
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
          <td>${item.tipo_texto || 'Local'}</td>
          <td>S/ ${(item.total || 0).toFixed(2)}</td>
          <td>${item.estado_texto || 'Pagado'}</td>
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
  // EXPORTAR A EXCEL (CSV)
  // ============================================
  exportarExcel(): void {
    const datos = this.datosReporte();
    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const filas = [
      ['ID', 'Fecha', 'Cliente', 'Items', 'Usuario', 'Tipo', 'Total (S/)', 'Estado'],
      ...datos.map((d: any) => [
        d.id ?? '',
        d.fecha ?? '',
        d.cliente ?? '',
        d.items ?? 0,
        d.usuario ?? '',
        d.tipo_texto || 'Local',
        (Number(d.total) || 0).toFixed(2),
        d.estado_texto ?? ''
      ]),
      [],
      ['TOTAL GENERAL', '', '', '', '', '', this.calcularTotal().toFixed(2), '']
    ];

    const csv = filas
      .map(fila => fila.map(celda => `"${String(celda).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.nombreReporte().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}