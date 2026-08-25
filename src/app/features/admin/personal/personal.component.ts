// personal.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss']
})
export class PersonalComponent implements OnInit {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  usuario = signal<any>(null);
  temaOscuro = signal<boolean>(false);
  loading = signal(true);
  
  personal = signal<any[]>([]);
  roles = ['admin', 'cajero', 'mesero'];
  mostrarFormulario = signal(false);
  editando = signal(false);
  personalEdit = signal<any>(null);
  
  nuevoPersonal = signal({ 
    nombre: '', 
    apellido: '',
    dni: '', 
    rol: 'mesero', 
    telefono: '', 
    email: '',
    fecha_contratacion: '',
    salario: null
  });
  
  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuarioActual());
    if (!this.usuario() || this.usuario()?.rol !== 'admin') {
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
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        // Mapear para mostrar el rol con formato
        const usuariosFormateados = usuarios.map((u: any) => ({
          ...u,
          rolDisplay: this.getRolDisplay(u.rol),
          nombreCompleto: u.apellido ? `${u.nombre} ${u.apellido}` : u.nombre
        }));
        this.personal.set(usuariosFormateados);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.loading.set(false);
      }
    });
  }

  // Función para obtener el display del rol
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
  
  guardarPersonal(): void {
    if (!this.nuevoPersonal().nombre || !this.nuevoPersonal().dni) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    if (this.nuevoPersonal().dni.length !== 8) {
      alert('El DNI debe tener 8 dígitos');
      return;
    }
    
    if (this.editando()) {
      this.usuarioService.actualizarUsuario(this.personalEdit().id, this.nuevoPersonal()).subscribe({
        next: () => {
          alert('Empleado actualizado correctamente');
          this.cargarDatos();
          this.toggleFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar empleado:', err);
          alert(err.error?.error || 'Error al actualizar empleado');
        }
      });
    } else {
      this.usuarioService.crearUsuario(this.nuevoPersonal()).subscribe({
        next: () => {
          alert('Empleado agregado correctamente');
          this.cargarDatos();
          this.toggleFormulario();
        },
        error: (err) => {
          console.error('Error al crear empleado:', err);
          alert(err.error?.error || 'Error al crear empleado');
        }
      });
    }
  }
  
  eliminarPersonal(id: number): void {
    const persona = this.personal().find(p => p.id === id);
    if (persona && persona.rol === 'admin' && persona.id === 1) {
      alert('No se puede eliminar al administrador principal');
      return;
    }
    
    if (confirm(`¿Está seguro de eliminar a ${persona?.nombre}?`)) {
      this.usuarioService.eliminarUsuario(id).subscribe({
        next: () => {
          alert('Empleado eliminado correctamente');
          this.cargarDatos();
        },
        error: (err) => {
          console.error('Error al eliminar empleado:', err);
          alert(err.error?.error || 'Error al eliminar empleado');
        }
      });
    }
  }

  // Clases CSS para cada rol
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

  // SVG para cada rol
  getRolSvg(rol: string): string {
    const iconos: any = {
      'admin': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      `,
      'cajero': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
          <circle cx="16" cy="15" r="1"/>
        </svg>
      `,
      'mesero': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <circle cx="9" cy="9" r="1" fill="currentColor"/>
          <circle cx="15" cy="9" r="1" fill="currentColor"/>
        </svg>
      `,
      'cocinero': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="9" cy="9" r="1" fill="currentColor"/>
          <circle cx="15" cy="9" r="1" fill="currentColor"/>
          <path d="M9 15c0 2 1.5 3 3 3s3-1 3-3"/>
        </svg>
      `,
      'delivery': `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="4" width="15" height="13" rx="2"/>
          <polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18" r="2.5"/>
          <circle cx="18.5" cy="18" r="2.5"/>
        </svg>
      `
    };
    return iconos[rol] || '';
  }

  irDashboard(): void {
    this.router.navigate(['/admin/dashboard-admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}