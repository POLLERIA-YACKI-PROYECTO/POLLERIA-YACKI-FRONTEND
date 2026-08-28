// carrito-lateral.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemCarrito } from '../../../../core/models/interfaces';

@Component({
  selector: 'app-carrito-lateral',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito-lateral.component.html',
  styleUrls: ['./carrito-lateral.component.scss']
})
export class CarritoLateralComponent {
  @Input() visible = false;
  @Input() items: ItemCarrito[] = [];
  @Input() subtotal = 0;
  @Input() igv = 0;
  @Input() total = 0;

  @Output() cerrar = new EventEmitter<void>();
  @Output() vaciar = new EventEmitter<void>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() pagar = new EventEmitter<void>();

  get tieneItems(): boolean {
    return this.items.length > 0;
  }

  get totalItems(): number {
    return this.items.reduce((sum, item) => sum + item.cantidad, 0);
  }

  obtenerPrecioNumerico(precio: number | string): number {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    return isNaN(num) ? 0 : num;
  }

  getImagenUrl(imagen?: string): string {
    if (!imagen) return 'assets/images/default-product.png';
    if (imagen.startsWith('http')) return imagen;
    return `assets/images/${imagen}`;
  }

  formatearPrecio(precio: number | string): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    if (isNaN(num)) return 'S/ 0.00';
    return `S/ ${num.toFixed(2)}`;
  }

  formatearSubtotal(precio: number | string, cantidad: number): string {
    const num = this.obtenerPrecioNumerico(precio);
    const total = num * cantidad;
    return `S/ ${total.toFixed(2)}`;
  }
}