// src/app/features/admin/compras/compras.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CompraService } from '../../../core/services/compra.service';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.scss']
})
export class ComprasComponent implements OnInit {
  private authService = inject(AuthService);
  private compraService = inject(CompraService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(false);
  loading = signal(true);
  mostrarFormulario = signal(false);
  editando = signal(false);
  compraEdit = signal<any>(null);

  compras = signal<any[]>([]);
  nuevaCompra = signal({
    proveedor: '',
    producto: '',
    cantidad: 0,
    precio: 0
  });

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (this.usuario()?.rol !== 'admin') {
      this.router.navigate(['/login-admin']);
      return;
    }
    this.cargarDatos();
  }

  toggleTema(): void {
    this.temaOscuro.set(!this.temaOscuro());
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.compraService.obtenerCompras().subscribe({
      next: (compras) => {
        this.compras.set(compras);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar compras:', err);
        this.loading.set(false);
      }
    });
  }

  toggleFormulario(): void {
    this.mostrarFormulario.set(!this.mostrarFormulario());
    if (!this.mostrarFormulario()) {
      this.editando.set(false);
      this.compraEdit.set(null);
      this.nuevaCompra.set({ proveedor: '', producto: '', cantidad: 0, precio: 0 });
    }
  }

  editarCompra(compra: any): void {
    this.editando.set(true);
    this.compraEdit.set(compra);
    this.nuevaCompra.set({
      proveedor: compra.proveedor,
      producto: compra.producto,
      cantidad: compra.cantidad,
      precio: compra.precio
    });
    this.mostrarFormulario.set(true);
  }

  guardarCompra(): void {
    if (!this.nuevaCompra().proveedor || !this.nuevaCompra().producto || this.nuevaCompra().cantidad <= 0 || this.nuevaCompra().precio <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    if (this.editando()) {
      this.compraService.actualizarCompra(this.compraEdit().id, this.nuevaCompra()).subscribe({
        next: () => {
          alert('Compra actualizada correctamente');
          this.cargarDatos();
          this.toggleFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar compra:', err);
          alert('Error al actualizar compra');
        }
      });
    } else {
      this.compraService.crearCompra(this.nuevaCompra()).subscribe({
        next: () => {
          alert('Compra registrada correctamente');
          this.cargarDatos();
          this.toggleFormulario();
        },
        error: (err) => {
          console.error('Error al crear compra:', err);
          alert('Error al crear compra');
        }
      });
    }
  }

  eliminarCompra(id: number): void {
    if (confirm('¿Está seguro de eliminar esta compra?')) {
      this.compraService.eliminarCompra(id).subscribe({
        next: () => {
          alert('Compra eliminada correctamente');
          this.cargarDatos();
        },
        error: (err) => {
          console.error('Error al eliminar compra:', err);
          alert('Error al eliminar compra');
        }
      });
    }
  }

  calcularTotal(cantidad: number, precio: number): number {
    return cantidad * precio;
  }

  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}
