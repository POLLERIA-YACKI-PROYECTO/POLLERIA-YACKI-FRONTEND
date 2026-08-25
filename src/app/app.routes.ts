import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { MeseroGuard } from './core/guards/mesero.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login-admin', pathMatch: 'full' },
  
  // Login
  {
    path: 'login-admin',
    loadComponent: () => import('./features/auth/login-admin/login-admin.component')
      .then(m => m.LoginAdminComponent)
  },
  {
    path: 'login-mesero',
    loadComponent: () => import('./features/auth/login-mesero/login-mesero.component')
      .then(m => m.LoginMeseroComponent)
  },
  
  // RUTAS DEL MESERO
  {
    path: 'dashboard-mesero',
    loadComponent: () => import('./features/mesero/dashboard-mesero/dashboard-mesero.component')
      .then(m => m.DashboardMeseroComponent),
    canActivate: [AuthGuard, MeseroGuard]
  },
  {
    path: 'carta-mesero',
    loadComponent: () => import('./features/mesero/carta-mesero/carta-mesero.component')
      .then(m => m.CartaMeseroComponent),
    canActivate: [AuthGuard, MeseroGuard]
  },
  {
    path: 'mesas-mesero',
    loadComponent: () => import('./features/mesero/mesas-mesero/mesas-mesero.component')
      .then(m => m.MesasMeseroComponent),
    canActivate: [AuthGuard, MeseroGuard]
  },
  {
    path: 'pedidos-mesero',
    loadComponent: () => import('./features/mesero/pedidos-mesero/pedidos-mesero.component')
      .then(m => m.PedidosMeseroComponent),
    canActivate: [AuthGuard, MeseroGuard]
  },
  {
    path: 'precios-carta-mesero',
    loadComponent: () => import('./features/mesero/precios-carta-mesero/precios-carta-mesero.component')
      .then(m => m.PreciosCartaMeseroComponent),
    canActivate: [AuthGuard, MeseroGuard]
  },
  {
    path: 'ventas-mesero',
    loadComponent: () => import('./features/mesero/ventas-mesero/ventas-mesero.component')
      .then(m => m.VentasMeseroComponent),
    canActivate: [AuthGuard, MeseroGuard]
  },
  {
    path: 'ticket',
    loadComponent: () => import('./features/mesero/ticket/ticket.component')
      .then(m => m.TicketComponent),
    canActivate: [AuthGuard, MeseroGuard]
  },
  
  // RUTAS DEL ADMINISTRADOR
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component')
      .then(m => m.AdminComponent),
    canActivate: [AuthGuard, AdminGuard],
    children: [
      {
        path: 'dashboard-admin',
        loadComponent: () => import('./features/admin/dashboard-admin/dashboard-admin.component')
          .then(m => m.DashboardAdminComponent)
      },
      {
        path: 'carta-admin',
        loadComponent: () => import('./features/admin/carta-admin/carta-admin.component')
          .then(m => m.CartaAdminComponent)
      },
      {
        path: 'precios-admin',
        loadComponent: () => import('./features/admin/precios-admin/precios-admin.component')
          .then(m => m.PreciosAdminComponent)
      },
      {
        path: 'mantenimiento',
        loadComponent: () => import('./features/admin/mantenimiento/mantenimiento.component')
          .then(m => m.MantenimientoComponent)
      },
      {
        path: 'compras',
        loadComponent: () => import('./features/admin/compras/compras.component')
          .then(m => m.ComprasComponent)
      },
      {
        path: 'descargos',
        loadComponent: () => import('./features/admin/descargos/descargos.component')
          .then(m => m.DescargosComponent)
      },
      {
        path: 'personal',
        loadComponent: () => import('./features/admin/personal/personal.component')
          .then(m => m.PersonalComponent)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/admin/reportes/reportes.component')
          .then(m => m.ReportesComponent)
      },
      { path: '', redirectTo: 'dashboard-admin', pathMatch: 'full' }
    ]
  },
  
  { path: '**', redirectTo: '/login-admin' }
];