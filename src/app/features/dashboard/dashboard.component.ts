import { Component, inject, OnInit, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { KpiCard } from '../../core/models/kpi-card.model';
import { Alerte } from '../../core/models/alerte.model';
import { VoiceService } from '../../core/services/voice.service';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, KpiCardComponent, AnalyseSelectorComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    public voiceService = inject(VoiceService);

    isLoading: boolean = true;
    selectedPeriod: string = 'MOIS';
    dashChartType: string = 'bar';
    chartTypes: { [key: string]: string } = {
        tresLiquidite: 'line',
        comptaSolde: 'bar',
        detteVolume: 'bar',
        recettesComposition: 'donut',
        recettesDetail: 'bar',
        gestionBailleurs: 'radial',
        cautionStatuts: 'donut'
    };

    // Mock KPIs from HEAD
    kpis: KpiCard[] = [];

    // Mock Daily Activities from HEAD
    activiteJour: any[] = [];

    // Mock Alerts
    alertes: Alerte[] = [
        { id: 'a1', type: 'DANGER', service: 'Statistiques', titre: 'RAP > 90 jours', description: 'Ancienneté moyenne des Restes à Payer dépassée.', routeAction: '/statistiques', lue: false, dateCreation: new Date() },
        { id: 'a2', type: 'DANGER', service: 'Trésorerie', titre: 'LA > 60 jours', description: 'Lettres d\'Avance non régularisées après délai.', routeAction: '/tresorerie', lue: false, dateCreation: new Date() },
        { id: 'a3', type: 'DANGER', service: 'Comptabilité', titre: 'Écart concordance > 0.1%', description: 'Écart critique détecté entre BCEAO et ACCT.', routeAction: '/comptabilite', lue: false, dateCreation: new Date() },
        { id: 'a4', type: 'WARNING', service: 'Cautionnement', titre: 'Cautionnement échu', description: 'Cautionnement non régularisé (Date fin + 30j).', routeAction: '/cautionnement', lue: true, dateCreation: new Date() }
    ];

    // Mock Top Posts from HEAD
    topPostes = [
        { poste: 'Trésorerie Paierie Générale', montant: 450000000, evolution: '+5%' },
        { poste: 'Recette Générale des Finances', montant: 320000000, evolution: '+2%' },
        { poste: 'Trésorerie Principale Cocody', montant: 150000000, evolution: '-1%' },
        { poste: 'Trésorerie Principale Yopougon', montant: 95000000, evolution: '+8%' },
        { poste: 'Trésorerie Régionale Bouaké', montant: 78000000, evolution: '+4%' }
    ];

    // Detailed SVG Variables
    soldeBancaireTotal = 15423; // Mds
    laEnCoursTotal = 45.8; // Mds
    
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
        // Initialize dynamic seed data
        this.generateData();

        // Observer voice transcript to trigger commands
        effect(() => {
            const text = this.voiceService.transcript().toLowerCase();
            if (text) {
                this.handleVoiceCommand(text);
            }
        });
    }

    ngOnInit() {
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
        }, 40);
    }

    private handleVoiceCommand(text: string) {
        console.log('🎙️ Traitement commande vocale:', text);
        if (text.includes('barre') || text.includes('histogramme')) {
            this.dashChartType = 'bar';
        } else if (text.includes('ligne') || text.includes('courbe')) {
            this.dashChartType = 'line';
        }
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

    // Navigation logic from HEAD (Aicha)
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
        if(this.selectedPeriod === 'JOUR') seed = 0.03; // Scale appropriately for daily
        if(this.selectedPeriod === 'MOIS') seed = 1;
        if(this.selectedPeriod === 'ANNEE') seed = 12;

        // Scale high-level KPIs
        this.kpis = [
            { id: '1', titre: 'Position Trésorerie Nette', valeur: 12450000000 * seed, unite: 'FCFA', couleur: '#1B3A6B', icone: 'fas fa-money-bill-wave', tendance: 'up', variation: 5.2 },
            { id: '2', titre: 'Total Restes à Payer', valeur: 320000000 * seed, unite: 'FCFA', couleur: '#B71C1C', icone: 'fas fa-exclamation-triangle', tendance: 'up', variation: 4.8 },
            { id: '3', titre: 'Taux Exécution Budgétaire', valeur: 85.8, unite: 'PERCENT', couleur: '#2E7D32', icone: 'fas fa-chart-line', tendance: 'up', variation: 2.1 },
            { id: '4', titre: 'Solde Bancaire Consolidé', valeur: 15423000000 * seed, unite: 'FCFA', couleur: '#D4A017', icone: 'fas fa-university', tendance: 'neutral', variation: 0 },
            { id: '5', titre: 'Opérations en Attente', valeur: Math.round(12 * seed), unite: 'NOMBRE', couleur: '#E65100', icone: 'fas fa-clock', tendance: 'up', variation: 1.5 }
        ];

        // Scale daily activities
        const reglemVal = Math.round(45 * seed);
        const mandatsVal = Math.round(128 * seed);
        const cautionVal = Math.round(8 * seed);
        
        let recettesFormatted = '2.4B';
        if (this.selectedPeriod === 'JOUR') {
            recettesFormatted = '80M';
        } else if (this.selectedPeriod === 'ANNEE') {
            recettesFormatted = '28.8B';
        }

        this.activiteJour = [
            { label: 'Règlements effectués', valeur: String(reglemVal), tendance: '+3', icone: 'fas fa-check-circle', couleur: 'text-success', montant: `${(1.2 * seed).toFixed(1)}B FCFA` },
            { label: 'Mandats émis', valeur: String(mandatsVal), tendance: '+12', icone: 'fas fa-file-invoice-dollar', couleur: 'text-primary', montant: `${(3.5 * seed).toFixed(1)}B FCFA` },
            { label: 'Nouveaux cautionnements', valeur: String(cautionVal), tendance: '0', icone: 'fas fa-shield-alt', couleur: 'text-warning', montant: `${Math.round(850 * seed)}M FCFA` },
            { label: 'Recettes perçues (Régies)', valeur: recettesFormatted, tendance: '+15%', icone: 'fas fa-arrow-down', couleur: 'text-info', montant: undefined }
        ];

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

        this.reglementQualiteGlobal = Math.min(100, Math.max(0, Math.round(92 + (seed * 0.5))));
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
