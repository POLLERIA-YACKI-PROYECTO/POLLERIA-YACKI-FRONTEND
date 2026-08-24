import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  private mesaSeleccionada = signal<number | null>(null);
  private mesas = signal<Map<number, boolean>>(new Map());

  seleccionarMesa(numero: number): void {
    this.mesaSeleccionada.set(numero);
  }

  getMesaSeleccionada(): number | null {
    return this.mesaSeleccionada();
  }

  ocuparMesa(numero: number): void {
    const mesas = this.mesas();
    mesas.set(numero, true);
    this.mesas.set(mesas);
  }

  liberarMesa(numero: number): void {
    const mesas = this.mesas();
    mesas.set(numero, false);
    this.mesas.set(mesas);
  }

  estaOcupada(numero: number): boolean {
    return this.mesas().get(numero) || false;
  }
}