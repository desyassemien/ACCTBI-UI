import { Component, OnInit, ChangeDetectorRef, NgZone, ViewChildren, QueryList, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

export interface ReglementItem {
    ref: string;
    beneficiaire: string;
    beneficiaireFull: string;
    objet: string;
    ministere: string;
    banque: string;
    canalPaiement: 'Virement RTGS' | 'Virement SICA' | 'Chèque Trésor' | 'Télé-règlement';
    dateEmission: string;
    dateEcheance: string;
    montant: string;
    montantVal: number; // in Millions FCFA
    typeReglement: 'Fournisseur' | 'Imputation Provisoire' | 'Rapprochement Inter-comptable';
    delaiJours: number;
    concordancePct: number;
    statut: 'regle' | 'en-cours' | 'bloque';
    statutLabel: string;
    avatarInitials: string;
    avatarClass: string;
    periodTag: 'today' | 'week' | 'month' | 'q1' | 'y2026' | 'y2025';
    perimetre: string;
}

@Component({
    selector: 'app-reglement',
    standalone: true,
    imports: [CommonModule, FormsModule, BaseChartDirective, AnalyseSelectorComponent],
    templateUrl: './reglement.component.html',
    styleUrl: './reglement.component.scss'
})
export class ReglementComponent implements OnInit {
    @ViewChildren(BaseChartDirective) charts?: QueryList<BaseChartDirective>;

    // View State
    viewMode: 'synthese' | 'avancee' = 'synthese';
    activeSubDomain: 'fournisseurs' | 'imputations' | 'rapprochement' = 'fournisseurs';
    chartTab: 'flux' | 'canaux' | 'banques' = 'flux';

    // Filters State
    periodsList: string[] = [
        'Aujourd\'hui (23 Mars)',
        '7 derniers jours',
        'Ce mois-ci (Mars 2026)',
        '1er Trimestre 2026',
        'Exercice 2026',
        'Exercice 2025'
    ];
    activePeriod: string = 'Ce mois-ci (Mars 2026)';

    perimetresList: string[] = [
        'Toutes Banques & Postes',
        'BCEAO Siège & Agence',
        'SGBCI / Trésor',
        'BNI Côte d\'Ivoire',
        'NSIA Banque CI',
        'SIB Abidjan'
    ];
    activePerimetre: string = 'Toutes Banques & Postes';

    filterChips: string[] = ['Règlements Validés', 'Virements RTGS', 'Délai < 30j'];
    allAvailableChips: string[] = [
        'Règlements Validés',
        'Virements RTGS',
        'Délai < 30j',
        'Imputations Sans Pièce',
        'Rejets Bancaires',
        'Virements BCEAO',
        'Mandats > 100M FCFA',
        'Délai ordonnancement > 45j',
        'Fournisseurs BTP & Travaux',
        'Retenue à la source',
        'Rapprochement Auto > 95%',
        'Paiements Électroniques',
        'Fournisseurs Énergie & Eau',
        'Chèques Trésor en circulation',
        'Imputations en attente'
    ];

    // Search and Table Filter
    searchQuery: string = '';
    tableFilter: 'all' | 'regle' | 'en-cours' | 'bloque' = 'all';

    // Toast feedback
    showToast: boolean = false;
    toastMessage: string = '';

    // Advanced OLAP Drag & Drop Selector State
    isDragDropMode = false;
    currentAvailableIndicators: string[] = [
        'Taux de rapprochement auto',
        'Délai moyen de règlement',
        'Volume total règlements jour',
        'Taux de paiements dans les délais',
        'Délai de régularisation IP',
        'Écart de concordance ACCT-ACCD'
    ];
    currentSelectedIndicators: string[] = [
        'Montant global des règlements',
        'Taux de règlements à échéance',
        'Anomalies de paiement détectées'
    ];
    currentAvailableAxes: string[] = [
        'Canal de paiement',
        'Agence bancaire',
        'Type d\'opération (Débit/Crédit)',
        'Échéance (Court/Moyen terme)',
        'Fournisseur / Bénéficiaire'
    ];
    currentSelectedAxes: string[] = ['Banque', 'Date valeur'];

    // All Items Mock Dataset (30+ items)
    allReglementItems: ReglementItem[] = [
        {
            ref: 'RGL-2026-089',
            beneficiaire: 'CIE Côte d\'Ivoire',
            beneficiaireFull: 'Compagnie Ivoirienne d\'Électricité S.A.',
            objet: 'Règlement Mandats Énergie Administrations Centrales',
            ministere: 'Mines, Pétrole & Énergie',
            banque: 'BCEAO Siège ACCT',
            canalPaiement: 'Virement RTGS',
            dateEmission: '04/03/2026',
            dateEcheance: '24/03/2026',
            montant: '245 800 000',
            montantVal: 245.8,
            typeReglement: 'Fournisseur',
            delaiJours: 19.5,
            concordancePct: 100.0,
            statut: 'regle',
            statutLabel: 'Règlement Exécuté',
            avatarInitials: 'CI',
            avatarClass: 'avatar-teal',
            periodTag: 'month',
            perimetre: 'BCEAO Siège & Agence'
        },
        {
            ref: 'RGL-2026-092',
            beneficiaire: 'SODECI',
            beneficiaireFull: 'Société de Distribution d\'Eau de Côte d\'Ivoire',
            objet: 'Factures Eau Écoles & Hôpitaux Publics Fév 2026',
            ministere: 'Santé & Éducation',
            banque: 'BNI Côte d\'Ivoire',
            canalPaiement: 'Virement SICA',
            dateEmission: '06/03/2026',
            dateEcheance: '26/03/2026',
            montant: '118 450 000',
            montantVal: 118.45,
            typeReglement: 'Fournisseur',
            delaiJours: 20.0,
            concordancePct: 99.4,
            statut: 'regle',
            statutLabel: 'Règlement Exécuté',
            avatarInitials: 'SO',
            avatarClass: 'avatar-blue',
            periodTag: 'month',
            perimetre: 'BNI Côte d\'Ivoire'
        },
        {
            ref: 'RGL-2026-104',
            beneficiaire: 'Colas Afrique CI',
            beneficiaireFull: 'Entreprise de Travaux Publics Colas CI',
            objet: 'Décompte N°4 Voiries Urbaines Bouaké',
            ministere: 'Équipement & Infrastructures',
            banque: 'SGBCI / Trésor',
            canalPaiement: 'Virement RTGS',
            dateEmission: '10/03/2026',
            dateEcheance: '30/03/2026',
            montant: '840 000 000',
            montantVal: 840.0,
            typeReglement: 'Fournisseur',
            delaiJours: 22.4,
            concordancePct: 98.2,
            statut: 'en-cours',
            statutLabel: 'En télé-transmission',
            avatarInitials: 'CA',
            avatarClass: 'avatar-amber',
            periodTag: 'month',
            perimetre: 'SGBCI / Trésor'
        },
        {
            ref: 'RGL-2026-118',
            beneficiaire: 'Nouvelle Pharmacie Santé',
            beneficiaireFull: 'Pharmacie de la Santé Publique CI',
            objet: 'Approvisionnement Médicaments Essentiels CHU Cocody',
            ministere: 'Santé Publique',
            banque: 'NSIA Banque CI',
            canalPaiement: 'Virement RTGS',
            dateEmission: '12/03/2026',
            dateEcheance: '28/03/2026',
            montant: '92 600 000',
            montantVal: 92.6,
            typeReglement: 'Fournisseur',
            delaiJours: 16.0,
            concordancePct: 100.0,
            statut: 'regle',
            statutLabel: 'Règlement Exécuté',
            avatarInitials: 'NP',
            avatarClass: 'avatar-teal',
            periodTag: 'month',
            perimetre: 'NSIA Banque CI'
        },
        {
            ref: 'RGL-2026-125',
            beneficiaire: 'Orange Côte d\'Ivoire',
            beneficiaireFull: 'Opérateur Télécoms & Réseau Sécurisé',
            objet: 'Liaison Réseau SYGACUT & Télécoms Trésor Fév 2026',
            ministere: 'Économie & Finances',
            banque: 'BCEAO Siège ACCT',
            canalPaiement: 'Télé-règlement',
            dateEmission: '15/03/2026',
            dateEcheance: '31/03/2026',
            montant: '64 200 000',
            montantVal: 64.2,
            typeReglement: 'Fournisseur',
            delaiJours: 12.0,
            concordancePct: 100.0,
            statut: 'regle',
            statutLabel: 'Règlement Exécuté',
            avatarInitials: 'OR',
            avatarClass: 'avatar-amber',
            periodTag: 'month',
            perimetre: 'BCEAO Siège & Agence'
        },
        // Imputations Provisoires (IP)
        {
            ref: 'IP-2026-042',
            beneficiaire: 'Régie Spéciale Sécurité',
            beneficiaireFull: 'Dépenses Opérationnelles Sécurité Intérieure',
            objet: 'Imputation Provisoire en attente de visa d\'engagement',
            ministere: 'Intérieur & Sécurité',
            banque: 'BCEAO Siège ACCT',
            canalPaiement: 'Virement RTGS',
            dateEmission: '28/02/2026',
            dateEcheance: '15/03/2026',
            montant: '78 500 000',
            montantVal: 78.5,
            typeReglement: 'Imputation Provisoire',
            delaiJours: 24.5,
            concordancePct: 82.0,
            statut: 'bloque',
            statutLabel: 'Pièce manquante',
            avatarInitials: 'IP',
            avatarClass: 'avatar-rose',
            periodTag: 'month',
            perimetre: 'BCEAO Siège & Agence'
        },
        {
            ref: 'IP-2026-048',
            beneficiaire: 'Fournitures Scolaires Abidjan',
            beneficiaireFull: 'Matériel Pédagogique DRENA Abidjan 1',
            objet: 'Imputation Provisoire - Attente bordereau de livraison',
            ministere: 'Éducation Nationale',
            banque: 'SIB Abidjan',
            canalPaiement: 'Chèque Trésor',
            dateEmission: '02/03/2026',
            dateEcheance: '20/03/2026',
            montant: '28 400 000',
            montantVal: 28.4,
            typeReglement: 'Imputation Provisoire',
            delaiJours: 21.0,
            concordancePct: 85.0,
            statut: 'en-cours',
            statutLabel: 'En régularisation',
            avatarInitials: 'FS',
            avatarClass: 'avatar-amber',
            periodTag: 'month',
            perimetre: 'SIB Abidjan'
        },
        // Rapprochement Bancaire ACCT - ACCD
        {
            ref: 'RAP-BCEAO-014',
            beneficiaire: 'BCEAO Siège',
            beneficiaireFull: 'Banque Centrale des États de l\'Afrique de l\'Ouest',
            objet: 'Écritures miroir Compte Unique du Trésor (CUT)',
            ministere: 'Économie & Finances',
            banque: 'BCEAO Siège ACCT',
            canalPaiement: 'Virement RTGS',
            dateEmission: '22/03/2026',
            dateEcheance: '23/03/2026',
            montant: '1 250 000 000',
            montantVal: 1250.0,
            typeReglement: 'Rapprochement Inter-comptable',
            delaiJours: 0.5,
            concordancePct: 100.0,
            statut: 'regle',
            statutLabel: 'Lettré & Rapproché',
            avatarInitials: 'BC',
            avatarClass: 'avatar-teal',
            periodTag: 'month',
            perimetre: 'BCEAO Siège & Agence'
        }
    ];

    filteredItems: ReglementItem[] = [];

    // Chart.js Datasets & Configurations for Advanced OLAP Mode
    barChartData: ChartData<'bar'> = {
        labels: ['BCEAO Siège', 'SGBCI / Trésor', 'BNI CI', 'NSIA Banque', 'SIB Abidjan', 'Ecobank CI'],
        datasets: [
            { data: [8.4, 4.2, 3.8, 2.9, 1.8, 1.4], label: 'Volume Règlements (Mds FCFA)', backgroundColor: '#F77F00', borderRadius: 4 },
            { data: [8.2, 4.0, 3.7, 2.8, 1.7, 1.3], label: 'Règlements Rapprochés (Mds FCFA)', backgroundColor: '#10b981', borderRadius: 4 }
        ]
    };
    barChartOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } }
    };

    lineChartData: ChartData<'line'> = {
        labels: ['Oct 25', 'Nov 25', 'Déc 25', 'Jan 26', 'Fév 26', 'Mar 26'],
        datasets: [
            { data: [91.5, 92.0, 93.4, 93.8, 94.0, 94.2], label: 'Taux Rapprochement Auto (%)', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.3 },
            { data: [28.0, 26.5, 24.0, 23.2, 22.1, 21.4], label: 'Délai Moyen Règlement (Jours)', borderColor: '#F77F00', tension: 0.3 }
        ]
    };
    lineChartOptions: ChartConfiguration<'line'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } }
    };

    constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

    ngOnInit(): void {
        this.updateFilteredItems();
    }

    // --- SUB-DOMAIN SWITCHING ---
    selectSubDomain(domain: 'fournisseurs' | 'imputations' | 'rapprochement') {
        this.activeSubDomain = domain;
        this.updateFilteredItems();
        this.triggerToast(`Sous-domaine : ${domain === 'fournisseurs' ? 'Règlements Fournisseurs' : (domain === 'imputations' ? 'Imputations Provisoires' : 'Rapprochement Bancaire ACCT-ACCD')}`);
    }

    // --- PERIOD SWITCHING ---
    selectPeriod(period: string) {
        this.activePeriod = period;
        this.updateFilteredItems();
        this.triggerToast(`Période sélectionnée : ${period}`);
    }

    // --- PERIMETER SWITCHING ---
    selectPerimetre(perimetre: string) {
        this.activePerimetre = perimetre;
        this.updateFilteredItems();
        this.triggerToast(`Banque / Périmètre appliqué : ${perimetre}`);
    }

    // --- CHIPS TOGGLE ---
    // --- CHIPS TOGGLE & MANAGEMENT ---
    toggleFilterChip(chip: any) {
        chip.active = !chip.active;
        this.updateFilteredItems();
    }

    isFilterDropdownOpen: boolean = false;

    toggleFilterDropdown(event: Event) {
        event.stopPropagation();
        this.isFilterDropdownOpen = !this.isFilterDropdownOpen;
    }

    @HostListener('document:click')
    closeFilterDropdown() {
        this.isFilterDropdownOpen = false;
    }

    addChip(chip: string) {
        this.isFilterDropdownOpen = false;
        if (!this.filterChips.includes(chip)) {
            this.filterChips.push(chip);
            this.triggerToast(`Filtre activé : ${chip}`);
            this.updateFilteredItems();
        }
    }

    removeChip(chip: string) {
        this.filterChips = this.filterChips.filter(c => c !== chip);
        if (this.allAvailableChips.includes(chip)) {
            this.allAvailableChips = [chip, ...this.allAvailableChips.filter(c => c !== chip)];
        } else {
            this.allAvailableChips.unshift(chip);
        }
        this.triggerToast(`Filtre retiré : ${chip} (disponible dans 'Ajouter un filtre')`);
        this.updateFilteredItems();
    }

    // --- TABLE QUICK FILTERS ---
    setTableFilter(filter: 'all' | 'regle' | 'en-cours' | 'bloque') {
        this.tableFilter = filter;
        this.updateFilteredItems();
    }

    setChartTab(tab: 'flux' | 'canaux' | 'banques') {
        this.chartTab = tab;
    }

    // --- REFRESH & TOAST NOTIFICATION ---
    refreshData() {
        this.updateFilteredItems();
        this.triggerToast('Flux de règlements synchronisés avec les télétransmissions bancaires');
    }

    triggerToast(msg: string) {
        this.toastMessage = msg;
        this.showToast = true;
        setTimeout(() => {
            this.showToast = false;
            this.cdr.markForCheck();
        }, 3000);
    }

    // --- EXPORT HANDLERS ---
    exportExcel() {
        this.triggerToast('Export Excel du journal des règlements généré');
    }

    exportPdf() {
        this.triggerToast('Export PDF du bordereau récapitulatif des règlements généré');
    }

    generateAnalysis(event?: any) {
        this.triggerToast('Matrice multidimensionnelle des règlements recalculée');
    }

    // --- DYNAMIC FILTERING ENGINE ---
    updateFilteredItems() {
        let items = [...this.allReglementItems];

        // 1. Filter by SubDomain
        if (this.activeSubDomain === 'fournisseurs') {
            items = items.filter(i => i.typeReglement === 'Fournisseur');
        } else if (this.activeSubDomain === 'imputations') {
            items = items.filter(i => i.typeReglement === 'Imputation Provisoire');
        } else if (this.activeSubDomain === 'rapprochement') {
            items = items.filter(i => i.typeReglement === 'Rapprochement Inter-comptable');
        }

        // 2. Filter by Perimeter
        if (this.activePerimetre !== 'Toutes Banques & Postes') {
            items = items.filter(i => i.perimetre === this.activePerimetre || i.banque.includes(this.activePerimetre.split(' ')[0]));
        }

        // 3. Filter by Search Query
        if (this.searchQuery.trim()) {
            const q = this.searchQuery.toLowerCase().trim();
            items = items.filter(i =>
                i.ref.toLowerCase().includes(q) ||
                i.beneficiaire.toLowerCase().includes(q) ||
                i.beneficiaireFull.toLowerCase().includes(q) ||
                i.objet.toLowerCase().includes(q) ||
                i.ministere.toLowerCase().includes(q) ||
                i.banque.toLowerCase().includes(q)
            );
        }

        // 4. Filter by Quick Pills
        if (this.tableFilter !== 'all') {
            items = items.filter(i => i.statut === this.tableFilter);
        }

        // 5. Filter by Active Chips
        if (this.filterChips.includes('Rejets Bancaires')) {
            items = items.filter(i => i.statut === 'bloque');
        }
        if (this.filterChips.includes('Délai < 30j')) {
            items = items.filter(i => i.delaiJours <= 30);
        }
        if (this.filterChips.includes('Virements RTGS')) {
            items = items.filter(i => i.canalPaiement.includes('Virement') || i.canalPaiement.includes('RTGS'));
        }
        if (this.filterChips.includes('Virements BCEAO')) {
            items = items.filter(i => i.banque.includes('BCEAO'));
        }
        if (this.filterChips.includes('Mandats > 100M FCFA')) {
            items = items.filter(i => i.montantVal >= 100);
        }
        if (this.filterChips.includes('Délai ordonnancement > 45j')) {
            items = items.filter(i => i.delaiJours >= 40);
        }
        if (this.filterChips.includes('Fournisseurs BTP & Travaux')) {
            items = items.filter(i => i.ministere.includes('Équipement') || i.objet.toLowerCase().includes('travaux') || i.objet.toLowerCase().includes('btp'));
        }
        if (this.filterChips.includes('Rapprochement Auto > 95%')) {
            items = items.filter(i => i.statut === 'regle');
        }
        if (this.filterChips.includes('Paiements Électroniques')) {
            items = items.filter(i => i.canalPaiement.includes('Virement') || i.canalPaiement.includes('BCEAO') || i.canalPaiement.includes('RTGS'));
        }
        if (this.filterChips.includes('Fournisseurs Énergie & Eau')) {
            items = items.filter(i => i.beneficiaire.includes('CIE') || i.beneficiaire.includes('SODECI') || i.objet.toLowerCase().includes('énergie') || i.objet.toLowerCase().includes('eau'));
        }
        if (this.filterChips.includes('Chèques Trésor en circulation')) {
            items = items.filter(i => i.canalPaiement.includes('Chèque'));
        }
        if (this.filterChips.includes('Imputations en attente')) {
            items = items.filter(i => i.statut === 'en-cours');
        }

        this.filteredItems = items;
    }

    getCount(type: 'all' | 'regle' | 'en-cours' | 'bloque'): number {
        if (type === 'all') return this.allReglementItems.length;
        return this.allReglementItems.filter(i => i.statut === type).length;
    }

    // --- DYNAMIC KPI METRICS (EXACT SAME FORMAT AS TRÉSORERIE) ---
    get currentKpis() {
        const p = this.activePerimetre;
        const isBceao = p.includes('BCEAO');
        const isSgbci = p.includes('SGBCI');
        const isBni = p.includes('BNI');

        const periodIsToday = this.activePeriod.includes('Aujourd');
        const periodIsWeek = this.activePeriod.includes('semaine');

        // SOUS-DOMAINE 1: RÈGLEMENTS FOURNISSEURS
        if (this.activeSubDomain === 'fournisseurs') {
            if (isBceao) {
                return [
                    { titre: 'Montant Règlements BCEAO', valeur: '8.400', unite: 'Milliards FCFA', progress: 58, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Dans les limites', badgeIcon: 'fa-check', bench: 'Plafond: 15.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Moyen Télé-virement', valeur: '18.5', unite: 'Jours ouvrés', progress: 92, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-4.2j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Objectif Légal : < 30j', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Rapprochement Auto', valeur: '98.5%', unite: 'des flux RTGS', progress: 98.5, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Excellence (+3.5%)', badgeIcon: 'fa-check', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Rejets Télétransmission', valeur: '1', unite: 'Virement en attente', progress: 8, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Régularisé ce jour', badgeIcon: 'fa-check', bench: 'Moyenne : 0.5', icon: 'fa-bell', colorTheme: 'red' }
                ];
            } else if (isSgbci) {
                return [
                    { titre: 'Montant Règlements SGBCI', valeur: '4.200', unite: 'Milliards FCFA', progress: 45, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 8.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Moyen Règlement', valeur: '22.0', unite: 'Jours ouvrés', progress: 85, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-2.5j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Objectif Légal : < 30j', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Rapprochement Auto', valeur: '93.4%', unite: 'des opérations', progress: 93.4, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme (+3.4%)', badgeIcon: 'fa-check', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Rejets Télétransmission', valeur: '2', unite: 'Anomalies coordonnées', progress: 20, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '2 coordonnées RIB', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne : 1.2', icon: 'fa-bell', colorTheme: 'red' }
                ];
            } else if (periodIsToday) {
                return [
                    { titre: 'Règlements Exécutés Jour', valeur: '620.0', unite: 'Millions FCFA', progress: 22, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Flux direct', badgeIcon: 'fa-check', bench: 'Plafond jour: 1.5 Md', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Exécution Télécoms', valeur: '0.8', unite: 'Jour ouvré', progress: 95, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Exécution instantanée', badgeIcon: 'fa-bolt', bench: 'Cible : < 1 jour', icon: 'fa-bolt', colorTheme: 'green' },
                    { titre: 'Taux Rapprochement Jour', valeur: '99.2%', unite: 'des flux', progress: 99.2, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Parfait', badgeIcon: 'fa-check', bench: 'Seuil : > 95%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Rejets Bancaires Jour', valeur: '0', unite: 'Rejet', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Aucune anomalie', badgeIcon: 'fa-check', bench: 'Moyenne : 0', icon: 'fa-bell', colorTheme: 'red' }
                ];
            }

            // Default Month (Mars 2026) — Format Trésorerie
            return [
                { titre: 'Montant Règlements en cours', valeur: '18.250', unite: 'Milliards FCFA', progress: 48, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 30.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                { titre: 'Délai Moyen Règlement', valeur: '21.4', unite: 'Jours ouvrés', progress: 84, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-3.6j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Objectif Légal : < 30j', icon: 'fa-stopwatch', colorTheme: 'green' },
                { titre: 'Taux Rapprochement Auto', valeur: '94.2%', unite: 'des flux bancaires', progress: 88.5, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Vigilance (+4.2%)', badgeIcon: 'fa-circle-exclamation', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Anomalies & Suspensions', valeur: '14', unite: 'Dossiers ordonnateurs', progress: 60, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '5 blocages > 45j', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne: 1.5 / banque', icon: 'fa-bell', colorTheme: 'red' }
            ];
        } else if (this.activeSubDomain === 'imputations') {
            return [
                { titre: 'Encours Imputations Provisoires', valeur: '1.850', unite: 'Milliards FCFA', progress: 35, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Sous surveillance', badgeIcon: 'fa-check', bench: 'Seuil max: 3.500 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                { titre: 'Délai Moyen Régularisation IP', valeur: '14.2', unite: 'Jours ouvrés', progress: 80, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-2.0j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 20 jours', icon: 'fa-stopwatch', colorTheme: 'green' },
                { titre: 'Taux Apurement Définitif', valeur: '91.8%', unite: 'des montants IP', progress: 91.8, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme (+1.8%)', badgeIcon: 'fa-check', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'IP Sans Pièces Justificatives', valeur: '8', unite: 'Dossiers à réclamer', progress: 40, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '3 critiques > 60j', badgeIcon: 'fa-triangle-exclamation', bench: 'Seuil max < 10 dossiers', icon: 'fa-bell', colorTheme: 'red' }
            ];
        } else {
            // Rapprochement Bancaire ACCT-ACCD
            return [
                { titre: 'Flux Rapprochés CUT / ACCT', valeur: '42.600', unite: 'Milliards FCFA', progress: 96, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Concordance haute', badgeIcon: 'fa-check', bench: 'Total flux: 44.0 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                { titre: 'Délai Moyen Concordance', valeur: '0.9', unite: 'Jour ouvré', progress: 98, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Flux T+1 respecté', badgeIcon: 'fa-bolt', bench: 'Objectif < 1 jour', icon: 'fa-bolt', colorTheme: 'green' },
                { titre: 'Écart de Concordance', valeur: '0.01%', unite: 'Tolérance nulle', progress: 10, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme ACCT', badgeIcon: 'fa-check-double', bench: 'Tolérance < 0.05%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Suspensions Non Lettrées', valeur: '5', unite: 'Écritures en sas', progress: 25, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '2 en régularisation', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne : 3', icon: 'fa-bell', colorTheme: 'red' }
            ];
        }
    }

    // --- REVENUE / PAYMENT CYCLE FLOW (SVG PIPELINE) ---
    get currentFlowData() {
        const p = this.activePerimetre;
        const isBceao = p.includes('BCEAO');

        const title = this.activeSubDomain === 'fournisseurs'
            ? `Chaîne d'Exécution du Règlement — ${p.startsWith('Toutes') ? 'Toutes Télétransmissions' : p}`
            : (this.activeSubDomain === 'imputations'
                ? `Circuit d'Apurement des Imputations Provisoires — ${p}`
                : `Rapprochement Miroir CUT & ACCT — ${p}`);

        return {
            title,
            sourceTitle: this.activeSubDomain === 'fournisseurs' ? '1. MANDATS TRANSMIS ACCT' : '1. ÉCRITURES IP DÉCAISSÉES',
            totalAmount: isBceao ? '8.400 Mds' : '18.250 Mds',
            mandatsCount: isBceao ? '124 Mandats RTGS' : '318 Règlements Actifs',
            validesAmount: isBceao ? '8.274 Mds' : '17.191 Mds',
            tauxValides: isBceao ? '98.5%' : '94.2%',
            instructionAmount: isBceao ? '98 Millions' : '820 Millions',
            instructionPct: '4.5%',
            echuAmount: isBceao ? '28 Millions' : '239 Millions',
            echuPct: '1.3%'
        };
    }

    // --- DONUT BREAKDOWN ENGINE ---
    get currentDonutData() {
        if (this.activeSubDomain === 'imputations') {
            return {
                title: 'Catégories d\'Imputations Provisoires',
                pctValide: 75,
                pctEnCours: 18,
                pctAlerte: 7,
                label1: 'Dépenses Urgentes Régularisées (75%)',
                amount1: '1.38 Mds',
                label2: 'En Attente de Visa Engagé (18%)',
                amount2: '333 Millions',
                label3: 'Sans Pièces > 45j (7%)',
                amount3: '130 Millions'
            };
        }
        return {
            title: 'Canaux d\'Exécution Bancaire',
            pctValide: 65,
            pctEnCours: 25,
            pctAlerte: 10,
            label1: 'Virements RTGS / BCEAO (65%)',
            amount1: '11.86 Mds',
            label2: 'Virements SICA / Réseau (25%)',
            amount2: '4.56 Mds',
            label3: 'Chèques Trésor & Autres (10%)',
            amount3: '1.83 Mds'
        };
    }

    // --- TELEMETRY ENGINE ---
    get currentTelemetry() {
        return {
            syncStatus: 'Connecté BCEAO / SICA (Temps Réel)',
            regiesConnectees: '18 Agences Bancaires Référencées',
            tauxConcordance: '99.98% Concordance CUT',
            delaiActualisation: 'Mis à jour il y a 1 min'
        };
    }
}
