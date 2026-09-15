// src/app/features/admin/compras/compras.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CompraService } from '../../../core/services/compra.service';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.scss']
})
export class ComprasComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private compraService = inject(CompraService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  private cargando = signal(false);
  private yaCargado = signal(false);

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTema(): void {
    this.temaOscuro.set(!this.temaOscuro());
  }

  cargarDatos(): void {
    if (this.cargando() || this.yaCargado()) return;

    this.cargando.set(true);
    this.loading.set(true);

    this.compraService.obtenerCompras()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (compras) => {
          this.compras.set(compras || []);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
        },
        error: (err) => {
          console.error('Error al cargar compras:', err);
          this.loading.set(false);
          this.cargando.set(false);
        }
      });
  }

  recargar(): void {
    this.yaCargado.set(false);
    this.cargarDatos();
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
      this.compraService.actualizarCompra(this.compraEdit().id, this.nuevaCompra())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Compra actualizada correctamente');
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            console.error('Error al actualizar compra:', err);
            alert('Error al actualizar compra');
          }
        });
    } else {
      this.compraService.crearCompra(this.nuevaCompra())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Compra registrada correctamente');
            this.recargar();
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
      this.compraService.eliminarCompra(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Compra eliminada correctamente');
            this.recargar();
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