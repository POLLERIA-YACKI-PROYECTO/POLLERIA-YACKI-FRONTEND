import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { MeseroGuard } from './core/guards/mesero.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login-admin',
    pathMatch: 'full'
  },
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

  {
    path: 'carta',
    loadComponent: () => import('./features/carta/carta.component')
      .then(m => m.CartaComponent),
    canActivate: [AuthGuard, MeseroGuard]
  },
  {
    path: 'ventas',
    loadComponent: () => import('./features/ventas/ventas.component')
      .then(m => m.VentasComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component')
      .then(m => m.AdminComponent),
    canActivate: [AuthGuard, AdminGuard],
    children: [
      {
        path: 'carta-admin',
        loadComponent: () => import('./features/admin/carta-admin/carta-admin.component')
          .then(m => m.CartaAdminComponent)
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
      {
        path: '',
        redirectTo: 'carta-admin',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login-admin'
  }
];