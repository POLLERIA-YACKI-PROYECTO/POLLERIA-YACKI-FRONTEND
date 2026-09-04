// src/app/features/carta-cliente/components/producto-card/producto-card.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// ✅ CORREGIDO: usar Product
import { Product } from '../../../../core/models/interfaces';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto-card.component.html',
  styleUrls: ['./producto-card.component.scss']
})
export class ProductoCardComponent {
  // ✅ CORREGIDO: usar Product
  @Input() producto!: Product;
  @Output() agregar = new EventEmitter<Product>();

  agregando = signal(false);

  get imagenUrl(): string {
    if (!this.producto?.imagen) return 'assets/images/default-product.png';
    if (this.producto.imagen.startsWith('http')) return this.producto.imagen;
    return `assets/images/${this.producto.imagen}`;
  }

  get estaDisponible(): boolean {
    return this.producto?.disponible !== false &&
           this.producto?.agotado !== true;
  }

  get tieneStock(): boolean {
    return true;
  }

  get stockLabel(): string {
    return '';
  }

  formatearPrecio(precio: number | string): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    if (isNaN(num)) return 'S/ 0.00';
    return `S/ ${num.toFixed(2)}`;
  }

  onAgregar(): void {
    if (!this.estaDisponible) return;
    this.agregando.set(true);
    this.agregar.emit(this.producto);
    setTimeout(() => this.agregando.set(false), 300);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/default-product.png';
  }
}