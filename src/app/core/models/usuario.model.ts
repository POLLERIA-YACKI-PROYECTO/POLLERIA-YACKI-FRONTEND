// src/app/core/models/usuario.model.ts

export interface Usuario {
  id: number;
  dni: string;
  nombre: string;
  rol: 'admin' | 'cajero' | 'mesero' | 'cocinero' | 'delivery';
  telefono?: string;
  email?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}
