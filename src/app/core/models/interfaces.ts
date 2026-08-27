// src/app/features/carta-cliente/interfaces.ts
export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  descripcion: string;
  orden: number;
  activo: boolean;
}

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
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  observacion?: string;
}