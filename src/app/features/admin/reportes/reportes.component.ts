import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent {
  fechaInicio = signal('');
  fechaFin = signal('');
  reporteSeleccionado = signal('ventas');
  
  reportes = signal([
    { id: 'ventas', nombre: 'Reporte de Ventas', icono: '📊' },
    { id: 'diario', nombre: 'Venta Diaria', icono: '📅' },
    { id: 'cajero', nombre: 'Diario de Cajero', icono: '👤' },
    { id: 'totales', nombre: 'Ventas Totales', icono: '💰' },
    { id: 'pago', nombre: 'Forma de Pago', icono: '💳' },
    { id: 'mozo', nombre: 'Ventas por Mozo', icono: '👨‍🍳' },
    { id: 'cliente', nombre: 'Ventas por Cliente', icono: '👥' },
    { id: 'motorizada', nombre: 'Venta Motorizada', icono: '🛵' }
  ]);

  datosReporte = signal<any[]>([
    { id: 1, fecha: '2026-08-24', total: 450.00, items: 12, cliente: 'Juan Pérez' },
    { id: 2, fecha: '2026-08-24', total: 320.50, items: 8, cliente: 'María Gómez' },
    { id: 3, fecha: '2026-08-23', total: 180.00, items: 5, cliente: 'Carlos Ruiz' }
  ]);

  // Computed para obtener el nombre del reporte seleccionado
  nombreReporte = computed(() => {
    const found = this.reportes().find(r => r.id === this.reporteSeleccionado());
    return found ? found.nombre : 'Reporte';
  });

  // Método para calcular total
  calcularTotal(): number {
    return this.datosReporte().reduce((sum, item) => sum + item.total, 0);
  }

  generarReporte(): void {
    console.log('Generando reporte:', this.reporteSeleccionado());
  }

  exportarExcel(): void {
    console.log('Exportando a Excel...');
  }

  exportarPDF(): void {
    console.log('Exportando a PDF...');
  }
}