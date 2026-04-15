import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { KpiCard } from '../../core/models/kpi-card.model';
import { Alerte } from '../../core/models/alerte.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, KpiCardComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
    private router = inject(Router);
    // Chart selected type state
    dashChartType: string = 'bar';
    // Mock KPIs aligned with Section 11.3.A
    kpis: KpiCard[] = [
        { id: '1', titre: 'Position Trésorerie Nette', valeur: 12450000000, unite: 'FCFA', couleur: '#1B3A6B', icone: 'fas fa-money-bill-wave', tendance: 'up', variation: 5.2 },
        { id: '2', titre: 'Total Restes à Payer', valeur: 320000000, unite: 'FCFA', couleur: '#B71C1C', icone: 'fas fa-exclamation-triangle', tendance: 'up', variation: 4.8 },
        { id: '3', titre: 'Taux Exécution Budgétaire', valeur: 85.8, unite: 'PERCENT', couleur: '#2E7D32', icone: 'fas fa-chart-line', tendance: 'up', variation: 2.1 },
        { id: '4', titre: 'Solde Bancaire Consolidé', valeur: 15423000000, unite: 'FCFA', couleur: '#D4A017', icone: 'fas fa-university', tendance: 'neutral', variation: 0 },
        { id: '5', titre: 'Opérations en Attente', valeur: 12, unite: 'NOMBRE', couleur: '#E65100', icone: 'fas fa-clock', tendance: 'up', variation: 1.5 }
    ];

    // Mock Alerts aligned with Section 11.3.B
    alertes: Alerte[] = [
        { id: 'a1', type: 'DANGER', service: 'Statistiques', titre: 'RAP > 90 jours', description: 'Ancienneté moyenne des Restes à Payer dépassée.', routeAction: '/statistiques', lue: false, dateCreation: new Date() },
        { id: 'a2', type: 'DANGER', service: 'Trésorerie', titre: 'LA > 60 jours', description: 'Lettres d\'Avance non régularisées après délai.', routeAction: '/tresorerie', lue: false, dateCreation: new Date() },
        { id: 'a3', type: 'DANGER', service: 'Comptabilité', titre: 'Écart concordance > 0.1%', description: 'Écart critique détecté entre BCEAO et ACCT.', routeAction: '/comptabilite', lue: false, dateCreation: new Date() },
        { id: 'a4', type: 'WARNING', service: 'Cautionnement', titre: 'Cautionnement échu', description: 'Cautionnement non régularisé (Date fin + 30j).', routeAction: '/cautionnement', lue: true, dateCreation: new Date() }
    ];

    // Mock Daily Activity aligned with Section 11.3.C
    activiteJour = [
        { label: 'Règlements effectués', valeur: '45', tendance: '+3', icone: 'fas fa-check-circle', couleur: 'text-success', montant: '1.2B FCFA' },
        { label: 'Mandats émis', valeur: '128', tendance: '+12', icone: 'fas fa-file-invoice-dollar', couleur: 'text-primary', montant: '3.5B FCFA' },
        { label: 'Nouveaux cautionnements', valeur: '8', tendance: '0', icone: 'fas fa-shield-alt', couleur: 'text-warning', montant: '850M FCFA' },
        { label: 'Recettes perçues (Régies)', valeur: '2.4B', tendance: '+15%', icone: 'fas fa-arrow-down', couleur: 'text-info', montant: undefined }
    ];

    // Mock Top Posts
    topPostes = [
        { poste: 'Trésorerie Paierie Générale', montant: 450000000, evolution: '+5%' },
        { poste: 'Recette Générale des Finances', montant: 320000000, evolution: '+2%' },
        { poste: 'Trésorerie Principale Cocody', montant: 150000000, evolution: '-1%' },
        { poste: 'Trésorerie Principale Yopougon', montant: 95000000, evolution: '+8%' },
        { poste: 'Trésorerie Régionale Bouaké', montant: 78000000, evolution: '+4%' }
    ];

    getAlertIcon(type: string): string {
        switch (type) {
            case 'DANGER': return 'fas fa-exclamation-circle text-danger';
            case 'WARNING': return 'fas fa-exclamation-triangle text-warning';
            case 'INFO': return 'fas fa-info-circle text-info';
            default: return 'fas fa-bell text-secondary';
        }
    }

    goToDetail(kpiId: string) {
        this.router.navigate(['/kpi-detail', kpiId]);
    }

    goToActiviteDetail(label: string) {
        const idMap: { [key: string]: string } = {
            'Règlements effectués': 'activite-reglements',
            'Mandats émis': 'activite-mandats',
            'Nouveaux cautionnements': 'activite-cautionnements',
            'Recettes perçues (Régies)': 'activite-recettes'
        };
        const id = idMap[label];
        if (id) this.router.navigate(['/kpi-detail', id]);
    }

    goToChartDetail(chartId: string) {
        this.router.navigate(['/kpi-detail', chartId]);
    }
}
