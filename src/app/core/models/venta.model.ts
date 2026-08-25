export interface Venta {
  id: number;
  fecha: Date;
  items: VentaItem[];
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'yape' | 'plin';
  estado: 'completada' | 'cancelada' | 'pendiente';
  cliente?: string;
  mesaId?: number;
  usuarioId: number;
  tipo: 'local' | 'delivery' | 'paraLlevar';
}

export interface VentaItem {
  id: number;
  productoId: number;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}