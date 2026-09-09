// src/app/features/carta-cliente/components/carrito-lateral/carrito-lateral.component.ts
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemCarrito } from '../../../../core/models/interfaces';
import { ProductoService } from '../../../../core/services/producto.service';

@Component({
  selector: 'app-carrito-lateral',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito-lateral.component.html',
  styleUrls: ['./carrito-lateral.component.scss']
})
export class CarritoLateralComponent {
  private productoService = inject(ProductoService);

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
    return this.items.reduce(
      (suma, item) => suma + item.cantidad,
      0
    );
  }

  obtenerPrecioNumerico(precio: number | string): number {
    const numero =
      typeof precio === 'string'
        ? Number.parseFloat(precio)
        : precio;

    return Number.isFinite(numero) ? numero : 0;
  }

  getImagenUrl(imagen?: string | null): string {
    return this.productoService.getImagenUrl(imagen);
  }

  manejarErrorImagen(event: Event): void {
    const imagen = event.target as HTMLImageElement;

    if (imagen.dataset['fallbackAplicado'] === 'true') {
      return;
    }

    imagen.dataset['fallbackAplicado'] = 'true';
    imagen.src = this.productoService.getImagenUrl('imagen.jpg');
  }

  formatearPrecio(precio: number | string): string {
    return `S/ ${this.obtenerPrecioNumerico(precio).toFixed(2)}`;
  }

  formatearSubtotal(
    precio: number | string,
    cantidad: number
  ): string {
    const importe = this.obtenerPrecioNumerico(precio) * cantidad;
    return `S/ ${importe.toFixed(2)}`;
  }
}
