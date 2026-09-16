// src/app/core/services/notification.service.ts
import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private counter = 0;
  private readonly _notifications = signal<Notification[]>([]);

  readonly notifications = this._notifications.asReadonly();

  /**
   * Muestra una notificación de éxito
   */
  success(message: string, title = 'Éxito', duration = 3500): void {
    this.show('success', title, message, duration);
  }

  /**
   * Muestra una notificación de error
   */
  error(message: string, title = 'Error', duration = 5000): void {
    this.show('error', title, message, duration);
  }

  /**
   * Muestra una notificación de advertencia
   */
  warning(message: string, title = 'Advertencia', duration = 4000): void {
    this.show('warning', title, message, duration);
  }

  /**
   * Muestra una notificación informativa
   */
  info(message: string, title = 'Info', duration = 3000): void {
    this.show('info', title, message, duration);
  }

  /**
   * Muestra una notificación personalizada
   */
  show(
    type: NotificationType,
    title: string,
    message: string,
    duration = 3500
  ): void {
    const id = ++this.counter;
    const notification: Notification = { id, type, title, message, duration };

    this._notifications.update((list) => [...list, notification]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  /**
   * Elimina una notificación por id
   */
  remove(id: number): void {
    this._notifications.update((list) => list.filter((n) => n.id !== id));
  }

  /**
   * Limpia todas las notificaciones
   */
  clear(): void {
    this._notifications.set([]);
  }
}