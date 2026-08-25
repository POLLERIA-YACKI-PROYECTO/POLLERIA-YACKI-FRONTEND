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