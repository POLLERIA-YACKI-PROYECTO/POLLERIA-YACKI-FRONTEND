// src/app/features/admin/personal/personal.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { NotificationService } from '../../../core/services/notificacion.service';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss']
})
export class PersonalComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  private cargando = signal(false);
  private yaCargado = signal(false);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(false);
  loading = signal(true);

  personal = signal<any[]>([]);
  roles = ['admin', 'cajero', 'mesero'];
  mostrarFormulario = signal(false);
  editando = signal(false);
  personalEdit = signal<any>(null);

  mostrarModalEliminar = signal(false);
  personalAEliminar = signal<any>(null);
  eliminando = signal(false);

  //NUEVO: Modal de confirmación para admin principal
  mostrarModalAviso = signal(false);
  mensajeAviso = signal('');

  guardando = signal(false);

  nuevoPersonal = signal({
    nombre: '',
    apellido: '',
    dni: '',
    rol: 'mesero',
    telefono: '',
    email: '',
    fecha_contratacion: '',
    salario: null as number | null
  });

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login-admin']);
      return;
    }

    this.usuario.set(this.authService.getUsuarioActual());

    if (!this.usuario() || this.usuario()?.rol !== 'admin') {
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

    this.usuarioService.obtenerUsuarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarios) => {
          const usuariosFormateados = (usuarios || []).map((u: any) => ({
            ...u,
            rolDisplay: this.getRolDisplay(u.rol),
            nombreCompleto: u.apellido ? `${u.nombre} ${u.apellido}` : u.nombre
          }));
          this.personal.set(usuariosFormateados);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(true);
          console.log('Personal cargado:', usuariosFormateados.length, 'empleados');
        },
        error: (err) => {
          console.error('Error al cargar usuarios:', err);
          this.loading.set(false);
          this.cargando.set(false);
          this.yaCargado.set(false);
          this.notificationService.error('No se pudieron cargar los empleados.', 'Error');
        }
      });
  }

  recargar(): void {
    this.usuarioService.limpiarCache();
    this.yaCargado.set(false);
    this.cargarDatos();
  }

  // ============================================
  // UTILIDADES DE ROL
  // ============================================
  getRolDisplay(rol: string): string {
    const rolesMap: any = {
      'admin': 'Administrador',
      'cajero': 'Cajero',
      'mesero': 'Mesero',
      'cocinero': 'Cocinero',
      'delivery': 'Delivery'
    };
    return rolesMap[rol] || rol;
  }

  getRolClass(rol: string): string {
    const clases: any = {
      'admin': 'rol-admin',
      'cajero': 'rol-cajero',
      'mesero': 'rol-mesero',
      'cocinero': 'rol-cocinero',
      'delivery': 'rol-delivery'
    };
    return clases[rol] || '';
  }

  getRolSvg(rol: string): string {
    const iconos: any = {
      'admin': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
      'cajero': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="16" cy="15" r="1"/></svg>`,
      'mesero': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/></svg>`,
      'cocinero': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><path d="M9 15c0 2 1.5 3 3 3s3-1 3-3"/></svg>`,
      'delivery': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="15" height="13" rx="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/></svg>`
    };
    return iconos[rol] || '';
  }

  // ============================================
  // FORMULARIO
  // ============================================
  toggleFormulario(): void {
    this.mostrarFormulario.set(!this.mostrarFormulario());
    if (!this.mostrarFormulario()) {
      this.editando.set(false);
      this.personalEdit.set(null);
      this.nuevoPersonal.set({
        nombre: '',
        apellido: '',
        dni: '',
        rol: 'mesero',
        telefono: '',
        email: '',
        fecha_contratacion: '',
        salario: null
      });
    }
  }

  editarPersonal(persona: any): void {
    this.editando.set(true);
    this.personalEdit.set(persona);
    this.nuevoPersonal.set({
      nombre: persona.nombre,
      apellido: persona.apellido || '',
      dni: persona.dni,
      rol: persona.rol,
      telefono: persona.telefono || '',
      email: persona.email || '',
      fecha_contratacion: persona.fecha_contratacion || '',
      salario: persona.salario || null
    });
    this.mostrarFormulario.set(true);
  }

  // ============================================
  // GUARDAR
  // ============================================
  guardarPersonal(): void {
    if (this.guardando()) return;

    const data = this.nuevoPersonal();

    // Validaciones con notificaciones
    if (!data.nombre || !data.dni) {
      this.notificationService.warning(
        'Completa el nombre y el DNI del empleado.',
        'Campos incompletos'
      );
      return;
    }

    if (data.dni.length !== 8) {
      this.notificationService.warning(
        'El DNI debe tener exactamente 8 dígitos.',
        'DNI inválido'
      );
      return;
    }

    this.guardando.set(true);

    if (this.editando()) {
      this.usuarioService.actualizarUsuario(this.personalEdit().id, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.notificationService.success(
              `"${data.nombre}" se actualizó correctamente.`,
              'Empleado actualizado'
            );
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            this.guardando.set(false);
            console.error('Error al actualizar empleado:', err);
            this.notificationService.error(
              this.obtenerMensajeError(err, 'actualizar'),
              'Error al actualizar'
            );
          }
        });
    } else {
      this.usuarioService.crearUsuario(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.notificationService.success(
              `"${data.nombre}" se agregó correctamente.`,
              'Empleado agregado'
            );
            this.recargar();
            this.toggleFormulario();
          },
          error: (err) => {
            this.guardando.set(false);
            console.error('Error al crear empleado:', err);
            this.notificationService.error(
              this.obtenerMensajeError(err, 'crear'),
              'Error al crear'
            );
          }
        });
    }
  }

  private obtenerMensajeError(err: any, accion: 'crear' | 'actualizar' | 'eliminar'): string {
    if (err?.error?.error) return err.error.error;
    if (err?.error?.message) return err.error.message;

    switch (err?.status) {
      case 0: return 'No se pudo conectar con el servidor.';
      case 401: return 'Sesión expirada. Vuelve a iniciar sesión.';
      case 403: return `No tienes permisos para ${accion} empleados.`;
      case 404: return 'El empleado ya no existe.';
      case 409: return 'Ya existe un empleado con ese DNI o email.';
      case 500: return 'Error interno del servidor.';
      default: return `Error al ${accion} empleado.`;
    }
  }

  // ============================================
  // MODAL ELIMINAR
  // ============================================
  abrirModalEliminar(persona: any): void {
    //  Si es el admin principal, mostrar aviso elegante (NO alert)
    if (persona.rol === 'admin' && persona.id === 1) {
      this.mensajeAviso.set('No se puede eliminar al administrador principal del sistema.');
      this.mostrarModalAviso.set(true);
      return;
    }

    this.personalAEliminar.set(persona);
    this.mostrarModalEliminar.set(true);
  }

  cerrarModalEliminar(): void {
    if (this.eliminando()) return;
    this.mostrarModalEliminar.set(false);
    this.personalAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const persona = this.personalAEliminar();
    if (!persona) return;

    if (this.eliminando()) return;

    this.eliminando.set(true);

    this.usuarioService.eliminarUsuario(persona.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.eliminando.set(false);
          this.mostrarModalEliminar.set(false);
          this.personalAEliminar.set(null);
          this.notificationService.success(
            `"${persona.nombreCompleto || persona.nombre}" se eliminó correctamente.`,
            'Empleado eliminado'
          );
          this.recargar();
        },
        error: (err) => {
          this.eliminando.set(false);
          console.error('Error al eliminar empleado:', err);
          this.notificationService.error(
            this.obtenerMensajeError(err, 'eliminar'),
            'Error al eliminar'
          );
          this.cerrarModalEliminar();
        }
      });
  }

  // ============================================
  // MODAL AVISO
  // ============================================
  cerrarModalAviso(): void {
    this.mostrarModalAviso.set(false);
    this.mensajeAviso.set('');
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================
  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}