import { Routes } from '@angular/router';
import { authKeycloakGuard } from './core/guards/auth.guard';
import { roleRedirectGuard } from './core/guards/role-redirect.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivateChild: [authKeycloakGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
                canActivate: [roleRedirectGuard],
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
                data: { roles: ['ADMIN'] }
            },
            {
                path: 'kpi-detail/:id',
                loadComponent: () => import('./features/dashboard/kpi-detail/kpi-detail.component').then(m => m.KpiDetailComponent)
            },
            {
                path: 'profil',
                loadComponent: () => import('./features/profil/profil.component').then(m => m.ProfilComponent)
            },
            {
                path: 'comptabilite',
                loadComponent: () => import('./features/comptabilite/comptabilite.component').then(m => m.ComptabiliteComponent),
                data: { roles: ['ADMIN', 'CHEF_COMPTA'] }
            },
            {
                path: 'tresorerie',
                loadComponent: () => import('./features/tresorerie/tresorerie.component').then(m => m.TresorerieComponent),
                data: { roles: ['ADMIN', 'CHEF_TRESORERIE'] }
            },
            {
                path: 'cautionnement',
                loadComponent: () => import('./features/cautionnement/cautionnement.component').then(m => m.CautionnementComponent),
                data: { roles: ['ADMIN'] }
            },
            {
                path: 'regies',
                loadComponent: () => import('./features/regies/regies.component').then(m => m.RegiesComponent),
                data: { roles: ['ADMIN', 'CHEF_REGIE'] }
            },
            {
                path: 'gestion-compte',
                loadComponent: () => import('./features/gestion-compte/gestion-compte.component').then(m => m.GestionCompteComponent)
            },
            {
                path: 'statistiques',
                loadComponent: () => import('./features/statistiques/statistiques.component').then(m => m.StatistiquesComponent)
            },
            {
                path: 'statistiques/rapport/:id',
                loadComponent: () => import('./features/statistiques/rapports/rapport-detail.component').then(m => m.RapportDetailComponent)
            },
            { 
                path: 'compte-gestion', 
                loadComponent: () => import('./features/gestion-compte/gestion-compte.component').then(m => m.GestionCompteComponent) 
            },
            { 
                path: 'reglement', 
                loadComponent: () => import('./features/reglement/reglement.component').then(m => m.ReglementComponent) 
            },
            { 
                path: 'admin', 
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) 
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
