import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    user = this.authService.currentUser;
    notificationCount = 3;
    isDarkMode = false;

    // Navigation items (moved from sidebar)
    readonly serviceItems = [
        { path: '/comptabilite', icon: 'fas fa-book', label: 'Comptabilité' },
        { path: '/tresorerie', icon: 'fas fa-money-bill-wave', label: 'Trésorerie' },
        { path: '/cautionnement', icon: 'fas fa-shield-alt', label: 'Cautionnement' },
        { path: '/regies', icon: 'fas fa-store', label: 'Régies' },
        { path: '/reglement', icon: 'fas fa-hand-holding-usd', label: 'Règlement' },
        { path: '/statistiques', icon: 'fas fa-chart-bar', label: 'Statistiques' },
        { path: '/compte-gestion', icon: 'fas fa-clipboard-list', label: 'Compte de Gestion' }
    ];

    constructor() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.isDarkMode = savedTheme === 'dark';
            this.applyTheme();
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.isDarkMode = true;
            this.applyTheme();
        }
    }

    /** Check if any service route is currently active (for dropdown highlight) */
    get isServicesActive(): boolean {
        const url = this.router.url;
        return this.serviceItems.some(item => url.startsWith(item.path));
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    }

    private applyTheme() {
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
        }
    }

    logout() {
        this.authService.logout();
    }
}
