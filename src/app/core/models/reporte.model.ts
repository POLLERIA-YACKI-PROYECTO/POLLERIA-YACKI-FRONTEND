// src/app/core/models/reporte.model.ts

export interface ReporteVenta {
  id: number;
  fecha: Date;
  total: number;
  items: number;
  cliente: string;
  usuario: string;
  metodoPago: string;
}

export interface ReporteDiario {
  fecha: Date;
  ventas: number;
  total: number;
  efectivo: number;
  tarjeta: number;
  yape: number;
  plin: number;
}

export interface ReporteCajero {
  usuarioId: number;
  nombre: string;
  ventas: number;
  total: number;
}

// NUEVO: Desglose por día para el reporte semanal
export interface DiaSemana {
  dia: string;        // 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'
  fecha: string;      // 'dd/mm'
  ventas: number;     // Cantidad de ventas
  total: number;      // Monto total del día
  esHoy: boolean;     // Si es el día actual
}

export interface ReporteSemanal {
  id: number;
  semana: string;         // "Semana 37 (2026)"
  fechaDesde: string;     // 'dd/mm/yyyy'
  fechaHasta: string;     // 'dd/mm/yyyy'
  ventasLocal: number;
  ventasMotorizado: number;
  totalLocal: number;
  totalMotorizado: number;
  total: number;
  dias: DiaSemana[];      // Desglose de los 7 días
}