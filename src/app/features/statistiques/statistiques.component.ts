import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

@Component({
    selector: 'app-statistiques',
    standalone: true,
    imports: [CommonModule, FormsModule, AnalyseSelectorComponent, RouterLink],
    templateUrl: './statistiques.component.html',
    styleUrl: './statistiques.component.scss'
})
export class StatistiquesComponent {

    // Placeholder data for the component
    currentFilters = {
        periode: 'Ce Mois-ci',
        indicateurs: 'Taux exécution subventions, Taux Restes à Payer',
        axes: 'Ministère/Réception'
    };

    // Selected period state to trigger custom date picker
    selectedPeriod: string = 'Ce mois-ci';

    // Chart specific state
    statChart1Type: string = 'bar';
    statChart2Type: string = 'pie';
    statChart3Type: string = 'line';
    statChart4Type: string = 'bar';

    // Drag & Drop specific state aligned with Section 4.4
    isDragDropMode = false;

    availableIndicators = [
        'Taux d\'exécution des subventions',
        'Délai moyen paiement subventions',
        'Concentration par bénéficiaire',
        'Taux de restes à payer',
        'Évolution Restes à Payer (12 mois)',
        'Taux respect des priorités',
        'Délai moyen paiement prioritaires',
        'Ratio UEMOA/Total dépenses',
        'Ratio CEDEAO/Total dépenses',
        'Écart PCS/PCC',
        'Taux de réalisation des prévisions',
        'Volatilité des prévisions'
    ];
    
    selectedIndicators = [
        'Taux d\'exécution des subventions',
        'Taux de restes à payer',
        'Taux respect des priorités'
    ];

    availableAxes = [
        'Ministère',
        'Direction',
        'Département',
        'Région',
        'Programme',
        'Projet',
        'Pays UEMOA',
        'Régions CEDEAO',
        'Nature dépense',
        'Source financement',
        'Bénéficiaire',
        'Bailleur'
    ];
    
    selectedAxes = ['Date (Mois/Trimestre/Exercice)'];

    toggleMode(mode: 'classic' | 'dragdrop') {
        this.isDragDropMode = mode === 'dragdrop';
    }

    // Mapping des rapports par index
    private rapportIds = [
        'subventions-approvisionnements',      // 0
        'entites-detail',                       // 1
        'approvisionnements-accdp',             // 2
        'oc-lc',                                // 3
        'restes-a-payer',                       // 4
        'depenses-prioritaires',                // 5
        'soldes-comptes',                       // 6
        'uemoa-pcs',                            // 7
        'cedeao-pcc',                           // 8
        'tva-electricite',                      // 9
        'webfontaine',                          // 10
        'previsions-mois',                      // 11
        'compte-principal',                     // 12
        'compte-c2d',                           // 13
        'compte-bad',                           // 14
        'compte-investissement'                 // 15
    ];

    getRapportRoute(index: number): string {
        const rapport = this.subsections[index];
        if (!rapport) return '#';
        const id = this.rapportIds[index];
        return `/statistiques/rapport/${id}`;
    }

    // KPI Data organized by category (Section 4.3)
    kpis = [
        // BLOC 1: Subventions et Approvisionnements
        { 
            titre: 'Taux Exécution Subventions', 
            valeur: '87.5%', 
            info: 'Seuil 80%-100%', 
            type: 'success',
            categorie: 'Subventions'
        },
        { 
            titre: 'Délai Moy. Subventions', 
            valeur: '18 jours', 
            info: 'Objectif < 30j', 
            type: 'success',
            categorie: 'Subventions'
        },
        { 
            titre: 'Concentration Bénéficiaires', 
            valeur: '52.3%', 
            info: 'Top 3 < 50%', 
            type: 'warning',
            categorie: 'Subventions'
        },
        // BLOC 2: Trésorerie et Engagements
        { 
            titre: 'Taux OC en Portefeuille', 
            valeur: '48.7 Mds', 
            info: 'Limite autorisée', 
            type: 'primary',
            categorie: 'OC & LC'
        },
        { 
            titre: 'Taux Restes à Payer Global', 
            valeur: '12.4%', 
            info: 'Seuil < 15%', 
            type: 'primary',
            categorie: 'Restes à Payer'
        },
        { 
            titre: 'Ancienneté Moy. Restes à Payer', 
            valeur: '75 jours', 
            info: 'Alerte > 90j', 
            type: 'success',
            categorie: 'Restes à Payer'
        },
        // BLOC 3: Intégration Régionale
        { 
            titre: 'Ratio UEMOA/Total', 
            valeur: '24.3%', 
            info: 'Suivi tendance', 
            type: 'primary',
            categorie: 'Intégration Régionale'
        },
        { 
            titre: 'Ratio CEDEAO/Total', 
            valeur: '42.1%', 
            info: 'Suivi tendance', 
            type: 'primary',
            categorie: 'Intégration Régionale'
        },
        { 
            titre: 'Écart PCS/PCC', 
            valeur: '8.1%', 
            info: 'Seuil < 10%', 
            type: 'primary',
            categorie: 'Intégration Régionale'
        },
        // BLOC 4: Prévisions & Soldes (POINT MAJEUR)
        { 
            titre: 'Taux Réalisation Prévisions', 
            valeur: '91.2%', 
            info: 'Écart < ±15%', 
            type: 'success',
            categorie: 'Prévisions & Soldes'
        },
        { 
            titre: 'Solde Compte Principal', 
            valeur: '14.52 Mds', 
            info: 'État de la liquidité', 
            type: 'success',
            categorie: 'Prévisions & Soldes'
        },
        { 
            titre: 'Solde Compte C2D', 
            valeur: '3.87 Mds', 
            info: 'Aide au développement', 
            type: 'primary',
            categorie: 'Prévisions & Soldes'
        }
    ];

