import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import Keycloak from 'keycloak-js';
import { LayoutService } from '../../core/services/layout.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
    host: {
        '[class.sidebar-host-collapsed]': 'layoutService.sidebarCollapsed()'
    }
})
export class SidebarComponent {
    private keycloak = inject(Keycloak);
    public layoutService = inject(LayoutService);
    public notificationService = inject(NotificationService);

    servicesOpen = signal<boolean>(true);
    pilotageOpen = signal<boolean>(true);

    readonly serviceItems = [
        { path: '/comptabilite', icon: 'fas fa-book', label: 'Comptabilité' },
        { path: '/tresorerie', icon: 'fas fa-money-bill-wave', label: 'Trésorerie' },
        { path: '/cautionnement', icon: 'fas fa-shield-alt', label: 'Cautionnement' },
        { path: '/regies', icon: 'fas fa-store', label: 'Régies' },
        { path: '/reglement', icon: 'fas fa-hand-holding-usd', label: 'Règlement' },
        { path: '/statistiques', icon: 'fas fa-chart-bar', label: 'Statistiques' },
        { path: '/compte-gestion', icon: 'fas fa-clipboard-list', label: 'Compte de Gestion' }
    ];

    readonly pilotageItems = [
        { path: '/synthese-decisionnelle', icon: 'fas fa-shield-alt', label: 'Synthèse Décisionnelle', isNotif: false },
        { path: '/analyse-comparative', icon: 'fas fa-balance-scale', label: 'Analyse Comparative', isNotif: false },
        { path: '/decision-ia', icon: 'fas fa-brain', label: 'Décision & Prospective IA', isNotif: false },
        { path: '/notifications', icon: 'fas fa-bell', label: 'Notifications', isNotif: true }
    ];

    getServiceName(path: string): string {
        return path?.replace('/', '') || '';
    }

    toggleServices() {
        this.servicesOpen.update(v => !v);
    }

    togglePilotage() {
        this.pilotageOpen.update(v => !v);
    }

    onLinkClick() {
        this.layoutService.closeMobileSidebar();
    }

    logout() {
        this.keycloak.logout({ redirectUri: window.location.origin });
    }
}
