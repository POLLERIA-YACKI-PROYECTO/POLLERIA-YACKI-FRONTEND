// src/app/features/carta-cliente/components/modal-pago/modal-pago.component.ts
import { Component, Input, Output, EventEmitter, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-pago.component.html',
  styleUrls: ['./modal-pago.component.scss']
})
export class ModalPagoComponent implements OnChanges {
  @Input() visible = false;
  @Input() total = 0;
  @Input() cargando = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<any>();

  metodoPago = signal('efectivo');
  clienteNombre = signal('');
  observaciones = signal('');
  tipoEntrega = signal('local');
  estadoPago = signal<'formulario' | 'procesando' | 'exitoso' | 'error'>('formulario');
  mensajeError = signal('');

  // Métodos de pago que va a manejar Izipay
  metodosPago = [
    { id: 'efectivo', label: 'Efectivo' },
    { id: 'tarjeta', label: 'Tarjeta' },
    { id: 'yape', label: 'Yape' },
    { id: 'plin', label: 'Plin' },
    { id: 'transferencia', label: 'Transferencia' }
  ];

  ngOnChanges(): void {
    if (this.visible) {
      this.resetEstado();
    }
  }

  get mostrarFormulario(): boolean {
    return this.estadoPago() === 'formulario';
  }

  get mostrarProcesando(): boolean {
    return this.estadoPago() === 'procesando';
  }

  get mostrarExitoso(): boolean {
    return this.estadoPago() === 'exitoso';
  }

  get mostrarError(): boolean {
    return this.estadoPago() === 'error';
  }

  resetEstado(): void {
    this.estadoPago.set('formulario');
    this.mensajeError.set('');
  }

  formatearPrecio(precio: number | string): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    if (isNaN(num)) return 'S/ 0.00';
    return `S/ ${num.toFixed(2)}`;
  }

  // ✅ Enviar a Izipay
  onSubmit(): void {
    if (this.cargando) return;

    if (!this.metodoPago()) {
      alert('Por favor selecciona un método de pago');
      return;
    }

    // Cambiar a estado procesando
    this.estadoPago.set('procesando');

    // Emitir evento para crear el pedido y redirigir a Izipay
    this.confirmar.emit({
      metodo: this.metodoPago(),
      clienteNombre: this.clienteNombre() || 'Cliente',
      observaciones: this.observaciones(),
      tipoEntrega: this.tipoEntrega(),
      total: this.total
    });
  }

  cerrarModal(): void {
    if (this.cargando) return;
    this.resetEstado();
    this.cerrar.emit();
  }

  // ✅ Cuando Izipay confirma el pago (llamado desde el padre)
  pagoExitoso(): void {
    this.estadoPago.set('exitoso');
    setTimeout(() => {
      this.cerrarModal();
    }, 3000);
  }

  pagoError(mensaje: string): void {
    this.estadoPago.set('error');
    this.mensajeError.set(mensaje || 'Error al procesar el pago');
  }

  reintentar(): void {
    this.resetEstado();
  }
}
