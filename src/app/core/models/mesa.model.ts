export interface Mesa {
  id: number;
  numero: number;
  ocupada: boolean;
  cliente?: string;
  pedido?: Pedido;
  total?: number;
  horaInicio?: Date;
}

export interface Pedido {
  id: number;
  mesaId: number;
  items: PedidoItem[];
  total: number;
  estado: 'pendiente' | 'preparando' | 'listo' | 'entregado';
  fecha: Date;
  cliente?: string;
}

export interface PedidoItem {
  id: number;
  productoId: number;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  observaciones?: string;
}