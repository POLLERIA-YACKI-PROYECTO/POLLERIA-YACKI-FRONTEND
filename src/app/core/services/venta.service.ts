import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Venta } from '../models/venta.model';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private ventas = signal<Venta[]>([
    {
      id: 1,
      fecha: new Date('2026-08-24'),
      items: [
        { id: 1, productoId: 1, nombre: 'Pollo a la Brasa', cantidad: 2, precio: 45.00, subtotal: 90.00 },
        { id: 2, productoId: 2, nombre: 'Coca Cola', cantidad: 2, precio: 5.00, subtotal: 10.00 }
      ],
      total: 100.00,
      metodoPago: 'efectivo',
      estado: 'completada',
      cliente: 'Juan Pérez',
      mesaId: 1,
      usuarioId: 1,
      tipo: 'local'
    },
    {
      id: 2,
      fecha: new Date('2026-08-24'),
      items: [
        { id: 3, productoId: 4, nombre: 'Papas Fritas', cantidad: 1, precio: 12.00, subtotal: 12.00 }
      ],
      total: 12.00,
      metodoPago: 'tarjeta',
      estado: 'completada',
      cliente: 'María Gómez',
      usuarioId: 2,
      tipo: 'paraLlevar'
    }
  ]);

  obtenerVentas(): Observable<Venta[]> {
    return of(this.ventas()).pipe(delay(300));
  }

  obtenerVenta(id: number): Observable<Venta | undefined> {
    const venta = this.ventas().find(v => v.id === id);
    return of(venta).pipe(delay(200));
  }

  crearVenta(venta: Omit<Venta, 'id'>): Observable<Venta> {
    const newId = Math.max(...this.ventas().map(v => v.id)) + 1;
    const nuevaVenta = { ...venta, id: newId };
    this.ventas.update(list => [...list, nuevaVenta]);
    return of(nuevaVenta).pipe(delay(500));
  }

  obtenerVentasPorFecha(fechaInicio: Date, fechaFin: Date): Observable<Venta[]> {
    const filtradas = this.ventas().filter(v => 
      v.fecha >= fechaInicio && v.fecha <= fechaFin
    );
    return of(filtradas).pipe(delay(300));
  }
}