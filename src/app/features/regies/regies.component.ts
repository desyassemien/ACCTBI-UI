import { Component, OnInit, ChangeDetectorRef, NgZone, ViewChildren, QueryList, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

export interface RegieItem {
    ref: string;
    regisseur: string;
    fonction: string;
    ministere: string;
    localite: string;
    dateCreation: string;
    dateDernierControle: string;
    soldeCaisse: string;
    soldeVal: number; // in Millions FCFA
    plafondAutorise: string;
    typeRegie: 'Régie d\'Avance' | 'Régie de Recette' | 'Régie Mixte';
    rotationJours: number;
    tauxJustificatifs: number;
    statut: 'conforme' | 'en-cours' | 'alerte';
    statutLabel: string;
    avatarInitials: string;
    avatarClass: string;
    banqueCompte: string;
    periodTag: 'today' | 'week' | 'month' | 'q1' | 'y2026' | 'y2025';
    perimetre: string;
}

@Component({
    selector: 'app-regies',
    standalone: true,
    imports: [CommonModule, FormsModule, BaseChartDirective, AnalyseSelectorComponent],
    templateUrl: './regies.component.html',
    styleUrl: './regies.component.scss'
})
export class RegiesComponent implements OnInit {
    @ViewChildren(BaseChartDirective) charts?: QueryList<BaseChartDirective>;

    // View State
    viewMode: 'synthese' | 'avancee' = 'synthese';
    activeSubDomain: 'avances' | 'recettes' | 'audits' = 'avances';
    chartTab: 'flux' | 'nature' | 'region' = 'flux';

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
        'Toutes Administrations',
        'Santé Publique',
        'Éducation Nationale',
        'Intérieur & Sécurité',
        'Justice & Droits de l\'Homme',
        'Économie & Finances'
    ];
    activePerimetre: string = 'Toutes Administrations';

    filterChips: string[] = ['Régies Actives', 'Solde < Plafond', 'Justificatifs > 95%'];
    allAvailableChips: string[] = [
        'Régies Actives',
        'Solde < Plafond',
        'Audits programmés',
        'Justificatifs > 95%',
        'Alertes Dépassement',
        'Délai apurement > 60j',
        'Plafond caisse > 20M FCFA',
        'Arrêté mensuel validé',
        'Écart physique / comptable',
        'Régies Santé Publique',
        'Régies Éducation Nationale',
        'Régies Intérieur & Sécurité',
        'Régies Économie & Finances',
        'Justificatifs en attente',
        'Rotation rapide (< 10j)'
    ];

    // Search and Table Filter
    searchQuery: string = '';
    tableFilter: 'all' | 'conforme' | 'en-cours' | 'alerte' = 'all';

    // Toast feedback
    showToast: boolean = false;
    toastMessage: string = '';

    // Advanced OLAP Drag & Drop Selector State
    isDragDropMode = false;
    currentAvailableIndicators: string[] = [
        'Taux de rotation des fonds',
        'Délai moyen d\'apurement',
        'Taux de conformité justificatifs',
        'Montant moyen des menues dépenses',
        'Volume total recettes encaissées',
        'Écart de caisse physique/comptable'
    ];
    currentSelectedIndicators: string[] = [
        'Solde de caisse cumulé',
        'Nombre de régies actives',
        'Taux de régularisation pièces'
    ];
    currentAvailableAxes: string[] = [
        'Régisseur / Poste',
        'Type de régie',
        'Localité géographique',
        'Nature de dépense / recette',
        'Direction locale'
    ];
    currentSelectedAxes: string[] = ['Ministère / Organisation'];

    // All Items Mock Dataset (30+ items)
    allRegieItems: RegieItem[] = [
        // Santé Publique
        {
            ref: 'REG-SAN-001',
            regisseur: 'M. Diallo Ibrahim',
            fonction: 'Régisseur Central CHU Treichville',
            ministere: 'Santé Publique',
            localite: 'Abidjan Sud',
            dateCreation: '12/01/2023',
            dateDernierControle: '14/03/2026',
            soldeCaisse: '18 450 000',
            soldeVal: 18.45,
            plafondAutorise: '25 000 000 FCFA',
            typeRegie: 'Régie d\'Avance',
            rotationJours: 11.2,
            tauxJustificatifs: 98.4,
            statut: 'conforme',
            statutLabel: 'Conforme',
            avatarInitials: 'DI',
            avatarClass: 'avatar-teal',
            banqueCompte: 'BCEAO / BNI Abidjan',
            periodTag: 'month',
            perimetre: 'Santé Publique'
        },
        {
            ref: 'REG-SAN-002',
            regisseur: 'Mme. Bamba Mariam',
            fonction: 'Régisseur Pharmacie CHU Cocody',
            ministere: 'Santé Publique',
            localite: 'Abidjan Nord',
            dateCreation: '04/05/2024',
            dateDernierControle: '10/03/2026',
            soldeCaisse: '32 800 000',
            soldeVal: 32.8,
            plafondAutorise: '35 000 000 FCFA',
            typeRegie: 'Régie de Recette',
            rotationJours: 8.5,
            tauxJustificatifs: 99.1,
            statut: 'conforme',
            statutLabel: 'Conforme',
            avatarInitials: 'BM',
            avatarClass: 'avatar-blue',
            banqueCompte: 'Trésor Pay / NSIA',
            periodTag: 'month',
            perimetre: 'Santé Publique'
        },
        {
            ref: 'REG-SAN-003',
            regisseur: 'M. Kouadio Jean-Marc',
            fonction: 'Régisseur District Sanitaire Daloa',
            ministere: 'Santé Publique',
            localite: 'Daloa',
            dateCreation: '15/09/2023',
            dateDernierControle: '02/02/2026',
            soldeCaisse: '9 800 000',
            soldeVal: 9.8,
            plafondAutorise: '10 000 000 FCFA',
            typeRegie: 'Régie d\'Avance',
            rotationJours: 19.4,
            tauxJustificatifs: 84.2,
            statut: 'alerte',
            statutLabel: 'Audit Requis',
            avatarInitials: 'KJ',
            avatarClass: 'avatar-rose',
            banqueCompte: 'Trésorerie Régionale Daloa',
            periodTag: 'month',
            perimetre: 'Santé Publique'
        },
        // Éducation Nationale
        {
            ref: 'REG-EDU-001',
            regisseur: 'Mme. Kouassi Adjoua',
            fonction: 'Régisseur Principal DRENA Yamoussoukro',
            ministere: 'Éducation Nationale',
            localite: 'Yamoussoukro',
            dateCreation: '18/02/2022',
            dateDernierControle: '18/03/2026',
            soldeCaisse: '14 200 000',
            soldeVal: 14.2,
            plafondAutorise: '20 000 000 FCFA',
            typeRegie: 'Régie d\'Avance',
            rotationJours: 10.8,
            tauxJustificatifs: 96.5,
            statut: 'conforme',
            statutLabel: 'Conforme',
            avatarInitials: 'KA',
            avatarClass: 'avatar-amber',
            banqueCompte: 'SGBCI Yamoussoukro',
            periodTag: 'month',
            perimetre: 'Éducation Nationale'
        },
        {
            ref: 'REG-EDU-002',
            regisseur: 'M. N\'Dri Yao Christian',
            fonction: 'Régisseur Lycée Scientifique Yamoussoukro',
            ministere: 'Éducation Nationale',
            localite: 'Yamoussoukro',
            dateCreation: '09/11/2023',
            dateDernierControle: '12/03/2026',
            soldeCaisse: '5 600 000',
            soldeVal: 5.6,
            plafondAutorise: '8 000 000 FCFA',
            typeRegie: 'Régie d\'Avance',
            rotationJours: 12.0,
            tauxJustificatifs: 95.0,
            statut: 'conforme',
            statutLabel: 'Conforme',
            avatarInitials: 'NY',
            avatarClass: 'avatar-purple',
            banqueCompte: 'Trésorerie Yamoussoukro',
            periodTag: 'month',
            perimetre: 'Éducation Nationale'
        },
        {
            ref: 'REG-EDU-003',
            regisseur: 'M. Fofana Sekou',
            fonction: 'Régisseur Recettes DRENA Korhogo',
            ministere: 'Éducation Nationale',
            localite: 'Korhogo',
            dateCreation: '22/08/2024',
            dateDernierControle: '20/02/2026',
            soldeCaisse: '7 450 000',
            soldeVal: 7.45,
            plafondAutorise: '10 000 000 FCFA',
            typeRegie: 'Régie de Recette',
            rotationJours: 14.2,
            tauxJustificatifs: 89.0,
            statut: 'en-cours',
            statutLabel: 'En apurement',
            avatarInitials: 'FS',
            avatarClass: 'avatar-indigo',
            banqueCompte: 'Trésorerie Régionale Korhogo',
            periodTag: 'month',
            perimetre: 'Éducation Nationale'
        },
        // Intérieur & Sécurité
        {
            ref: 'REG-INT-001',
            regisseur: 'M. Traoré Bakary',
            fonction: 'Régisseur Préfecture de Police Bouaké',
            ministere: 'Intérieur & Sécurité',
            localite: 'Bouaké',
            dateCreation: '11/04/2021',
            dateDernierControle: '05/03/2026',
            soldeCaisse: '28 000 000',
            soldeVal: 28.0,
            plafondAutorise: '30 000 000 FCFA',
            typeRegie: 'Régie d\'Avance',
            rotationJours: 16.5,
            tauxJustificatifs: 88.0,
            statut: 'alerte',
            statutLabel: 'Audit Requis',
            avatarInitials: 'TB',
            avatarClass: 'avatar-rose',
            banqueCompte: 'SIB Bouaké',
            periodTag: 'month',
            perimetre: 'Intérieur & Sécurité'
        },
        {
            ref: 'REG-INT-002',
            regisseur: 'Mme. Ouattara Fatou',
            fonction: 'Régisseur DST / Sécurité Intérieure',
            ministere: 'Intérieur & Sécurité',
            localite: 'Abidjan Plateau',
            dateCreation: '17/07/2023',
            dateDernierControle: '19/03/2026',
            soldeCaisse: '19 500 000',
            soldeVal: 19.5,
            plafondAutorise: '25 000 000 FCFA',
            typeRegie: 'Régie d\'Avance',
            rotationJours: 9.8,
            tauxJustificatifs: 97.2,
            statut: 'conforme',
            statutLabel: 'Conforme',
            avatarInitials: 'OF',
            avatarClass: 'avatar-teal',
            banqueCompte: 'ACCT Siège',
            periodTag: 'month',
            perimetre: 'Intérieur & Sécurité'
        },
        // Justice & Droits de l'Homme
        {
            ref: 'REG-JUS-001',
            regisseur: 'M. Gnahoré Eric',
            fonction: 'Régisseur Tribunal de Première Instance Yopougon',
            ministere: 'Justice & Droits de l\'Homme',
            localite: 'Abidjan Yopougon',
            dateCreation: '14/10/2022',
            dateDernierControle: '17/03/2026',
            soldeCaisse: '41 200 000',
            soldeVal: 41.2,
            plafondAutorise: '50 000 000 FCFA',
            typeRegie: 'Régie de Recette',
            rotationJours: 7.2,
            tauxJustificatifs: 99.4,
            statut: 'conforme',
            statutLabel: 'Conforme',
            avatarInitials: 'GE',
            avatarClass: 'avatar-blue',
            banqueCompte: 'BCEAO / BNI Yopougon',
            periodTag: 'month',
            perimetre: 'Justice & Droits de l\'Homme'
        },
        // Économie & Finances
        {
            ref: 'REG-FIN-001',
            regisseur: 'Mme. Sylla Fatoumata',
            fonction: 'Régisseur Menues Dépenses Trésor San-Pedro',
            ministere: 'Économie & Finances',
            localite: 'San-Pedro',
            dateCreation: '05/06/2023',
            dateDernierControle: '21/03/2026',
            soldeCaisse: '2 150 000',
            soldeVal: 2.15,
            plafondAutorise: '5 000 000 FCFA',
            typeRegie: 'Régie d\'Avance',
            rotationJours: 6.5,
            tauxJustificatifs: 100.0,
            statut: 'conforme',
            statutLabel: 'Conforme',
            avatarInitials: 'SF',
            avatarClass: 'avatar-teal',
            banqueCompte: 'Trésorerie San-Pedro',
            periodTag: 'month',
            perimetre: 'Économie & Finances'
        },
        {
            ref: 'REG-FIN-002',
            regisseur: 'M. Kone Lamine',
            fonction: 'Régisseur Recettes Douanes Port Autonome',
            ministere: 'Économie & Finances',
            localite: 'Abidjan Port',
            dateCreation: '01/02/2024',
            dateDernierControle: '22/03/2026',
            soldeCaisse: '84 500 000',
            soldeVal: 84.5,
            plafondAutorise: '100 000 000 FCFA',
            typeRegie: 'Régie de Recette',
            rotationJours: 3.2,
            tauxJustificatifs: 99.8,
            statut: 'conforme',
            statutLabel: 'Conforme',
            avatarInitials: 'KL',
            avatarClass: 'avatar-blue',
            banqueCompte: 'BCEAO Siège ACCT',
            periodTag: 'month',
            perimetre: 'Économie & Finances'
        }
    ];

    filteredItems: RegieItem[] = [];

    // Chart.js Datasets & Configurations for Advanced OLAP Mode
    barChartData: ChartData<'bar'> = {
        labels: ['Santé', 'Éducation', 'Intérieur', 'Justice', 'Finances', 'Infrastructures'],
        datasets: [
            { data: [45.2, 38.6, 52.0, 48.4, 86.5, 34.0], label: 'Avances Accordées (Mds)', backgroundColor: '#F77F00', borderRadius: 4 },
            { data: [44.0, 36.8, 47.5, 47.9, 85.8, 32.5], label: 'Dépenses Justifiées (Mds)', backgroundColor: '#10b981', borderRadius: 4 }
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
            { data: [92.4, 93.1, 94.5, 95.2, 96.0, 96.4], label: 'Taux Justification (%)', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.3 },
            { data: [15.2, 14.8, 14.0, 13.5, 13.0, 12.5], label: 'Délai Rotation (Jours)', borderColor: '#F77F00', tension: 0.3 }
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
    selectSubDomain(domain: 'avances' | 'recettes' | 'audits') {
        this.activeSubDomain = domain;
        this.updateFilteredItems();
        this.triggerToast(`Sous-domaine : ${domain === 'avances' ? 'Régies d\'Avances' : (domain === 'recettes' ? 'Régies de Recettes' : 'Contrôle & Audits de Caisse')}`);
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
        this.triggerToast(`Périmètre appliqué : ${perimetre}`);
    }

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
    setTableFilter(filter: 'all' | 'conforme' | 'en-cours' | 'alerte') {
        this.tableFilter = filter;
        this.updateFilteredItems();
    }

    setChartTab(tab: 'flux' | 'nature' | 'region') {
        this.chartTab = tab;
    }

    // --- REFRESH & TOAST NOTIFICATION ---
    refreshData() {
        this.updateFilteredItems();
        this.triggerToast('Données des régies synchronisées avec succès');
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
        this.triggerToast('Export Excel du relevé des régies généré avec succès');
    }

    exportPdf() {
        this.triggerToast('Export PDF du rapport de contrôle des régies généré avec succès');
    }

    generateAnalysis(event?: any) {
        this.triggerToast('Matrice multidimensionnelle des régies recalculée');
    }

    // --- DYNAMIC FILTERING ENGINE ---
    updateFilteredItems() {
        let items = [...this.allRegieItems];

        // 1. Filter by SubDomain
        if (this.activeSubDomain === 'avances') {
            items = items.filter(i => i.typeRegie === 'Régie d\'Avance' || i.typeRegie === 'Régie Mixte');
        } else if (this.activeSubDomain === 'recettes') {
            items = items.filter(i => i.typeRegie === 'Régie de Recette' || i.typeRegie === 'Régie Mixte');
        } else if (this.activeSubDomain === 'audits') {
            items = items.filter(i => i.statut === 'alerte' || i.rotationJours > 14);
        }

        // 2. Filter by Perimeter
        if (this.activePerimetre !== 'Toutes Administrations') {
            items = items.filter(i => i.perimetre === this.activePerimetre || i.ministere === this.activePerimetre);
        }

        // 3. Filter by Search Query
        if (this.searchQuery.trim()) {
            const q = this.searchQuery.toLowerCase().trim();
            items = items.filter(i =>
                i.ref.toLowerCase().includes(q) ||
                i.regisseur.toLowerCase().includes(q) ||
                i.ministere.toLowerCase().includes(q) ||
                i.localite.toLowerCase().includes(q) ||
                i.fonction.toLowerCase().includes(q)
            );
        }

        // 4. Filter by Quick Pills
        if (this.tableFilter !== 'all') {
            items = items.filter(i => i.statut === this.tableFilter);
        }

        // 5. Filter by Active Chips
        if (this.filterChips.includes('Alertes Dépassement')) {
            items = items.filter(i => i.statut === 'alerte');
        }
        if (this.filterChips.includes('Solde < Plafond')) {
            items = items.filter(i => i.rotationJours <= 14);
        }
        if (this.filterChips.includes('Audits programmés')) {
            items = items.filter(i => i.statut === 'en-cours');
        }
        if (this.filterChips.includes('Délai apurement > 60j')) {
            items = items.filter(i => i.rotationJours >= 10);
        }
        if (this.filterChips.includes('Plafond caisse > 20M FCFA')) {
            items = items.filter(i => i.soldeVal >= 15);
        }
        if (this.filterChips.includes('Régies Santé') || this.filterChips.includes('Régies Santé Publique')) {
            items = items.filter(i => i.ministere.includes('Santé'));
        }
        if (this.filterChips.includes('Régies Éducation') || this.filterChips.includes('Régies Éducation Nationale')) {
            items = items.filter(i => i.ministere.includes('Éducation'));
        }
        if (this.filterChips.includes('Régies Intérieur & Sécurité')) {
            items = items.filter(i => i.ministere.includes('Intérieur') || i.ministere.includes('Sécurité'));
        }
        if (this.filterChips.includes('Régies Économie & Finances')) {
            items = items.filter(i => i.ministere.includes('Finances') || i.ministere.includes('Économie'));
        }
        if (this.filterChips.includes('Justificatifs en attente')) {
            items = items.filter(i => i.tauxJustificatifs < 90);
        }
        if (this.filterChips.includes('Rotation rapide (< 10j)')) {
            items = items.filter(i => i.rotationJours < 10);
        }

        this.filteredItems = items;
    }

    getCount(type: 'all' | 'conforme' | 'en-cours' | 'alerte'): number {
        if (type === 'all') return this.allRegieItems.length;
        return this.allRegieItems.filter(i => i.statut === type).length;
    }

    // --- DYNAMIC KPI METRICS (EXACT SAME FORMAT AS TRÉSORERIE) ---
    get currentKpis() {
        const p = this.activePerimetre;
        const isSante = p.includes('Santé');
        const isEducation = p.includes('Éducation');
        const isInterieur = p.includes('Intérieur');
        const isJustice = p.includes('Justice');
        const isFinances = p.includes('Finances');

        const periodIsToday = this.activePeriod.includes('Aujourd');
        const periodIsWeek = this.activePeriod.includes('semaine');

        // SOUS-DOMAINE 1: RÉGIES D'AVANCES
        if (this.activeSubDomain === 'avances') {
            if (isSante) {
                return [
                    { titre: 'Montant Avances Santé', valeur: '1.450', unite: 'Milliards FCFA', progress: 42, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 3.500 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Rotation des Fonds', valeur: '10.2', unite: 'Jours ouvrés', progress: 88, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-1.8j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 15 jours', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Justificatifs Validés', valeur: '98.4%', unite: 'des pièces', progress: 98.4, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme (+3.4%)', badgeIcon: 'fa-check', bench: 'Seuil légal : > 95%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Régies en Dépassement', valeur: '1', unite: 'Régie en alerte', progress: 12, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '1 critique > 20j', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne: 0.2 / poste', icon: 'fa-bell', colorTheme: 'red' }
                ];
            } else if (isEducation) {
                return [
                    { titre: 'Montant Avances Éducation', valeur: '2.100', unite: 'Milliards FCFA', progress: 55, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 4.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Rotation des Fonds', valeur: '11.5', unite: 'Jours ouvrés', progress: 82, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-1.1j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 15 jours', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Justificatifs Validés', valeur: '96.5%', unite: 'des pièces', progress: 96.5, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme (+1.5%)', badgeIcon: 'fa-check', bench: 'Seuil légal : > 95%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Régies en Dépassement', valeur: '2', unite: 'Régies en alerte', progress: 20, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '2 en attente', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne: 0.4 / poste', icon: 'fa-bell', colorTheme: 'red' }
                ];
            } else if (periodIsToday) {
                return [
                    { titre: 'Décaissements du Jour', valeur: '142.5', unite: 'Millions FCFA', progress: 18, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Flux journalier', badgeIcon: 'fa-check', bench: 'Plafond jour: 400M', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Traitement Ordres', valeur: '0.6', unite: 'Jour ouvré', progress: 95, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Traitement direct', badgeIcon: 'fa-bolt', bench: 'Cible : < 1 jour', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Justificatifs Jour', valeur: '99.0%', unite: 'des pièces', progress: 99, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Parfait', badgeIcon: 'fa-check', bench: 'Seuil : > 95%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Régies en Dépassement', valeur: '0', unite: 'Régie en alerte', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Aucune anomalie', badgeIcon: 'fa-check', bench: 'Moyenne: 0', icon: 'fa-bell', colorTheme: 'red' }
                ];
            }

            // Default Month (Mars 2026) — Format Trésorerie
            return [
                { titre: 'Montant Avances en cours', valeur: '4.850', unite: 'Milliards FCFA', progress: 48, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 8.500 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                { titre: 'Délai Moyen Apurement', valeur: '12.5', unite: 'Jours ouvrés', progress: 84, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-2.4j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 15 jours', icon: 'fa-stopwatch', colorTheme: 'green' },
                { titre: 'Taux Pièces Conformes', valeur: '96.4%', unite: 'des écritures', progress: 88.5, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Vigilance (+1.4%)', badgeIcon: 'fa-circle-exclamation', bench: 'Seuil légal : > 95%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Régies en Dépassement', valeur: '7', unite: 'Régisseurs ordonnateurs', progress: 55, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '3 critiques > 30j', badgeIcon: 'fa-triangle-exclamation', bench: 'Tolérance solde : 0', icon: 'fa-bell', colorTheme: 'red' }
            ];
        } else if (this.activeSubDomain === 'recettes') {
            return [
                { titre: 'Montant Recettes Perçues', valeur: '14.280', unite: 'Milliards FCFA', progress: 72, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Objectif atteint', badgeIcon: 'fa-check', bench: 'Prévision: 18.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                { titre: 'Délai Moyen Versement ACCT', valeur: '2.4', unite: 'Jours ouvrés', progress: 92, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-0.8j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 3 jours', icon: 'fa-stopwatch', colorTheme: 'green' },
                { titre: 'Taux Rapatriement Trésor', valeur: '99.1%', unite: 'des encaissements', progress: 99.1, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme (+4.1%)', badgeIcon: 'fa-check', bench: 'Seuil légal : > 95%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Chèques en Souffrance', valeur: '4', unite: 'Chèques impayés', progress: 25, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '1 en recouvrement', badgeIcon: 'fa-triangle-exclamation', bench: 'Taux impayés < 1%', icon: 'fa-bell', colorTheme: 'red' }
            ];
        } else {
            // Audits & Contrôle
            return [
                { titre: 'Soldes Vérifiés en Audit', valeur: '22.400', unite: 'Milliards FCFA', progress: 85, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Couverture 85%', badgeIcon: 'fa-check', bench: 'Total parc: 26 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                { titre: 'Délai Moyen Contrôle Inopiné', valeur: '3.5', unite: 'Jours ouvrés', progress: 80, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Dans les normes', badgeIcon: 'fa-stopwatch', bench: 'Cible : < 5 jours', icon: 'fa-stopwatch', colorTheme: 'green' },
                { titre: 'Concordance Caisse / Livre', valeur: '98.8%', unite: 'des vérifications', progress: 88, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Vigilance (-1.2%)', badgeIcon: 'fa-circle-exclamation', bench: 'Tolérance nulle', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Irrégularités de Caisse', valeur: '11', unite: 'Dossiers à régulariser', progress: 68, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '4 sommations ACCT', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne : 1.2 / mission', icon: 'fa-bell', colorTheme: 'red' }
            ];
        }
    }

    // --- REVENUE / EXPENSE CYCLE FLOW (SVG PIPELINE) ---
    get currentFlowData() {
        const p = this.activePerimetre;
        const isSante = p.includes('Santé');
        const isEducation = p.includes('Éducation');

        const title = this.activeSubDomain === 'avances'
            ? `Circuit de l'Avance de Caisse — ${p.startsWith('Toutes') ? 'Parc National des Régies' : p}`
            : (this.activeSubDomain === 'recettes'
                ? `Chaîne de Recouvrement des Recettes — ${p.startsWith('Toutes') ? 'Tous Postes' : p}`
                : `Procédure de Contrôle et Apurement — ${p}`);

        return {
            title,
            sourceTitle: this.activeSubDomain === 'avances' ? '1. ÉMISSION AVANCE ACCT' : '1. ENCAISSEMENT RÉGIE',
            totalAmount: isSante ? '1.450 Mds' : (isEducation ? '2.100 Mds' : '4.850 Mds'),
            mandatsCount: isSante ? '48 Régies Sanitaires' : (isEducation ? '64 DRENA & Lycées' : '142 Régisseurs Actifs'),
            validesAmount: isSante ? '1.426 Mds' : (isEducation ? '2.026 Mds' : '4.675 Mds'),
            tauxValides: isSante ? '98.4%' : '96.4%',
            instructionAmount: isSante ? '18 Millions' : '145 Millions',
            instructionPct: '3.0%',
            echuAmount: isSante ? '6 Millions' : '30 Millions',
            echuPct: '0.6%'
        };
    }

    // --- DONUT BREAKDOWN ENGINE ---
    get currentDonutData() {
        if (this.activeSubDomain === 'recettes') {
            return {
                title: 'Nature des Recettes Régies',
                pctValide: 62,
                pctEnCours: 28,
                pctAlerte: 10,
                label1: 'Droits Fiscaux & Timbres (62%)',
                amount1: '8.85 Mds',
                label2: 'Taxes Sanitaires & Hospitalières (28%)',
                amount2: '4.00 Mds',
                label3: 'Frais de Greffe & Actes (10%)',
                amount3: '1.43 Mds'
            };
        }
        return {
            title: 'Statut des Pièces de Dépenses',
            pctValide: 68,
            pctEnCours: 24,
            pctAlerte: 8,
            label1: 'Pièces Validées & Apurées (68%)',
            amount1: '3.30 Mds',
            label2: 'En Vérification ACCT (24%)',
            amount2: '1.16 Mds',
            label3: 'Pièces Rejetées / Suspendues (8%)',
            amount3: '390 Millions'
        };
    }

    // --- TELEMETRY ENGINE ---
    get currentTelemetry() {
        return {
            syncStatus: 'Opérationnel (Temps Réel)',
            regiesConnectees: '142 / 142 Postes Connectés',
            tauxConcordance: '99.8% Concordance Caisse',
            delaiActualisation: 'Mis à jour il y a 2 min'
        };
    }
}
