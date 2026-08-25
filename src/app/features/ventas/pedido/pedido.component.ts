import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.scss']
})
export class PedidoComponent implements OnInit {
  private productoService = inject(ProductoService);
  
  @Input() mesaId: number = 0;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<any>();

  productos = signal<any[]>([]);
  itemsPedido = signal<any[]>([]);
  productoSeleccionado = signal<any>(null);
  cantidad = signal(1);
  total = signal(0);

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productoService.obtenerProductos().subscribe({
      next: (data) => this.productos.set(data),
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  agregarProducto(): void {
    const producto = this.productoSeleccionado();
    if (!producto) return;

    const itemExistente = this.itemsPedido().find(i => i.id === producto.id);
    if (itemExistente) {
      itemExistente.cantidad += this.cantidad();
      itemExistente.subtotal = itemExistente.cantidad * itemExistente.precio;
      this.itemsPedido.set([...this.itemsPedido()]);
    } else {
      this.itemsPedido.update(list => [...list, {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: this.cantidad(),
        subtotal: producto.precio * this.cantidad()
      }]);
    }

    this.calcularTotal();
    this.cantidad.set(1);
    this.productoSeleccionado.set(null);
  }

  eliminarItem(index: number): void {
    this.itemsPedido.update(list => list.filter((_, i) => i !== index));
    this.calcularTotal();
  }

  calcularTotal(): void {
    const total = this.itemsPedido().reduce((sum, item) => sum + item.subtotal, 0);
    this.total.set(total);
  }

  guardarPedido(): void {
    if (this.itemsPedido().length === 0) return;
    this.guardar.emit({
      mesaId: this.mesaId,
      items: this.itemsPedido(),
      total: this.total()
    });
  }

  cerrarPedido(): void {
    this.cerrar.emit();
  }
}