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

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    // ✅ Verificar autenticación primero
    if (!this.authService.isAuthenticated()) {
      console.warn('🛡️ Compras: sin sesión → /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    this.usuario.set(this.authService.getUsuarioActual());

    if (this.usuario()?.rol !== 'admin') {
      console.warn('🛡️ Compras: no es admin → /login-admin');
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

  // ============================================
  // CARGAR DATOS
  // ============================================
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
          console.log('✅ Compras cargadas:', (compras || []).length);
        },
        error: (err) => {
          console.error('Error al cargar compras:', err);
          this.loading.set(false);
          this.cargando.set(false);
          // ✅ Resetear yaCargado para permitir reintento
          this.yaCargado.set(false);
        }
      });
  }

  recargar(): void {
    this.yaCargado.set(false);
    this.cargarDatos();
  }

  // ============================================
  // FORMULARIO
  // ============================================
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

  // ============================================
  // GUARDAR (con reset de editando SIEMPRE)
  // ============================================
  guardarCompra(): void {
    const data = this.nuevaCompra();

    if (!data.proveedor || !data.producto || data.cantidad <= 0 || data.precio <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    if (this.editando()) {
      this.compraService.actualizarCompra(this.compraEdit().id, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Compra actualizada correctamente');
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            console.error('Error al actualizar compra:', err);
            // ✅ Mensaje específico por status
            let mensaje = 'Error al actualizar compra';
            if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
            else if (err?.status === 401) mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para actualizar compras.';
            else if (err?.status === 404) mensaje = 'La compra ya no existe.';
            else if (err?.error?.error) mensaje = err.error.error;
            alert(`❌ ${mensaje}`);
          }
        });
    } else {
      this.compraService.crearCompra(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Compra registrada correctamente');
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            console.error('Error al crear compra:', err);
            let mensaje = 'Error al crear compra';
            if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
            else if (err?.status === 401) mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para crear compras.';
            else if (err?.error?.error) mensaje = err.error.error;
            alert(`❌ ${mensaje}`);
          }
        });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================
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
            let mensaje = 'Error al eliminar compra';
            if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
            else if (err?.status === 401) mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para eliminar compras.';
            else if (err?.status === 404) mensaje = 'La compra ya no existe.';
            else if (err?.error?.error) mensaje = err.error.error;
            alert(`❌ ${mensaje}`);
          }
        });
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================
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