// src/app/features/admin/reportes/reportes.component.ts
import {
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';

import { PedidoService } from '../../../core/services/pedido.service';
import { VentaService } from '../../../core/services/venta.service';
import { AuthService } from '../../../core/services/auth.service';

import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ============================================
// TIPOS E INTERFACES
// ============================================

type TipoCelda = 'texto' | 'numero' | 'moneda' | 'tipo' | 'estado' | 'id';

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

interface DiaSemana {
  dia: string;
  fecha: string;
  ventas: number;
  total: number;
  esHoy: boolean;
}

interface FilaReporte {
  id: string | number;
  fecha?: string;
  cliente?: string;
  items?: number;
  usuario?: string;
  rol?: string;
  semana?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
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
  ventas_local?: number;
  ventas_motorizado?: number;
  total_local?: number;
  total_motorizado?: number;
  total: number;
  promedio?: number;
  dias?: DiaSemana[];
}

const TIPOS_REPORTE: TipoReporte[] = [
  { id: 'ventas', nombre: 'Reporte de Ventas' },
  { id: 'semanal', nombre: 'Venta por Semana' },
  { id: 'diario', nombre: 'Venta Diaria' },
  { id: 'pendientes', nombre: 'Pedidos Pendientes' },
  { id: 'cajero', nombre: 'Diario de Cajero' },
  { id: 'totales', nombre: 'Ventas Totales' },
  { id: 'pago', nombre: 'Forma de Pago' },
  { id: 'mozo', nombre: 'Ventas por Mozo' },
  { id: 'cliente', nombre: 'Ventas por Cliente' },
  { id: 'motorizada', nombre: 'Venta Motorizada' }
];

const ETIQUETA_METODO_PAGO: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia',
  izipay: 'Tarjeta (Izipay)',
  no_especificado: 'No especificado'
};

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit, OnDestroy {

  private pedidoService = inject(PedidoService);
  private ventaService = inject(VentaService);
  private authService = inject(AuthService);

  // ✅ Protección anti-saturación
  private destroy$ = new Subject<void>();
  private cargando = signal(false);
  private yaCargado = signal(false);

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
          { clave: 'fecha', titulo: 'Fecha', tipo: 'texto' },
          { clave: 'cliente', titulo: 'Cliente', tipo: 'texto' },
          { clave: 'items', titulo: 'Items', tipo: 'numero' },
          { clave: 'usuario', titulo: 'Usuario', tipo: 'texto' },
          { clave: 'tipo_entrega', titulo: 'Tipo', tipo: 'tipo' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'estado', titulo: 'Estado', tipo: 'estado' }
        ];

      case 'semanal':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'semana', titulo: 'Semana', tipo: 'texto' },
          { clave: 'fecha_desde', titulo: 'Desde', tipo: 'texto' },
          { clave: 'fecha_hasta', titulo: 'Hasta', tipo: 'texto' },
          { clave: 'ventas_local', titulo: 'Local', tipo: 'numero' },
          { clave: 'ventas_motorizado', titulo: 'Motorizado', tipo: 'numero' },
          { clave: 'total_local', titulo: 'Total Local', tipo: 'moneda' },
          { clave: 'total_motorizado', titulo: 'Total Motorizado', tipo: 'moneda' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' }
        ];

      case 'diario':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'fecha', titulo: 'Fecha', tipo: 'texto' },
          { clave: 'ventas', titulo: 'Ventas', tipo: 'numero' },
          { clave: 'items', titulo: 'Items', tipo: 'numero' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'promedio', titulo: 'Promedio', tipo: 'moneda' }
        ];

      case 'pendientes':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'fecha', titulo: 'Fecha', tipo: 'texto' },
          { clave: 'cliente', titulo: 'Cliente', tipo: 'texto' },
          { clave: 'items', titulo: 'Items', tipo: 'numero' },
          { clave: 'usuario', titulo: 'Usuario', tipo: 'texto' },
          { clave: 'tipo_entrega', titulo: 'Tipo', tipo: 'tipo' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'estado', titulo: 'Estado', tipo: 'estado' }
        ];

      case 'cajero':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'fecha', titulo: 'Fecha', tipo: 'texto' },
          { clave: 'transacciones', titulo: 'Transacciones', tipo: 'numero' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'promedio', titulo: 'Promedio', tipo: 'moneda' }
        ];

      case 'totales':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'categoria', titulo: 'Tipo de Venta', tipo: 'texto' },
          { clave: 'cantidad', titulo: 'Cantidad', tipo: 'numero' },
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
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'promedio', titulo: 'Promedio', tipo: 'moneda' }
        ];

      case 'cliente':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'cliente', titulo: 'Cliente', tipo: 'texto' },
          { clave: 'ventas', titulo: 'Cantidad de Ventas', tipo: 'numero' },
          { clave: 'total', titulo: 'Total', tipo: 'moneda' },
          { clave: 'promedio', titulo: 'Promedio', tipo: 'moneda' }
        ];

      case 'motorizada':
        return [
          { clave: 'id', titulo: 'ID', tipo: 'id' },
          { clave: 'fecha', titulo: 'Fecha', tipo: 'texto' },
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
    // ✅ FIX: Verificar autenticación primero
    if (!this.authService.isAuthenticated()) {
      console.warn('🛡️ Reportes: sin sesión');
      return;
    }

    this.usuario.set(this.authService.getUsuarioActual());

    const hoy = new Date();
    const haceSieteDias = new Date(hoy);
    haceSieteDias.setDate(hoy.getDate() - 7);

    this.fechaInicio.set(this.fechaClave(haceSieteDias));
    this.fechaFin.set(this.fechaClave(hoy));

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
  // CARGAR DATOS (forkJoin + protección)
  // ==========================================
  cargarDatos(): void {
    if (this.cargando() || this.yaCargado()) return;

    this.cargando.set(true);
    this.loading.set(true);

    forkJoin({
      ventas: this.ventaService.obtenerVentas().pipe(catchError(() => of([]))),
      pedidos: this.pedidoService.obtenerPedidosPendientes().pipe(catchError(() => of([])))
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ ventas, pedidos }) => {
          this.ventas.set(Array.isArray(ventas) ? ventas : []);
          this.pedidosPendientes.set(Array.isArray(pedidos) ? pedidos : []);
          this.generarReporte();
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('✅ Reportes cargados:', this.ventas().length, 'ventas');
        },
        error: (error) => {
          console.error('Error al cargar datos:', error);
          this.ventas.set([]);
          this.pedidosPendientes.set([]);
          this.loading.set(false);
          this.cargando.set(false);
          // ✅ FIX: Resetear yaCargado para permitir reintento
          this.yaCargado.set(false);
        }
      });
  }

  recargar(): void {
    // ✅ FIX: Limpiar caché de servicios para traer datos frescos
    this.ventaService.limpiarCache?.();
    this.pedidoService.limpiarCache?.();
    this.yaCargado.set(false);
    this.cargarDatos();
  }

  // ==========================================
  // GENERACIÓN DEL REPORTE
  // ==========================================
  generarReporte(): void {
    if (!this.fechaInicio() || !this.fechaFin()) {
      this.datosReporte.set([]);
      this.resumenReporte.set({});
      return;
    }

    try {
      switch (this.reporteSeleccionado()) {
        case 'ventas': this.generarReporteVentas(); break;
        case 'semanal': this.generarReporteSemanal(); break;
        case 'diario': this.generarReporteDiario(); break;
        case 'pendientes': this.generarReportePendientes(); break;
        case 'cajero': this.generarReporteCajero(); break;
        case 'totales': this.generarReporteTotales(); break;
        case 'pago': this.generarReportePago(); break;
        case 'mozo': this.generarReporteMozo(); break;
        case 'cliente': this.generarReporteCliente(); break;
        case 'motorizada': this.generarReporteMotorizada(); break;
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
  // REPORTE GENERAL DE VENTAS
  // ==========================================
  private generarReporteVentas(): void {
    const ventasFiltradas = this.filtrarPorRango(this.ventas(), 'fecha_venta');
    const filas = ventasFiltradas.map(venta => this.armarFilaVenta(venta));
    this.publicarReporte(filas, ventasFiltradas.length, this.desglosePorTipo(ventasFiltradas));
  }

  // ==========================================
  // REPORTE SEMANAL (CON DESGLOSE POR DÍA)
  // ==========================================
  private generarReporteSemanal(): void {
    const fechaInicial = this.crearFechaLocal(this.fechaInicio());
    const fechaFinal = this.crearFechaLocal(this.fechaFin());

    if (!fechaInicial || !fechaFinal) {
      this.publicarReporte([], 0);
      return;
    }

    const primerLunes = this.obtenerLunesSemana(fechaInicial);
    const ultimoDomingo = this.obtenerDomingoSemana(fechaFinal);

    const fechaPrimerLunes = this.fechaClave(primerLunes);
    const fechaUltimoDomingo = this.fechaClave(ultimoDomingo);

    const ventasFiltradas = this.ventas().filter(venta => {
      const fecha = this.obtenerFechaComparacion(
        venta.fecha_venta || venta.created_at
      );
      if (!fecha) return false;
      return fecha >= fechaPrimerLunes && fecha <= fechaUltimoDomingo;
    });

    type GrupoSemana = {
      numeroSemana: number;
      anio: number;
      inicio: Date;
      fin: Date;
      ventas_local: number;
      ventas_motorizado: number;
      total_local: number;
      total_motorizado: number;
      total: number;
      dias: DiaSemana[];
    };

    const agrupacion: Record<string, GrupoSemana> = {};

    const semanaActual = new Date(primerLunes);
    while (semanaActual.getTime() <= ultimoDomingo.getTime()) {
      const inicio = new Date(semanaActual);
      const fin = new Date(semanaActual);
      fin.setDate(fin.getDate() + 6);

      const clave = this.fechaClave(inicio);
      const numeroSemana = this.obtenerNumeroSemanaISO(inicio);
      const anio = inicio.getFullYear();

      const dias: DiaSemana[] = [];
      const hoy = new Date();
      const hoyClave = this.fechaClave(hoy);
      const nombreDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

      for (let i = 0; i < 7; i++) {
        const dia = new Date(inicio);
        dia.setDate(dia.getDate() + i);
        const diaClave = this.fechaClave(dia);

        dias.push({
          dia: nombreDias[i],
          fecha: `${String(dia.getDate()).padStart(2, '0')}/${String(dia.getMonth() + 1).padStart(2, '0')}`,
          ventas: 0,
          total: 0,
          esHoy: diaClave === hoyClave
        });
      }

      agrupacion[clave] = {
        numeroSemana,
        anio,
        inicio,
        fin,
        ventas_local: 0,
        ventas_motorizado: 0,
        total_local: 0,
        total_motorizado: 0,
        total: 0,
        dias
      };

      semanaActual.setDate(semanaActual.getDate() + 7);
    }

    ventasFiltradas.forEach(venta => {
      const fechaVentaTexto = this.obtenerFechaComparacion(
        venta.fecha_venta || venta.created_at
      );
      if (!fechaVentaTexto) return;

      const fechaVenta = this.crearFechaLocal(fechaVentaTexto);
      if (!fechaVenta) return;

      const lunes = this.obtenerLunesSemana(fechaVenta);
      const clave = this.fechaClave(lunes);
      const grupo = agrupacion[clave];
      if (!grupo) return;

      const total = this.numeroSeguro(venta.total);
      const tipo = this.normalizarTipo(venta.tipo_entrega || venta.tipo);

      if (tipo === 'delivery') {
        grupo.ventas_motorizado++;
        grupo.total_motorizado += total;
      } else {
        grupo.ventas_local++;
        grupo.total_local += total;
      }
      grupo.total += total;

      const diaSemana = fechaVenta.getDay();
      const indiceDia = diaSemana === 0 ? 6 : diaSemana - 1;

      if (grupo.dias[indiceDia]) {
        grupo.dias[indiceDia].ventas++;
        grupo.dias[indiceDia].total += total;
      }
    });

    const filas: FilaReporte[] = Object.values(agrupacion)
      .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
      .map((grupo, indice) => ({
        id: indice + 1,
        semana: `Semana ${grupo.numeroSemana} (${grupo.anio})`,
        fecha_desde: this.formatearFechaSoloDia(this.fechaClave(grupo.inicio)),
        fecha_hasta: this.formatearFechaSoloDia(this.fechaClave(grupo.fin)),
        ventas_local: grupo.ventas_local,
        ventas_motorizado: grupo.ventas_motorizado,
        total_local: grupo.total_local,
        total_motorizado: grupo.total_motorizado,
        total: grupo.total,
        dias: grupo.dias
      }));

    this.publicarReporte(
      filas,
      ventasFiltradas.length,
      this.desglosePorTipo(ventasFiltradas)
    );
  }

  // ==========================================
  // OTROS REPORTES
  // ==========================================
  private generarReporteDiario(): void {
    const ventasFiltradas = this.filtrarPorRango(this.ventas(), 'fecha_venta');
    const grupos: Record<string, { ventas: number; items: number; total: number }> = {};

    ventasFiltradas.forEach(venta => {
      const fecha = this.obtenerFechaComparacion(venta.fecha_venta);
      if (!fecha) return;
      if (!grupos[fecha]) grupos[fecha] = { ventas: 0, items: 0, total: 0 };
      grupos[fecha].ventas++;
      grupos[fecha].items += this.contarItems(venta.items);
      grupos[fecha].total += this.numeroSeguro(venta.total);
    });

    const filas: FilaReporte[] = Object.entries(grupos)
      .sort(([fechaA], [fechaB]) => fechaB.localeCompare(fechaA))
      .map(([fecha, grupo], indice) => ({
        id: indice + 1,
        fecha: this.formatearFechaSoloDia(fecha),
        ventas: grupo.ventas,
        items: grupo.items,
        total: grupo.total,
        promedio: this.calcularPromedio(grupo.total, grupo.ventas)
      }));

    this.publicarReporte(filas, ventasFiltradas.length);
  }

  private generarReportePendientes(): void {
    const pedidos = this.filtrarPorRango(this.pedidosPendientes(), 'created_at');
    const filas = pedidos.map(pedido =>
      this.armarFilaVenta({
        ...pedido,
        fecha_venta: pedido.created_at,
        estado: pedido.estado || 'pendiente'
      })
    );
    this.publicarReporte(filas, pedidos.length, this.desglosePorTipo(pedidos));
  }

  private generarReporteCajero(): void {
    const ventas = this.filtrarPorRango(this.ventas(), 'fecha_venta');
    const grupos: Record<string, { transacciones: number; total: number }> = {};

    ventas.forEach(venta => {
      const fecha = this.obtenerFechaComparacion(venta.fecha_venta);
      if (!fecha) return;
      if (!grupos[fecha]) grupos[fecha] = { transacciones: 0, total: 0 };
      grupos[fecha].transacciones++;
      grupos[fecha].total += this.numeroSeguro(venta.total);
    });

    const filas: FilaReporte[] = Object.entries(grupos)
      .sort(([fechaA], [fechaB]) => fechaB.localeCompare(fechaA))
      .map(([fecha, grupo], indice) => ({
        id: indice + 1,
        fecha: this.formatearFechaSoloDia(fecha),
        transacciones: grupo.transacciones,
        total: grupo.total,
        promedio: this.calcularPromedio(grupo.total, grupo.transacciones)
      }));

    this.publicarReporte(filas, ventas.length);
  }

  private generarReporteTotales(): void {
    const ventas = this.filtrarPorRango(this.ventas(), 'fecha_venta');
    const desglose = this.desglosePorTipo(ventas);
    const filas: FilaReporte[] = [];

    if (desglose.local.cantidad > 0) {
      filas.push({
        id: filas.length + 1,
        categoria: 'Local',
        cantidad: desglose.local.cantidad,
        total: desglose.local.total,
        promedio: this.calcularPromedio(desglose.local.total, desglose.local.cantidad)
      });
    }
    if (desglose.motorizado.cantidad > 0) {
      filas.push({
        id: filas.length + 1,
        categoria: 'Motorizado',
        cantidad: desglose.motorizado.cantidad,
        total: desglose.motorizado.total,
        promedio: this.calcularPromedio(desglose.motorizado.total, desglose.motorizado.cantidad)
      });
    }

    this.publicarReporte(filas, ventas.length, desglose);
  }

  private generarReportePago(): void {
    const ventas = this.filtrarPorRango(this.ventas(), 'fecha_venta');
    const grupos: Record<string, { transacciones: number; total: number }> = {};

    ventas.forEach(venta => {
      const metodo = String(venta.metodo_pago || 'no_especificado').trim().toLowerCase();
      if (!grupos[metodo]) grupos[metodo] = { transacciones: 0, total: 0 };
      grupos[metodo].transacciones++;
      grupos[metodo].total += this.numeroSeguro(venta.total);
    });

    const filas: FilaReporte[] = Object.entries(grupos)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([metodo, grupo], indice) => ({
        id: indice + 1,
        metodo_pago: ETIQUETA_METODO_PAGO[metodo] || this.capitalizar(metodo),
        transacciones: grupo.transacciones,
        total: grupo.total,
        promedio: this.calcularPromedio(grupo.total, grupo.transacciones)
      }));

    this.publicarReporte(filas, ventas.length);
  }

  private generarReporteMozo(): void {
    const ventas = this.filtrarPorRango(this.ventas(), 'fecha_venta');
    const grupos: Record<string, { usuario: string; rol: string; ventas: number; total: number }> = {};

    ventas.forEach(venta => {
      const clave = String(venta.usuario_id ?? venta.usuario_nombre ?? 'desconocido');
      if (!grupos[clave]) {
        grupos[clave] = {
          usuario: venta.usuario_nombre || venta.mesero_nombre || 'Desconocido',
          rol: this.obtenerRolVisible(venta.usuario_rol || venta.rol || 'mesero'),
          ventas: 0,
          total: 0
        };
      }
      grupos[clave].ventas++;
      grupos[clave].total += this.numeroSeguro(venta.total);
    });

    const filas: FilaReporte[] = Object.values(grupos)
      .sort((a, b) => b.total - a.total)
      .map((grupo, indice) => ({
        id: indice + 1,
        usuario: grupo.usuario,
        rol: grupo.rol,
        ventas: grupo.ventas,
        total: grupo.total,
        promedio: this.calcularPromedio(grupo.total, grupo.ventas)
      }));

    this.publicarReporte(filas, ventas.length);
  }

  private generarReporteCliente(): void {
    const ventas = this.filtrarPorRango(this.ventas(), 'fecha_venta');
    const grupos: Record<string, { cliente: string; ventas: number; total: number }> = {};

    ventas.forEach(venta => {
      const nombre = venta.cliente_nombre_real || venta.cliente_nombre || venta.cliente || 'Consumidor Final';
      const clave = String(venta.cliente_id ?? nombre.toLowerCase());
      if (!grupos[clave]) grupos[clave] = { cliente: nombre, ventas: 0, total: 0 };
      grupos[clave].ventas++;
      grupos[clave].total += this.numeroSeguro(venta.total);
    });

    const filas: FilaReporte[] = Object.values(grupos)
      .sort((a, b) => b.total - a.total)
      .map((grupo, indice) => ({
        id: indice + 1,
        cliente: grupo.cliente,
        ventas: grupo.ventas,
        total: grupo.total,
        promedio: this.calcularPromedio(grupo.total, grupo.ventas)
      }));

    this.publicarReporte(filas, ventas.length);
  }

  private generarReporteMotorizada(): void {
    const ventas = this.filtrarPorRango(this.ventas(), 'fecha_venta')
      .filter(venta => this.normalizarTipo(venta.tipo_entrega || venta.tipo) === 'delivery');
    const filas = ventas.map(venta => this.armarFilaVenta(venta));
    this.publicarReporte(filas, ventas.length, this.desglosePorTipo(ventas));
  }

  private publicarReporte(
    filas: FilaReporte[],
    totalVentas: number,
    desglose?: { local: DesgloseTipo; motorizado: DesgloseTipo }
  ): void {
    const totalRecaudado = filas.reduce(
      (suma, fila) => suma + this.numeroSeguro(fila.total),
      0
    );

    this.datosReporte.set(filas);
    this.resumenReporte.set({
      totalVentas,
      totalRecaudado,
      promedio: this.calcularPromedio(totalRecaudado, totalVentas),
      ...(desglose || {})
    });
  }

  private armarFilaVenta(venta: any): FilaReporte {
    const tipo = this.normalizarTipo(venta.tipo_entrega || venta.tipo);
    const estado = this.normalizarEstado(venta.estado || 'completada');

    return {
      id: venta.id,
      fecha: this.formatearFechaHora(venta.fecha_venta || venta.created_at),
      cliente: venta.cliente_nombre_real || venta.cliente_nombre || venta.cliente || 'Consumidor Final',
      items: this.contarItems(venta.items),
      usuario: venta.usuario_nombre || venta.mesero_nombre || 'Desconocido',
      tipo_entrega: tipo,
      tipo_texto: tipo === 'delivery' ? 'Motorizado' : 'Local',
      tipo_clase: tipo === 'delivery' ? 'tipo-delivery' : 'tipo-local',
      estado,
      estado_texto: this.obtenerTextoEstado(estado),
      estado_clase: this.obtenerClaseEstado(estado),
      total: this.numeroSeguro(venta.total)
    };
  }

  private filtrarPorRango(registros: any[], campoFecha: string): any[] {
    return registros.filter(registro => {
      const fecha = this.obtenerFechaComparacion(registro?.[campoFecha]);
      if (!fecha) return false;
      return fecha >= this.fechaInicio() && fecha <= this.fechaFin();
    });
  }

  private normalizarTipo(valor: unknown): 'local' | 'delivery' {
    const tipo = String(valor || 'local').trim().toLowerCase();
    if (tipo === 'delivery' || tipo === 'motorizada' || tipo === 'motorizado') {
      return 'delivery';
    }
    return 'local';
  }

  private desglosePorTipo(registros: any[]): { local: DesgloseTipo; motorizado: DesgloseTipo } {
    const local: DesgloseTipo = { cantidad: 0, total: 0 };
    const motorizado: DesgloseTipo = { cantidad: 0, total: 0 };

    registros.forEach(registro => {
      const tipo = this.normalizarTipo(registro.tipo_entrega || registro.tipo);
      const total = this.numeroSeguro(registro.total);

      if (tipo === 'delivery') {
        motorizado.cantidad++;
        motorizado.total += total;
      } else {
        local.cantidad++;
        local.total += total;
      }
    });

    return { local, motorizado };
  }

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
      if (Number.isFinite(cantidad) && cantidad > 0) return total + cantidad;
      return total + 1;
    }, 0);
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
    const partes = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!partes) return null;
    const fecha = new Date(
      Number(partes[1]),
      Number(partes[2]) - 1,
      Number(partes[3]),
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
    const dia = resultado.getDay();
    const diferencia = dia === 0 ? -6 : 1 - dia;
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

  private obtenerNumeroSemanaISO(fecha: Date): number {
    const fechaUTC = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    const dia = fechaUTC.getUTCDay() || 7;
    fechaUTC.setUTCDate(fechaUTC.getUTCDate() + 4 - dia);
    const inicioAnio = new Date(Date.UTC(fechaUTC.getUTCFullYear(), 0, 1));
    return Math.ceil(((fechaUTC.getTime() - inicioAnio.getTime()) / 86400000 + 1) / 7);
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
    const roles: Record<string, string> = {
      admin: 'Administrador',
      cajero: 'Cajero',
      mesero: 'Mesero',
      cocinero: 'Cocinero',
      delivery: 'Motorizado'
    };
    const valor = String(rol || 'mesero').trim().toLowerCase();
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

  obtenerDiasSemana(dato: FilaReporte): DiaSemana[] {
    return dato.dias || [];
  }

  calcularSumaCampo(campo: keyof FilaReporte): number {
    return this.datosReporte().reduce(
      (suma, fila) => suma + this.numeroSeguro(fila[campo]),
      0
    );
  }

  calcularTotal(): number {
    return this.calcularSumaCampo('total');
  }

  calcularTotalItems(): number {
    return this.calcularSumaCampo('items');
  }

  calcularTotalVentas(): number {
    switch (this.reporteSeleccionado()) {
      case 'ventas':
      case 'pendientes':
      case 'motorizada':
        return this.datosReporte().length;
      case 'semanal':
        return this.calcularSumaCampo('ventas_local') + this.calcularSumaCampo('ventas_motorizado');
      case 'diario':
      case 'mozo':
      case 'cliente':
        return this.calcularSumaCampo('ventas');
      case 'cajero':
      case 'pago':
        return this.calcularSumaCampo('transacciones');
      case 'totales':
        return this.calcularSumaCampo('cantidad');
      default:
        return 0;
    }
  }

  calcularPromedioGeneral(): number {
    return this.calcularPromedio(this.calcularTotal(), this.calcularTotalVentas());
  }

  calcularTotalSemanal(
    campo: 'ventas_local' | 'ventas_motorizado' | 'total_local' | 'total_motorizado'
  ): number {
    return this.calcularSumaCampo(campo);
  }

  obtenerValorTotalColumna(columna: ColumnaReporte, indice: number): string | number {
    if (indice === 0) return 'TOTAL GENERAL';

    switch (this.reporteSeleccionado()) {
      case 'ventas':
      case 'pendientes':
      case 'motorizada':
        if (columna.clave === 'items') return this.calcularTotalItems();
        if (columna.clave === 'total') return this.calcularTotal();
        return '';

      case 'semanal':
        if (columna.clave === 'ventas_local') return this.calcularTotalSemanal('ventas_local');
        if (columna.clave === 'ventas_motorizado') return this.calcularTotalSemanal('ventas_motorizado');
        if (columna.clave === 'total_local') return this.calcularTotalSemanal('total_local');
        if (columna.clave === 'total_motorizado') return this.calcularTotalSemanal('total_motorizado');
        if (columna.clave === 'total') return this.calcularTotal();
        return '';

      case 'diario':
        if (columna.clave === 'ventas') return this.calcularTotalVentas();
        if (columna.clave === 'items') return this.calcularTotalItems();
        if (columna.clave === 'total') return this.calcularTotal();
        if (columna.clave === 'promedio') return this.calcularPromedioGeneral();
        return '';

      case 'cajero':
      case 'pago':
        if (columna.clave === 'transacciones') return this.calcularTotalVentas();
        if (columna.clave === 'total') return this.calcularTotal();
        if (columna.clave === 'promedio') return this.calcularPromedioGeneral();
        return '';

      case 'totales':
        if (columna.clave === 'cantidad') return this.calcularTotalVentas();
        if (columna.clave === 'total') return this.calcularTotal();
        if (columna.clave === 'promedio') return this.calcularPromedioGeneral();
        return '';

      case 'mozo':
      case 'cliente':
        if (columna.clave === 'ventas') return this.calcularTotalVentas();
        if (columna.clave === 'total') return this.calcularTotal();
        if (columna.clave === 'promedio') return this.calcularPromedioGeneral();
        return '';

      default:
        if (columna.clave === 'total') return this.calcularTotal();
        return '';
    }
  }

  // ==========================================
  // EXPORTAR EXCEL
  // ==========================================
  async exportarExcel(): Promise<void> {
    const datos = this.datosReporte();
    const columnas = this.columnasReporte();

    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    this.loading.set(true);

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Pollería Yacky';
      workbook.created = new Date();

      const nombreHoja = this.nombreReporte().replace(/[\\/*?:[\]]/g, '').substring(0, 31) || 'Reporte';
      const worksheet = workbook.addWorksheet(nombreHoja);

      // (aquí va el código completo de exportación de Excel
      // que ya tenías - no lo cambio para no alargar la respuesta)

      const buffer = await workbook.xlsx.writeBuffer();
      const archivo = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const nombreArchivo = `${this.nombreReporte().replace(/\s+/g, '_')}_${this.fechaInicio()}_${this.fechaFin()}.xlsx`;
      saveAs(archivo, nombreArchivo);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('No se pudo generar el archivo Excel');
    } finally {
      this.loading.set(false);
    }
  }

  // ==========================================
  // EXPORTAR PDF
  // ==========================================
  exportarPDF(): void {
    const datos = this.datosReporte();
    const columnas = this.columnasReporte();

    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const ventana = window.open('', '_blank');
    if (!ventana) {
      alert('El navegador bloqueó la ventana de impresión');
      return;
    }

    // (aquí va el código completo de exportación de PDF
    // que ya tenías - no lo cambio para no alargar la respuesta)

    ventana.document.close();
    setTimeout(() => {
      ventana.focus();
      ventana.print();
    }, 350);
  }

  private escaparHTML(valor: unknown): string {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}