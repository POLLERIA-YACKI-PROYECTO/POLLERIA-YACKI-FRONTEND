// src/app/features/admin/reportes/reportes.component.ts
import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PedidoService } from '../../../core/services/pedido.service';
import { VentaService } from '../../../core/services/venta.service';
import { AuthService } from '../../../core/services/auth.service';

// ============================================
// TIPOS E INTERFACES
// ============================================

type TipoCelda =
  | 'texto'
  | 'numero'
  | 'moneda'
  | 'tipo'
  | 'estado'
  | 'id'
  | 'fecha'
  | 'total';

interface TipoReporte {
  id: string;
  nombre: string;
}

interface ColumnaReporte {
  clave: keyof FilaReporte;
  titulo: string;
  tipo: TipoCelda;
}

interface DesgloseTipo {
  cantidad: number;
  total: number;
}

interface FilaReporte {
  id: string | number;

  fecha?: string;
  dia?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  semana?: string;

  cliente?: string;
  items?: number;
  usuario?: string;
  rol?: string;

  ventas?: number;
  transacciones?: number;
  cantidad?: number;

  categoria?: string;
  metodo_pago?: string;

  tipo_entrega?: string;
  tipo_texto?: string;
  tipo_clase?: string;

  estado?: string;
  estado_texto?: string;
  estado_clase?: string;

  // ✅ NUEVAS COLUMNAS PARA LOCAL Y MOTORIZADO
  ventas_local?: number;
  ventas_motorizado?: number;
  total_local?: number;
  total_motorizado?: number;

  total: number;
  promedio?: number;
}

// ============================================
// CATÁLOGO DE REPORTES
// ============================================

const TIPOS_REPORTE: TipoReporte[] = [
  {
    id: 'ventas',
    nombre: 'Reporte de Ventas'
  },
  {
    id: 'semanal',
    nombre: 'Venta por Semana'
  },
  {
    id: 'diario',
    nombre: 'Venta Diaria'
  },
  {
    id: 'pendientes',
    nombre: 'Pedidos Pendientes'
  },
  {
    id: 'cajero',
    nombre: 'Diario de Cajero'
  },
  {
    id: 'totales',
    nombre: 'Ventas Totales'
  },
  {
    id: 'pago',
    nombre: 'Forma de Pago'
  },
  {
    id: 'mozo',
    nombre: 'Ventas por Mozo'
  },
  {
    id: 'cliente',
    nombre: 'Ventas por Cliente'
  },
  {
    id: 'motorizada',
    nombre: 'Venta Motorizada'
  }
];

// ============================================
// MÉTODOS DE PAGO
// ============================================

const ETIQUETA_METODO_PAGO: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia',
  izipay: 'Tarjeta (Izipay)',
  no_especificado: 'No especificado'
};

