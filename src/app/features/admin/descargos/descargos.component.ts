import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-descargos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './descargos.component.html',
  styleUrls: ['./descargos.component.scss']
})
export class DescargosComponent {
  descargos = signal<any[]>([
    { id: 1, producto: 'Pollo Entero', cantidad: 5, motivo: 'Merma', fecha: '2026-08-24' },
    { id: 2, producto: 'Papas Fritas', cantidad: 2, motivo: 'Caducado', fecha: '2026-08-23' }
  ]);
  
  mostrarFormulario = signal(false);
  nuevoDescargo = signal({ producto: '', cantidad: 0, motivo: '' });
  
  toggleFormulario(): void {
    this.mostrarFormulario.set(!this.mostrarFormulario());
  }
  
  guardarDescargo(): void {
    const descargo = {
      id: this.descargos().length + 1,
      ...this.nuevoDescargo(),
      fecha: new Date().toISOString().split('T')[0]
    };
    this.descargos.update(list => [...list, descargo]);
    this.nuevoDescargo.set({ producto: '', cantidad: 0, motivo: '' });
    this.mostrarFormulario.set(false);
  }
  
  eliminarDescargo(id: number): void {
    if (confirm('¿Eliminar este descargo?')) {
      this.descargos.update(list => list.filter(d => d.id !== id));
    }
  }
}