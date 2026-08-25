import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DescargoService } from '../../../core/services/descargo.service';

@Component({
  selector: 'app-descargos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './descargos.component.html',
  styleUrls: ['./descargos.component.scss']
})
export class DescargosComponent implements OnInit {
  private authService = inject(AuthService);
  private descargoService = inject(DescargoService);
  private router = inject(Router);

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
    this.descargoService.obtenerDescargos().subscribe({
      next: (descargos) => {
        this.descargos.set(descargos);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar descargos:', err);
        this.loading.set(false);
      }
    });
  }

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

  guardarDescargo(): void {
    if (!this.nuevoDescargo().producto || this.nuevoDescargo().cantidad <= 0 || !this.nuevoDescargo().motivo) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    if (this.editando()) {
      this.descargoService.actualizarDescargo(this.descargoEdit().id, this.nuevoDescargo()).subscribe({
        next: () => {
          alert('Descargo actualizado correctamente');
          this.cargarDatos();
          this.toggleFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar descargo:', err);
          alert('Error al actualizar descargo');
        }
      });
    } else {
      this.descargoService.crearDescargo(this.nuevoDescargo()).subscribe({
        next: () => {
          alert('Descargo registrado correctamente');
          this.cargarDatos();
          this.toggleFormulario();
        },
        error: (err) => {
          console.error('Error al crear descargo:', err);
          alert('Error al crear descargo');
        }
      });
    }
  }

  eliminarDescargo(id: number): void {
    if (confirm('¿Está seguro de eliminar este descargo?')) {
      this.descargoService.eliminarDescargo(id).subscribe({
        next: () => {
          alert('Descargo eliminado correctamente');
          this.cargarDatos();
        },
        error: (err) => {
          console.error('Error al eliminar descargo:', err);
          alert('Error al eliminar descargo');
        }
      });
    }
  }

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