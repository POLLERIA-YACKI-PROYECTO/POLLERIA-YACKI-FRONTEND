// src/app/features/carta-cliente/components/producto-card/producto-card.component.ts
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../../core/models/interfaces';
import { ProductoService } from '../../../../core/services/producto.service';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto-card.component.html',
  styleUrls: ['./producto-card.component.scss']
})
export class ProductoCardComponent {
  private productoService = inject(ProductoService);

  @Input({ required: true }) producto!: Producto;
  @Output() agregar = new EventEmitter<Producto>();

  agregando = signal(false);

  get imagenUrl(): string {
    return this.productoService.getImagenUrl(
      this.producto?.imagen
    );
  }

  get estaDisponible(): boolean {
    return (
      this.producto?.disponible !== false &&
      this.producto?.agotado !== true &&
      (this.producto?.stock ?? 0) > 0
    );
  }

  get tieneStock(): boolean {
    return (this.producto?.stock ?? 0) > 0;
  }

  get stockLabel(): string {
    const stock = this.producto?.stock ?? 0;

    if (stock === 0) {
      return 'Agotado';
    }

    if (stock < 5) {
      return `Últimas ${stock}`;
    }

    return '';
  }

  formatearPrecio(precio: number | string): string {
    const numero =
      typeof precio === 'string'
        ? Number.parseFloat(precio)
        : precio;

    return Number.isFinite(numero)
      ? numero.toFixed(2)
      : '0.00';
  }

  onAgregar(): void {
    if (!this.estaDisponible) {
      return;
    }

    this.agregando.set(true);
    this.agregar.emit(this.producto);

    setTimeout(() => {
      this.agregando.set(false);
    }, 500);
  }

  onImageError(event: Event): void {
    const imagen = event.target as HTMLImageElement;

    if (imagen.dataset['fallbackAplicado'] === 'true') {
      return;
    }

    imagen.dataset['fallbackAplicado'] = 'true';
    imagen.src = this.productoService.getImagenUrl('imagen.jpg');
  }
}
