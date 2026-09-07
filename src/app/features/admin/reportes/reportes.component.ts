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

import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ============================================
// TIPOS E INTERFACES
// ============================================

type TipoCelda =
  | 'texto'
  | 'numero'
  | 'moneda'
  | 'tipo'
  | 'estado'
  | 'id';

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
// ETIQUETAS DE MÉTODOS DE PAGO
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
      item =>
        item.id === this.reporteSeleccionado()
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
          {
            clave: 'id',
            titulo: 'ID',
            tipo: 'id'
          },
          {
            clave: 'fecha',
            titulo: 'Fecha',
            tipo: 'texto'
          },
          {
            clave: 'cliente',
            titulo: 'Cliente',
            tipo: 'texto'
          },
          {
            clave: 'items',
            titulo: 'Items',
            tipo: 'numero'
          },
          {
            clave: 'usuario',
            titulo: 'Usuario',
            tipo: 'texto'
          },
          {
            clave: 'tipo_entrega',
            titulo: 'Tipo',
            tipo: 'tipo'
          },
          {
            clave: 'total',
            titulo: 'Total',
            tipo: 'moneda'
          },
          {
            clave: 'estado',
            titulo: 'Estado',
            tipo: 'estado'
          }
        ];

      case 'semanal':
        return [
          {
            clave: 'id',
            titulo: 'ID',
            tipo: 'id'
          },
          {
            clave: 'semana',
            titulo: 'Semana',
            tipo: 'texto'
          },
          {
            clave: 'fecha_desde',
            titulo: 'Desde',
            tipo: 'texto'
          },
          {
            clave: 'fecha_hasta',
            titulo: 'Hasta',
            tipo: 'texto'
          },
          {
            clave: 'ventas_local',
            titulo: 'Local',
            tipo: 'numero'
          },
          {
            clave: 'ventas_motorizado',
            titulo: 'Motorizado',
            tipo: 'numero'
          },
          {
            clave: 'total_local',
            titulo: 'Total Local',
            tipo: 'moneda'
          },
          {
            clave: 'total_motorizado',
            titulo: 'Total Motorizado',
            tipo: 'moneda'
          },
          {
            clave: 'total',
            titulo: 'Total',
            tipo: 'moneda'
          }
        ];

      case 'diario':
        return [
          {
            clave: 'id',
            titulo: 'ID',
            tipo: 'id'
          },
          {
            clave: 'fecha',
            titulo: 'Fecha',
            tipo: 'texto'
          },
          {
            clave: 'ventas',
            titulo: 'Ventas',
            tipo: 'numero'
          },
          {
            clave: 'items',
            titulo: 'Items',
            tipo: 'numero'
          },
          {
            clave: 'total',
            titulo: 'Total',
            tipo: 'moneda'
          },
          {
            clave: 'promedio',
            titulo: 'Promedio',
            tipo: 'moneda'
          }
        ];

      case 'pendientes':
        return [
          {
            clave: 'id',
            titulo: 'ID',
            tipo: 'id'
          },
          {
            clave: 'fecha',
            titulo: 'Fecha',
            tipo: 'texto'
          },
          {
            clave: 'cliente',
            titulo: 'Cliente',
            tipo: 'texto'
          },
          {
            clave: 'items',
            titulo: 'Items',
            tipo: 'numero'
          },
          {
            clave: 'usuario',
            titulo: 'Usuario',
            tipo: 'texto'
          },
          {
            clave: 'tipo_entrega',
            titulo: 'Tipo',
            tipo: 'tipo'
          },
          {
            clave: 'total',
            titulo: 'Total',
            tipo: 'moneda'
          },
          {
            clave: 'estado',
            titulo: 'Estado',
            tipo: 'estado'
          }
        ];

      case 'cajero':
        return [
          {
            clave: 'id',
            titulo: 'ID',
            tipo: 'id'
          },
          {
            clave: 'fecha',
            titulo: 'Fecha',
            tipo: 'texto'
          },
          {
            clave: 'transacciones',
            titulo: 'Transacciones',
            tipo: 'numero'
          },
          {
            clave: 'total',
            titulo: 'Total',
            tipo: 'moneda'
          },
          {
            clave: 'promedio',
            titulo: 'Promedio',
            tipo: 'moneda'
          }
        ];

      case 'totales':
        return [
          {
            clave: 'id',
            titulo: 'ID',
            tipo: 'id'
          },
          {
            clave: 'categoria',
            titulo: 'Tipo de Venta',
            tipo: 'texto'
          },
          {
            clave: 'cantidad',
            titulo: 'Cantidad',
            tipo: 'numero'
          },
          {
            clave: 'total',
            titulo: 'Total',
            tipo: 'moneda'
          },
          {
            clave: 'promedio',
            titulo: 'Promedio',
            tipo: 'moneda'
          }
        ];

      case 'pago':
        return [
          {
            clave: 'id',
            titulo: 'ID',
            tipo: 'id'
          },
          {
            clave: 'metodo_pago',
            titulo: 'Forma de Pago',
            tipo: 'texto'
          },
          {
            clave: 'transacciones',
            titulo: 'Transacciones',
            tipo: 'numero'
          },
          {
            clave: 'total',
            titulo: 'Total',
            tipo: 'moneda'
          },
          {
            clave: 'promedio',
            titulo: 'Promedio',
            tipo: 'moneda'
          }
        ];

      case 'mozo':
        return [
          {
            clave: 'id',
            titulo: 'ID',
            tipo: 'id'
          },
          {
            clave: 'usuario',
            titulo: 'Mozo',
            tipo: 'texto'
          },
          {
            clave: 'rol',
            titulo: 'Rol',
            tipo: 'texto'
          },
          {
            clave: 'ventas',
            titulo: 'Cantidad de Ventas',
            tipo: 'numero'
          },
          {
            clave: 'total',
            titulo: 'Total',
            tipo: 'moneda'
          },
          {
            clave: 'promedio',
            titulo: 'Promedio',
            tipo: 'moneda'
          }
        ];

      case 'cliente':
        return [
          {
            clave: 'id',
            titulo: 'ID',
            tipo: 'id'
          },
          {
            clave: 'cliente',
            titulo: 'Cliente',
            tipo: 'texto'
          },
          {
            clave: 'ventas',
            titulo: 'Cantidad de Ventas',
            tipo: 'numero'
          },
          {
            clave: 'total',
            titulo: 'Total',
            tipo: 'moneda'
          },
          {
            clave: 'promedio',
            titulo: 'Promedio',
            tipo: 'moneda'
          }
        ];

      case 'motorizada':
        return [
          {
            clave: 'id',
            titulo: 'ID',
            tipo: 'id'
          },
          {
            clave: 'fecha',
            titulo: 'Fecha',
            tipo: 'texto'
          },
          {
            clave: 'cliente',
            titulo: 'Cliente',
            tipo: 'texto'
          },
          {
            clave: 'items',
            titulo: 'Items',
            tipo: 'numero'
          },
          {
            clave: 'tipo_entrega',
            titulo: 'Tipo',
            tipo: 'tipo'
          },
          {
            clave: 'total',
            titulo: 'Total',
            tipo: 'moneda'
          },
          {
            clave: 'estado',
            titulo: 'Estado',
            tipo: 'estado'
          }
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

    const haceSieteDias =
      new Date(hoy);

    haceSieteDias.setDate(
      hoy.getDate() - 7
    );

    this.fechaInicio.set(
      this.fechaClave(haceSieteDias)
    );

    this.fechaFin.set(
      this.fechaClave(hoy)
    );

    this.cargarDatos();
  }

  // ==========================================
  // MENÚ
  // ==========================================

  toggleMenu(): void {
    this.menuAbierto.update(
      valor => !valor
    );
  }

  seleccionarReporte(
    id: string
  ): void {
    this.reporteSeleccionado.set(id);

    this.menuAbierto.set(false);

    this.generarReporte();
  }

  // ==========================================
  // FECHAS
  // ==========================================

  actualizarFechaInicio(
    valor: string
  ): void {
    this.fechaInicio.set(valor);

    this.validarRangoFechas();

    this.generarReporte();
  }

  actualizarFechaFin(
    valor: string
  ): void {
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
      this.fechaFin.set(
        this.fechaInicio()
      );
    }
  }

  // ==========================================
  // CARGA DE DATOS
  // ==========================================

  cargarDatos(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);

    let solicitudesFinalizadas = 0;

    const totalSolicitudes = 2;

    const verificarFinalizacion = (): void => {
      solicitudesFinalizadas++;

      if (
        solicitudesFinalizadas >= totalSolicitudes
      ) {
        this.generarReporte();

        this.loading.set(false);
      }
    };

    this.ventaService
      .obtenerVentas()
      .subscribe({
        next: (ventas: any[]) => {
          this.ventas.set(
            Array.isArray(ventas)
              ? ventas
              : []
          );

          verificarFinalizacion();
        },

        error: error => {
          console.error(
            'Error al cargar ventas:',
            error
          );

          this.ventas.set([]);

          verificarFinalizacion();
        }
      });

    this.pedidoService
      .obtenerPedidosPendientes()
      .subscribe({
        next: (pedidos: any[]) => {
          this.pedidosPendientes.set(
            Array.isArray(pedidos)
              ? pedidos
              : []
          );

          verificarFinalizacion();
        },

        error: error => {
          console.error(
            'Error al cargar pedidos pendientes:',
            error
          );

          this.pedidosPendientes.set([]);

          verificarFinalizacion();
        }
      });
  }

  // ==========================================
  // GENERACIÓN DEL REPORTE SELECCIONADO
  // ==========================================

  generarReporte(): void {
    if (
      !this.fechaInicio() ||
      !this.fechaFin()
    ) {
      this.datosReporte.set([]);

      this.resumenReporte.set({});

      return;
    }

    try {
      switch (
        this.reporteSeleccionado()
      ) {
        case 'ventas':
          this.generarReporteVentas();
          break;

        case 'semanal':
          this.generarReporteSemanal();
          break;

        case 'diario':
          this.generarReporteDiario();
          break;

        case 'pendientes':
          this.generarReportePendientes();
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
      console.error(
        'Error al generar reporte:',
        error
      );

      this.datosReporte.set([]);

      this.resumenReporte.set({});
    }
  }
    // ==========================================
  // REPORTE GENERAL DE VENTAS
  // ==========================================

  private generarReporteVentas(): void {
    const ventasFiltradas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const filas =
      ventasFiltradas.map(
        venta =>
          this.armarFilaVenta(venta)
      );

    this.publicarReporte(
      filas,
      ventasFiltradas.length,
      this.desglosePorTipo(
        ventasFiltradas
      )
    );
  }

  // ==========================================
  // REPORTE DE VENTAS POR SEMANA
  // Una fila por semana, de lunes a domingo
  // ==========================================

  private generarReporteSemanal(): void {
    const fechaInicial =
      this.crearFechaLocal(
        this.fechaInicio()
      );

    const fechaFinal =
      this.crearFechaLocal(
        this.fechaFin()
      );

    if (
      !fechaInicial ||
      !fechaFinal
    ) {
      this.publicarReporte([], 0);
      return;
    }

    const primerLunes =
      this.obtenerLunesSemana(
        fechaInicial
      );

    const ultimoDomingo =
      this.obtenerDomingoSemana(
        fechaFinal
      );

    const fechaPrimerLunes =
      this.fechaClave(primerLunes);

    const fechaUltimoDomingo =
      this.fechaClave(ultimoDomingo);

    const ventasFiltradas =
      this.ventas().filter(venta => {
        const fecha =
          this.obtenerFechaComparacion(
            venta.fecha_venta ||
            venta.created_at
          );

        if (!fecha) {
          return false;
        }

        return (
          fecha >= fechaPrimerLunes &&
          fecha <= fechaUltimoDomingo
        );
      });

    const agrupacion: Record<
      string,
      {
        inicio: Date;
        fin: Date;
        ventas_local: number;
        ventas_motorizado: number;
        total_local: number;
        total_motorizado: number;
        total: number;
      }
    > = {};

    /*
     * Primero se crean todas las semanas
     * comprendidas en el rango seleccionado.
     * De esta manera también aparecen semanas
     * que no tienen ventas.
     */
    const semanaActual =
      new Date(primerLunes);

    while (
      semanaActual.getTime() <=
      ultimoDomingo.getTime()
    ) {
      const inicio =
        new Date(semanaActual);

      const fin =
        new Date(semanaActual);

      fin.setDate(
        fin.getDate() + 6
      );

      const clave =
        this.fechaClave(inicio);

      agrupacion[clave] = {
        inicio,
        fin,
        ventas_local: 0,
        ventas_motorizado: 0,
        total_local: 0,
        total_motorizado: 0,
        total: 0
      };

      semanaActual.setDate(
        semanaActual.getDate() + 7
      );
    }

    ventasFiltradas.forEach(venta => {
      const fechaVentaTexto =
        this.obtenerFechaComparacion(
          venta.fecha_venta ||
          venta.created_at
        );

      if (!fechaVentaTexto) {
        return;
      }

      const fechaVenta =
        this.crearFechaLocal(
          fechaVentaTexto
        );

      if (!fechaVenta) {
        return;
      }

      const lunes =
        this.obtenerLunesSemana(
          fechaVenta
        );

      const clave =
        this.fechaClave(lunes);

      const grupo =
        agrupacion[clave];

      if (!grupo) {
        return;
      }

      const total =
        this.numeroSeguro(
          venta.total
        );

      const tipo =
        this.normalizarTipo(
          venta.tipo_entrega ||
          venta.tipo
        );

      if (tipo === 'delivery') {
        grupo.ventas_motorizado++;

        grupo.total_motorizado +=
          total;
      } else {
        grupo.ventas_local++;

        grupo.total_local +=
          total;
      }

      grupo.total += total;
    });

    const filas: FilaReporte[] =
      Object.values(agrupacion)
        .sort(
          (grupoA, grupoB) =>
            grupoA.inicio.getTime() -
            grupoB.inicio.getTime()
        )
        .map(
          (grupo, indice) => ({
            id: indice + 1,

            semana:
              `Semana ${
                this.obtenerNumeroSemanaISO(
                  grupo.inicio
                )
              }`,

            fecha_desde:
              this.formatearFechaSoloDia(
                this.fechaClave(
                  grupo.inicio
                )
              ),

            fecha_hasta:
              this.formatearFechaSoloDia(
                this.fechaClave(
                  grupo.fin
                )
              ),

            ventas_local:
              grupo.ventas_local,

            ventas_motorizado:
              grupo.ventas_motorizado,

            total_local:
              grupo.total_local,

            total_motorizado:
              grupo.total_motorizado,

            total:
              grupo.total
          })
        );

    this.publicarReporte(
      filas,
      ventasFiltradas.length,
      this.desglosePorTipo(
        ventasFiltradas
      )
    );
  }

  // ==========================================
  // REPORTE DE VENTA DIARIA
  // ==========================================

  private generarReporteDiario(): void {
    const ventasFiltradas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const grupos: Record<
      string,
      {
        ventas: number;
        items: number;
        total: number;
      }
    > = {};

    ventasFiltradas.forEach(venta => {
      const fecha =
        this.obtenerFechaComparacion(
          venta.fecha_venta
        );

      if (!fecha) {
        return;
      }

      if (!grupos[fecha]) {
        grupos[fecha] = {
          ventas: 0,
          items: 0,
          total: 0
        };
      }

      grupos[fecha].ventas++;

      grupos[fecha].items +=
        this.contarItems(
          venta.items
        );

      grupos[fecha].total +=
        this.numeroSeguro(
          venta.total
        );
    });

    const filas: FilaReporte[] =
      Object.entries(grupos)
        .sort(
          ([fechaA], [fechaB]) =>
            fechaB.localeCompare(
              fechaA
            )
        )
        .map(
          ([fecha, grupo], indice) => ({
            id: indice + 1,

            fecha:
              this.formatearFechaSoloDia(
                fecha
              ),

            ventas:
              grupo.ventas,

            items:
              grupo.items,

            total:
              grupo.total,

            promedio:
              this.calcularPromedio(
                grupo.total,
                grupo.ventas
              )
          })
        );

    this.publicarReporte(
      filas,
      ventasFiltradas.length
    );
  }

  // ==========================================
  // REPORTE DE PEDIDOS PENDIENTES
  // ==========================================

  private generarReportePendientes(): void {
    const pedidos =
      this.filtrarPorRango(
        this.pedidosPendientes(),
        'created_at'
      );

    const filas =
      pedidos.map(pedido =>
        this.armarFilaVenta({
          ...pedido,

          fecha_venta:
            pedido.created_at,

          estado:
            pedido.estado ||
            'pendiente'
        })
      );

    this.publicarReporte(
      filas,
      pedidos.length,
      this.desglosePorTipo(
        pedidos
      )
    );
  }

  // ==========================================
  // REPORTE DIARIO DE CAJERO
  // ==========================================

  private generarReporteCajero(): void {
    const ventas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const grupos: Record<
      string,
      {
        transacciones: number;
        total: number;
      }
    > = {};

    ventas.forEach(venta => {
      const fecha =
        this.obtenerFechaComparacion(
          venta.fecha_venta
        );

      if (!fecha) {
        return;
      }

      if (!grupos[fecha]) {
        grupos[fecha] = {
          transacciones: 0,
          total: 0
        };
      }

      grupos[fecha].transacciones++;

      grupos[fecha].total +=
        this.numeroSeguro(
          venta.total
        );
    });

    const filas: FilaReporte[] =
      Object.entries(grupos)
        .sort(
          ([fechaA], [fechaB]) =>
            fechaB.localeCompare(
              fechaA
            )
        )
        .map(
          ([fecha, grupo], indice) => ({
            id: indice + 1,

            fecha:
              this.formatearFechaSoloDia(
                fecha
              ),

            transacciones:
              grupo.transacciones,

            total:
              grupo.total,

            promedio:
              this.calcularPromedio(
                grupo.total,
                grupo.transacciones
              )
          })
        );

    this.publicarReporte(
      filas,
      ventas.length
    );
  }

  // ==========================================
  // REPORTE DE VENTAS TOTALES
  // ==========================================

  private generarReporteTotales(): void {
    const ventas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const desglose =
      this.desglosePorTipo(
        ventas
      );

    const filas: FilaReporte[] = [];

    if (
      desglose.local.cantidad > 0
    ) {
      filas.push({
        id: filas.length + 1,

        categoria: 'Local',

        cantidad:
          desglose.local.cantidad,

        total:
          desglose.local.total,

        promedio:
          this.calcularPromedio(
            desglose.local.total,
            desglose.local.cantidad
          )
      });
    }

    if (
      desglose.motorizado.cantidad > 0
    ) {
      filas.push({
        id: filas.length + 1,

        categoria: 'Motorizado',

        cantidad:
          desglose.motorizado.cantidad,

        total:
          desglose.motorizado.total,

        promedio:
          this.calcularPromedio(
            desglose.motorizado.total,
            desglose.motorizado.cantidad
          )
      });
    }

    this.publicarReporte(
      filas,
      ventas.length,
      desglose
    );
  }

  // ==========================================
  // REPORTE POR FORMA DE PAGO
  // ==========================================

  private generarReportePago(): void {
    const ventas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const grupos: Record<
      string,
      {
        transacciones: number;
        total: number;
      }
    > = {};

    ventas.forEach(venta => {
      const metodo =
        String(
          venta.metodo_pago ||
          'no_especificado'
        )
          .trim()
          .toLowerCase();

      if (!grupos[metodo]) {
        grupos[metodo] = {
          transacciones: 0,
          total: 0
        };
      }

      grupos[metodo].transacciones++;

      grupos[metodo].total +=
        this.numeroSeguro(
          venta.total
        );
    });

    const filas: FilaReporte[] =
      Object.entries(grupos)
        .sort(
          ([, grupoA], [, grupoB]) =>
            grupoB.total -
            grupoA.total
        )
        .map(
          ([metodo, grupo], indice) => ({
            id: indice + 1,

            metodo_pago:
              ETIQUETA_METODO_PAGO[
                metodo
              ] ||
              this.capitalizar(
                metodo
              ),

            transacciones:
              grupo.transacciones,

            total:
              grupo.total,

            promedio:
              this.calcularPromedio(
                grupo.total,
                grupo.transacciones
              )
          })
        );

    this.publicarReporte(
      filas,
      ventas.length
    );
  }

  // ==========================================
  // REPORTE DE VENTAS POR MOZO
  // ==========================================

  private generarReporteMozo(): void {
    const ventas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const grupos: Record<
      string,
      {
        usuario: string;
        rol: string;
        ventas: number;
        total: number;
      }
    > = {};

    ventas.forEach(venta => {
      const clave =
        String(
          venta.usuario_id ??
          venta.usuario_nombre ??
          'desconocido'
        );

      if (!grupos[clave]) {
        grupos[clave] = {
          usuario:
            venta.usuario_nombre ||
            venta.mesero_nombre ||
            'Desconocido',

          rol:
            this.obtenerRolVisible(
              venta.usuario_rol ||
              venta.rol ||
              'mesero'
            ),

          ventas: 0,

          total: 0
        };
      }

      grupos[clave].ventas++;

      grupos[clave].total +=
        this.numeroSeguro(
          venta.total
        );
    });

    const filas: FilaReporte[] =
      Object.values(grupos)
        .sort(
          (grupoA, grupoB) =>
            grupoB.total -
            grupoA.total
        )
        .map(
          (grupo, indice) => ({
            id: indice + 1,

            usuario:
              grupo.usuario,

            rol:
              grupo.rol,

            ventas:
              grupo.ventas,

            total:
              grupo.total,

            promedio:
              this.calcularPromedio(
                grupo.total,
                grupo.ventas
              )
          })
        );

    this.publicarReporte(
      filas,
      ventas.length
    );
  }

  // ==========================================
  // REPORTE DE VENTAS POR CLIENTE
  // ==========================================

  private generarReporteCliente(): void {
    const ventas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const grupos: Record<
      string,
      {
        cliente: string;
        ventas: number;
        total: number;
      }
    > = {};

    ventas.forEach(venta => {
      const nombre =
        venta.cliente_nombre_real ||
        venta.cliente_nombre ||
        venta.cliente ||
        'Consumidor Final';

      const clave =
        String(
          venta.cliente_id ??
          nombre.toLowerCase()
        );

      if (!grupos[clave]) {
        grupos[clave] = {
          cliente: nombre,
          ventas: 0,
          total: 0
        };
      }

      grupos[clave].ventas++;

      grupos[clave].total +=
        this.numeroSeguro(
          venta.total
        );
    });

    const filas: FilaReporte[] =
      Object.values(grupos)
        .sort(
          (grupoA, grupoB) =>
            grupoB.total -
            grupoA.total
        )
        .map(
          (grupo, indice) => ({
            id: indice + 1,

            cliente:
              grupo.cliente,

            ventas:
              grupo.ventas,

            total:
              grupo.total,

            promedio:
              this.calcularPromedio(
                grupo.total,
                grupo.ventas
              )
          })
        );

    this.publicarReporte(
      filas,
      ventas.length
    );
  }

  // ==========================================
  // REPORTE DE VENTAS MOTORIZADAS
  // ==========================================

  private generarReporteMotorizada(): void {
    const ventas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      ).filter(venta =>
        this.normalizarTipo(
          venta.tipo_entrega ||
          venta.tipo
        ) === 'delivery'
      );

    const filas =
      ventas.map(
        venta =>
          this.armarFilaVenta(
            venta
          )
      );

    this.publicarReporte(
      filas,
      ventas.length,
      this.desglosePorTipo(
        ventas
      )
    );
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
    const totalRecaudado =
      filas.reduce(
        (suma, fila) =>
          suma +
          this.numeroSeguro(
            fila.total
          ),
        0
      );

    this.datosReporte.set(
      filas
    );

    this.resumenReporte.set({
      totalVentas,

      totalRecaudado,

      promedio:
        this.calcularPromedio(
          totalRecaudado,
          totalVentas
        ),

      ...(desglose || {})
    });
  }

  // ==========================================
  // CONSTRUIR FILA DE VENTA
  // ==========================================

  private armarFilaVenta(
    venta: any
  ): FilaReporte {
    const tipo =
      this.normalizarTipo(
        venta.tipo_entrega ||
        venta.tipo
      );

    const estado =
      this.normalizarEstado(
        venta.estado ||
        'completada'
      );

    return {
      id:
        venta.id,

      fecha:
        this.formatearFechaHora(
          venta.fecha_venta ||
          venta.created_at
        ),

      cliente:
        venta.cliente_nombre_real ||
        venta.cliente_nombre ||
        venta.cliente ||
        'Consumidor Final',

      items:
        this.contarItems(
          venta.items
        ),

      usuario:
        venta.usuario_nombre ||
        venta.mesero_nombre ||
        'Desconocido',

      tipo_entrega:
        tipo,

      tipo_texto:
        tipo === 'delivery'
          ? 'Motorizado'
          : 'Local',

      tipo_clase:
        tipo === 'delivery'
          ? 'tipo-delivery'
          : 'tipo-local',

      estado,

      estado_texto:
        this.obtenerTextoEstado(
          estado
        ),

      estado_clase:
        this.obtenerClaseEstado(
          estado
        ),

      total:
        this.numeroSeguro(
          venta.total
        )
    };
  }

  // ==========================================
  // FILTRAR REGISTROS POR RANGO
  // ==========================================

  private filtrarPorRango(
    registros: any[],
    campoFecha: string
  ): any[] {
    return registros.filter(
      registro => {
        const fecha =
          this.obtenerFechaComparacion(
            registro?.[campoFecha]
          );

        if (!fecha) {
          return false;
        }

        return (
          fecha >= this.fechaInicio() &&
          fecha <= this.fechaFin()
        );
      }
    );
  }

  // ==========================================
  // NORMALIZAR TIPO DE ENTREGA
  // ==========================================

  private normalizarTipo(
    valor: unknown
  ): 'local' | 'delivery' {
    const tipo =
      String(
        valor || 'local'
      )
        .trim()
        .toLowerCase();

    if (
      tipo === 'delivery' ||
      tipo === 'motorizada' ||
      tipo === 'motorizado'
    ) {
      return 'delivery';
    }

    return 'local';
  }

  // ==========================================
  // DESGLOSE LOCAL Y MOTORIZADO
  // ==========================================

  private desglosePorTipo(
    registros: any[]
  ): {
    local: DesgloseTipo;
    motorizado: DesgloseTipo;
  } {
    const local: DesgloseTipo = {
      cantidad: 0,
      total: 0
    };

    const motorizado: DesgloseTipo = {
      cantidad: 0,
      total: 0
    };

    registros.forEach(registro => {
      const tipo =
        this.normalizarTipo(
          registro.tipo_entrega ||
          registro.tipo
        );

      const total =
        this.numeroSeguro(
          registro.total
        );

      if (tipo === 'delivery') {
        motorizado.cantidad++;

        motorizado.total += total;
      } else {
        local.cantidad++;

        local.total += total;
      }
    });

    return {
      local,
      motorizado
    };
  }

  // ==========================================
  // CONTAR ITEMS
  // ==========================================

  private contarItems(
    valor: unknown
  ): number {
    let items: any[] = [];

    if (Array.isArray(valor)) {
      items = valor;
    } else if (
      typeof valor === 'string'
    ) {
      try {
        const resultado =
          JSON.parse(valor);

        items =
          Array.isArray(resultado)
            ? resultado
            : [];
      } catch {
        items = [];
      }
    }

    return items.reduce(
      (total, item) => {
        const cantidad =
          Number(
            item?.cantidad
          );

        if (
          Number.isFinite(cantidad) &&
          cantidad > 0
        ) {
          return total + cantidad;
        }

        return total + 1;
      },
      0
    );
  }

  // ==========================================
  // UTILIDADES DE FECHA
  // ==========================================

  private obtenerFechaComparacion(
    valor: unknown
  ): string | null {
    if (!valor) {
      return null;
    }

    const texto =
      String(valor).trim();

    const coincidencia =
      texto.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );

    if (coincidencia) {
      return (
        `${coincidencia[1]}-` +
        `${coincidencia[2]}-` +
        `${coincidencia[3]}`
      );
    }

    const fecha =
      new Date(texto);

    if (
      isNaN(fecha.getTime())
    ) {
      return null;
    }

    return this.fechaClave(
      fecha
    );
  }

  private crearFechaLocal(
    valor: string
  ): Date | null {
    const partes =
      valor.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (!partes) {
      return null;
    }

    const fecha =
      new Date(
        Number(partes[1]),
        Number(partes[2]) - 1,
        Number(partes[3]),
        0,
        0,
        0,
        0
      );

    if (
      isNaN(fecha.getTime())
    ) {
      return null;
    }

    return fecha;
  }

  private fechaClave(
    fecha: Date
  ): string {
    const anio =
      fecha.getFullYear();

    const mes =
      String(
        fecha.getMonth() + 1
      ).padStart(2, '0');

    const dia =
      String(
        fecha.getDate()
      ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private formatearFechaSoloDia(
    fecha: string
  ): string {
    const partes =
      fecha.split('-');

    if (
      partes.length !== 3
    ) {
      return fecha;
    }

    return (
      `${partes[2]}/` +
      `${partes[1]}/` +
      `${partes[0]}`
    );
  }

  private formatearFechaHora(
    valor: unknown
  ): string {
    if (!valor) {
      return '--';
    }

    const fecha =
      new Date(
        String(valor)
      );

    if (
      isNaN(fecha.getTime())
    ) {
      return String(valor);
    }

    return fecha.toLocaleString(
      'es-PE'
    );
  }

  private obtenerLunesSemana(
    fecha: Date
  ): Date {
    const resultado =
      new Date(fecha);

    const dia =
      resultado.getDay();

    const diferencia =
      dia === 0
        ? -6
        : 1 - dia;

    resultado.setDate(
      resultado.getDate() +
      diferencia
    );

    resultado.setHours(
      0,
      0,
      0,
      0
    );

    return resultado;
  }

  private obtenerDomingoSemana(
    fecha: Date
  ): Date {
    const resultado =
      this.obtenerLunesSemana(
        fecha
      );

    resultado.setDate(
      resultado.getDate() + 6
    );

    resultado.setHours(
      23,
      59,
      59,
      999
    );

    return resultado;
  }

  private obtenerNumeroSemanaISO(
    fecha: Date
  ): number {
    const fechaUTC =
      new Date(
        Date.UTC(
          fecha.getFullYear(),
          fecha.getMonth(),
          fecha.getDate()
        )
      );

    const dia =
      fechaUTC.getUTCDay() || 7;

    fechaUTC.setUTCDate(
      fechaUTC.getUTCDate() +
      4 -
      dia
    );

    const inicioAnio =
      new Date(
        Date.UTC(
          fechaUTC.getUTCFullYear(),
          0,
          1
        )
      );

    return Math.ceil(
      (
        (
          fechaUTC.getTime() -
          inicioAnio.getTime()
        ) /
        86400000 +
        1
      ) /
      7
    );
  }

  // ==========================================
  // ESTADOS
  // ==========================================

  private normalizarEstado(
    valor: unknown
  ): string {
    return String(
      valor || 'pendiente'
    )
      .trim()
      .toLowerCase();
  }

  private obtenerTextoEstado(
    estado: string
  ): string {
    if (
      estado === 'completada' ||
      estado === 'entregado' ||
      estado === 'pagado'
    ) {
      return 'Pagado';
    }

    if (
      estado === 'cancelada' ||
      estado === 'cancelado'
    ) {
      return 'Cancelado';
    }

    return this.capitalizar(
      estado
    );
  }

  private obtenerClaseEstado(
    estado: string
  ): string {
    if (
      estado === 'completada' ||
      estado === 'entregado' ||
      estado === 'pagado'
    ) {
      return 'estado-pagado';
    }

    if (
      estado === 'cancelada' ||
      estado === 'cancelado'
    ) {
      return 'estado-cancelado';
    }

    if (
      estado === 'preparando'
    ) {
      return 'estado-preparando';
    }

    if (
      estado === 'listo'
    ) {
      return 'estado-listo';
    }

    return 'estado-pendiente';
  }

  // ==========================================
  // ROL VISIBLE
  // ==========================================

  private obtenerRolVisible(
    rol: unknown
  ): string {
    const roles: Record<
      string,
      string
    > = {
      admin: 'Administrador',
      cajero: 'Cajero',
      mesero: 'Mesero',
      cocinero: 'Cocinero',
      delivery: 'Motorizado'
    };

    const valor =
      String(
        rol || 'mesero'
      )
        .trim()
        .toLowerCase();

    return (
      roles[valor] ||
      this.capitalizar(valor)
    );
  }

  // ==========================================
  // UTILIDADES NUMÉRICAS
  // ==========================================

  private numeroSeguro(
    valor: unknown
  ): number {
    const numero =
      Number(valor);

    return Number.isFinite(numero)
      ? numero
      : 0;
  }

  private calcularPromedio(
    total: number,
    cantidad: number
  ): number {
    return cantidad > 0
      ? total / cantidad
      : 0;
  }

  private capitalizar(
    valor: string
  ): string {
    if (!valor) {
      return '-';
    }

    return (
      valor.charAt(0).toUpperCase() +
      valor.slice(1)
    );
  }

  // ==========================================
  // VALORES PARA EL HTML
  // ==========================================

  obtenerValor(
    fila: FilaReporte,
    clave: keyof FilaReporte
  ): string | number {
    const valor =
      fila[clave];

    if (
      valor === undefined ||
      valor === null ||
      valor === ''
    ) {
      return '-';
    }

    return valor as string | number;
  }

  obtenerValorNumerico(
    fila: FilaReporte,
    clave: keyof FilaReporte
  ): number {
    return this.numeroSeguro(
      fila[clave]
    );
  }

  calcularSumaCampo(
    campo: keyof FilaReporte
  ): number {
    return this.datosReporte().reduce(
      (suma, fila) =>
        suma +
        this.numeroSeguro(
          fila[campo]
        ),
      0
    );
  }

  calcularTotal(): number {
    return this.calcularSumaCampo(
      'total'
    );
  }

  calcularTotalItems(): number {
    return this.calcularSumaCampo(
      'items'
    );
  }

  calcularTotalVentas(): number {
    switch (
      this.reporteSeleccionado()
    ) {
      case 'ventas':
      case 'pendientes':
      case 'motorizada':
        return this.datosReporte().length;

      case 'semanal':
        return (
          this.calcularSumaCampo(
            'ventas_local'
          ) +
          this.calcularSumaCampo(
            'ventas_motorizado'
          )
        );

      case 'diario':
      case 'mozo':
      case 'cliente':
        return this.calcularSumaCampo(
          'ventas'
        );

      case 'cajero':
      case 'pago':
        return this.calcularSumaCampo(
          'transacciones'
        );

      case 'totales':
        return this.calcularSumaCampo(
          'cantidad'
        );

      default:
        return 0;
    }
  }

  calcularPromedioGeneral(): number {
    return this.calcularPromedio(
      this.calcularTotal(),
      this.calcularTotalVentas()
    );
  }

  calcularTotalSemanal(
    campo:
      | 'ventas_local'
      | 'ventas_motorizado'
      | 'total_local'
      | 'total_motorizado'
  ): number {
    return this.calcularSumaCampo(
      campo
    );
  }

  // ==========================================
  // TOTAL GENERAL DINÁMICO
  // ==========================================

  obtenerValorTotalColumna(
    columna: ColumnaReporte,
    indice: number
  ): string | number {
    if (indice === 0) {
      return 'TOTAL GENERAL';
    }

    switch (
      this.reporteSeleccionado()
    ) {
      case 'ventas':
      case 'pendientes':
      case 'motorizada':
        if (
          columna.clave === 'items'
        ) {
          return this.calcularTotalItems();
        }

        if (
          columna.clave === 'total'
        ) {
          return this.calcularTotal();
        }

        return '';

      case 'semanal':
        if (
          columna.clave ===
          'ventas_local'
        ) {
          return this.calcularTotalSemanal(
            'ventas_local'
          );
        }

        if (
          columna.clave ===
          'ventas_motorizado'
        ) {
          return this.calcularTotalSemanal(
            'ventas_motorizado'
          );
        }

        if (
          columna.clave ===
          'total_local'
        ) {
          return this.calcularTotalSemanal(
            'total_local'
          );
        }

        if (
          columna.clave ===
          'total_motorizado'
        ) {
          return this.calcularTotalSemanal(
            'total_motorizado'
          );
        }

        if (
          columna.clave === 'total'
        ) {
          return this.calcularTotal();
        }

        return '';

      case 'diario':
        if (
          columna.clave === 'ventas'
        ) {
          return this.calcularTotalVentas();
        }

        if (
          columna.clave === 'items'
        ) {
          return this.calcularTotalItems();
        }

        if (
          columna.clave === 'total'
        ) {
          return this.calcularTotal();
        }

        if (
          columna.clave === 'promedio'
        ) {
          return this.calcularPromedioGeneral();
        }

        return '';

      case 'cajero':
      case 'pago':
        if (
          columna.clave ===
          'transacciones'
        ) {
          return this.calcularTotalVentas();
        }

        if (
          columna.clave === 'total'
        ) {
          return this.calcularTotal();
        }

        if (
          columna.clave === 'promedio'
        ) {
          return this.calcularPromedioGeneral();
        }

        return '';

      case 'totales':
        if (
          columna.clave === 'cantidad'
        ) {
          return this.calcularTotalVentas();
        }

        if (
          columna.clave === 'total'
        ) {
          return this.calcularTotal();
        }

        if (
          columna.clave === 'promedio'
        ) {
          return this.calcularPromedioGeneral();
        }

        return '';

      case 'mozo':
      case 'cliente':
        if (
          columna.clave === 'ventas'
        ) {
          return this.calcularTotalVentas();
        }

        if (
          columna.clave === 'total'
        ) {
          return this.calcularTotal();
        }

        if (
          columna.clave === 'promedio'
        ) {
          return this.calcularPromedioGeneral();
        }

        return '';

      default:
        if (
          columna.clave === 'total'
        ) {
          return this.calcularTotal();
        }

        return '';
    }
  }

  // ==========================================
  // VALOR PARA EXPORTACIÓN
  // ==========================================

  private obtenerValorExportacion(
    fila: FilaReporte,
    columna: ColumnaReporte
  ): string | number {
    if (
      columna.tipo === 'tipo'
    ) {
      return (
        fila.tipo_texto ||
        '-'
      );
    }

    if (
      columna.tipo === 'estado'
    ) {
      return (
        fila.estado_texto ||
        '-'
      );
    }

    const valor =
      fila[columna.clave];

    if (
      valor === undefined ||
      valor === null ||
      valor === ''
    ) {
      return '-';
    }

    if (
      columna.tipo === 'moneda'
    ) {
      return this.numeroSeguro(
        valor
      );
    }

    return valor as string | number;
  }
    // ==========================================
  // EXPORTAR EXCEL XLSX
  // ==========================================

  async exportarExcel(): Promise<void> {
    const datos =
      this.datosReporte();

    const columnas =
      this.columnasReporte();

    if (datos.length === 0) {
      alert(
        'No hay datos para exportar'
      );

      return;
    }

    this.loading.set(true);

    try {
      const workbook =
        new ExcelJS.Workbook();

      workbook.creator =
        'Pollería Yacky';

      workbook.company =
        'Pollería Yacky';

      workbook.created =
        new Date();

      const nombreHoja =
        this.nombreReporte()
          .replace(/[\\/*?:[\]]/g, '')
          .substring(0, 31) ||
        'Reporte';

      const worksheet =
        workbook.addWorksheet(
          nombreHoja,
          {
            properties: {
              defaultRowHeight: 20
            },

            views: [
              {
                state: 'frozen',
                ySplit: 7,
                xSplit: 0,
                showGridLines: false
              }
            ],

            pageSetup: {
              orientation: 'landscape',
              fitToPage: true,
              fitToWidth: 1,
              fitToHeight: 0,
              paperSize: 9,
              horizontalCentered: true,

              margins: {
                left: 0.25,
                right: 0.25,
                top: 0.4,
                bottom: 0.4,
                header: 0.2,
                footer: 0.2
              }
            }
          }
        );

      const ultimaColumna =
        columnas.length;

      const colorMarron =
        'FF5E412F';

      const colorDorado =
        'FFE9BD6E';

      const colorNaranja =
        'FFCE8329';

      const colorCrema =
        'FFF5F0E8';

      const colorCremaAlterno =
        'FFFAF8F5';

      const colorBorde =
        'FFD8D1C8';

      const colorTexto =
        'FF2E2E2E';

      // ======================================
      // TÍTULO
      // ======================================

      worksheet.mergeCells(
        1,
        1,
        1,
        ultimaColumna
      );

      const celdaTitulo =
        worksheet.getCell(
          1,
          1
        );

      celdaTitulo.value =
        this.nombreReporte();

      celdaTitulo.font = {
        name: 'Arial',
        size: 20,
        bold: true,

        color: {
          argb: colorMarron
        }
      };

      celdaTitulo.alignment = {
        horizontal: 'left',
        vertical: 'middle'
      };

      worksheet.getRow(1).height =
        34;

      // ======================================
      // PERÍODO
      // ======================================

      worksheet.mergeCells(
        2,
        1,
        2,
        ultimaColumna
      );

      const celdaPeriodo =
        worksheet.getCell(
          2,
          1
        );

      celdaPeriodo.value =
        `Período: ${this.fechaInicio()} ` +
        `al ${this.fechaFin()}`;

      celdaPeriodo.font = {
        name: 'Arial',
        size: 11,
        bold: true,

        color: {
          argb: colorTexto
        }
      };

      celdaPeriodo.alignment = {
        horizontal: 'left',
        vertical: 'middle'
      };

      worksheet.getRow(2).height =
        23;

      for (
        let columna = 1;
        columna <= ultimaColumna;
        columna++
      ) {
        worksheet.getCell(
          2,
          columna
        ).border = {
          bottom: {
            style: 'medium',

            color: {
              argb: colorNaranja
            }
          }
        };
      }

      // ======================================
      // TARJETAS DE RESUMEN
      // ======================================

      const cantidadTarjetas =
        Math.min(
          3,
          ultimaColumna
        );

      const anchosBloque =
        this.distribuirColumnasExcel(
          ultimaColumna,
          cantidadTarjetas
        );

      const tarjetas: Array<{
        etiqueta: string;
        valor: number;
        moneda: boolean;
      }> = [
        {
          etiqueta: 'TOTAL VENTAS',

          valor:
            this.calcularTotalVentas(),

          moneda: false
        },
        {
          etiqueta: 'TOTAL RECAUDADO',

          valor:
            this.calcularTotal(),

          moneda: true
        },
        {
          etiqueta: 'PROMEDIO',

          valor:
            this.calcularPromedioGeneral(),

          moneda: true
        }
      ];

      let inicioTarjeta = 1;

      tarjetas.forEach(
        (tarjeta, indice) => {
          const finTarjeta =
            inicioTarjeta +
            anchosBloque[indice] -
            1;

          worksheet.mergeCells(
            4,
            inicioTarjeta,
            4,
            finTarjeta
          );

          worksheet.mergeCells(
            5,
            inicioTarjeta,
            5,
            finTarjeta
          );

          const etiqueta =
            worksheet.getCell(
              4,
              inicioTarjeta
            );

          const valor =
            worksheet.getCell(
              5,
              inicioTarjeta
            );

          etiqueta.value =
            tarjeta.etiqueta;

          valor.value =
            tarjeta.valor;

          etiqueta.font = {
            name: 'Arial',
            size: 10,

            color: {
              argb: 'FF6B625C'
            }
          };

          valor.font = {
            name: 'Arial',
            size: 14,
            bold: true,

            color: {
              argb: colorMarron
            }
          };

          etiqueta.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          };

          valor.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          };

          if (tarjeta.moneda) {
            valor.numFmt =
              '"S/ " #,##0.00';
          }

          for (
            let fila = 4;
            fila <= 5;
            fila++
          ) {
            for (
              let columna = inicioTarjeta;
              columna <= finTarjeta;
              columna++
            ) {
              const celda =
                worksheet.getCell(
                  fila,
                  columna
                );

              celda.fill = {
                type: 'pattern',
                pattern: 'solid',

                fgColor: {
                  argb: colorCrema
                }
              };

              celda.border =
                this.bordeExcel(
                  colorBorde
                );
            }
          }

          inicioTarjeta =
            finTarjeta + 1;
        }
      );

      worksheet.getRow(4).height =
        24;

      worksheet.getRow(5).height =
        28;

      // ======================================
      // ENCABEZADOS DE LA TABLA
      // ======================================

      const filaEncabezado = 7;

      columnas.forEach(
        (columna, indice) => {
          const celda =
            worksheet.getCell(
              filaEncabezado,
              indice + 1
            );

          celda.value =
            columna.titulo;

          celda.font = {
            name: 'Arial',
            size: 10,
            bold: true,

            color: {
              argb: colorDorado
            }
          };

          celda.fill = {
            type: 'pattern',
            pattern: 'solid',

            fgColor: {
              argb: colorMarron
            }
          };

          celda.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true
          };

          celda.border =
            this.bordeExcel(
              'FF765844'
            );
        }
      );

      worksheet
        .getRow(filaEncabezado)
        .height = 32;

      // ======================================
      // FILAS DE DATOS
      // ======================================

      datos.forEach(
        (fila, indiceFila) => {
          const numeroFila =
            filaEncabezado +
            indiceFila +
            1;

          columnas.forEach(
            (
              columna,
              indiceColumna
            ) => {
              const celda =
                worksheet.getCell(
                  numeroFila,
                  indiceColumna + 1
                );

              celda.value =
                this.obtenerValorExportacion(
                  fila,
                  columna
                );

              celda.font = {
                name: 'Arial',
                size: 10,

                color: {
                  argb: colorTexto
                }
              };

              celda.alignment = {
                horizontal:
                  columna.tipo ===
                    'moneda' ||
                  columna.tipo ===
                    'numero'
                    ? 'right'
                    : 'center',

                vertical: 'middle',
                wrapText: false
              };

              celda.border =
                this.bordeExcel(
                  colorBorde
                );

              if (
                indiceFila % 2 === 1
              ) {
                celda.fill = {
                  type: 'pattern',
                  pattern: 'solid',

                  fgColor: {
                    argb:
                      colorCremaAlterno
                  }
                };
              }

              if (
                columna.tipo ===
                'moneda'
              ) {
                celda.numFmt =
                  '"S/ " #,##0.00';
              }
            }
          );

          worksheet
            .getRow(numeroFila)
            .height = 23;
        }
      );

      // ======================================
      // FILA TOTAL GENERAL
      // ======================================

      const filaTotal =
        filaEncabezado +
        datos.length +
        1;

      const primerIndiceTotalizable =
        this.obtenerPrimerIndiceTotalizable();

      const columnasEtiqueta =
        Math.max(
          primerIndiceTotalizable,
          1
        );

      if (columnasEtiqueta > 1) {
        worksheet.mergeCells(
          filaTotal,
          1,
          filaTotal,
          columnasEtiqueta
        );
      }

      const celdaTotalGeneral =
        worksheet.getCell(
          filaTotal,
          1
        );

      celdaTotalGeneral.value =
        'TOTAL GENERAL';

      celdaTotalGeneral.alignment = {
        horizontal: 'left',
        vertical: 'middle',
        wrapText: false
      };

      for (
        let indice = 0;
        indice < columnas.length;
        indice++
      ) {
        const numeroColumna =
          indice + 1;

        const celda =
          worksheet.getCell(
            filaTotal,
            numeroColumna
          );

        if (
          numeroColumna >
          columnasEtiqueta
        ) {
          celda.value =
            this.obtenerValorTotalColumna(
              columnas[indice],
              indice
            );
        }

        celda.font = {
          name: 'Arial',
          size: 11,
          bold: true,

          color: {
            argb: colorMarron
          }
        };

        celda.fill = {
          type: 'pattern',
          pattern: 'solid',

          fgColor: {
            argb: colorCrema
          }
        };

        celda.alignment = {
          horizontal:
            numeroColumna <=
            columnasEtiqueta
              ? 'left'
              : (
                    columnas[indice]
                      .tipo ===
                      'moneda' ||
                    columnas[indice]
                      .tipo ===
                      'numero'
                )
                ? 'right'
                : 'center',

          vertical: 'middle',
          wrapText: false
        };

        celda.border = {
          ...this.bordeExcel(
            colorBorde
          ),

          top: {
            style: 'medium',

            color: {
              argb: colorNaranja
            }
          }
        };

        if (
          numeroColumna >
            columnasEtiqueta &&
          columnas[indice].tipo ===
            'moneda' &&
          typeof celda.value ===
            'number'
        ) {
          celda.numFmt =
            '"S/ " #,##0.00';
        }
      }

      worksheet
        .getRow(filaTotal)
        .height = 28;

      // ======================================
      // ANCHOS DE LAS COLUMNAS
      // ======================================

      columnas.forEach(
        (columna, indice) => {
          worksheet.getColumn(
            indice + 1
          ).width =
            this.obtenerAnchoColumnaExcel(
              columna,
              datos
            );
        }
      );

      // ======================================
      // FILTROS AUTOMÁTICOS
      // ======================================

      worksheet.autoFilter = {
        from: {
          row: filaEncabezado,
          column: 1
        },

        to: {
          row:
            filaEncabezado +
            datos.length,

          column:
            ultimaColumna
        }
      };

      // ======================================
      // IMPRESIÓN
      // ======================================

      const letraUltimaColumna =
        worksheet.getColumn(
          ultimaColumna
        ).letter;

      worksheet.pageSetup.printArea =
        `A1:${letraUltimaColumna}` +
        `${filaTotal}`;

      worksheet.pageSetup.printTitlesRow =
        `${filaEncabezado}:` +
        `${filaEncabezado}`;

      // ======================================
      // PIE DEL REPORTE
      // ======================================

      const filaPie =
        filaTotal + 2;

      worksheet.mergeCells(
        filaPie,
        1,
        filaPie,
        ultimaColumna
      );

      const celdaPie =
        worksheet.getCell(
          filaPie,
          1
        );

      celdaPie.value =
        'Pollería Yacky · ' +
        'Sistema de Administración · ' +
        'Reporte generado el ' +
        new Date().toLocaleString(
          'es-PE'
        );

      celdaPie.font = {
        name: 'Arial',
        size: 9,

        color: {
          argb: 'FF666666'
        }
      };

      celdaPie.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };

      celdaPie.border = {
        top: {
          style: 'thin',

          color: {
            argb: colorBorde
          }
        }
      };

      worksheet
        .getRow(filaPie)
        .height = 22;

      // ======================================
      // DESCARGAR ARCHIVO
      // ======================================

      const buffer =
        await workbook.xlsx.writeBuffer();

      const archivo =
        new Blob(
          [buffer],
          {
            type:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        );

      const nombreArchivo =
        `${this.nombreReporte()
          .replace(/\s+/g, '_')}_` +
        `${this.fechaInicio()}_` +
        `${this.fechaFin()}.xlsx`;

      saveAs(
        archivo,
        nombreArchivo
      );
    } catch (error) {
      console.error(
        'Error al exportar Excel:',
        error
      );

      alert(
        'No se pudo generar el archivo Excel'
      );
    } finally {
      this.loading.set(false);
    }
  }

  // ==========================================
  // DISTRIBUIR COLUMNAS DEL RESUMEN
  // ==========================================

  private distribuirColumnasExcel(
    totalColumnas: number,
    cantidadBloques: number
  ): number[] {
    const base =
      Math.floor(
        totalColumnas /
        cantidadBloques
      );

    const sobrantes =
      totalColumnas %
      cantidadBloques;

    return Array.from(
      {
        length:
          cantidadBloques
      },

      (_, indice) =>
        base +
        (
          indice < sobrantes
            ? 1
            : 0
        )
    );
  }

  // ==========================================
  // PRIMERA COLUMNA TOTALIZABLE
  // ==========================================

  private obtenerPrimerIndiceTotalizable():
    number {
    const columnas =
      this.columnasReporte();

    let clavesTotalizables:
      Array<keyof FilaReporte>;

    switch (
      this.reporteSeleccionado()
    ) {
      case 'semanal':
        clavesTotalizables = [
          'ventas_local',
          'ventas_motorizado',
          'total_local',
          'total_motorizado',
          'total'
        ];
        break;

      case 'ventas':
      case 'pendientes':
      case 'motorizada':
        clavesTotalizables = [
          'items',
          'total'
        ];
        break;

      case 'diario':
        clavesTotalizables = [
          'ventas',
          'items',
          'total',
          'promedio'
        ];
        break;

      case 'cajero':
      case 'pago':
        clavesTotalizables = [
          'transacciones',
          'total',
          'promedio'
        ];
        break;

      case 'totales':
        clavesTotalizables = [
          'cantidad',
          'total',
          'promedio'
        ];
        break;

      case 'mozo':
      case 'cliente':
        clavesTotalizables = [
          'ventas',
          'total',
          'promedio'
        ];
        break;

      default:
        clavesTotalizables = [
          'total'
        ];
        break;
    }

    const indice =
      columnas.findIndex(
        columna =>
          clavesTotalizables.includes(
            columna.clave
          )
      );

    return indice > 0
      ? indice
      : 1;
  }

  // ==========================================
  // ANCHO AUTOMÁTICO DE COLUMNA
  // ==========================================

  private obtenerAnchoColumnaExcel(
    columna: ColumnaReporte,
    datos: FilaReporte[]
  ): number {
    const anchosBase:
      Partial<
        Record<
          keyof FilaReporte,
          number
        >
      > = {
        id: 10,
        fecha: 25,
        fecha_desde: 16,
        fecha_hasta: 16,
        semana: 16,
        cliente: 24,
        items: 11,
        usuario: 20,
        rol: 16,
        ventas: 20,
        transacciones: 18,
        cantidad: 14,
        categoria: 20,
        metodo_pago: 20,
        tipo_entrega: 17,
        estado: 15,
        ventas_local: 13,
        ventas_motorizado: 18,
        total_local: 18,
        total_motorizado: 22,
        total: 17,
        promedio: 17
      };

    const anchoBase =
      anchosBase[columna.clave] ||
      15;

    const longitudEncabezado =
      columna.titulo.length + 4;

    const longitudDatos =
      datos.reduce(
        (maximo, fila) => {
          const valor =
            this.obtenerValorExportacion(
              fila,
              columna
            );

          return Math.max(
            maximo,
            String(
              valor ?? ''
            ).length + 2
          );
        },
        0
      );

    const anchoMaximo =
      columna.clave === 'fecha'
        ? 28
        : 30;

    return Math.min(
      Math.max(
        anchoBase,
        longitudEncabezado,
        longitudDatos
      ),
      anchoMaximo
    );
  }

  // ==========================================
  // BORDES DEL EXCEL
  // ==========================================

  private bordeExcel(
    color: string
  ): Partial<ExcelJS.Borders> {
    return {
      top: {
        style: 'thin',

        color: {
          argb: color
        }
      },

      left: {
        style: 'thin',

        color: {
          argb: color
        }
      },

      right: {
        style: 'thin',

        color: {
          argb: color
        }
      },

      bottom: {
        style: 'thin',

        color: {
          argb: color
        }
      }
    };
  }

  // ==========================================
  // EXPORTAR PDF
  // ==========================================

  exportarPDF(): void {
    const datos =
      this.datosReporte();

    const columnas =
      this.columnasReporte();

    if (datos.length === 0) {
      alert(
        'No hay datos para exportar'
      );

      return;
    }

    const ventana =
      window.open(
        '',
        '_blank'
      );

    if (!ventana) {
      alert(
        'El navegador bloqueó ' +
        'la ventana de impresión'
      );

      return;
    }

    const encabezados =
      columnas
        .map(columna => {
          return `
            <th>
              ${this.escaparHTML(
                columna.titulo
              )}
            </th>
          `;
        })
        .join('');

    const filas =
      datos
        .map(fila => {
          const celdas =
            columnas
              .map(columna => {
                const valor =
                  this.obtenerValorExportacion(
                    fila,
                    columna
                  );

                const texto =
                  columna.tipo ===
                  'moneda'
                    ? (
                        'S/ ' +
                        this.numeroSeguro(
                          valor
                        ).toFixed(2)
                      )
                    : String(valor);

                const clase =
                  columna.tipo ===
                    'moneda' ||
                  columna.tipo ===
                    'numero'
                    ? 'numero'
                    : '';

                return `
                  <td class="${clase}">
                    ${this.escaparHTML(
                      texto
                    )}
                  </td>
                `;
              })
              .join('');

          return `
            <tr>
              ${celdas}
            </tr>
          `;
        })
        .join('');

    const celdasTotales =
      columnas
        .map(
          (columna, indice) => {
            const valor =
              this.obtenerValorTotalColumna(
                columna,
                indice
              );

            let texto = '';

            if (
              valor !== '' &&
              valor !== null &&
              valor !== undefined
            ) {
              texto =
                columna.tipo ===
                'moneda'
                  ? (
                      'S/ ' +
                      this.numeroSeguro(
                        valor
                      ).toFixed(2)
                    )
                  : String(valor);
            }

            const clase =
              columna.tipo ===
                'moneda' ||
              columna.tipo ===
                'numero'
                ? 'numero'
                : '';

            return `
              <td class="${clase}">
                ${this.escaparHTML(
                  texto
                )}
              </td>
            `;
          }
        )
        .join('');

    const resumen =
      this.resumenReporte();

    const resumenLocal =
      resumen.local &&
      resumen.local.cantidad > 0
        ? `
          <div class="resumen-item">
            <span class="resumen-etiqueta">
              Local
            </span>

            <span class="resumen-valor">
              ${this.numeroSeguro(
                resumen.local.cantidad
              )}
              venta(s) ·
              S/
              ${this.numeroSeguro(
                resumen.local.total
              ).toFixed(2)}
            </span>
          </div>
        `
        : '';

    const resumenMotorizado =
      resumen.motorizado &&
      resumen.motorizado.cantidad > 0
        ? `
          <div class="resumen-item">
            <span class="resumen-etiqueta">
              Motorizado
            </span>

            <span class="resumen-valor">
              ${this.numeroSeguro(
                resumen.motorizado.cantidad
              )}
              venta(s) ·
              S/
              ${this.numeroSeguro(
                resumen.motorizado.total
              ).toFixed(2)}
            </span>
          </div>
        `
        : '';

    ventana.document.write(`
      <!DOCTYPE html>

      <html lang="es">
        <head>
          <meta charset="UTF-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >

          <title>
            ${this.escaparHTML(
              this.nombreReporte()
            )}
          </title>

          <style>
            @page {
              size: landscape;
              margin: 12mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 10px;
              font-family: Arial, Helvetica, sans-serif;
              color: #2e2e2e;
              background: #ffffff;
            }

            h1 {
              margin: 0 0 8px;
              padding-bottom: 8px;
              color: #5e412f;
              border-bottom: 2px solid #ce8329;
              font-size: 22px;
            }

            .periodo {
              margin: 8px 0 16px;
              font-size: 12px;
            }

            .resumen {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-bottom: 18px;
            }

            .resumen-item {
              min-width: 155px;
              padding: 10px 13px;
              border: 1px solid #ddd2c4;
              border-radius: 6px;
              background: #f5f0e8;
            }

            .resumen-etiqueta {
              display: block;
              margin-bottom: 5px;
              color: #6b625c;
              font-size: 10px;
              text-transform: uppercase;
            }

            .resumen-valor {
              color: #5e412f;
              font-size: 14px;
              font-weight: bold;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: auto;
              font-size: 10px;
            }

            thead {
              display: table-header-group;
            }

            tfoot {
              display: table-row-group;
            }

            tr {
              page-break-inside: avoid;
            }

            th {
              padding: 8px 5px;
              border: 1px solid #765844;
              background: #5e412f;
              color: #e9bd6e;
              text-align: center;
              white-space: normal;
            }

            td {
              padding: 8px 5px;
              border: 1px solid #dedede;
              text-align: center;
              vertical-align: middle;
            }

            tbody tr:nth-child(even) {
              background: #faf8f5;
            }

            td.numero {
              text-align: right;
              white-space: nowrap;
            }

            .total-general td {
              background: #f5f0e8;
              color: #5e412f;
              font-weight: bold;
              border-top: 2px solid #ce8329;
            }

            .footer {
              margin-top: 20px;
              padding-top: 12px;
              border-top: 1px solid #dddddd;
              text-align: center;
              color: #666666;
              font-size: 10px;
            }

            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>

        <body>
          <h1>
            ${this.escaparHTML(
              this.nombreReporte()
            )}
          </h1>

          <div class="periodo">
            <strong>Período:</strong>

            ${this.escaparHTML(
              this.fechaInicio()
            )}

            al

            ${this.escaparHTML(
              this.fechaFin()
            )}
          </div>

          <div class="resumen">
            <div class="resumen-item">
              <span class="resumen-etiqueta">
                Total Ventas
              </span>

              <span class="resumen-valor">
                ${this.calcularTotalVentas()}
              </span>
            </div>

            <div class="resumen-item">
              <span class="resumen-etiqueta">
                Total Recaudado
              </span>

              <span class="resumen-valor">
                S/
                ${this.calcularTotal()
                  .toFixed(2)}
              </span>
            </div>

            <div class="resumen-item">
              <span class="resumen-etiqueta">
                Promedio
              </span>

              <span class="resumen-valor">
                S/
                ${this.calcularPromedioGeneral()
                  .toFixed(2)}
              </span>
            </div>

            ${resumenLocal}

            ${resumenMotorizado}
          </div>

          <table>
            <thead>
              <tr>
                ${encabezados}
              </tr>
            </thead>

            <tbody>
              ${filas}
            </tbody>

            <tfoot>
              <tr class="total-general">
                ${celdasTotales}
              </tr>
            </tfoot>
          </table>

          <div class="footer">
            Pollería Yacky ·
            Sistema de Administración ·
            Reporte generado el
            ${this.escaparHTML(
              new Date().toLocaleString(
                'es-PE'
              )
            )}
          </div>
        </body>
      </html>
    `);

    ventana.document.close();

    setTimeout(() => {
      ventana.focus();

      ventana.print();
    }, 350);
  }

  // ==========================================
  // ESCAPAR CONTENIDO HTML
  // ==========================================

  private escaparHTML(
    valor: unknown
  ): string {
    return String(
      valor ?? ''
    )
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );
  }
}