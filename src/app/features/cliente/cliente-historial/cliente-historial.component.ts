import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoService } from '../../../core/services/pedido.service';

@Component({
  selector: 'app-cliente-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cliente-historial.component.html',
  styleUrls: ['./cliente-historial.component.scss']
})
export class ClienteHistorialComponent implements OnInit {
  private authService = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);

  pedidos = signal<any[]>([]);

  ngOnInit(): void {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario || usuario.rol !== 'cliente') {
      this.router.navigate(['/login-cliente']);
      return;
    }

    this.pedidoService.obtenerHistorialCliente().subscribe({
      next: (historial) => this.pedidos.set(Array.isArray(historial) ? historial : []),
      error: (error) => {
        console.error('Error al cargar historial de pedidos:', error);
        this.pedidos.set([]);
      }
    });
  }

  volverCarta(): void {
    this.router.navigate(['/cliente/carta']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-cliente']);
  }
}
