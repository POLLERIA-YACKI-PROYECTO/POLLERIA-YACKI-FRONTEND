// src/app/core/services/mesa.service.ts
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
  capacidad?: number;
  ubicacion?: string;
  cantidad_personas?: number;
  hora_ocupacion?: string;
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
          cliente: m.cliente || undefined,
          capacidad: m.capacidad || 4,
          ubicacion: m.ubicacion || 'Sala Principal',
          cantidad_personas: m.cantidad_personas || 0,
          hora_ocupacion: m.hora_ocupacion || undefined
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

  ocuparMesa(numero: number, cliente?: string, cantidad_personas?: number): void {
    const payload: any = { cliente: cliente || 'Cliente' };
    if (cantidad_personas) {
      payload.cantidad_personas = cantidad_personas;
    }
    
    this.http.put(`${this.apiUrl}/ocupar/${numero}`, payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.cargarMesas();
        this.seleccionarMesa(numero);
      },
      error: (err) => {
        console.error('Error al ocupar mesa:', err);
        alert(err.error?.error || `No se pudo ocupar la mesa ${numero}`);
      }
    });
  }

  liberarMesa(numero: number): void {
    this.http.put(`${this.apiUrl}/liberar/${numero}`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.cargarMesas();
        this.seleccionarMesa(numero);
      },
      error: (err) => {
        console.error('Error al liberar mesa:', err);
        alert(err.error?.error || `No se pudo liberar la mesa ${numero}`);
      }
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

  getUltimaActualizacion() {
    return this.ultimaActualizacion;
  }
}