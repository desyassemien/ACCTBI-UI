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
        cautionStatuts: 'donut',
        reglementVolumes: 'bar'
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
    
    // Datasets par service (3 colonnes par domaine)
    
    // 1. Trésorerie
    tresorerieDetails: any[] = [];
    soldeBancaireEvolution: any[] = [];
    comptaSoldesCompte: any[] = [];
    laEvolution: any[] = [];
    laDetailsList: any[] = [];
    laTotalRegul = 85.2;
    laTotalEnCours = 45.8;
    tresorerieDisponibilites: any[] = [];
    liquiditeNetteTotal = 15423;

    // 2. Règlement
    reglementVolumesPostes: any[] = [];
    reglementTypologie: any[] = [];
    reglementFluxTransactions: any[] = [];
    reglementDelais: any[] = [];
    reglementEcheancesDetail: any[] = [];

    // 3. Cautionnement
    cautionnementStatuts: any[] = [];
    cautionnementVolumes: any[] = [];
    cautionEcheances: any[] = [];
    cautionTopRisques: any[] = [];

    // 4. Comptabilité
    comptaSuspendsParMinistere: any[] = [];
    comptaSuspendsParAnciennete: any[] = [];
    comptaRapprochementEcarts: any[] = [];
    comptaOperationsRapprochement: any[] = [];

    // 5. Régies
    recettesComposition: any[] = [];
    recettesDetails: any[] = [];
    regiesObjectifsLF: any[] = [];
    regiesTauxGlobal = 94.5;

    // 6. Statistiques & Dette
    detteEvolution: any[] = [];
    detteDetails: any[] = [];
    detteServiceEvolution: any[] = [];
    detteEcheancierDetail: any[] = [];

    activeModalCard: {
        id: string;
        domain: string;
        icon: string;
        title: string;
        subtitle: string;
        badgeText?: string;
        badgeClass?: string;
        routeAction: string;
    } | null = null;

    get reglementTotalRegle(): number {
        return this.reglementVolumesPostes.reduce((sum, d) => sum + d.regle, 0);
    }
    get reglementTotalRap(): number {
        return this.reglementVolumesPostes.reduce((sum, d) => sum + d.rap, 0);
    }
    get cautionTotalCount(): number {
        return this.cautionnementStatuts.reduce((sum, s) => sum + s.count, 0);
    }
    get cautionTotalVolume(): number {
        return this.cautionnementVolumes.reduce((sum, v) => sum + v.montant, 0);
    }

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

    openCardModal(id: string, domain: string, icon: string, title: string, subtitle: string, badgeText: string, badgeClass: string, routeAction: string, event?: Event) {
        if (event) {
            event.stopPropagation();
        }
        this.activeModalCard = { id, domain, icon, title, subtitle, badgeText, badgeClass, routeAction };
    }

    closeCardModal(event?: Event) {
        if (event) {
            event.stopPropagation();
        }
        this.activeModalCard = null;
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

    getServiceIcon(service: string): string {
        const s = (service || '').toLowerCase();
        if (s.includes('trésor') || s.includes('tresor')) return 'fas fa-university';
        if (s.includes('règle') || s.includes('regle')) return 'fas fa-file-invoice-dollar';
        if (s.includes('stat')) return 'fas fa-chart-line';
        if (s.includes('compta')) return 'fas fa-balance-scale';
        if (s.includes('caution')) return 'fas fa-shield-alt';
        if (s.includes('régi') || s.includes('regi')) return 'fas fa-cash-register';
        return 'fas fa-bell';
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

        // ==========================================
        // 1. TRÉSORERIE
        // ==========================================
        this.soldeBancaireTotal = 15423 * seed;
        this.laEnCoursTotal = 45.8 * seed;
        this.laTotalRegul = 85.2 * seed;
        this.liquiditeNetteTotal = 15423 * seed;

        // Col 1: Solde Consolidé
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
            { banque: 'SGCI - Transit', solde: 320 * seed, tendance: '+8.4%' },
            { banque: 'Ecobank - Dépôts', solde: 203 * seed, tendance: '+0.8%' }
        ];

        // Col 2: Lettres d'Avance (LA)
        this.laEvolution = [
            { mois: 'Jan', regul: 65 * seed, encours: 42 * seed },
            { mois: 'Fev', regul: 72 * seed, encours: 38 * seed },
            { mois: 'Mar', regul: 68 * seed, encours: 45 * seed },
            { mois: 'Avr', regul: 80 * seed, encours: 35 * seed },
            { mois: 'Mai', regul: 75 * seed, encours: 40 * seed },
            { mois: 'Juin', regul: 85 * seed, encours: 45.8 * seed }
        ];
        this.laDetailsList = [
            { ref: 'LA-2024-001', ministere: 'Éducation Nationale', montant: 18.5 * seed, statut: 'EN_COURS', delai: '45 jours' },
            { ref: 'LA-2024-002', ministere: 'Santé Publique', montant: 14.2 * seed, statut: 'REGULARISE', delai: '20 jours' },
            { ref: 'LA-2024-003', ministere: 'Infrastructures', montant: 8.5 * seed, statut: 'EN_COURS', delai: '60 jours' },
            { ref: 'LA-2024-004', ministere: 'Défense', montant: 4.6 * seed, statut: 'EN_COURS', delai: '15 jours' }
        ];

        // Col 3: Position Nette de Liquidité
        this.tresorerieDisponibilites = [
            { banque: 'BCEAO (Compte Unique)', montant: 8500 * seed, pct: 55, couleur: '#009E60' },
            { banque: 'BNI & Banques Publiques', montant: 4200 * seed, pct: 27, couleur: '#FF8200' },
            { banque: 'Banques Privées & Placements', montant: 2723 * seed, pct: 18, couleur: '#1B3A6B' }
        ];

        // ==========================================
        // 2. RÈGLEMENT
        // ==========================================
        // Col 1: Volumes engagés
        this.reglementVolumesPostes = [
            { poste: 'Personnel', regle: 3200 * seed, rap: 300 * seed },
            { poste: 'Dette', regle: 2400 * seed, rap: 100 * seed },
            { poste: 'Investissements', regle: 1600 * seed, rap: 400 * seed },
            { poste: 'Subventions', regle: 980 * seed, rap: 220 * seed },
            { poste: 'Fonctionnement', regle: 750 * seed, rap: 180 * seed }
        ];

        // Col 2: Typologie & Transactions
        this.reglementTypologie = [
            { type: 'Virements RTGS/BCEAO', montant: 3450 * seed, pct: 68, couleur: '#009E60' },
            { type: 'Chèques du Trésor', montant: 1120 * seed, pct: 22, couleur: '#FF8200' },
            { type: 'Paiements Électroniques', montant: 510 * seed, pct: 10, couleur: '#1B3A6B' }
        ];
        this.reglementFluxTransactions = [
            { ref: 'REG-2024-0891', libelle: 'Salaires – Éducation', montant: 485.2 * seed, statut: 'REGLE', date: '12/06' },
            { ref: 'REG-2024-0892', libelle: 'Eurobond Coupon', montant: 320.0 * seed, statut: 'REGLE', date: '11/06' },
            { ref: 'REG-2024-0893', libelle: 'Autoroute Nord', montant: 215.5 * seed, statut: 'RAP', date: '10/06' },
            { ref: 'REG-2024-0894', libelle: 'Subvention Santé', montant: 180.3 * seed, statut: 'REGLE', date: '09/06' }
        ];

        // Col 3: Délais & Échéancier RAP
        this.reglementDelais = [
            { tranche: '< 30 jours', montant: 210.5 * seed, count: 145, couleur: '#009E60' },
            { tranche: '30 à 60 jours', montant: 145.8 * seed, count: 82, couleur: '#D4A017' },
            { tranche: '> 90 jours (Critique)', montant: 99.9 * seed, count: 48, couleur: '#B71C1C' }
        ];
        this.reglementEcheancesDetail = [
            { beneficiaire: 'Fournisseurs BTP', montant: 145.0 * seed, age: '45j', statut: 'EN_ATTENTE' },
            { beneficiaire: 'Prestations Médicales', montant: 98.5 * seed, age: '65j', statut: 'EN_ATTENTE' },
            { beneficiaire: 'Travaux Urbains', montant: 82.0 * seed, age: '110j', statut: 'URGENT' },
            { beneficiaire: 'Matériel Informatique', montant: 34.5 * seed, age: '25j', statut: 'NORMAL' }
        ];

        // ==========================================
        // 3. CAUTIONNEMENT
        // ==========================================
        // Col 1: États des cautionnements
        this.cautionnementStatuts = [
            { statut: 'Actifs', count: Math.round(1450 * seed), color: '#2E7D32', montant: 12.2 * seed },
            { statut: 'Échus non levés', count: Math.round(320 * seed), color: '#D4A017', montant: 2.3 * seed },
            { statut: 'Contentieux', count: Math.round(45 * seed), color: '#B71C1C', montant: 0.5 * seed }
        ];

        // Col 2: Volumes par catégorie
        this.cautionnementVolumes = [
            { type: 'Marchés Publics', montant: 8.5 * seed, pct: 57 },
            { type: 'Douanes', montant: 4.2 * seed, pct: 28 },
            { type: 'Agréments & Licences', montant: 1.8 * seed, pct: 12 },
            { type: 'Divers', montant: 0.5 * seed, pct: 3 }
        ];

        // Col 3: Échéances & Alertes
        this.cautionEcheances = [
            { tranche: '< 30 jours', montant: 4.8 * seed, count: 65, color: '#B71C1C' },
            { tranche: '30 - 90 jours', montant: 6.2 * seed, count: 120, color: '#D4A017' },
            { tranche: '> 90 jours', montant: 4.0 * seed, count: 180, color: '#2E7D32' }
        ];
        this.cautionTopRisques = [
            { ref: 'CAUT-8891', tiers: 'BTP Côte d\'Ivoire', montant: 1.8 * seed, echeance: '15j', statut: 'À LIBÉRER' },
            { ref: 'CAUT-8892', tiers: 'Import Transit SA', montant: 1.2 * seed, echeance: '28j', statut: 'CONTENTIEUX' },
            { ref: 'CAUT-8893', tiers: 'Fournitures Médicales', montant: 0.9 * seed, echeance: '40j', statut: 'ACTIF' },
            { ref: 'CAUT-8894', tiers: 'Génie Civil Abidjan', montant: 0.6 * seed, echeance: '80j', statut: 'ACTIF' }
        ];

        // ==========================================
        // 4. COMPTABILITÉ
        // ==========================================
        // Col 1: Suspends par ministère
        this.comptaSuspendsParMinistere = [
            { ministere: 'Éducation Nationale', montant: 15.4 * seed, pct: 34 },
            { ministere: 'Santé Publique', montant: 12.8 * seed, pct: 28 },
            { ministere: 'Infrastructures', montant: 8.5 * seed, pct: 19 },
            { ministere: 'Enseignement Sup.', montant: 5.2 * seed, pct: 11 },
            { ministere: 'Autres Ministères', montant: 3.9 * seed, pct: 8 }
        ];

        // Col 2: Suspends par ancienneté
        this.comptaSuspendsParAnciennete = [
            { tranche: 'Moins de 30j', montant: 22.4 * seed, couleur: '#2E7D32', icone: 'fa-check-circle' },
            { tranche: 'Entre 30 et 90j', montant: 14.2 * seed, couleur: '#D4A017', icone: 'fa-exclamation-triangle' },
            { tranche: 'Plus de 90j (Critique)', montant: 9.2 * seed, couleur: '#B71C1C', icone: 'fa-times-circle' }
        ];

        // Col 3: Rapprochements & Écarts BCEAO
        this.comptaRapprochementEcarts = [
            { mois: 'Jan', ecart: 1.8 * seed },
            { mois: 'Fev', ecart: 1.5 * seed },
            { mois: 'Mar', ecart: 1.2 * seed },
            { mois: 'Avr', ecart: 1.4 * seed },
            { mois: 'Mai', ecart: 0.9 * seed },
            { mois: 'Juin', ecart: 1.2 * seed }
        ];
        this.comptaOperationsRapprochement = [
            { compte: 'BCEAO - Principal', soldeReleve: 7502.4 * seed, soldeComptable: 7501.2 * seed, ecart: 1.2 * seed, statut: 'EN_COURS' },
            { compte: 'BNI - Recettes', soldeReleve: 1400.0 * seed, soldeComptable: 1400.0 * seed, ecart: 0.0, statut: 'CONFORME' },
            { compte: 'SGCI - Transit', soldeReleve: 322.5 * seed, soldeComptable: 320.0 * seed, ecart: 2.5 * seed, statut: 'AJUSTEMENT' },
            { compte: 'Ecobank - Dépôts', soldeReleve: 203.2 * seed, soldeComptable: 203.0 * seed, ecart: 0.2 * seed, statut: 'CONFORME' }
        ];

        // ==========================================
        // 5. RÉGIES
        // ==========================================
        // Col 1: Composition des recettes
        this.recettesComposition = [
            { nature: 'Impôts directs', pct: 42, montant: 4200 * seed, couleur: '#1B3A6B' },
            { nature: 'Taxes douanières', pct: 21, montant: 2100 * seed, couleur: '#2E7D32' },
            { nature: 'Recettes non fiscales', pct: 18, montant: 1800 * seed, couleur: '#D4A017' },
            { nature: 'TVA & Assimilés', pct: 19, montant: 1900 * seed, couleur: '#E65100' }
        ];

        // Col 2: Performance par régie
        this.recettesDetails = [
            { libelle: 'Direction Générale Impôts', montant: 4200 * seed, tendance: '+5.2%', taux: 96 },
            { libelle: 'Direction Générale Douanes', montant: 2100 * seed, tendance: '+1.8%', taux: 92 },
            { libelle: 'Trésor Public', montant: 1800 * seed, tendance: '-0.4%', taux: 94 },
            { libelle: 'Conservation Foncière', montant: 900 * seed, tendance: '+3.1%', taux: 91 }
        ];

        // Col 3: Objectifs Loi de Finances
        this.regiesObjectifsLF = [
            { regie: 'DGI', prevision: 4500 * seed, realise: 4200 * seed, taux: 93.3 },
            { regie: 'DGD', prevision: 2200 * seed, realise: 2100 * seed, taux: 95.5 },
            { regie: 'Trésor', prevision: 1850 * seed, realise: 1800 * seed, taux: 97.3 },
            { regie: 'Autres', prevision: 950 * seed, realise: 900 * seed, taux: 94.7 }
        ];

        // ==========================================
        // 6. STATISTIQUES & DETTE
        // ==========================================
        // Col 1: Encours dette
        this.detteEvolution = [
            { annee: '2020', volume: 8500 * seed },
            { annee: '2021', volume: 9200 * seed },
            { annee: '2022', volume: 10500 * seed },
            { annee: '2023', volume: 11200 * seed },
            { annee: '2024', volume: 12100 * seed }
        ];

        // Col 2: Portefeuille par instrument
        this.detteDetails = [
            { libelle: 'Eurobonds', montant: 4500 * seed, tendance: '37%', devise: 'USD / EUR' },
            { libelle: 'Bons du Trésor', montant: 3800 * seed, tendance: '31%', devise: 'XOF' },
            { libelle: 'Dette Bilatérale', montant: 2100 * seed, tendance: '17%', devise: 'Multi' },
            { libelle: 'Dette Multilatérale', montant: 1700 * seed, tendance: '14%', devise: 'Multi' }
        ];

        // Col 3: Service de la dette
        this.detteServiceEvolution = [
            { annee: '2021', principal: 450 * seed, interets: 180 * seed },
            { annee: '2022', principal: 520 * seed, interets: 210 * seed },
            { annee: '2023', principal: 610 * seed, interets: 240 * seed },
            { annee: '2024', principal: 700 * seed, interets: 280 * seed },
            { annee: '2025', principal: 780 * seed, interets: 310 * seed }
        ];
        this.detteEcheancierDetail = [
            { echeance: 'T3 2025', libelle: 'Eurobond 2028 - Coupon', montant: 85.4 * seed, type: 'Intérêts' },
            { echeance: 'T4 2025', libelle: 'Bons du Trésor 3 ans', montant: 140.0 * seed, type: 'Principal' },
            { echeance: 'T1 2026', libelle: 'Prêt BIRD - Échéance sem.', montant: 62.5 * seed, type: 'Mixte' },
            { echeance: 'T2 2026', libelle: 'Emprunt Obligataire UMOA', montant: 110.0 * seed, type: 'Principal' }
        ];
    }
}
