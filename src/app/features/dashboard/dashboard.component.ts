import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    // Chart selected type state
    dashChartType: string = 'bar';
    // Mock KPIs
    kpis: KpiCard[] = [
        { id: '1', titre: 'Solde CUT', valeur: 1542300000, unite: 'FCFA', couleur: '#1B3A6B', icone: 'fas fa-wallet', tendance: 'up', variation: 5.2 },
        { id: '2', titre: 'Mandats du Mois', valeur: 1245, unite: 'NOMBRE', couleur: '#3D5A8C', icone: 'fas fa-file-invoice-dollar', tendance: 'up', variation: 12 },
        { id: '3', titre: 'Taux Exécution Budg', valeur: 45.8, unite: 'PERCENT', couleur: '#2E7D32', icone: 'fas fa-chart-line', tendance: 'up', variation: 2.1 },
        { id: '4', titre: 'LA en Instance', valeur: 85000000, unite: 'FCFA', couleur: '#E65100', icone: 'fas fa-clock', tendance: 'down', variation: -1.5 },
        { id: '5', titre: 'Restes à Payer', valeur: 320000000, unite: 'FCFA', couleur: '#B71C1C', icone: 'fas fa-exclamation-triangle', tendance: 'up', variation: 4.8 },
        { id: '6', titre: 'Concordance Bancaire', valeur: 98.5, unite: 'PERCENT', couleur: '#D4A017', icone: 'fas fa-check-double', tendance: 'neutral', variation: 0 }
    ];

    // Mock Alerts
    alertes: Alerte[] = [
        { id: 'a1', type: 'DANGER', service: 'Trésorerie', titre: 'Rapprochement en retard', description: 'Le rapprochement BCEAO n\'a pas été validé depuis 48h.', routeAction: '/tresorerie', lue: false, dateCreation: new Date() },
        { id: 'a2', type: 'WARNING', service: 'Comptabilité', titre: 'Écart de balance', description: 'Écart détecté de 2M FCFA sur le compte d\'attente 4711.', routeAction: '/comptabilite', lue: false, dateCreation: new Date() },
        { id: 'a3', type: 'INFO', service: 'Cautionnement', titre: 'Expiration imminente', description: '5 cautions arrivent à expiration dans les 7 prochains jours.', routeAction: '/cautionnement', lue: true, dateCreation: new Date() }
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
}
