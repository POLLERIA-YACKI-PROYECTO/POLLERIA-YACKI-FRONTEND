import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Mesa, Pedido } from '../models/mesa.model';

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  private mesas = signal<Mesa[]>([
    { id: 1, numero: 1, ocupada: false },
    { id: 2, numero: 2, ocupada: false },
    { id: 3, numero: 3, ocupada: true, cliente: 'Juan Pérez' },
    { id: 4, numero: 4, ocupada: false },
    { id: 5, numero: 5, ocupada: false },
    { id: 6, numero: 6, ocupada: false },
    { id: 7, numero: 7, ocupada: false },
    { id: 8, numero: 8, ocupada: false },
    { id: 9, numero: 9, ocupada: false },
    { id: 10, numero: 10, ocupada: false }
  ]);

  private mesaSeleccionada = signal<number | null>(null);

  obtenerMesas(): Observable<Mesa[]> {
    return of(this.mesas()).pipe(delay(300));
  }

  seleccionarMesa(numero: number): void {
    this.mesaSeleccionada.set(numero);
  }

  getMesaSeleccionada(): number | null {
    return this.mesaSeleccionada();
  }

  ocuparMesa(numero: number, cliente?: string): void {
    this.mesas.update(list => 
      list.map(m => 
        m.numero === numero 
          ? { ...m, ocupada: true, cliente: cliente || 'Cliente' }
          : m
      )
    );
  }

  liberarMesa(numero: number): void {
    this.mesas.update(list => 
      list.map(m => 
        m.numero === numero 
          ? { ...m, ocupada: false, cliente: undefined }
          : m
      )
    );
  }

  estaOcupada(numero: number): boolean {
    const mesa = this.mesas().find(m => m.numero === numero);
    return mesa ? mesa.ocupada : false;
  }
}