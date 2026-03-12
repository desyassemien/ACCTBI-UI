import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
    private authService = inject(AuthService);

    logout() {
        this.authService.logout();
    }

    // Navigation structure based on context
    readonly menuItems = [
        {
            title: 'SERVICES',
            items: [
                { path: '/comptabilite', icon: 'fas fa-book', label: 'Comptabilité' },
                { path: '/tresorerie', icon: 'fas fa-money-bill-wave', label: 'Trésorerie' },
                { path: '/cautionnement', icon: 'fas fa-shield-alt', label: 'Cautionnement' },
                { path: '/regies', icon: 'fas fa-store', label: 'Régies' },
                { path: '/reglement', icon: 'fas fa-hand-holding-usd', label: 'Règlement' },
                { path: '/statistiques', icon: 'fas fa-chart-bar', label: 'Statistiques' },
                { path: '/compte-gestion', icon: 'fas fa-clipboard-list', label: 'Compte de Gestion' }
            ]
        },
        {
            title: 'SYSTÈME',
            items: [
                { path: '/admin', icon: 'fas fa-cog', label: 'Administration' }
            ]
        }
    ];
}
