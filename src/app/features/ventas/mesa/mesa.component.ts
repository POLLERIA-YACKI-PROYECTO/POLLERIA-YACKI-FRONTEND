import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mesa-venta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mesa.component.html',
  styleUrls: ['./mesa.component.scss']
})
export class MesaVentaComponent {
  @Input() numero: number = 0;
  @Input() seleccionada: boolean = false;
  @Input() ocupada: boolean = false;
  @Input() cliente: string = '';
  @Output() seleccionar = new EventEmitter<number>();
}