// src/app/features/carta-cliente/components/producto-card/producto-card.component.ts
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../../core/models/interfaces';
import { ProductoService } from '../../../../core/services/producto.service';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto-card.component.html',
  styleUrls: ['./producto-card.component.scss'],
  // ✅ OnPush: solo re-renderiza si cambian inputs
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductoCardComponent implements OnDestroy {
  private productoService = inject(ProductoService);

  @Input({ required: true }) producto!: Producto;
  @Output() agregar = new EventEmitter<Producto>();

  agregando = signal(false);

  // ✅ Timer para limpiar el estado "agregando" si el componente se destruye
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  // ============================================
  // IMAGEN CON CACHE BUSTING
  // ============================================
  /**
   * Genera la URL de la imagen del producto.
   *
   * ✅ Cache busting: usa el `updated_at` del producto como versión.
   * Cada vez que el admin cambia la imagen (o cualquier dato del producto),
   * `updated_at` cambia, la URL cambia, y el navegador pide la imagen nueva.
   */
  get imagenUrl(): string {
    const version = this.producto?.updated_at
      ? new Date(this.producto.updated_at).getTime()
      : undefined;

    return this.productoService.getImagenUrl(
      this.producto?.imagen,
      version
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

  // ============================================
  // AGREGAR AL CARRITO
  // ============================================
  onAgregar(): void {
    if (!this.estaDisponible) {
      return;
    }

    // ✅ Evita doble click mientras se procesa
    if (this.agregando()) {
      return;
    }

    this.agregando.set(true);
    this.agregar.emit(this.producto);

    // ✅ Limpiar timer anterior si existe
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      this.agregando.set(false);
      this.resetTimer = null;
    }, 500);
  }

  // ✅ Limpiar timer al destruir (evita memory leak)
  ngOnDestroy(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  // ============================================
  // MANEJO DE ERRORES DE IMAGEN
  // ============================================
  onImageError(event: Event): void {
    const imagen = event.target as HTMLImageElement;

    if (imagen.dataset['fallbackAplicado'] === 'true') {
      return;
    }

    imagen.dataset['fallbackAplicado'] = 'true';
    imagen.src = this.productoService.getImagenUrl('imagen.jpg');
  }
}