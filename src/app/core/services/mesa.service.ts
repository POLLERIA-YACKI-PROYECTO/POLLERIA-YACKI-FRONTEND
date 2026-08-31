// core/services/mesa.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Mesa {
  id: number;
  numero: number;
  ocupada: boolean;
  cliente?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/mesas`;

  private mesas = signal<Mesa[]>([]);

  private mesaSeleccionada = signal<number | null>(null);
  private ultimaActualizacion = signal<Date>(new Date());

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  cargarMesas(): void {
    this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
      next: (mesas) => {
        this.mesas.set((mesas || []).map((m: any) => ({
          id: m.id,
          numero: m.numero,
          ocupada: !!m.ocupada,
          cliente: m.cliente || undefined
        })));
        this.ultimaActualizacion.set(new Date());
      },
      error: (err) => console.error('Error al cargar mesas del servidor:', err)
    });
  }

  obtenerMesas(): Observable<Mesa[]> {
    return of(this.mesas());
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
    this.http.put(`${this.apiUrl}/ocupar/${numero}`, { cliente }, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.cargarMesas();
        this.seleccionarMesa(numero);
      },
      error: (err) => alert(err.error?.error || `No se pudo ocupar la mesa ${numero}`)
    });
  }

  liberarMesa(numero: number): void {
    this.http.put(`${this.apiUrl}/liberar/${numero}`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.cargarMesas();
        this.seleccionarMesa(numero);
      },
      error: (err) => alert(err.error?.error || `No se pudo liberar la mesa ${numero}`)
    });
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