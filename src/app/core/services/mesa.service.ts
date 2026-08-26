// core/services/mesa.service.ts
import { Injectable, signal, effect } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Mesa {
  id: number;
  numero: number;
  ocupada: boolean;
  cliente?: string;
  pedido?: any;
  total?: number;
  horaInicio?: Date;
}

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
    { id: 10, numero: 10, ocupada: false },
    { id: 11, numero: 11, ocupada: false },
    { id: 12, numero: 12, ocupada: false },
    { id: 13, numero: 13, ocupada: false },
    { id: 14, numero: 14, ocupada: false },
    { id: 15, numero: 15, ocupada: false },
    { id: 16, numero: 16, ocupada: false }
  ]);

  private mesaSeleccionada = signal<number | null>(null);
  private ultimaActualizacion = signal<Date>(new Date());

  obtenerMesas(): Observable<Mesa[]> {
    return of(this.mesas()).pipe(delay(200));
  }

  getMesasSignal() {
    return this.mesas;
  }

  seleccionarMesa(numero: number): void {
    this.mesaSeleccionada.set(numero);
  }

  getMesaSeleccionada(): number | null {
    return this.mesaSeleccionada();
  }

  getMesaSeleccionadaSignal() {
    return this.mesaSeleccionada;
  }

  ocuparMesa(numero: number, cliente?: string): void {
    this.mesas.update(list => 
      list.map(m => 
        m.numero === numero 
          ? { ...m, ocupada: true, cliente: cliente || `Cliente ${numero}`, horaInicio: new Date() }
          : m
      )
    );
    this.ultimaActualizacion.set(new Date());
  }

  liberarMesa(numero: number): void {
    this.mesas.update(list => 
      list.map(m => 
        m.numero === numero 
          ? { ...m, ocupada: false, cliente: undefined, horaInicio: undefined, pedido: undefined, total: undefined }
          : m
      )
    );
    this.ultimaActualizacion.set(new Date());
  }

  estaOcupada(numero: number): boolean {
    const mesa = this.mesas().find(m => m.numero === numero);
    return mesa ? mesa.ocupada : false;
  }

  getClienteMesa(numero: number): string | undefined {
    const mesa = this.mesas().find(m => m.numero === numero);
    return mesa?.cliente;
  }

  actualizarMesa(mesa: Mesa): void {
    this.mesas.update(list => 
      list.map(m => 
        m.numero === mesa.numero ? mesa : m
      )
    );
    this.ultimaActualizacion.set(new Date());
  }

  // Método para sincronizar cambios entre componentes
  getUltimaActualizacion() {
    return this.ultimaActualizacion;
  }
}