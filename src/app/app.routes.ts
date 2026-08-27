// app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { MeseroGuard } from './core/guards/mesero.guard';

export const routes: Routes = [
  // ============================================
  // RUTA PRINCIPAL - CARTA DEL CLIENTE
  // ============================================
  { 
    path: '', 
    redirectTo: '/carta', 
    pathMatch: 'full' 
  },
  {
    path: 'carta',
    loadChildren: () => import('./features/carta-cliente/carta-cliente.routes')
      .then(m => m.CARTA_CLIENTE_ROUTES)
  },
  
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
  
  // ============================================
  // RUTAS DEL MESERO
  // ============================================
  {
    path: 'mesero',
    canActivate: [AuthGuard, MeseroGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/mesero/dashboard-mesero/dashboard-mesero.component')
          .then(m => m.DashboardMeseroComponent)
      },
      {
        path: 'carta',
        loadComponent: () => import('./features/mesero/carta-mesero/carta-mesero.component')
          .then(m => m.CartaMeseroComponent)
      },
      {
        path: 'mesas',
        loadComponent: () => import('./features/mesero/mesas-mesero/mesas-mesero.component')
          .then(m => m.MesasMeseroComponent)
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./features/mesero/pedidos-mesero/pedidos-mesero.component')
          .then(m => m.PedidosMeseroComponent)
      },
      {
        path: 'precios',
        loadComponent: () => import('./features/mesero/precios-carta-mesero/precios-carta-mesero.component')
          .then(m => m.PreciosCartaMeseroComponent)
      },
      {
        path: 'ventas',
        loadComponent: () => import('./features/mesero/ventas-mesero/ventas-mesero.component')
          .then(m => m.VentasMeseroComponent)
      },
      {
        path: 'tickets',
        loadComponent: () => import('./features/mesero/ticket/ticket.component')
          .then(m => m.TicketComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // ============================================
  // RUTAS DEL ADMINISTRADOR
  // ============================================
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () => import('./features/admin/admin.component')
      .then(m => m.AdminComponent),
    children: [
      {
        path: 'dashboard-admin',
        loadComponent: () => import('./features/admin/dashboard-admin/dashboard-admin.component')
          .then(m => m.DashboardAdminComponent)
      },
      {
        path: 'ventas-admin',
        loadComponent: () => import('./features/admin/ventas-admin/ventas-admin.component')
          .then(m => m.VentasAdminComponent)
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
  
  { path: '**', redirectTo: '/carta' }
];