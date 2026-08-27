// src/app/features/carta-cliente/components/modal-pago/modal-pago.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-pago.component.html',
  styleUrls: ['./modal-pago.component.scss']
})
export class ModalPagoComponent {
  @Input() visible = false;
  @Input() total = 0;
  @Input() cargando = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<any>();

  metodoPago = signal('yape');
  clienteNombre = signal('');
  observaciones = signal('');

  metodosPago = [
    { id: 'yape', label: 'Yape', icon: '📱' },
    { id: 'plin', label: 'Plin', icon: '📱' },
    { id: 'efectivo', label: 'Efectivo', icon: '💰' },
    { id: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { id: 'transferencia', label: 'Transferencia', icon: '🏦' }
  ];

  get esPagoDigital(): boolean {
    return ['yape', 'plin'].includes(this.metodoPago());
  }

  formatearPrecio(precio: number | string): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    if (isNaN(num)) return 'S/ 0.00';
    return `S/ ${num.toFixed(2)}`;
  }

  onSubmit(): void {
    if (this.cargando) return;
    this.confirmar.emit({
      metodo: this.metodoPago(),
      clienteNombre: this.clienteNombre() || 'Cliente',
      observaciones: this.observaciones()
    });
  }
}