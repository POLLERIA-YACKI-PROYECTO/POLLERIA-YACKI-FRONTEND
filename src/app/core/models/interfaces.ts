// src/app/features/carta-cliente/interfaces.ts

// ============================================
// CATEGORÍA
// ============================================
export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  descripcion: string;
  orden: number;
  activo: boolean;
}

// ============================================
// PRODUCTO
// ============================================
export interface Producto {
  id: number;
  categoria_id: number;
  nombre: string;
  precio: number | string;
  descripcion: string;
  imagen: string;
  stock: number;
  disponible: boolean;
  agotado: boolean;
  destacado: boolean;
  categoria_nombre?: string;

  // ✅ Campos opcionales que devuelve el backend
  precio_compra?: number | string;
  stock_minimo?: number;
  unidad_medida?: string;
  imagenUrl?: string;
  esDefault?: boolean;

  // ✅ NUEVOS: timestamps para cache busting de imágenes
  created_at?: string;
  updated_at?: string;
}

// ============================================
// ITEM DEL CARRITO
// ============================================
export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  observacion?: string;
}