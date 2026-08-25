import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.scss']
})
export class ComprasComponent {
  compras = signal<any[]>([
    { id: 1, proveedor: 'Distribuidora Norte', producto: 'Pollo Entero', cantidad: 50, precio: 12.50, fecha: '2026-08-24' },
    { id: 2, proveedor: 'Carnes del Sur', producto: 'Pechuga', cantidad: 30, precio: 15.00, fecha: '2026-08-23' },
    { id: 3, proveedor: 'Bebidas SAC', producto: 'Coca Cola', cantidad: 100, precio: 3.50, fecha: '2026-08-22' }
  ]);
  
  mostrarFormulario = signal(false);
  nuevaCompra = signal({ proveedor: '', producto: '', cantidad: 0, precio: 0 });
  
  toggleFormulario(): void {
    this.mostrarFormulario.set(!this.mostrarFormulario());
  }
  
  guardarCompra(): void {
    const compra = {
      id: this.compras().length + 1,
      ...this.nuevaCompra(),
      fecha: new Date().toISOString().split('T')[0]
    };
    this.compras.update(list => [...list, compra]);
    this.nuevaCompra.set({ proveedor: '', producto: '', cantidad: 0, precio: 0 });
    this.mostrarFormulario.set(false);
  }
  
  eliminarCompra(id: number): void {
    if (confirm('¿Eliminar esta compra?')) {
      this.compras.update(list => list.filter(c => c.id !== id));
    }
  }
}