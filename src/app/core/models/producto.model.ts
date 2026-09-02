// src/app/features/carta-cliente/producto.model.ts

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: 'Comida' | 'Bebida' | 'Postre' | 'Otros';
  descripcion?: string;
  stock?: number;
  activo?: boolean;
  imagen?: string;
}
