// src/app/app.ts
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationsComponent } from './features/shared/components/notificacion/notificacion.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationsComponent],  // ✅ AGREGADO
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('polleria-yaki-frontend');
}