import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mantenimiento.component.html',
  styleUrls: ['./mantenimiento.component.scss']
})
export class MantenimientoComponent implements OnInit {
  private productoService = inject(ProductoService);
  
  productos = signal<any[]>([]);
  nuevoProducto = signal({ 
    nombre: '', 
    precio: 0, 
    categoria: 'Otros' as 'Comida' | 'Bebida' | 'Postre' | 'Otros' 
  });
  categorias = signal(['Comida', 'Bebida', 'Postre', 'Otros']);
  mostrarFormulario = signal(false);

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productoService.obtenerProductos().subscribe({
      next: (data) => this.productos.set(data),
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  guardarProducto(): void {
    if (!this.nuevoProducto().nombre || this.nuevoProducto().precio <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    this.productoService.crearProducto({
      nombre: this.nuevoProducto().nombre,
      precio: this.nuevoProducto().precio,
      categoria: this.nuevoProducto().categoria as 'Comida' | 'Bebida' | 'Postre' | 'Otros',
      stock: 0
    }).subscribe({
      next: () => {
        this.cargarProductos();
        this.nuevoProducto.set({ nombre: '', precio: 0, categoria: 'Otros' });
        this.mostrarFormulario.set(false);
      },
      error: (err) => console.error('Error al guardar producto', err)
    });
  }

  eliminarProducto(id: number): void {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.productoService.eliminarProducto(id).subscribe({
        next: () => this.cargarProductos(),
        error: (err) => console.error('Error al eliminar producto', err)
      });
    }
  }

  toggleFormulario(): void {
    this.mostrarFormulario.set(!this.mostrarFormulario());
    if (!this.mostrarFormulario()) {
      this.nuevoProducto.set({ nombre: '', precio: 0, categoria: 'Otros' });
    }
  }
}