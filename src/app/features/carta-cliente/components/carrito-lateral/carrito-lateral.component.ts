// src/app/features/carta-cliente/components/carrito-lateral/carrito-lateral.component.ts
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemCarrito } from '../../../../core/models/interfaces';
import { ProductoService } from '../../../../core/services/producto.service';

@Component({
  selector: 'app-carrito-lateral',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito-lateral.component.html',
  styleUrls: ['./carrito-lateral.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarritoLateralComponent {
  private productoService = inject(ProductoService);

  @Input() visible = false;
  @Input() items: ItemCarrito[] = [];
  @Input() subtotal = 0;
  @Input() total = 0;

  @Output() cerrar = new EventEmitter<void>();
  @Output() vaciar = new EventEmitter<void>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() pagar = new EventEmitter<void>();

  // ============================================
  // GETTERS
  // ============================================
  get tieneItems(): boolean {
    return Array.isArray(this.items) && this.items.length > 0;
  }

  get totalItems(): number {
    if (!Array.isArray(this.items)) return 0;
    return this.items.reduce(
      (suma, item) => suma + (Number(item.cantidad) || 0),
      0
    );
  }

  // ============================================
  // TRACK BY
  // ============================================
  trackByProductoId(index: number, item: ItemCarrito): any {
    return item?.producto?.id ?? index;
  }

  // ============================================
  // UTILIDADES
  // ============================================
  obtenerPrecioNumerico(precio: number | string): number {
    const numero =
      typeof precio === 'string'
        ? Number.parseFloat(precio)
        : precio;

    return Number.isFinite(numero) ? numero : 0;
  }

  formatearPrecio(precio: number | string): string {
    return `S/ ${this.obtenerPrecioNumerico(precio).toFixed(2)}`;
  }

  formatearSubtotal(
    precio: number | string,
    cantidad: number
  ): string {
    const importe = this.obtenerPrecioNumerico(precio) * (Number(cantidad) || 0);
    return `S/ ${importe.toFixed(2)}`;
  }

  // ============================================
  // IMAGENES CON CACHE BUSTING
  // ============================================
  getImagenUrl(item: ItemCarrito): string {
    const producto: any = item?.producto;
    const version = producto?.updated_at
      ? new Date(producto.updated_at).getTime()
      : undefined;

    return this.productoService.getImagenUrl(producto?.imagen, version);
  }

  manejarErrorImagen(event: Event): void {
    const imagen = event.target as HTMLImageElement;

    if (imagen.dataset['fallbackAplicado'] === 'true') {
      return;
    }

    imagen.dataset['fallbackAplicado'] = 'true';
    imagen.src = this.productoService.getImagenUrl('imagen.jpg');
  }

  // ============================================
  // ACCIONES
  // ============================================
  onCerrar(): void {
    this.cerrar.emit();
  }

  onVaciar(): void {
    if (!this.tieneItems) return;
    this.vaciar.emit();
  }

  onEliminar(index: number): void {
    if (index < 0 || index >= this.items.length) return;
    this.eliminar.emit(index);
  }

  onPagar(): void {
    if (!this.tieneItems) return;
    this.pagar.emit();
  }
}