// src/app/core/models/interfaces.ts

// --- TIPOS Y ESTADOS ---
export type OrderStatus =
  | 'pendiente_pago'
  | 'pagado'
  | 'en_preparacion'
  | 'entregado'
  | 'cancelado'
  | 'expirado';

export type OrderChannel = 'web' | 'local' | 'delivery';

// --- PRODUCTOS Y CATEGORÍAS ---
export interface Product {
  id: number;
  nombre: string;
  name?: string;
  descripcion?: string | null;
  description?: string | null;
  categoria_id: number;
  category?: string;
  precio: number | string;
  price?: number | string;
  imagen?: string | null;
  imageUrl?: string | null;
  disponible: boolean;
  agotado?: boolean;
  stock?: number;
  destacado?: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  activo?: boolean;
  orden?: number;
}

export interface ItemCarrito {
  producto: Product;
  cantidad: number;
}

export interface ProductCategory {
  code: string;
  label: string;
  items: Product[];
}

// --- SOLICITUD Y RESPUESTA DE PEDIDOS ---
export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  channelCode: string;
  items: OrderItemRequest[];
  subtotal?: number;
  igv?: number;
  total?: number;
  tipo_entrega?: string;
  metodo_pago?: string;
  pagado?: boolean;
  cliente_nombre?: string;
  observaciones?: string;
  estado?: string;
}

export interface CreateOrderResponse {
  orderCode: string;
  status: OrderStatus;
  total: number;
  qrImageBase64: string;
  qrExpiresAt: string;
}

export interface OrderStatusResponse {
  orderCode: string;
  status: OrderStatus;
  qrExpiresAt: string;
  total: number;
}

// ✅ AÑADIDO VoucherResponse
export interface VoucherResponse {
  orderCode: string;
  total: number;
  items: VoucherItem[];
  createdAt: string;
  transactionId: string;
  voucher: VoucherDetails;
}

// ✅ AÑADIDO VoucherItem
export interface VoucherItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// ✅ AÑADIDO VoucherDetails
export interface VoucherDetails {
  voucherCode: string;
  pdfPath: string;
}

// --- MONITOREO Y PEDIDOS EN VIVO ---
export interface LiveOrder {
  id: number;
  orderCode: string;
  codigo?: string;
  status: OrderStatus;
  estado?: string;
  total: number;
  monto_total?: number;
  customerName?: string;
  cliente?: string;
  createdAt: string;
  updatedAt: string;
  items?: any[];
  [key: string]: any;
}