// ============================================
// COMPONENTE
// ============================================

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {

  private pedidoService = inject(PedidoService);
  private ventaService = inject(VentaService);
  private authService = inject(AuthService);

  // ==========================================
  // ESTADO GENERAL
  // ==========================================

  loading = signal<boolean>(false);

  reporteSeleccionado = signal<string>('ventas');

  menuAbierto = signal<boolean>(false);

  fechaInicio = signal<string>('');
  fechaFin = signal<string>('');

  usuario = signal<any>(null);

  ventas = signal<any[]>([]);

  pedidosPendientes = signal<any[]>([]);

  datosReporte = signal<FilaReporte[]>([]);

  resumenReporte = signal<any>({});

  reportes = TIPOS_REPORTE;

  // ==========================================
  // NOMBRE DEL REPORTE
  // ==========================================

  nombreReporte = computed<string>(() => {
    const reporte = TIPOS_REPORTE.find(
      item => item.id === this.reporteSeleccionado()
    );
    return reporte?.nombre || 'Reporte';
  });

  // ==========================================
  // COLUMNAS DINÁMICAS
  // ==========================================

  columnasReporte = computed<ColumnaReporte[]>(() => {
    switch (this.reporteSeleccionado()) {

      case 'ventas':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
          { clave: 'cliente', titulo: 'Cliente', tipo: 'texto' },
          { clave: 'items', titulo: 'Items', tipo: 'numero' },
          { clave: 'usuario', titulo: 'Mesero', tipo: 'texto' },
          { clave: 'ventas_local', titulo: 'Local', tipo: 'numero' },
          { clave: 'ventas_motorizado', titulo: 'Motorizado', tipo: 'numero' },
          { clave: 'metodo_pago', titulo: 'Método', tipo: 'texto' },
          { clave: 'total_local', titulo: 'Total Local', tipo: 'moneda' },
          { clave: 'total_motorizado', titulo: 'Total Motorizado', tipo: 'moneda' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'estado', titulo: 'Estado', tipo: 'estado' }
        ];

      case 'semanal':
        return [
          { clave: 'id', titulo: 'Semana', tipo: 'id' },
          { clave: 'semana', titulo: 'Semana', tipo: 'texto' },
          { clave: 'fecha_desde', titulo: 'Desde', tipo: 'fecha' },
          { clave: 'fecha_hasta', titulo: 'Hasta', tipo: 'fecha' },
          { clave: 'ventas_local', titulo: 'Local', tipo: 'numero' },
          { clave: 'ventas_motorizado', titulo: 'Motorizado', tipo: 'numero' },
          { clave: 'total_local', titulo: 'Total Local', tipo: 'moneda' },
          { clave: 'total_motorizado', titulo: 'Total Motorizado', tipo: 'moneda' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' }
        ];

      case 'diario':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
          { clave: 'dia', titulo: 'Día', tipo: 'texto' },
          { clave: 'ventas_local', titulo: 'Local', tipo: 'numero' },
          { clave: 'ventas_motorizado', titulo: 'Motorizado', tipo: 'numero' },
          { clave: 'total_local', titulo: 'Total Local', tipo: 'moneda' },
          { clave: 'total_motorizado', titulo: 'Total Motorizado', tipo: 'moneda' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'promedio', titulo: 'Promedio', tipo: 'moneda' }
        ];

      case 'pendientes':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
          { clave: 'cliente', titulo: 'Cliente', tipo: 'texto' },
          { clave: 'items', titulo: 'Items', tipo: 'numero' },
          { clave: 'usuario', titulo: 'Mesero', tipo: 'texto' },
          { clave: 'tipo_entrega', titulo: 'Tipo', tipo: 'tipo' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'estado', titulo: 'Estado', tipo: 'estado' }
        ];

      case 'cajero':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
          { clave: 'transacciones', titulo: 'Transacciones', tipo: 'numero' },
          { clave: 'ventas_local', titulo: 'Local', tipo: 'numero' },
          { clave: 'ventas_motorizado', titulo: 'Motorizado', tipo: 'numero' },
          { clave: 'total_local', titulo: 'Total Local', tipo: 'moneda' },
          { clave: 'total_motorizado', titulo: 'Total Motorizado', tipo: 'moneda' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'promedio', titulo: 'Promedio', tipo: 'moneda' }
        ];

      case 'totales':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'categoria', titulo: 'Tipo de Venta', tipo: 'texto' },
          { clave: 'ventas_local', titulo: 'Local', tipo: 'numero' },
          { clave: 'ventas_motorizado', titulo: 'Motorizado', tipo: 'numero' },
          { clave: 'total_local', titulo: 'Total Local', tipo: 'moneda' },
          { clave: 'total_motorizado', titulo: 'Total Motorizado', tipo: 'moneda' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'promedio', titulo: 'Promedio', tipo: 'moneda' }
        ];

      case 'pago':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'metodo_pago', titulo: 'Forma de Pago', tipo: 'texto' },
          { clave: 'transacciones', titulo: 'Transacciones', tipo: 'numero' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'promedio', titulo: 'Promedio', tipo: 'moneda' }
        ];

      case 'mozo':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'usuario', titulo: 'Mozo', tipo: 'texto' },
          { clave: 'rol', titulo: 'Rol', tipo: 'texto' },
          { clave: 'ventas', titulo: 'Cantidad de Ventas', tipo: 'numero' },
          { clave: 'ventas_local', titulo: 'Local', tipo: 'numero' },
          { clave: 'ventas_motorizado', titulo: 'Motorizado', tipo: 'numero' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'promedio', titulo: 'Promedio', tipo: 'moneda' }
        ];

      case 'cliente':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'cliente', titulo: 'Cliente', tipo: 'texto' },
          { clave: 'ventas', titulo: 'Cantidad de Ventas', tipo: 'numero' },
          { clave: 'ventas_local', titulo: 'Local', tipo: 'numero' },
          { clave: 'ventas_motorizado', titulo: 'Motorizado', tipo: 'numero' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'promedio', titulo: 'Promedio', tipo: 'moneda' }
        ];

      case 'motorizada':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
          { clave: 'cliente', titulo: 'Cliente', tipo: 'texto' },
          { clave: 'items', titulo: 'Items', tipo: 'numero' },
          { clave: 'tipo_entrega', titulo: 'Tipo', tipo: 'tipo' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'estado', titulo: 'Estado', tipo: 'estado' }
        ];

      default:
        return [];
    }
  });

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {
    this.usuario.set(
      this.authService.getUsuarioActual()
    );

    const hoy = new Date();
    const haceSieteDias = new Date(hoy);
    haceSieteDias.setDate(hoy.getDate() - 7);

    this.fechaInicio.set(this.fechaClave(haceSieteDias));
    this.fechaFin.set(this.fechaClave(hoy));

    this.cargarDatos();
  }

  // ==========================================
  // MENÚ
  // ==========================================

  toggleMenu(): void {
    this.menuAbierto.update(valor => !valor);
  }

  seleccionarReporte(id: string): void {
    this.reporteSeleccionado.set(id);
    this.menuAbierto.set(false);
    this.generarReporte();
  }

  // ==========================================
  // FECHAS
  // ==========================================

  actualizarFechaInicio(valor: string): void {
    this.fechaInicio.set(valor);
    this.validarRangoFechas();
    this.generarReporte();
  }

  actualizarFechaFin(valor: string): void {
    this.fechaFin.set(valor);
    this.validarRangoFechas();
    this.generarReporte();
  }

  private validarRangoFechas(): void {
    if (
      this.fechaInicio() &&
      this.fechaFin() &&
      this.fechaInicio() > this.fechaFin()
    ) {
      this.fechaFin.set(this.fechaInicio());
    }
  }

  // ==========================================
  // CARGAR DATOS
  // ==========================================

  cargarDatos(): void {
    if (this.loading()) return;

    this.loading.set(true);
    let solicitudesFinalizadas = 0;
    const totalSolicitudes = 2;

    const verificarFinalizacion = (): void => {
      solicitudesFinalizadas++;
      if (solicitudesFinalizadas >= totalSolicitudes) {
        this.generarReporte();
        this.loading.set(false);
      }
    };

    this.ventaService.obtenerVentas().subscribe({
      next: (ventas: any[]) => {
        this.ventas.set(Array.isArray(ventas) ? ventas : []);
        verificarFinalizacion();
      },
      error: error => {
        console.error('Error al cargar ventas:', error);
        this.ventas.set([]);
        verificarFinalizacion();
      }
    });

    this.pedidoService.obtenerPedidosPendientes().subscribe({
      next: (pedidos: any[]) => {
        this.pedidosPendientes.set(Array.isArray(pedidos) ? pedidos : []);
        verificarFinalizacion();
      },
      error: error => {
        console.error('Error al cargar pedidos pendientes:', error);
        this.pedidosPendientes.set([]);
        verificarFinalizacion();
      }
    });
  }

  // ==========================================
  // GENERAR REPORTE SELECCIONADO
  // ==========================================

  generarReporte(): void {
    if (!this.fechaInicio() || !this.fechaFin()) {
      this.datosReporte.set([]);
      this.resumenReporte.set({});
      return;
    }

    try {
      switch (this.reporteSeleccionado()) {
        case 'ventas':
          this.generarReporteVentas();
          break;
        case 'pendientes':
          this.generarReportePendientes();
          break;
        case 'diario':
          this.generarReporteDiario();
          break;
        case 'semanal':
          this.generarReporteSemanal();
          break;
        case 'cajero':
          this.generarReporteCajero();
          break;
        case 'totales':
          this.generarReporteTotales();
          break;
        case 'pago':
          this.generarReportePago();
          break;
        case 'mozo':
          this.generarReporteMozo();
          break;
        case 'cliente':
          this.generarReporteCliente();
          break;
        case 'motorizada':
          this.generarReporteMotorizada();
          break;
        default:
          this.datosReporte.set([]);
          this.resumenReporte.set({});
          break;
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
      this.datosReporte.set([]);
      this.resumenReporte.set({});
    }
  }

  // ==========================================
  // REPORTE DE VENTAS (CON LOCAL Y MOTORIZADO)
  // ==========================================

  private generarReporteVentas(): void {
    const ventasFiltradas = this.filtrarPorRango(this.ventas(), 'fecha_venta');

    const filas = ventasFiltradas.map(venta => {
      const tipo = this.normalizarTipo(venta.tipo_entrega || venta.tipo);
      const esLocal = tipo === 'local';
      const total = this.numeroSeguro(venta.total);

      return {
        id: venta.id,
        fecha: this.formatearFechaHora(venta.fecha_venta || venta.created_at),
        cliente: venta.cliente_nombre_real || venta.cliente_nombre || 'Consumidor Final',
        items: this.contarItems(venta.items),
        usuario: venta.usuario_nombre || 'Desconocido',
        ventas_local: esLocal ? 1 : 0,
        ventas_motorizado: esLocal ? 0 : 1,
        total_local: esLocal ? total : 0,
        total_motorizado: esLocal ? 0 : total,
        metodo_pago: this.capitalizar(venta.metodo_pago || 'N/A'),
        total: total,
        estado: this.normalizarEstado(venta.estado || 'completada'),
        estado_texto: this.obtenerTextoEstado(venta.estado || 'completada'),
        estado_clase: this.obtenerClaseEstado(venta.estado || 'completada')
      };
    });

    const totalLocal = filas.reduce((sum, f) => sum + (f.total_local || 0), 0);
    const totalMotorizado = filas.reduce((sum, f) => sum + (f.total_motorizado || 0), 0);

    this.publicarReporte(filas, ventasFiltradas.length, {
      local: { cantidad: filas.filter(f => f.ventas_local > 0).length, total: totalLocal },
      motorizado: { cantidad: filas.filter(f => f.ventas_motorizado > 0).length, total: totalMotorizado }
    });
  }

  // ==========================================
  // REPORTE SEMANAL (CON FECHAS CLARAS)
  // ==========================================

  private generarReporteSemanal(): void {
    const fechaInicio = this.crearFechaLocal(this.fechaInicio());
    const fechaFin = this.crearFechaLocal(this.fechaFin());

    if (!fechaInicio || !fechaFin) {
      this.publicarReporte([], 0);
      return;
    }

    const inicioSemana = this.obtenerLunesSemana(fechaInicio);
    const finSemana = this.obtenerDomingoSemana(fechaFin);

    const ventasFiltradas = this.ventas().filter(venta => {
      const fecha = this.obtenerFechaComparacion(venta.fecha_venta || venta.created_at);
      if (!fecha) return false;
      return fecha >= this.fechaClave(inicioSemana) && fecha <= this.fechaClave(finSemana);
    });

    // Agrupar por semana
    const agrupacion: Record<string, any> = {};
    let semanaId = 1;

    ventasFiltradas.forEach(venta => {
      const fecha = new Date(venta.fecha_venta || venta.created_at);
      const lunes = this.obtenerLunesSemana(fecha);
      const domingo = this.obtenerDomingoSemana(fecha);
      const clave = this.fechaClave(lunes);

      const tipo = this.normalizarTipo(venta.tipo_entrega || venta.tipo);
      const esLocal = tipo === 'local';
      const total = this.numeroSeguro(venta.total);

      if (!agrupacion[clave]) {
        agrupacion[clave] = {
          id: semanaId++,
          semana: `Semana ${Math.ceil((fecha.getDate() + 1) / 7)}`,
          fecha_desde: this.formatearFechaSoloDia(this.fechaClave(lunes)),
          fecha_hasta: this.formatearFechaSoloDia(this.fechaClave(domingo)),
          ventas_local: 0,
          ventas_motorizado: 0,
          total_local: 0,
          total_motorizado: 0,
          total: 0
        };
      }

      if (esLocal) {
        agrupacion[clave].ventas_local += 1;
        agrupacion[clave].total_local += total;
      } else {
        agrupacion[clave].ventas_motorizado += 1;
        agrupacion[clave].total_motorizado += total;
      }
      agrupacion[clave].total += total;
    });

    const filas = Object.values(agrupacion) as FilaReporte[];
    filas.sort((a, b) => (a.fecha_desde || '').localeCompare(b.fecha_desde || ''));

    const totalLocal = filas.reduce((sum, f) => sum + (f.total_local || 0), 0);
    const totalMotorizado = filas.reduce((sum, f) => sum + (f.total_motorizado || 0), 0);

    this.publicarReporte(filas, ventasFiltradas.length, {
      local: { cantidad: filas.reduce((sum, f) => sum + (f.ventas_local || 0), 0), total: totalLocal },
      motorizado: { cantidad: filas.reduce((sum, f) => sum + (f.ventas_motorizado || 0), 0), total: totalMotorizado }
    });
  }

  // ==========================================
  // REPORTE DIARIO
  // ==========================================

  private generarReporteDiario(): void {
    const ventasFiltradas = this.filtrarPorRango(this.ventas(), 'fecha_venta');

    const agrupacion: Record<string, any> = {};
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    ventasFiltradas.forEach(venta => {
      const fecha = this.obtenerFechaComparacion(venta.fecha_venta);
      if (!fecha) return;

      const fechaObj = new Date(fecha);
      const diaNombre = diasSemana[fechaObj.getDay()];

      const tipo = this.normalizarTipo(venta.tipo_entrega || venta.tipo);
      const esLocal = tipo === 'local';
      const total = this.numeroSeguro(venta.total);

      if (!agrupacion[fecha]) {
        agrupacion[fecha] = {
          id: Object.keys(agrupacion).length + 1,
          fecha: this.formatearFechaSoloDia(fecha),
          dia: diaNombre,
          ventas_local: 0,
          ventas_motorizado: 0,
          total_local: 0,
          total_motorizado: 0,
          total: 0,
          transacciones: 0
        };
      }

      if (esLocal) {
        agrupacion[fecha].ventas_local += 1;
        agrupacion[fecha].total_local += total;
      } else {
        agrupacion[fecha].ventas_motorizado += 1;
        agrupacion[fecha].total_motorizado += total;
      }
      agrupacion[fecha].total += total;
      agrupacion[fecha].transacciones += 1;
    });

    const filas = Object.values(agrupacion).map((item: any) => ({
      ...item,
      promedio: item.transacciones > 0 ? item.total / item.transacciones : 0
    }));

    filas.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

    const totalLocal = filas.reduce((sum, f) => sum + (f.total_local || 0), 0);
    const totalMotorizado = filas.reduce((sum, f) => sum + (f.total_motorizado || 0), 0);

    this.publicarReporte(filas, ventasFiltradas.length, {
      local: { cantidad: filas.reduce((sum, f) => sum + (f.ventas_local || 0), 0), total: totalLocal },
      motorizado: { cantidad: filas.reduce((sum, f) => sum + (f.ventas_motorizado || 0), 0), total: totalMotorizado }
    });
  }

  // ==========================================
  // REPORTE PENDIENTES
  // ==========================================

  private generarReportePendientes(): void {
    const pedidosFiltrados = this.filtrarPorRango(this.pedidosPendientes(), 'created_at');

    const filas = pedidosFiltrados.map(pedido => ({
      id: pedido.id,
      fecha: this.formatearFechaHora(pedido.created_at),
      cliente: pedido.cliente_nombre_real || pedido.cliente_nombre || 'Cliente',
      items: this.contarItems(pedido.items),
      usuario: pedido.usuario_nombre || 'Desconocido',
      tipo_entrega: this.normalizarTipo(pedido.tipo_entrega || pedido.tipo),
      tipo_texto: this.normalizarTipo(pedido.tipo_entrega || pedido.tipo) === 'delivery' ? 'Motorizado' : 'Local',
      tipo_clase: this.normalizarTipo(pedido.tipo_entrega || pedido.tipo) === 'delivery' ? 'tipo-delivery' : 'tipo-local',
      total: this.numeroSeguro(pedido.total),
      estado: pedido.estado || 'pendiente',
      estado_texto: this.obtenerTextoEstado(pedido.estado || 'pendiente'),
      estado_clase: this.obtenerClaseEstado(pedido.estado || 'pendiente')
    }));

    this.publicarReporte(filas, pedidosFiltrados.length);
  }

  // ==========================================
  // REPORTE CAJERO
  // ==========================================

  private generarReporteCajero(): void {
    const ventasFiltradas = this.filtrarPorRango(this.ventas(), 'fecha_venta');

    const agrupacion: Record<string, any> = {};

    ventasFiltradas.forEach(venta => {
      const fecha = this.obtenerFechaComparacion(venta.fecha_venta);
      if (!fecha) return;

      const tipo = this.normalizarTipo(venta.tipo_entrega || venta.tipo);
      const esLocal = tipo === 'local';
      const total = this.numeroSeguro(venta.total);

      if (!agrupacion[fecha]) {
        agrupacion[fecha] = {
          id: Object.keys(agrupacion).length + 1,
          fecha: this.formatearFechaSoloDia(fecha),
          transacciones: 0,
          ventas_local: 0,
          ventas_motorizado: 0,
          total_local: 0,
          total_motorizado: 0,
          total: 0
        };
      }

      if (esLocal) {
        agrupacion[fecha].ventas_local += 1;
        agrupacion[fecha].total_local += total;
      } else {
        agrupacion[fecha].ventas_motorizado += 1;
        agrupacion[fecha].total_motorizado += total;
      }
      agrupacion[fecha].total += total;
      agrupacion[fecha].transacciones += 1;
    });

    const filas = Object.values(agrupacion).map((item: any) => ({
      ...item,
      promedio: item.transacciones > 0 ? item.total / item.transacciones : 0
    }));

    filas.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

    this.publicarReporte(filas, ventasFiltradas.length);
  }

  // ==========================================
  // REPORTE TOTALES
  // ==========================================

  private generarReporteTotales(): void {
    const ventasFiltradas = this.filtrarPorRango(this.ventas(), 'fecha_venta');

    let localCantidad = 0;
    let localTotal = 0;
    let motorizadoCantidad = 0;
    let motorizadoTotal = 0;

    ventasFiltradas.forEach(venta => {
      const tipo = this.normalizarTipo(venta.tipo_entrega || venta.tipo);
      const total = this.numeroSeguro(venta.total);

      if (tipo === 'local') {
        localCantidad++;
        localTotal += total;
      } else {
        motorizadoCantidad++;
        motorizadoTotal += total;
      }
    });

    const filas: FilaReporte[] = [];

    if (localCantidad > 0 || localTotal > 0) {
      filas.push({
        id: 1,
        categoria: 'Local',
        ventas_local: localCantidad,
        ventas_motorizado: 0,
        total_local: localTotal,
        total_motorizado: 0,
        total: localTotal,
        promedio: localCantidad > 0 ? localTotal / localCantidad : 0
      });
    }

    if (motorizadoCantidad > 0 || motorizadoTotal > 0) {
      filas.push({
        id: 2,
        categoria: 'Motorizado',
        ventas_local: 0,
        ventas_motorizado: motorizadoCantidad,
        total_local: 0,
        total_motorizado: motorizadoTotal,
        total: motorizadoTotal,
        promedio: motorizadoCantidad > 0 ? motorizadoTotal / motorizadoCantidad : 0
      });
    }

    this.publicarReporte(filas, ventasFiltradas.length, {
      local: { cantidad: localCantidad, total: localTotal },
      motorizado: { cantidad: motorizadoCantidad, total: motorizadoTotal }
    });
  }

  // ==========================================
  // REPORTE PAGO
  // ==========================================

  private generarReportePago(): void {
    const ventasFiltradas = this.filtrarPorRango(this.ventas(), 'fecha_venta');

    const agrupacion: Record<string, any> = {};

    ventasFiltradas.forEach(venta => {
      const metodo = String(venta.metodo_pago || 'no_especificado').trim().toLowerCase();

      if (!agrupacion[metodo]) {
        agrupacion[metodo] = {
          id: Object.keys(agrupacion).length + 1,
          metodo_pago: ETIQUETA_METODO_PAGO[metodo] || this.capitalizar(metodo),
          transacciones: 0,
          total: 0
        };
      }

      agrupacion[metodo].transacciones++;
      agrupacion[metodo].total += this.numeroSeguro(venta.total);
    });

    const filas = Object.values(agrupacion).map((item: any) => ({
      ...item,
      promedio: item.transacciones > 0 ? item.total / item.transacciones : 0
    }));

    filas.sort((a, b) => b.total - a.total);

    this.publicarReporte(filas, ventasFiltradas.length);
  }

  // ==========================================
  // REPORTE MOZO
  // ==========================================

  private generarReporteMozo(): void {
    const ventasFiltradas = this.filtrarPorRango(this.ventas(), 'fecha_venta');

    const agrupacion: Record<string, any> = {};

    ventasFiltradas.forEach(venta => {
      const usuarioId = String(venta.usuario_id ?? 'desconocido');

      if (!agrupacion[usuarioId]) {
        agrupacion[usuarioId] = {
          id: Object.keys(agrupacion).length + 1,
          usuario: venta.usuario_nombre || 'Desconocido',
          rol: this.obtenerRolVisible(venta.usuario_rol || 'mesero'),
          ventas: 0,
          ventas_local: 0,
          ventas_motorizado: 0,
          total_local: 0,
          total_motorizado: 0,
          total: 0
        };
      }

      const tipo = this.normalizarTipo(venta.tipo_entrega || venta.tipo);
      const esLocal = tipo === 'local';
      const total = this.numeroSeguro(venta.total);

      agrupacion[usuarioId].ventas++;
      if (esLocal) {
        agrupacion[usuarioId].ventas_local++;
        agrupacion[usuarioId].total_local += total;
      } else {
        agrupacion[usuarioId].ventas_motorizado++;
        agrupacion[usuarioId].total_motorizado += total;
      }
      agrupacion[usuarioId].total += total;
    });

    const filas = Object.values(agrupacion).map((item: any) => ({
      ...item,
      promedio: item.ventas > 0 ? item.total / item.ventas : 0
    }));

    filas.sort((a, b) => b.total - a.total);

    this.publicarReporte(filas, ventasFiltradas.length);
  }

  // ==========================================
  // REPORTE CLIENTE
  // ==========================================

  private generarReporteCliente(): void {
    const ventasFiltradas = this.filtrarPorRango(this.ventas(), 'fecha_venta');

    const agrupacion: Record<string, any> = {};

    ventasFiltradas.forEach(venta => {
      const cliente = venta.cliente_nombre_real || venta.cliente_nombre || 'Consumidor Final';

      if (!agrupacion[cliente]) {
        agrupacion[cliente] = {
          id: Object.keys(agrupacion).length + 1,
          cliente: cliente,
          ventas: 0,
          ventas_local: 0,
          ventas_motorizado: 0,
          total_local: 0,
          total_motorizado: 0,
          total: 0
        };
      }

      const tipo = this.normalizarTipo(venta.tipo_entrega || venta.tipo);
      const esLocal = tipo === 'local';
      const total = this.numeroSeguro(venta.total);

      agrupacion[cliente].ventas++;
      if (esLocal) {
        agrupacion[cliente].ventas_local++;
        agrupacion[cliente].total_local += total;
      } else {
        agrupacion[cliente].ventas_motorizado++;
        agrupacion[cliente].total_motorizado += total;
      }
      agrupacion[cliente].total += total;
    });

    const filas = Object.values(agrupacion).map((item: any) => ({
      ...item,
      promedio: item.ventas > 0 ? item.total / item.ventas : 0
    }));

    filas.sort((a, b) => b.total - a.total);

    this.publicarReporte(filas, ventasFiltradas.length);
  }

  // ==========================================
  // REPORTE MOTORIZADA
  // ==========================================

  private generarReporteMotorizada(): void {
    const ventasMotorizadas = this.filtrarPorRango(this.ventas(), 'fecha_venta')
      .filter(venta => this.normalizarTipo(venta.tipo_entrega || venta.tipo) === 'delivery');

    const filas = ventasMotorizadas.map(venta => ({
      id: venta.id,
      fecha: this.formatearFechaHora(venta.fecha_venta || venta.created_at),
      cliente: venta.cliente_nombre_real || venta.cliente_nombre || 'Cliente',
      items: this.contarItems(venta.items),
      tipo_entrega: 'delivery',
      tipo_texto: 'Motorizado',
      tipo_clase: 'tipo-delivery',
      total: this.numeroSeguro(venta.total),
      estado: venta.estado || 'completada',
      estado_texto: this.obtenerTextoEstado(venta.estado || 'completada'),
      estado_clase: this.obtenerClaseEstado(venta.estado || 'completada')
    }));

    const totalMotorizado = filas.reduce((sum, f) => sum + f.total, 0);

    this.publicarReporte(filas, ventasMotorizadas.length, {
      local: { cantidad: 0, total: 0 },
      motorizado: { cantidad: ventasMotorizadas.length, total: totalMotorizado }
    });
  }

  // ==========================================
  // PUBLICAR RESULTADOS
  // ==========================================

  private publicarReporte(
    filas: FilaReporte[],
    totalVentas: number,
    desglose?: {
      local: DesgloseTipo;
      motorizado: DesgloseTipo;
    }
  ): void {
    const totalRecaudado = filas.reduce((sum, fila) => sum + this.numeroSeguro(fila.total), 0);

    this.datosReporte.set(filas);
    this.resumenReporte.set({
      totalVentas,
      totalRecaudado,
      promedio: this.calcularPromedio(totalRecaudado, totalVentas),
      ...(desglose || {})
    });
  }

  // ==========================================
  // MÉTODOS DE UTILIDAD
  // ==========================================

  private contarItems(valor: unknown): number {
    let items: any[] = [];
    if (Array.isArray(valor)) {
      items = valor;
    } else if (typeof valor === 'string') {
      try {
        const resultado = JSON.parse(valor);
        items = Array.isArray(resultado) ? resultado : [];
      } catch {
        items = [];
      }
    }
    return items.reduce((total, item) => {
      const cantidad = Number(item?.cantidad);
      return total + (Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1);
    }, 0);
  }

  private normalizarTipo(valor: unknown): 'local' | 'delivery' {
    const tipo = String(valor || 'local').trim().toLowerCase();
    if (tipo === 'delivery' || tipo === 'motorizada' || tipo === 'motorizado') {
      return 'delivery';
    }
    return 'local';
  }

  private normalizarEstado(valor: unknown): string {
    return String(valor || 'pendiente').trim().toLowerCase();
  }

  private obtenerTextoEstado(estado: string): string {
    if (estado === 'completada' || estado === 'entregado' || estado === 'pagado') return 'Pagado';
    if (estado === 'cancelada' || estado === 'cancelado') return 'Cancelado';
    return this.capitalizar(estado);
  }

  private obtenerClaseEstado(estado: string): string {
    if (estado === 'completada' || estado === 'entregado' || estado === 'pagado') return 'estado-pagado';
    if (estado === 'cancelada' || estado === 'cancelado') return 'estado-cancelado';
    if (estado === 'preparando') return 'estado-preparando';
    if (estado === 'listo') return 'estado-listo';
    return 'estado-pendiente';
  }

  private obtenerRolVisible(rol: unknown): string {
    const valor = String(rol || 'mesero').trim().toLowerCase();
    const roles: Record<string, string> = {
      admin: 'Administrador',
      cajero: 'Cajero',
      mesero: 'Mesero',
      cocinero: 'Cocinero',
      delivery: 'Motorizado'
    };
    return roles[valor] || this.capitalizar(valor);
  }

  private numeroSeguro(valor: unknown): number {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
  }

  private calcularPromedio(total: number, cantidad: number): number {
    return cantidad > 0 ? total / cantidad : 0;
  }

  private capitalizar(valor: string): string {
    if (!valor) return '-';
    return valor.charAt(0).toUpperCase() + valor.slice(1);
  }

  // ==========================================
  // FECHAS
  // ==========================================

  private filtrarPorRango(registros: any[], campoFecha: string): any[] {
    return registros.filter(registro => {
      const fecha = this.obtenerFechaComparacion(registro?.[campoFecha]);
      if (!fecha) return false;
      return fecha >= this.fechaInicio() && fecha <= this.fechaFin();
    });
  }

  private obtenerFechaComparacion(valor: unknown): string | null {
    if (!valor) return null;
    const texto = String(valor).trim();
    const coincidencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (coincidencia) {
      return `${coincidencia[1]}-${coincidencia[2]}-${coincidencia[3]}`;
    }
    const fecha = new Date(texto);
    if (isNaN(fecha.getTime())) return null;
    return this.fechaClave(fecha);
  }

  private crearFechaLocal(valor: string): Date | null {
    const coincidencia = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!coincidencia) return null;
    const fecha = new Date(
      Number(coincidencia[1]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[3]),
      0, 0, 0, 0
    );
    if (isNaN(fecha.getTime())) return null;
    return fecha;
  }

  private fechaClave(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private formatearFechaSoloDia(fecha: string): string {
    const partes = fecha.split('-');
    if (partes.length !== 3) return fecha;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  private formatearFechaHora(valor: unknown): string {
    if (!valor) return '--';
    const fecha = new Date(String(valor));
    if (isNaN(fecha.getTime())) return String(valor);
    return fecha.toLocaleString('es-PE');
  }

  private obtenerLunesSemana(fecha: Date): Date {
    const resultado = new Date(fecha);
    const diaSemana = resultado.getDay();
    const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana;
    resultado.setDate(resultado.getDate() + diferencia);
    resultado.setHours(0, 0, 0, 0);
    return resultado;
  }

  private obtenerDomingoSemana(fecha: Date): Date {
    const resultado = this.obtenerLunesSemana(fecha);
    resultado.setDate(resultado.getDate() + 6);
    resultado.setHours(23, 59, 59, 999);
    return resultado;
  }

  // ==========================================
  // VALORES PARA EL HTML
  // ==========================================

  obtenerValor(fila: FilaReporte, clave: keyof FilaReporte): string | number {
    const valor = fila[clave];
    if (valor === undefined || valor === null || valor === '') return '-';
    return valor as string | number;
  }

  obtenerValorNumerico(fila: FilaReporte, clave: keyof FilaReporte): number {
    return this.numeroSeguro(fila[clave]);
  }

  calcularTotal(): number {
    return this.datosReporte().reduce((sum, fila) => sum + this.numeroSeguro(fila.total), 0);
  }

  // ==========================================
  // EXPORTAR
  // ==========================================

  exportarExcel(): void {
    // Implementación similar a la anterior
    alert('📊 Exportando a Excel...');
  }

  exportarPDF(): void {
    // Implementación similar a la anterior
    alert('📄 Exportando a PDF...');
  }
}