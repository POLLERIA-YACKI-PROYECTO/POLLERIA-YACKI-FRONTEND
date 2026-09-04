/**
 * Interfaces y tipos compartidos para la gestión de productos, 
 * carrito y pedidos en Pollería Yacky.
 */

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
  name: string;
  description?: string | null;
  category: string;
  price: number | string; // Permite manejar conversion de MySQL (string/decimal) a número
  imageUrl?: string | null;
}

export interface ProductCategory {
  code: string;
  label: string;
  items: Product[];
}

// --- CARRITO DE COMPRAS ---
export interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

// --- SOLICITUD Y RESPUESTA DE PEDIDOS ---
export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  channelCode: OrderChannel;
  items: OrderItemRequest[];
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

// --- COMPROBANTES Y VOUCHERS ---
export interface VoucherItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface VoucherDetails {
  voucherCode: string;
  pdfPath: string;
}

export interface VoucherResponse {
  orderCode: string;
  total: number;
  items: VoucherItem[];
  createdAt: string;
  transactionId: string;
  voucher: VoucherDetails;
}

// --- MONITOREO Y PEDIDOS EN VIVO ---
export interface LiveOrderItem {
  productName: string;
  quantity: number;
}

export interface LiveOrder {
  id: number;
  orderCode: string;
  status: OrderStatus;
  total: number;
  customerName?: string;
  createdAt: string;
  updatedAt: string;
  items?: LiveOrderItem[];
}