export interface Usuario {
  id: number;
  dni: string;
  nombre: string;
  rol: 'admin' | 'cajero' | 'mesero';
}