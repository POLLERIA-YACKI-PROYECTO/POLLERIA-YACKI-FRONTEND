import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mesa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mesa.component.html',
  styleUrls: ['./mesa.component.scss']
})
export class MesaComponent {
  @Input() numero: number = 0;
  @Input() seleccionada: boolean = false;
  @Input() ocupada: boolean = false;
  @Output() seleccionar = new EventEmitter<number>();
}