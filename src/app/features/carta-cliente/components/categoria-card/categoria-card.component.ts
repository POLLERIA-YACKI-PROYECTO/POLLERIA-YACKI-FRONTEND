// categoria-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  descripcion: string;
  activo: boolean;
}

@Component({
  selector: 'app-categoria-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categoria-card.component.html',
  styleUrls: ['./categoria-card.component.scss']
})
export class CategoriaCardComponent {
  @Input() categoria!: Categoria;
  @Input() seleccionada = false;
  @Output() seleccionar = new EventEmitter<number>();
}