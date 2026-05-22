import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import Keycloak from 'keycloak-js';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule],
    providers: [DatePipe],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
    private router = inject(Router);
    private keycloak = inject(Keycloak);
    private authService = inject(AuthService);
    public notificationService = inject(NotificationService);

    userProfile: any | null = null;
    notificationCount = 3;
    isDarkMode = false;
    user = this.authService.currentUser;

    async ngOnInit() {
        try {
            if (this.keycloak.authenticated) {
                this.userProfile = await this.keycloak.loadUserProfile();
            }
        } catch (err) {
            console.error('Erreur lors du chargement du profil Keycloak:', err);
        }
    }

    /** Check if any service route is currently active (for dropdown highlight) */
    get isServicesActive(): boolean {
        const url = this.router.url;
        return this.serviceItems.some(item => url.startsWith(item.path));
    }


    // Navigation items
    readonly serviceItems = [
        { path: '/comptabilite', icon: 'fas fa-book', label: 'Comptabilité' },
        { path: '/tresorerie', icon: 'fas fa-money-bill-wave', label: 'Trésorerie' },
        { path: '/cautionnement', icon: 'fas fa-shield-alt', label: 'Cautionnement' },
        { path: '/regies', icon: 'fas fa-store', label: 'Régies' },
        { path: '/reglement', icon: 'fas fa-hand-holding-usd', label: 'Règlement' },
        { path: '/statistiques', icon: 'fas fa-chart-bar', label: 'Statistiques' },
        { path: '/compte-gestion', icon: 'fas fa-clipboard-list', label: 'Compte de Gestion' }
    ];

    /** Helper to get service clean name without slash */
    getServiceName(path: string): string {
        return path?.replace('/', '') || '';
    }

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

    async logout() {
        console.log('[Header] Tentative de déconnexion via l\'instance native Keycloak...');
        await this.keycloak.logout({
            redirectUri: window.location.origin
        });
    }

    markAsRead(id: string, event: Event) {
        event.stopPropagation();
        this.notificationService.markAsRead(id);
    }

    markAllAsRead(event: Event) {
        event.stopPropagation();
        this.notificationService.markAllAsRead();
    }

    testPushNotification(event: Event) {
        event.stopPropagation();
        const alertes = this.notificationService.alertes();
        if (alertes && alertes.length > 0) {
            this.notificationService.triggerSystemNotification(alertes[0]);
        }
    }
}
