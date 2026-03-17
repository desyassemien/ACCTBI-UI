import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'profil',
                loadComponent: () => import('./features/profil/profil.component').then(m => m.ProfilComponent)
            },
            {
                path: 'comptabilite',
                loadComponent: () => import('./features/comptabilite/comptabilite.component').then(m => m.ComptabiliteComponent)
            },
            // Placeholder routes for navigation items to prevent errors
            {
                path: 'tresorerie',
                loadComponent: () => import('./features/tresorerie/tresorerie.component').then(m => m.TresorerieComponent)
            },
            {
                path: 'cautionnement',
                loadComponent: () => import('./features/cautionnement/cautionnement.component').then(m => m.CautionnementComponent)
            },
            {
                path: 'regies',
                loadComponent: () => import('./features/regies/regies.component').then(m => m.RegiesComponent)
            },
            { path: 'statistiques', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'compte-gestion', loadComponent: () => import('./features/gestion-compte/gestion-compte.component').then(m => m.GestionCompteComponent) },
            { path: 'reglement', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'admin', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) }
        ]
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
