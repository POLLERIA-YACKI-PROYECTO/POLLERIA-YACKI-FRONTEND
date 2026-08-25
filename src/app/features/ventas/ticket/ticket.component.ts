import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss']
})
export class TicketComponent {
  @Input() pedido: any = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() imprimir = new EventEmitter<void>();

  get fecha(): string {
    return new Date().toLocaleString();
  }

  calcularSubtotal(): number {
    if (!this.pedido?.items) return 0;
    return this.pedido.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  }

  calcularIGV(): number {
    const subtotal = this.calcularSubtotal();
    return subtotal * 0.18;
  }

  imprimirTicket(): void {
    this.imprimir.emit();
  }

  cerrarTicket(): void {
    this.cerrar.emit();
  }
}