import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';
import { Alerte } from '../../core/models/alerte.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, AnalyseSelectorComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    isLoading: boolean = true;
    selectedPeriod: string = 'MOIS';
    chartTypes: { [key: string]: string } = {
        tresLiquidite: 'line',
        comptaSolde: 'bar',
        detteVolume: 'bar',
        recettesComposition: 'donut',
        recettesDetail: 'bar',
        gestionBailleurs: 'radial',
        cautionStatuts: 'donut'
    };

    alertes: Alerte[] = [
        { id: 'a1', type: 'DANGER', service: 'Trésorerie', titre: 'Total liquidité : 12.45 Mds | LA non régularisé : 45.8 Mds', description: 'Position de liquidité nette globale et Lettres d\'Avance non régularisées.', routeAction: '/tresorerie', lue: false, dateCreation: new Date() },
        { id: 'a2', type: 'DANGER', service: 'Règlement', titre: 'Total réglé : 456.2 Mds', description: 'Volume global de règlements et paiements finalisés.', routeAction: '/reglement', lue: false, dateCreation: new Date() },
        { id: 'a3', type: 'DANGER', service: 'Statistiques', titre: 'Montant RAP : 124.5 Mds', description: 'Encours total des Restes à Payer (RAP) de plus de 90 jours.', routeAction: '/statistiques', lue: false, dateCreation: new Date() },
        { id: 'a4', type: 'WARNING', service: 'Comptabilité', titre: 'Écart de concordance : 1.2 Mds', description: 'Divergence critique constatée lors du rapprochement BCEAO.', routeAction: '/comptabilite', lue: false, dateCreation: new Date() },
        { id: 'a5', type: 'WARNING', service: 'Cautionnement', titre: 'Cautionnement échu : 320.5 Mds', description: 'Cautionnements n\'ayant pas fait l\'objet de mainlevée ou régularisation.', routeAction: '/cautionnement', lue: false, dateCreation: new Date() },
        { id: 'a6', type: 'INFO', service: 'Régies', titre: 'Total recettes collectées : 1 254 Mds', description: 'Total des recettes fiscales et non-fiscales constatées par les Régies.', routeAction: '/regies', lue: false, dateCreation: new Date() },
        { id: 'a7', type: 'INFO', service: 'Statistiques', titre: 'Service de la dette : 75.4 Mds', description: 'Total des remboursements du service de la dette sur la période.', routeAction: '/statistiques', lue: false, dateCreation: new Date() }
    ];

    soldeBancaireTotal = 15423; // Mds
    laEnCoursTotal = 45.8; // Mds
    
    // Arrays for data
    tresorerieDetails: any[] = [];
    soldeBancaireEvolution: any[] = [];
    comptaSoldesCompte: any[] = [];
    comptaSuspendsParMinistere: any[] = [];
    comptaSuspendsParAnciennete: any[] = [];
    detteEvolution: any[] = [];
    detteDetails: any[] = [];
    recettesComposition: any[] = [];
    recettesDetails: any[] = [];
    top10Depenses: any[] = [];
    gestionFondsBailleursRadar: any[] = [];
    reglementQualiteGlobal = 92;
    reglementRejetsCauses: any[] = [];
    cautionnementStatuts: any[] = [];
    cautionnementVolumes: any[] = [];

    constructor() {
        this.generateData();
    }

    ngOnInit() {
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
        }, 40);
    }

    setChartType(key: string, type: string, event: Event) {
        event.stopPropagation();
        this.chartTypes[key] = type;
    }

    getAlertIcon(type: string): string {
        switch (type) {
            case 'DANGER': return 'fas fa-exclamation-circle text-danger';
            case 'WARNING': return 'fas fa-exclamation-triangle text-warning';
            case 'INFO': return 'fas fa-info-circle text-info';
            default: return 'fas fa-bell text-secondary';
        }
    }

    goToService(route: string) {
        if(route) {
            this.router.navigate([route]);
        }
    }

    onPeriodChange(period: string) {
        this.selectedPeriod = period;
        this.onRefresh();
    }

    onRefresh() {
        this.isLoading = true;
        setTimeout(() => {
            this.generateData();
            this.isLoading = false;
            this.cdr.detectChanges();
        }, 30);
    }

    // Deterministic random generator based on selected period
    generateData() {
        let seed = 1;
        if(this.selectedPeriod === 'JOUR') seed = 0.5;
        if(this.selectedPeriod === 'MOIS') seed = 1;
        if(this.selectedPeriod === 'ANNEE') seed = 12;

        this.soldeBancaireTotal = 15423 * seed;
        this.laEnCoursTotal = 45.8 * seed;

        this.tresorerieDetails = [
            { libelle: 'Comptes BCEAO', montant: 8500 * seed, tendance: '+2.5%' },
            { libelle: 'Banques Commerciales', montant: 3200 * seed, tendance: '-1.2%' },
            { libelle: 'Comptes de Transit', montant: 750 * seed, tendance: '+5.0%' }
        ];

        this.comptaSuspendsParMinistere = [
            { ministere: 'Éducation Nationale', montant: 15.4 * seed, pct: 34 },
            { ministere: 'Santé Publique', montant: 12.8 * seed, pct: 28 },
            { ministere: 'Infrastructures', montant: 8.5 * seed, pct: 19 },
            { ministere: 'Enseignement Sup.', montant: 5.2 * seed, pct: 11 },
            { ministere: 'Autres Ministères', montant: 3.9 * seed, pct: 8 }
        ];

        this.comptaSuspendsParAnciennete = [
            { tranche: 'Moins de 30j', montant: 22.4 * seed, couleur: '#2E7D32', icone: 'fa-check-circle' },
            { tranche: 'Entre 30 et 90j', montant: 14.2 * seed, couleur: '#D4A017', icone: 'fa-exclamation-triangle' },
            { tranche: 'Plus de 90j (Critique)', montant: 9.2 * seed, couleur: '#B71C1C', icone: 'fa-times-circle' }
        ];

        this.soldeBancaireEvolution = [
            { mois: 'Jan', transit: 200 * seed, depots: 500 * seed, bni: 1200 * seed, bceao: 6500 * seed },
            { mois: 'Fev', transit: 250 * seed, depots: 550 * seed, bni: 1250 * seed, bceao: 6700 * seed },
            { mois: 'Mar', transit: 180 * seed, depots: 520 * seed, bni: 1300 * seed, bceao: 7000 * seed },
            { mois: 'Avr', transit: 300 * seed, depots: 600 * seed, bni: 1100 * seed, bceao: 6800 * seed },
            { mois: 'Mai', transit: 220 * seed, depots: 580 * seed, bni: 1150 * seed, bceao: 7200 * seed },
            { mois: 'Juin', transit: 280 * seed, depots: 620 * seed, bni: 1400 * seed, bceao: 7500 * seed }
        ];

        this.comptaSoldesCompte = [
            { banque: 'BCEAO - Principal', solde: 7500 * seed, tendance: '+1.2%' },
            { banque: 'BNI - Recettes', solde: 1400 * seed, tendance: '-0.5%' },
            { banque: 'SGCI - Transit', solde: 320 * seed, tendance: '+8.4%' }
        ];

        this.detteEvolution = [
            { annee: '2020', volume: 8500 * seed },
            { annee: '2021', volume: 9200 * seed },
            { annee: '2022', volume: 10500 * seed },
            { annee: '2023', volume: 11200 * seed },
            { annee: '2024', volume: 12100 * seed }
        ];

        this.detteDetails = [
            { libelle: 'Eurobonds', montant: 4500 * seed, tendance: '37%' },
            { libelle: 'Bons du Trésor', montant: 3800 * seed, tendance: '31%' },
            { libelle: 'Dette Bilatérale', montant: 2100 * seed, tendance: '17%' },
            { libelle: 'Dette Multilatérale', montant: 1700 * seed, tendance: '14%' }
        ];

        this.recettesComposition = [
            { nature: 'Impôts directs', pct: 42, couleur: '#1B3A6B' },
            { nature: 'Taxes douanières', pct: 21, couleur: '#2E7D32' },
            { nature: 'Recettes non fiscales', pct: 18, couleur: '#D4A017' },
            { nature: 'TVA & Assimilés', pct: 19, couleur: '#E65100' }
        ];

        this.recettesDetails = [
            { libelle: 'Direction Générale Impôts', montant: 4200 * seed, tendance: '+5.2%' },
            { libelle: 'Direction Générale Douanes', montant: 2100 * seed, tendance: '+1.8%' },
            { libelle: 'Trésor Public', montant: 1800 * seed, tendance: '-0.4%' }
        ];

        this.top10Depenses = [
            { poste: 'Dépenses de Personnel', pct: 35, montant: 3500 * seed },
            { poste: 'Service de la Dette', pct: 25, montant: 2500 * seed },
            { poste: 'Investissements Publics', pct: 20, montant: 2000 * seed },
            { poste: 'Fonctionnement', pct: 12, montant: 1200 * seed },
            { poste: 'Subventions', pct: 8, montant: 800 * seed }
        ];

        this.gestionFondsBailleursRadar = [
            { bailleur: 'Banque Mondiale', consomme: 82 },
            { bailleur: 'BAD', consomme: 65 },
            { bailleur: 'AFD', consomme: 45 },
            { bailleur: 'Union Européenne', consomme: 90 }
        ];

        this.reglementQualiteGlobal = Math.round(92 + (seed * 2));
        this.reglementRejetsCauses = [
            { cause: 'Fonds Insuffisants', count: Math.round(12 * seed), color: '#B71C1C' },
            { cause: 'Erreur RIB', count: Math.round(8 * seed), color: '#D4A017' },
            { cause: 'Défaut de Pièces', count: Math.round(3 * seed), color: '#1B3A6B' }
        ];

        this.cautionnementStatuts = [
            { statut: 'Actifs', count: Math.round(1450 * seed), color: '#2E7D32' },
            { statut: 'Échus non levés', count: Math.round(320 * seed), color: '#D4A017' },
            { statut: 'Contentieux', count: Math.round(45 * seed), color: '#B71C1C' }
        ];

        this.cautionnementVolumes = [
            { type: 'Marchés Publics', montant: 8.5 * seed },
            { type: 'Douanes', montant: 4.2 * seed },
            { type: 'Agréments', montant: 1.8 * seed },
            { type: 'Divers', montant: 0.5 * seed }
        ];
    }
}