    // Livrables organized by 4 main blocks (kpi_service_statistiques.txt)
    subsections = [
        // ========== BLOC 1: SUBVENTIONS & APPROVISIONNEMENTS ==========
        {
            titre: 'Situation des Subventions et Approvisionnements',
            description: 'Suivi global des flux entrants par source',
            icon: 'fas fa-gift',
            bloc: 1
        },
        {
            titre: 'Détail par Entité',
            description: 'EPN, Communes, SODE, Conseils Généraux, Districts',
            icon: 'fas fa-building',
            bloc: 1
        },
        {
            titre: 'Situation Approvisionnements ACCDP',
            description: 'Agents comptables centraux des dépôts',
            icon: 'fas fa-warehouse',
            bloc: 1
        },
        // ========== BLOC 2: TRÉSORERIE & ENGAGEMENTS ==========
        {
            titre: 'Situation des OC & LC',
            description: 'Obligations Cautionnées et Lettres de Change',
            icon: 'fas fa-file-invoice-dollar',
            bloc: 2
        },
        {
            titre: 'Situation des Restes à Payer',
            description: 'Indicateur crucial - Engagements non soldés',
            icon: 'fas fa-hourglass-end',
            bloc: 2
        },
        {
            titre: 'Situation des Dépenses Prioritaires',
            description: 'Suivi des règlements stratégiques/urgents',
            icon: 'fas fa-star',
            bloc: 2
        },
        {
            titre: 'Situation Soldes Comptes Principaux',
            description: 'État global des comptes transversaux',
            icon: 'fas fa-university',
            bloc: 2
        },
        // ========== BLOC 3: COOPÉRATION RÉGIONALE & SECTEURS SPÉCIFIQUES ==========
        {
            titre: 'Situation UEMOA (PCS)',
            description: 'Prélèvement Communautaire de Solidarité',
            icon: 'fas fa-globe',
            bloc: 3
        },
        {
            titre: 'Situation CEDEAO (PCC)',
            description: 'Prélèvement Communautaire de Compensation',
            icon: 'fas fa-earth-africa',
            bloc: 3
        },
        {
            titre: 'Situation TVA Secteur Électrique',
            description: 'Indicateur fiscal spécifique à l\'énergie',
            icon: 'fas fa-bolt',
            bloc: 3
        },
        {
            titre: 'Situation Webfontaine',
            description: 'Suivi plateforme douanière/fiscale',
            icon: 'fas fa-network-wired',
            bloc: 3
        },
        // ========== PRÉVISIONS & SOLDES ==========
        {
            titre: 'Prévision des Mois',
            description: 'Projection flux financiers - Capacité d\'anticipation',
            icon: 'fas fa-chart-line',
            bloc: 4
        },
        {
            titre: 'Situation Compte Principal',
            description: 'État de la liquidité globale',
            icon: 'fas fa-piggy-bank',
            bloc: 4
        },
        {
            titre: 'Situation Compte C2D',
            description: 'Contrat Désendettement & Développement',
            icon: 'fas fa-file-contract',
            bloc: 4
        },
        {
            titre: 'Situation Compte BAD',
            description: 'Ressources Banque Africaine Développement',
            icon: 'fas fa-landmark',
            bloc: 4
        },
        {
            titre: 'Situation Compte Investissement',
            description: 'Fonds dédiés aux dépenses de capital',
            icon: 'fas fa-hammer',
            bloc: 4
        }
    ];
}
