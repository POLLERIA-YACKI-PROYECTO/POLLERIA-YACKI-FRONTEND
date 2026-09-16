// src/app/features/admin/descargos/descargos.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DescargoService } from '../../../core/services/descargo.service';

@Component({
  selector: 'app-descargos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './descargos.component.html',
  styleUrls: ['./descargos.component.scss']
})
export class DescargosComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private descargoService = inject(DescargoService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  private cargando = signal(false);
  private yaCargado = signal(false);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(false);
  loading = signal(true);
  mostrarFormulario = signal(false);
  editando = signal(false);
  descargoEdit = signal<any>(null);

  descargos = signal<any[]>([]);
  nuevoDescargo = signal({
    producto: '',
    cantidad: 0,
    motivo: '',
    tipo: 'merma'
  });

  tipos = [
    { value: 'merma', label: 'Merma' },
    { value: 'caducado', label: 'Caducado' },
    { value: 'rotura', label: 'Rotura' },
    { value: 'devolucion', label: 'Devolución' },
    { value: 'otros', label: 'Otros' }
  ];

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    // ✅ Verificar autenticación primero
    if (!this.authService.isAuthenticated()) {
      console.warn('🛡️ Descargos: sin sesión → /login-admin');
      this.router.navigate(['/login-admin']);
      return;
    }

    this.usuario.set(this.authService.getUsuarioActual());

    if (this.usuario()?.rol !== 'admin') {
      console.warn('🛡️ Descargos: no es admin → /login-admin');
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

    this.descargoService.obtenerDescargos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (descargos) => {
          this.descargos.set(descargos || []);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('✅ Descargos cargados:', (descargos || []).length);
        },
        error: (err) => {
          console.error('Error al cargar descargos:', err);
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
      this.descargoEdit.set(null);
      this.nuevoDescargo.set({ producto: '', cantidad: 0, motivo: '', tipo: 'merma' });
    }
  }

  editarDescargo(descargo: any): void {
    this.editando.set(true);
    this.descargoEdit.set(descargo);
    this.nuevoDescargo.set({
      producto: descargo.producto,
      cantidad: descargo.cantidad,
      motivo: descargo.motivo,
      tipo: descargo.tipo || 'merma'
    });
    this.mostrarFormulario.set(true);
  }

  // ============================================
  // GUARDAR (con mensajes de error específicos)
  // ============================================
  guardarDescargo(): void {
    const data = this.nuevoDescargo();

    if (!data.producto || data.cantidad <= 0 || !data.motivo) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    if (this.editando()) {
      this.descargoService.actualizarDescargo(this.descargoEdit().id, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Descargo actualizado correctamente');
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            console.error('Error al actualizar descargo:', err);
            let mensaje = 'Error al actualizar descargo';
            if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
            else if (err?.status === 401) mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para actualizar descargos.';
            else if (err?.status === 404) mensaje = 'El descargo ya no existe.';
            else if (err?.error?.error) mensaje = err.error.error;
            alert(`❌ ${mensaje}`);
          }
        });
    } else {
      this.descargoService.crearDescargo(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Descargo registrado correctamente');
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            console.error('Error al crear descargo:', err);
            let mensaje = 'Error al crear descargo';
            if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
            else if (err?.status === 401) mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para crear descargos.';
            else if (err?.error?.error) mensaje = err.error.error;
            alert(`❌ ${mensaje}`);
          }
        });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================
  eliminarDescargo(id: number): void {
    if (confirm('¿Está seguro de eliminar este descargo?')) {
      this.descargoService.eliminarDescargo(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Descargo eliminado correctamente');
            this.recargar();
          },
          error: (err) => {
            console.error('Error al eliminar descargo:', err);
            let mensaje = 'Error al eliminar descargo';
            if (err?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
            else if (err?.status === 401) mensaje = 'Sesión expirada. Vuelve a iniciar sesión.';
            else if (err?.status === 403) mensaje = 'No tienes permisos para eliminar descargos.';
            else if (err?.status === 404) mensaje = 'El descargo ya no existe.';
            else if (err?.error?.error) mensaje = err.error.error;
            alert(`❌ ${mensaje}`);
          }
        });
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================
  getTipoLabel(tipo: string): string {
    const tipos: any = {
      'merma': 'Merma',
      'caducado': 'Caducado',
      'rotura': 'Rotura',
      'devolucion': 'Devolución',
      'otros': 'Otros'
    };
    return tipos[tipo] || tipo;
  }

  getTipoClass(tipo: string): string {
    const clases: any = {
      'merma': 'tipo-merma',
      'caducado': 'tipo-caducado',
      'rotura': 'tipo-rotura',
      'devolucion': 'tipo-devolucion',
      'otros': 'tipo-otros'
    };
    return clases[tipo] || 'tipo-otros';
  }

  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}