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
  dia?: string;

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
    id: 'pendientes',
    nombre: 'Pedidos Pendientes'
  },
  {
    id: 'diario',
    nombre: 'Venta Diaria'
  },
  {
    id: 'semanal',
    nombre: 'Venta por Semana'
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

      case 'semanal':
        return [
          {
            clave: 'id',
            titulo: 'ID',
            tipo: 'id'
          },
          {
            clave: 'dia',
            titulo: 'Día',
            tipo: 'texto'
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
            clave: 'tipo_entrega',
            titulo: 'Tipo',
            tipo: 'tipo'
          },
          {
            clave: 'total',
            titulo: 'Total',
            tipo: 'moneda'
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

    const haceSieteDias = new Date(hoy);

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
      this.fechaFin.set(
        this.fechaInicio()
      );
    }
  }

  // ==========================================
  // CARGAR DATOS
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

    this.ventaService.obtenerVentas().subscribe({
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
  // GENERAR REPORTE SELECCIONADO
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
        venta => this.armarFilaVenta(venta)
      );

    this.publicarReporte(
      filas,
      ventasFiltradas.length,
      this.desglosePorTipo(ventasFiltradas)
    );
  }

  // ==========================================
  // PEDIDOS PENDIENTES
  // ==========================================

  private generarReportePendientes(): void {
    const pedidosFiltrados =
      this.filtrarPorRango(
        this.pedidosPendientes(),
        'created_at'
      );

    const filas: FilaReporte[] =
      pedidosFiltrados.map(pedido => {
        return this.armarFilaVenta({
          ...pedido,
          fecha_venta: pedido.created_at,
          estado: pedido.estado || 'pendiente'
        });
      });

    this.publicarReporte(
      filas,
      pedidosFiltrados.length,
      this.desglosePorTipo(pedidosFiltrados)
    );
  }

  // ==========================================
  // VENTA DIARIA
  // ==========================================

  private generarReporteDiario(): void {
    const ventasFiltradas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const agrupacion: Record<
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

      if (!agrupacion[fecha]) {
        agrupacion[fecha] = {
          ventas: 0,
          items: 0,
          total: 0
        };
      }

      agrupacion[fecha].ventas++;

      agrupacion[fecha].items +=
        this.contarItems(
          venta.items
        );

      agrupacion[fecha].total +=
        this.numeroSeguro(
          venta.total
        );
    });

    const filas: FilaReporte[] =
      Object.entries(agrupacion)
        .sort(
          ([fechaA], [fechaB]) =>
            fechaB.localeCompare(fechaA)
        )
        .map(
          ([fecha, informacion], indice) => {
            return {
              id: indice + 1,

              fecha:
                this.formatearFechaSoloDia(
                  fecha
                ),

              ventas:
                informacion.ventas,

              items:
                informacion.items,

              total:
                informacion.total,

              promedio:
                this.calcularPromedio(
                  informacion.total,
                  informacion.ventas
                )
            };
          }
        );

    this.publicarReporte(
      filas,
      ventasFiltradas.length
    );
  }

  // ==========================================
  // VENTA POR SEMANA
  // ==========================================
  // La semana se muestra de lunes a domingo.
  // Se incluyen los días sin ventas.
  // ==========================================

  private generarReporteSemanal(): void {
    const fechaInicioSeleccionada =
      this.crearFechaLocal(
        this.fechaInicio()
      );

    const fechaFinSeleccionada =
      this.crearFechaLocal(
        this.fechaFin()
      );

    if (
      !fechaInicioSeleccionada ||
      !fechaFinSeleccionada
    ) {
      this.publicarReporte([], 0);

      return;
    }

    const inicioSemana =
      this.obtenerLunesSemana(
        fechaInicioSeleccionada
      );

    const finSemana =
      this.obtenerDomingoSemana(
        fechaFinSeleccionada
      );

    const inicioTexto =
      this.fechaClave(inicioSemana);

    const finTexto =
      this.fechaClave(finSemana);

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
          fecha >= inicioTexto &&
          fecha <= finTexto
        );
      });

    const agrupacion: Record<
      string,
      {
        ventas: number;
        total: number;
        cantidadLocal: number;
        cantidadMotorizado: number;
      }
    > = {};

    ventasFiltradas.forEach(venta => {
      const fecha =
        this.obtenerFechaComparacion(
          venta.fecha_venta ||
          venta.created_at
        );

      if (!fecha) {
        return;
      }

      if (!agrupacion[fecha]) {
        agrupacion[fecha] = {
          ventas: 0,
          total: 0,
          cantidadLocal: 0,
          cantidadMotorizado: 0
        };
      }

      const tipo =
        this.normalizarTipo(
          venta.tipo_entrega ||
          venta.tipo
        );

      agrupacion[fecha].ventas++;

      agrupacion[fecha].total +=
        this.numeroSeguro(
          venta.total
        );

      if (tipo === 'delivery') {
        agrupacion[fecha]
          .cantidadMotorizado++;
      } else {
        agrupacion[fecha]
          .cantidadLocal++;
      }
    });

    const filas: FilaReporte[] = [];

    const fechaActual =
      new Date(inicioSemana);

    while (
      fechaActual.getTime() <=
      finSemana.getTime()
    ) {
      const claveFecha =
        this.fechaClave(fechaActual);

      const informacion =
        agrupacion[claveFecha] || {
          ventas: 0,
          total: 0,
          cantidadLocal: 0,
          cantidadMotorizado: 0
        };

      const tipoDia =
        this.obtenerTipoDelDia(
          informacion.cantidadLocal,
          informacion.cantidadMotorizado
        );

      filas.push({
        id: filas.length + 1,

        dia:
          this.obtenerNombreDia(
            fechaActual
          ),

        fecha:
          this.formatearFechaSoloDia(
            claveFecha
          ),

        ventas:
          informacion.ventas,

        tipo_entrega:
          tipoDia.clave,

        tipo_texto:
          tipoDia.texto,

        tipo_clase:
          tipoDia.clase,

        total:
          informacion.total
      });

      fechaActual.setDate(
        fechaActual.getDate() + 1
      );
    }

    this.publicarReporte(
      filas,
      ventasFiltradas.length,
      this.desglosePorTipo(ventasFiltradas)
    );
  }

  // ==========================================
  // DIARIO DE CAJERO
  // ==========================================

  private generarReporteCajero(): void {
    const ventasFiltradas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const agrupacion: Record<
      string,
      {
        transacciones: number;
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

      if (!agrupacion[fecha]) {
        agrupacion[fecha] = {
          transacciones: 0,
          total: 0
        };
      }

      agrupacion[fecha].transacciones++;

      agrupacion[fecha].total +=
        this.numeroSeguro(
          venta.total
        );
    });

    const filas: FilaReporte[] =
      Object.entries(agrupacion)
        .sort(
          ([fechaA], [fechaB]) =>
            fechaB.localeCompare(fechaA)
        )
        .map(
          ([fecha, informacion], indice) => {
            return {
              id: indice + 1,

              fecha:
                this.formatearFechaSoloDia(
                  fecha
                ),

              transacciones:
                informacion.transacciones,

              total:
                informacion.total,

              promedio:
                this.calcularPromedio(
                  informacion.total,
                  informacion.transacciones
                )
            };
          }
        );

    this.publicarReporte(
      filas,
      ventasFiltradas.length
    );
  }

  // ==========================================
  // VENTAS TOTALES
  // ==========================================
  // Solamente muestra Local o Motorizado.
  // Para llevar se clasifica como Local.
  // ==========================================

  private generarReporteTotales(): void {
    const ventasFiltradas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const desglose =
      this.desglosePorTipo(
        ventasFiltradas
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
      ventasFiltradas.length,
      desglose
    );
  }

  // ==========================================
  // FORMAS DE PAGO
  // ==========================================

  private generarReportePago(): void {
    const ventasFiltradas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const agrupacion: Record<
      string,
      {
        transacciones: number;
        total: number;
      }
    > = {};

    ventasFiltradas.forEach(venta => {
      const metodo = String(
        venta.metodo_pago ||
        'no_especificado'
      )
        .trim()
        .toLowerCase();

      if (!agrupacion[metodo]) {
        agrupacion[metodo] = {
          transacciones: 0,
          total: 0
        };
      }

      agrupacion[metodo]
        .transacciones++;

      agrupacion[metodo].total +=
        this.numeroSeguro(
          venta.total
        );
    });

    const filas: FilaReporte[] =
      Object.entries(agrupacion)
        .sort(
          (
            [, informacionA],
            [, informacionB]
          ) =>
            informacionB.total -
            informacionA.total
        )
        .map(
          ([metodo, informacion], indice) => {
            return {
              id: indice + 1,

              metodo_pago:
                ETIQUETA_METODO_PAGO[
                  metodo
                ] ||
                this.capitalizar(
                  metodo
                ),

              transacciones:
                informacion.transacciones,

              total:
                informacion.total,

              promedio:
                this.calcularPromedio(
                  informacion.total,
                  informacion.transacciones
                )
            };
          }
        );

    this.publicarReporte(
      filas,
      ventasFiltradas.length
    );
  }

  // ==========================================
  // VENTAS POR MOZO
  // ==========================================

  private generarReporteMozo(): void {
    const ventasFiltradas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const agrupacion: Record<
      string,
      {
        usuario: string;
        rol: string;
        ventas: number;
        total: number;
      }
    > = {};

    ventasFiltradas.forEach(venta => {
      const usuarioId = String(
        venta.usuario_id ??
        venta.usuario_nombre ??
        'desconocido'
      );

      if (!agrupacion[usuarioId]) {
        agrupacion[usuarioId] = {
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

      agrupacion[usuarioId].ventas++;

      agrupacion[usuarioId].total +=
        this.numeroSeguro(
          venta.total
        );
    });

    const filas: FilaReporte[] =
      Object.values(agrupacion)
        .sort(
          (a, b) =>
            b.total - a.total
        )
        .map(
          (informacion, indice) => {
            return {
              id: indice + 1,

              usuario:
                informacion.usuario,

              rol:
                informacion.rol,

              ventas:
                informacion.ventas,

              total:
                informacion.total,

              promedio:
                this.calcularPromedio(
                  informacion.total,
                  informacion.ventas
                )
            };
          }
        );

    this.publicarReporte(
      filas,
      ventasFiltradas.length
    );
  }

  // ==========================================
  // VENTAS POR CLIENTE
  // ==========================================

  private generarReporteCliente(): void {
    const ventasFiltradas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      );

    const agrupacion: Record<
      string,
      {
        cliente: string;
        ventas: number;
        total: number;
      }
    > = {};

    ventasFiltradas.forEach(venta => {
      const cliente =
        venta.cliente_nombre_real ||
        venta.cliente_nombre ||
        venta.cliente ||
        'Consumidor Final';

      const clienteId = String(
        venta.cliente_id ??
        cliente.toLowerCase()
      );

      if (!agrupacion[clienteId]) {
        agrupacion[clienteId] = {
          cliente,
          ventas: 0,
          total: 0
        };
      }

      agrupacion[clienteId].ventas++;

      agrupacion[clienteId].total +=
        this.numeroSeguro(
          venta.total
        );
    });

    const filas: FilaReporte[] =
      Object.values(agrupacion)
        .sort(
          (a, b) =>
            b.total - a.total
        )
        .map(
          (informacion, indice) => {
            return {
              id: indice + 1,

              cliente:
                informacion.cliente,

              ventas:
                informacion.ventas,

              total:
                informacion.total,

              promedio:
                this.calcularPromedio(
                  informacion.total,
                  informacion.ventas
                )
            };
          }
        );

    this.publicarReporte(
      filas,
      ventasFiltradas.length
    );
  }

  // ==========================================
  // VENTAS MOTORIZADAS
  // ==========================================

  private generarReporteMotorizada(): void {
    const ventasMotorizadas =
      this.filtrarPorRango(
        this.ventas(),
        'fecha_venta'
      ).filter(venta => {
        return this.normalizarTipo(
          venta.tipo_entrega ||
          venta.tipo
        ) === 'delivery';
      });

    const filas =
      ventasMotorizadas.map(
        venta => this.armarFilaVenta(venta)
      );

    this.publicarReporte(
      filas,
      ventasMotorizadas.length,
      {
        local: {
          cantidad: 0,
          total: 0
        },
        motorizado: {
          cantidad:
            ventasMotorizadas.length,

          total:
            ventasMotorizadas.reduce(
              (suma, venta) =>
                suma +
                this.numeroSeguro(
                  venta.total
                ),
              0
            )
        }
      }
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

    this.datosReporte.set(filas);

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
      id: venta.id,

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
  // NORMALIZAR TIPO
  // ==========================================
  // Solo devuelve local o delivery.
  // Para llevar se clasifica como Local.
  // ==========================================

  private normalizarTipo(
    valor: unknown
  ): 'local' | 'delivery' {
    const tipo = String(
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
  // TIPO DEL DÍA SEMANAL
  // ==========================================

  private obtenerTipoDelDia(
    cantidadLocal: number,
    cantidadMotorizado: number
  ): {
    clave: string;
    texto: string;
    clase: string;
  } {
    if (
      cantidadLocal === 0 &&
      cantidadMotorizado === 0
    ) {
      return {
        clave: 'sin-ventas',
        texto: 'Sin ventas',
        clase: 'tipo-local'
      };
    }

    if (
      cantidadLocal > 0 &&
      cantidadMotorizado > 0
    ) {
      return {
        clave: 'mixto',
        texto: 'Local / Motorizado',
        clase: 'tipo-local'
      };
    }

    if (cantidadMotorizado > 0) {
      return {
        clave: 'delivery',
        texto: 'Motorizado',
        clase: 'tipo-delivery'
      };
    }

    return {
      clave: 'local',
      texto: 'Local',
      clase: 'tipo-local'
    };
  }

  // ==========================================
  // TIPO GENERAL DE LA SEMANA
  // ==========================================

  obtenerTipoTotalSemanal(): string {
    const filas =
      this.datosReporte();

    const tieneLocal =
      filas.some(
        fila =>
          fila.tipo_entrega === 'local' ||
          fila.tipo_entrega === 'mixto'
      );

    const tieneMotorizado =
      filas.some(
        fila =>
          fila.tipo_entrega === 'delivery' ||
          fila.tipo_entrega === 'mixto'
      );

    if (
      tieneLocal &&
      tieneMotorizado
    ) {
      return 'Local / Motorizado';
    }

    if (tieneLocal) {
      return 'Local';
    }

    if (tieneMotorizado) {
      return 'Motorizado';
    }

    return 'Sin ventas';
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
  // FECHAS
  // ==========================================

  private filtrarPorRango(
    registros: any[],
    campoFecha: string
  ): any[] {
    return registros.filter(registro => {
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
    });
  }

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

    if (isNaN(fecha.getTime())) {
      return null;
    }

    return this.fechaClave(fecha);
  }

  private crearFechaLocal(
    valor: string
  ): Date | null {
    const coincidencia =
      valor.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (!coincidencia) {
      return null;
    }

    const fecha =
      new Date(
        Number(coincidencia[1]),
        Number(coincidencia[2]) - 1,
        Number(coincidencia[3]),
        0,
        0,
        0,
        0
      );

    if (isNaN(fecha.getTime())) {
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

    if (partes.length !== 3) {
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

    if (isNaN(fecha.getTime())) {
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

    const diaSemana =
      resultado.getDay();

    const diferencia =
      diaSemana === 0
        ? -6
        : 1 - diaSemana;

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

  private obtenerNombreDia(
    fecha: Date
  ): string {
    const dias = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado'
    ];

    return dias[
      fecha.getDay()
    ];
  }

  // ==========================================
  // ITEMS
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

    if (estado === 'listo') {
      return 'estado-listo';
    }

    return 'estado-pendiente';
  }

  // ==========================================
  // UTILIDADES
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

  private obtenerRolVisible(
    rol: unknown
  ): string {
    const valor =
      String(
        rol || 'mesero'
      )
        .trim()
        .toLowerCase();

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

    return (
      roles[valor] ||
      this.capitalizar(valor)
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

  calcularTotal(): number {
    return this.datosReporte().reduce(
      (suma, fila) =>
        suma +
        this.numeroSeguro(
          fila.total
        ),
      0
    );
  }

  calcularTotalVentasReporte(): number {
    return this.datosReporte().reduce(
      (suma, fila) =>
        suma +
        this.numeroSeguro(
          fila.ventas
        ),
      0
    );
  }

  // ==========================================
  // EXPORTAR EXCEL COMO CSV
  // ==========================================

  exportarExcel(): void {
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

    const filas: Array<
      Array<string | number>
    > = [];

    filas.push(
      columnas.map(
        columna =>
          columna.titulo
      )
    );

    datos.forEach(fila => {
      filas.push(
        columnas.map(columna => {
          return this.obtenerValorExportacion(
            fila,
            columna
          );
        })
      );
    });

    filas.push([]);

    if (
      this.reporteSeleccionado() ===
      'semanal'
    ) {
      filas.push([
        'TOTAL GENERAL',
        '',
        '',
        this.calcularTotalVentasReporte(),
        this.obtenerTipoTotalSemanal(),
        this.calcularTotal().toFixed(2)
      ]);
    } else {
      const filaTotal:
        Array<string | number> =
        new Array(
          columnas.length
        ).fill('');

      filaTotal[0] =
        'TOTAL GENERAL';

      filaTotal[
        columnas.length - 1
      ] =
        this.calcularTotal().toFixed(2);

      filas.push(filaTotal);
    }

    const csv =
      filas.map(fila => {
        return fila
          .map(celda => {
            const texto =
              String(
                celda ?? ''
              ).replace(
                /"/g,
                '""'
              );

            return `"${texto}"`;
          })
          .join(';');
      }).join('\r\n');

    const blob =
      new Blob(
        ['\ufeff' + csv],
        {
          type:
            'text/csv;charset=utf-8;'
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const enlace =
      document.createElement(
        'a'
      );

    enlace.href = url;

    enlace.download =
      `${this.nombreReporte()
        .replace(/\s+/g, '_')}_` +
      `${this.fechaInicio()}_` +
      `${this.fechaFin()}.csv`;

    document.body.appendChild(
      enlace
    );

    enlace.click();

    document.body.removeChild(
      enlace
    );

    URL.revokeObjectURL(
      url
    );
  }

  // ==========================================
  // EXPORTAR PDF MEDIANTE IMPRESIÓN
  // ==========================================

  exportarPDF(): void {
    if (
      this.datosReporte().length === 0
    ) {
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
        'El navegador bloqueó la ventana de impresión'
      );

      return;
    }

    const columnas =
      this.columnasReporte();

    const encabezados =
      columnas.map(columna => {
        return `
          <th>
            ${this.escaparHTML(
              columna.titulo
            )}
          </th>
        `;
      }).join('');

    const filas =
      this.datosReporte()
        .map(fila => {
          const celdas =
            columnas.map(columna => {
              return `
                <td>
                  ${this.escaparHTML(
                    this.obtenerValorExportacion(
                      fila,
                      columna
                    )
                  )}
                </td>
              `;
            }).join('');

          return `
            <tr>
              ${celdas}
            </tr>
          `;
        }).join('');

    const filaTotal =
      this.reporteSeleccionado() ===
      'semanal'
        ? `
          <tr class="total">
            <td colspan="3">
              Total General
            </td>

            <td>
              ${this.calcularTotalVentasReporte()}
            </td>

            <td>
              ${this.escaparHTML(
                this.obtenerTipoTotalSemanal()
              )}
            </td>

            <td>
              S/ ${this.calcularTotal().toFixed(2)}
            </td>
          </tr>
        `
        : `
          <tr class="total">
            <td colspan="${columnas.length - 1}">
              Total General
            </td>

            <td>
              S/ ${this.calcularTotal().toFixed(2)}
            </td>
          </tr>
        `;

    ventana.document.write(`
      <!DOCTYPE html>

      <html lang="es">
        <head>
          <meta charset="UTF-8">

          <title>
            ${this.escaparHTML(
              this.nombreReporte()
            )}
          </title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #2e2e2e;
            }

            h1 {
              color: #5e412f;
              border-bottom: 2px solid #ce8329;
              padding-bottom: 10px;
            }

            .resumen {
              background: #f5f0e8;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 12px;
            }

            th {
              background: #5e412f;
              color: #e9bd6e;
              padding: 10px;
              text-align: left;
            }

            td {
              padding: 10px;
              border-bottom: 1px solid #dddddd;
            }

            .total {
              background: #f5f0e8;
              font-weight: bold;
            }

            .footer {
              margin-top: 30px;
              border-top: 1px solid #dddddd;
              padding-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #666666;
            }
          </style>
        </head>

        <body>
          <h1>
            ${this.escaparHTML(
              this.nombreReporte()
            )}
          </h1>

          <p>
            <strong>Período:</strong>

            ${this.escaparHTML(
              this.fechaInicio()
            )}

            al

            ${this.escaparHTML(
              this.fechaFin()
            )}
          </p>

          <div class="resumen">
            <strong>Total ventas:</strong>
            ${this.numeroSeguro(
              this.resumenReporte().totalVentas
            )}

            &nbsp;&nbsp;

            <strong>Total recaudado:</strong>
            S/
            ${this.numeroSeguro(
              this.resumenReporte().totalRecaudado
            ).toFixed(2)}

            &nbsp;&nbsp;

            <strong>Promedio:</strong>
            S/
            ${this.numeroSeguro(
              this.resumenReporte().promedio
            ).toFixed(2)}
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
              ${filaTotal}
            </tfoot>
          </table>

          <div class="footer">
            Pollería Yacky - Sistema de Administración
          </div>
        </body>
      </html>
    `);

    ventana.document.close();

    setTimeout(() => {
      ventana.focus();

      ventana.print();
    }, 250);
  }

  private obtenerValorExportacion(
    fila: FilaReporte,
    columna: ColumnaReporte
  ): string {
    if (
      columna.tipo === 'tipo'
    ) {
      return (
        fila.tipo_texto ||
        'Local'
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

    if (
      columna.tipo === 'moneda'
    ) {
      return this.numeroSeguro(
        fila[columna.clave]
      ).toFixed(2);
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

    return String(valor);
  }

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