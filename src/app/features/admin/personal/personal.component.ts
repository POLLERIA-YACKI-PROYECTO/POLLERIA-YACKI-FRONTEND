import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss']
})
export class PersonalComponent {
  personal = signal<any[]>([
    { id: 1, nombre: 'Carlos Mendoza', dni: '12345678', rol: 'admin', telefono: '987654321' },
    { id: 2, nombre: 'Ana García', dni: '87654321', rol: 'cajero', telefono: '987654322' },
    { id: 3, nombre: 'Luis Fernández', dni: '11111111', rol: 'mesero', telefono: '987654323' }
  ]);
  
  roles = ['admin', 'cajero', 'mesero'];
  mostrarFormulario = signal(false);
  nuevoPersonal = signal({ nombre: '', dni: '', rol: 'mesero', telefono: '' });
  
  toggleFormulario(): void {
    this.mostrarFormulario.set(!this.mostrarFormulario());
  }
  
  guardarPersonal(): void {
    const persona = {
      id: this.personal().length + 1,
      ...this.nuevoPersonal()
    };
    this.personal.update(list => [...list, persona]);
    this.nuevoPersonal.set({ nombre: '', dni: '', rol: 'mesero', telefono: '' });
    this.mostrarFormulario.set(false);
  }
  
  eliminarPersonal(id: number): void {
    if (confirm('¿Eliminar este empleado?')) {
      this.personal.update(list => list.filter(p => p.id !== id));
    }
  }
}