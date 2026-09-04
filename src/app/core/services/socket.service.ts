// src/app/core/services/socket.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;

  constructor() {
    this.conectarSocket();
  }

  /**
   * Establece la conexión WebSocket usando la URL de la API del entorno
   */
  private conectarSocket(): void {
    // Extrae el host base eliminando la ruta '/api' si la tuviera
    const socketUrl = environment.apiUrl.replace('/api', '');
    this.socket = io(socketUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
  }

  /**
   * Escucha eventos en tiempo real emitidos desde el servidor
   */
  listen<T>(eventName: string): Observable<T> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data: T) => {
        subscriber.next(data);
      });

      return () => {
        this.socket.off(eventName);
      };
    });
  }

  /**
   * Emite eventos desde el frontend hacia el servidor
   */
  emit(eventName: string, data?: any): void {
    this.socket.emit(eventName, data);
  }

  joinAdminDashboard(): void {
    this.emit('join_admin_dashboard');
  }

  onNewOrder<T>(): Observable<T> {
    return this.listen<T>('new_order');
  }

  onOrderUpdated<T>(): Observable<T> {
    return this.listen<T>('order_updated');
  }

  /**
   * Desconecta el socket al finalizar la sesión
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}