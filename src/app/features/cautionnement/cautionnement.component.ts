import { Component, OnInit, ChangeDetectorRef, NgZone, ViewChildren, QueryList, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

export interface CautionnementItem {
    ref: string;
    beneficiaire: string;
    beneficiaireFull: string;
    subtext: string;
    dateEmission: string;
    echeance: string;
    echeanceSub: string;
    echeanceStatus: 'normal' | 'warning' | 'danger' | 'success';
    montant: string;
    montantUnite: string;
    montantVal: number; // in Millions FCFA for accurate calculations
    typeCaution: 'Comptable / Régisseur' | 'Marché Public' | 'Consignation / Séquestre';
    banqueGarante?: string;
    hasGarantieBancaire: boolean;
    progression: number;
    statut: 'actif' | 'en-attente' | 'echu';
    statutLabel: string;
    avatarInitials: string;
    avatarClass: string;
    periodTag: 'today' | 'week' | 'month' | 'q1' | 'y2026' | 'y2025';
    perimetre: string;
}

@Component({
    selector: 'app-cautionnement',
    standalone: true,
    imports: [CommonModule, FormsModule, AnalyseSelectorComponent, BaseChartDirective],
    templateUrl: './cautionnement.component.html',
    styleUrl: './cautionnement.component.scss'
})
export class CautionnementComponent implements OnInit {

    constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

    @ViewChildren(BaseChartDirective) chartDirectives?: QueryList<BaseChartDirective>;

    ngOnInit(): void {
        this.updateFilteredItems();
    }

    // Sub-modules: 'comptables' (Comptables & Régisseurs) | 'marches' (Marchés & Garanties) | 'consignations' (Consignations & Séquestres)
    activeSubDomain: 'comptables' | 'marches' | 'consignations' = 'comptables';

    // View Mode: 'synthese' (modern dashboard) or 'avancee' (multidimensional OLAP selector)
    viewMode: 'synthese' | 'avancee' = 'synthese';

    // Chart mode tab
    chartTab: 'flux' | 'garant' | 'anciennete' = 'flux';

    // Table quick filter & search
    tableFilter: 'all' | 'actif' | 'en-attente' | 'echu' = 'all';
    searchQuery: string = '';

    // Active filters
    activePeriod: string = 'Ce mois-ci (Mars 2026)';
    activePerimetre: string = 'Tous les Ministères & Tutelles';
    filterChips: string[] = ['Cautions > 20M FCFA', 'Garantie bancaire active'];
    allAvailableChips: string[] = [
        'Cautions > 20M FCFA',
        'Garantie bancaire active',
        'Délai restant < 30j',
        'Attestation validée',
        'Cautionnements Santé',
        'Cautionnements Éducation',
        'En attente de régularisation'
    ];

    // Dropdown choices
    periodsList: string[] = [
        'Aujourd\'hui',
        'Cette semaine',
        'Ce mois-ci (Mars 2026)',
        '1er Trimestre 2026',
        'Exercice 2026',
        'Exercice 2025'
    ];

    perimetresComptables: string[] = [
        'Tous les Ministères & Tutelles',
        'Ministère de la Santé Publique',
        'Ministère de l\'Éducation Nationale',
        'Ministère de l\'Économie & Finances',
        'Trésoreries Régionales & Agences',
        'Régies d\'Avances Autonomes'
    ];

    perimetresMarches: string[] = [
        'Toutes les Autorités Contractantes',
        'Infrastructures & Travaux Publics',
        'Énergie & Ressources Hydrauliques',
        'Santé & Équipements Médicaux',
        'Technologies, Numérique & Télécoms'
    ];

    perimetresConsignations: string[] = [
        'Toutes les Juridictions & Caisses',
        'Cour des Comptes & Chambres',
        'Tribunal de Commerce d\'Abidjan',
        'Direction Générale des Douanes',
        'Pôle Pénal Économique & Financier'
    ];

    get currentPerimetres(): string[] {
        if (this.activeSubDomain === 'comptables') return this.perimetresComptables;
        if (this.activeSubDomain === 'marches') return this.perimetresMarches;
        return this.perimetresConsignations;
    }

    selectPeriod(period: string) {
        this.activePeriod = period;
        this.triggerToast(`Période sélectionnée : ${period}`);
        this.updateFilteredItems();
        if (this.isAnalysisGenerated) {
            this.generateAnalysis();
        }
    }

    selectPerimetre(perimetre: string) {
        this.activePerimetre = perimetre;
        this.triggerToast(`Périmètre sélectionné : ${perimetre}`);
        this.updateFilteredItems();
        if (this.isAnalysisGenerated) {
            this.generateAnalysis();
        }
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

    // Toast notification feedback
    toastMessage: string = '';
    showToast: boolean = false;
    private toastTimer: any = null;

    // Legacy Selector Support
    isDragDropMode = true;

    get selectedPeriod(): string {
        return this.activePeriod;
    }
    set selectedPeriod(period: string) {
        this.activePeriod = period;
    }

    // --- OLAP Dimension Indicators ---
    availableIndicatorsComptables = [
        'Taux de retenue sur traitement',
        'Ancienneté moy. constitution',
        'Nombre de régisseurs sans quitus',
        'Taux de renouvellement annuel'
    ];
    selectedIndicatorsComptables = [
        'Taux de cautionnement actif',
        'Montant moyen de caution',
        'Délai moy. émission attestation'
    ];
    availableAxesComptables = [
        'Fonction / Statut (Comptable / Régisseur)',
        'Poste comptable de rattachement',
        'Tranche de traitement indiciaire',
        'Niveau d\'habilitation',
        'Nature de la régie'
    ];
    selectedAxesComptables = ['Ministère / Tutelle', 'Temporel (Échéance)'];

    availableIndicatorsMarches = [
        'Volume retenues 5% libérables',
        'Taux d\'appels en garantie bancaire',
        'Délai moyen mainlevée provisoire',
        'Taux de déchéance de garantie'
    ];
    selectedIndicatorsMarches = [
        'Volume total cautions marchés',
        'Taux cautions 1ère demande',
        'Délai moy. mainlevée définitive'
    ];
    availableAxesMarches = [
        'Secteur d\'activité / Lot',
        'Établissement bancaire garant',
        'Seuil financier de marché',
        'Type de procédure d\'attribution'
    ];
    selectedAxesMarches = ['Autorité Contractante', 'Type de Caution'];

    availableIndicatorsConsignations = [
        'Volume séquestres sous séquestre',
        'Taux de mainlevée d\'office',
        'Délai moyen restitution ordonnée',
        'Taux d\'intérêts capitalisés'
    ];
    selectedIndicatorsConsignations = [
        'Encours total dépôts judiciaires',
        'Taux apurement séquestres',
        'Volume garanties douanières'
    ];
    availableAxesConsignations = [
        'Juridiction d\'origine',
        'Nature du litige / Contentieux',
        'Origine des fonds (Tiers / Caution)',
        'Ancienneté du dépôt'
    ];
    selectedAxesConsignations = ['Juridiction / Caisse', 'Statut du Dossier'];

    // Dynamic Getters and Setters for active sub-domain
    get currentAvailableIndicators(): string[] {
        if (this.activeSubDomain === 'comptables') return this.availableIndicatorsComptables;
        if (this.activeSubDomain === 'marches') return this.availableIndicatorsMarches;
        return this.availableIndicatorsConsignations;
    }
    set currentAvailableIndicators(val: string[]) {
        if (this.activeSubDomain === 'comptables') this.availableIndicatorsComptables = val;
        else if (this.activeSubDomain === 'marches') this.availableIndicatorsMarches = val;
        else this.availableIndicatorsConsignations = val;
    }

    get currentSelectedIndicators(): string[] {
        if (this.activeSubDomain === 'comptables') return this.selectedIndicatorsComptables;
        if (this.activeSubDomain === 'marches') return this.selectedIndicatorsMarches;
        return this.selectedIndicatorsConsignations;
    }
    set currentSelectedIndicators(val: string[]) {
        if (this.activeSubDomain === 'comptables') this.selectedIndicatorsComptables = val;
        else if (this.activeSubDomain === 'marches') this.selectedIndicatorsMarches = val;
        else this.selectedIndicatorsConsignations = val;
    }

    get currentAvailableAxes(): string[] {
        if (this.activeSubDomain === 'comptables') return this.availableAxesComptables;
        if (this.activeSubDomain === 'marches') return this.availableAxesMarches;
        return this.availableAxesConsignations;
    }
    set currentAvailableAxes(val: string[]) {
        if (this.activeSubDomain === 'comptables') this.availableAxesComptables = val;
        else if (this.activeSubDomain === 'marches') this.availableAxesMarches = val;
        else this.availableAxesConsignations = val;
    }

    get currentSelectedAxes(): string[] {
        if (this.activeSubDomain === 'comptables') return this.selectedAxesComptables;
        if (this.activeSubDomain === 'marches') return this.selectedAxesMarches;
        return this.selectedAxesConsignations;
    }
    set currentSelectedAxes(val: string[]) {
        if (this.activeSubDomain === 'comptables') this.selectedAxesComptables = val;
        else if (this.activeSubDomain === 'marches') this.selectedAxesMarches = val;
        else this.selectedAxesConsignations = val;
    }

    // --- DATASETS COMPLETS ET RÉACTIFS MULTI-PÉRIMÈTRES ET MULTI-PÉRIODES ---
    itemsComptables: CautionnementItem[] = [
        // Santé Publique
        {
            ref: 'ATT-2026-042',
            beneficiaire: 'Santé Publique',
            beneficiaireFull: 'Régie Centrale des Recettes CHU Treichville',
            subtext: 'Régisseur d\'Avances & Recettes — Arrêté N°2026-081',
            dateEmission: '14 Mars 2026',
            echeance: 'Dans 11 mois',
            echeanceSub: '31 Déc. 2026',
            echeanceStatus: 'success',
            montant: '25.000',
            montantUnite: 'M FCFA',
            montantVal: 25,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'BNI & Caisse des Dépôts',
            hasGarantieBancaire: true,
            progression: 100,
            statut: 'actif',
            statutLabel: 'Attestation Active',
            avatarInitials: 'SP',
            avatarClass: 'avatar-emerald',
            periodTag: 'today',
            perimetre: 'Ministère de la Santé Publique'
        },
        {
            ref: 'ATT-2026-049',
            beneficiaire: 'Santé Publique',
            beneficiaireFull: 'Régie Principale Recettes CHU Cocody',
            subtext: 'Cautionnement légal solidaire & précompte indiciaire',
            dateEmission: '11 Mars 2026',
            echeance: 'Dans 10 mois',
            echeanceSub: '15 Déc. 2026',
            echeanceStatus: 'success',
            montant: '32.000',
            montantUnite: 'M FCFA',
            montantVal: 32,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'Société Générale Côte d\'Ivoire',
            hasGarantieBancaire: true,
            progression: 95,
            statut: 'actif',
            statutLabel: 'Attestation Active',
            avatarInitials: 'SP',
            avatarClass: 'avatar-emerald',
            periodTag: 'week',
            perimetre: 'Ministère de la Santé Publique'
        },
        {
            ref: 'ATT-2026-055',
            beneficiaire: 'Santé Publique',
            beneficiaireFull: 'Pharmacie de la Santé Publique (Nouvelle PSP)',
            subtext: 'Cautionnement de gestion caisse médicaments d\'urgence',
            dateEmission: '04 Mars 2026',
            echeance: 'Dans 9 mois',
            echeanceSub: '30 Nov. 2026',
            echeanceStatus: 'normal',
            montant: '45.000',
            montantUnite: 'M FCFA',
            montantVal: 45,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'Banque Atlantique CI',
            hasGarantieBancaire: true,
            progression: 90,
            statut: 'actif',
            statutLabel: 'Attestation Active',
            avatarInitials: 'SP',
            avatarClass: 'avatar-emerald',
            periodTag: 'month',
            perimetre: 'Ministère de la Santé Publique'
        },
        {
            ref: 'ATT-2026-031',
            beneficiaire: 'Santé Publique',
            beneficiaireFull: 'Institut National d\'Hygiène Publique (INHP)',
            subtext: 'Enregistrement nouveau régisseur suppléant',
            dateEmission: '01 Mars 2026',
            echeance: 'Instruction en cours',
            echeanceSub: 'Examen quitus trésor',
            echeanceStatus: 'warning',
            montant: '12.500',
            montantUnite: 'M FCFA',
            montantVal: 12.5,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'Précompte direct',
            hasGarantieBancaire: false,
            progression: 60,
            statut: 'en-attente',
            statutLabel: 'En Instruction',
            avatarInitials: 'SP',
            avatarClass: 'avatar-amber',
            periodTag: 'month',
            perimetre: 'Ministère de la Santé Publique'
        },
        {
            ref: 'ATT-2026-019',
            beneficiaire: 'Santé Publique',
            beneficiaireFull: 'Centre Hospitalier Régional (CHR) de Daloa',
            subtext: 'Attestation échue suite à fin de mandat régisseur',
            dateEmission: '18 Janv. 2026',
            echeance: 'Échue depuis 20j',
            echeanceSub: 'Renouvellement impératif',
            echeanceStatus: 'danger',
            montant: '22.000',
            montantUnite: 'M FCFA',
            montantVal: 22,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'BNI Agence Daloa',
            hasGarantieBancaire: true,
            progression: 25,
            statut: 'echu',
            statutLabel: 'Renouvellement Requis',
            avatarInitials: 'SP',
            avatarClass: 'avatar-red',
            periodTag: 'q1',
            perimetre: 'Ministère de la Santé Publique'
        },

        // Éducation Nationale
        {
            ref: 'ATT-2026-038',
            beneficiaire: 'Éducation Nationale',
            beneficiaireFull: 'Comptable Secondaire DRENA Abidjan 2',
            subtext: 'Cautionnement légal personnel et solidaire gestion examens',
            dateEmission: '12 Mars 2026',
            echeance: 'Dans 8 mois',
            echeanceSub: '15 Nov. 2026',
            echeanceStatus: 'normal',
            montant: '28.500',
            montantUnite: 'M FCFA',
            montantVal: 28.5,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'Retenue sur traitement & CDC-CI',
            hasGarantieBancaire: true,
            progression: 92,
            statut: 'actif',
            statutLabel: 'Attestation Active',
            avatarInitials: 'EN',
            avatarClass: 'avatar-blue',
            periodTag: 'today',
            perimetre: 'Ministère de l\'Éducation Nationale'
        },
        {
            ref: 'ATT-2026-061',
            beneficiaire: 'Éducation Nationale',
            beneficiaireFull: 'Lycée Classique d\'Abidjan — Intendant Comptable',
            subtext: 'Garantie bancaire mixte régie cantines & frais scolaires',
            dateEmission: '09 Mars 2026',
            echeance: 'Dans 9 mois',
            echeanceSub: '31 Déc. 2026',
            echeanceStatus: 'success',
            montant: '21.000',
            montantUnite: 'M FCFA',
            montantVal: 21,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'Ecobank Côte d\'Ivoire',
            hasGarantieBancaire: true,
            progression: 98,
            statut: 'actif',
            statutLabel: 'Attestation Active',
            avatarInitials: 'EN',
            avatarClass: 'avatar-blue',
            periodTag: 'week',
            perimetre: 'Ministère de l\'Éducation Nationale'
        },
        {
            ref: 'ATT-2026-034',
            beneficiaire: 'Éducation Nationale',
            beneficiaireFull: 'Direction Régionale Éducation Bouaké 1',
            subtext: 'Dossier de régularisation précompte annuel',
            dateEmission: '25 Fév. 2026',
            echeance: 'En attente quitus',
            echeanceSub: 'Vérification Trésorerie Bouaké',
            echeanceStatus: 'warning',
            montant: '14.000',
            montantUnite: 'M FCFA',
            montantVal: 14,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'Précompte direct',
            hasGarantieBancaire: false,
            progression: 55,
            statut: 'en-attente',
            statutLabel: 'En Instruction',
            avatarInitials: 'EN',
            avatarClass: 'avatar-amber',
            periodTag: 'month',
            perimetre: 'Ministère de l\'Éducation Nationale'
        },

        // Économie & Finances
        {
            ref: 'ATT-2026-029',
            beneficiaire: 'Économie & Finances',
            beneficiaireFull: 'Paierie Générale du Trésor — Caisse Principale',
            subtext: 'Mise à niveau cautionnement grand livre centralisateur',
            dateEmission: '13 Mars 2026',
            echeance: 'Dans 12 mois',
            echeanceSub: '31 Mars 2027',
            echeanceStatus: 'success',
            montant: '75.000',
            montantUnite: 'M FCFA',
            montantVal: 75,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'Garantie BCEAO & BNI',
            hasGarantieBancaire: true,
            progression: 100,
            statut: 'actif',
            statutLabel: 'Attestation Active',
            avatarInitials: 'EF',
            avatarClass: 'avatar-emerald',
            periodTag: 'today',
            perimetre: 'Ministère de l\'Économie & Finances'
        },
        {
            ref: 'ATT-2026-022',
            beneficiaire: 'Économie & Finances',
            beneficiaireFull: 'Direction Générale des Impôts (DGI) — Recette Plateau',
            subtext: 'Cautionnement solidaire recettes fiscales directes',
            dateEmission: '03 Mars 2026',
            echeance: 'Conforme',
            echeanceSub: '31 Déc. 2026',
            echeanceStatus: 'success',
            montant: '50.000',
            montantUnite: 'M FCFA',
            montantVal: 50,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'SGCI Trésor',
            hasGarantieBancaire: true,
            progression: 94,
            statut: 'actif',
            statutLabel: 'Attestation Active',
            avatarInitials: 'EF',
            avatarClass: 'avatar-emerald',
            periodTag: 'month',
            perimetre: 'Ministère de l\'Économie & Finances'
        },

        // Trésoreries Régionales & Agences
        {
            ref: 'ATT-2026-021',
            beneficiaire: 'Trésoreries Régionales',
            beneficiaireFull: 'Trésorerie Régionale Yamoussoukro — Caissier',
            subtext: 'Attestation d\'habilitation et consignation d\'espèces',
            dateEmission: '10 Mars 2026',
            echeance: 'Dans 6 mois',
            echeanceSub: '30 Sept. 2026',
            echeanceStatus: 'normal',
            montant: '30.000',
            montantUnite: 'M FCFA',
            montantVal: 30,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'BNI Yamoussoukro',
            hasGarantieBancaire: true,
            progression: 88,
            statut: 'actif',
            statutLabel: 'Attestation Active',
            avatarInitials: 'TR',
            avatarClass: 'avatar-blue',
            periodTag: 'today',
            perimetre: 'Trésoreries Régionales & Agences'
        },
        {
            ref: 'ATT-2026-017',
            beneficiaire: 'Trésoreries Régionales',
            beneficiaireFull: 'Trésorerie Principale de San-Pedro — Guichet Portuaire',
            subtext: 'Cautionnement comptable recettes du domaine maritime',
            dateEmission: '20 Fév. 2026',
            echeance: 'Conforme',
            echeanceSub: '31 Déc. 2026',
            echeanceStatus: 'success',
            montant: '38.000',
            montantUnite: 'M FCFA',
            montantVal: 38,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'Banque Atlantique San-Pedro',
            hasGarantieBancaire: true,
            progression: 100,
            statut: 'actif',
            statutLabel: 'Attestation Active',
            avatarInitials: 'TR',
            avatarClass: 'avatar-emerald',
            periodTag: 'month',
            perimetre: 'Trésoreries Régionales & Agences'
        },

        // Régies d'Avances Autonomes
        {
            ref: 'ATT-2026-015',
            beneficiaire: 'Régies Autonomes',
            beneficiaireFull: 'Régie Spéciale Port Autonome d\'Abidjan (PAA)',
            subtext: 'Cautionnement mixte espèces et garantie bancaire première demande',
            dateEmission: '12 Mars 2026',
            echeance: 'Dans 11 mois',
            echeanceSub: '31 Déc. 2026',
            echeanceStatus: 'success',
            montant: '60.000',
            montantUnite: 'M FCFA',
            montantVal: 60,
            typeCaution: 'Comptable / Régisseur',
            banqueGarante: 'SGCI & Acte Notarié',
            hasGarantieBancaire: true,
            progression: 100,
            statut: 'actif',
            statutLabel: 'Attestation Active',
            avatarInitials: 'RA',
            avatarClass: 'avatar-emerald',
            periodTag: 'today',
            perimetre: 'Régies d\'Avances Autonomes'
        }
    ];

    itemsMarches: CautionnementItem[] = [
        {
            ref: 'MAR-2026-104',
            beneficiaire: 'Infrastructures & BTP',
            beneficiaireFull: 'Colas Afrique — Autoroute Bouaké-Tiébissou',
            subtext: 'Caution de bonne fin d\'exécution (5% du marché)',
            dateEmission: '14 Mars 2026',
            echeance: 'Dans 18 mois',
            echeanceSub: 'Réception provisoire oct. 2027',
            echeanceStatus: 'success',
            montant: '450.000',
            montantUnite: 'M FCFA',
            montantVal: 450,
            typeCaution: 'Marché Public',
            banqueGarante: 'Ecobank Côte d\'Ivoire',
            hasGarantieBancaire: true,
            progression: 100,
            statut: 'actif',
            statutLabel: 'Garantie Active',
            avatarInitials: 'IN',
            avatarClass: 'avatar-emerald',
            periodTag: 'today',
            perimetre: 'Infrastructures & Travaux Publics'
        },
        {
            ref: 'MAR-2026-098',
            beneficiaire: 'Énergie & Mines',
            beneficiaireFull: 'Consortium Énergie Solaire Nord — Centrale Boundiali',
            subtext: 'Caution d\'avance de démarrage (15% décaissé)',
            dateEmission: '10 Mars 2026',
            echeance: 'Dans 6 mois',
            echeanceSub: 'Apurement sur décomptes',
            echeanceStatus: 'normal',
            montant: '820.000',
            montantUnite: 'M FCFA',
            montantVal: 820,
            typeCaution: 'Marché Public',
            banqueGarante: 'Banque Atlantique CI',
            hasGarantieBancaire: true,
            progression: 80,
            statut: 'actif',
            statutLabel: 'Garantie Active',
            avatarInitials: 'EM',
            avatarClass: 'avatar-blue',
            periodTag: 'week',
            perimetre: 'Énergie & Ressources Hydrauliques'
        },
        {
            ref: 'MAR-2026-077',
            beneficiaire: 'Santé & Équipements',
            beneficiaireFull: 'Médical Pro CI — Fourniture Scanners CHU Angré',
            subtext: 'Retenue de garantie 5% éligible à mainlevée',
            dateEmission: '04 Mars 2026',
            echeance: 'En attente quitus',
            echeanceSub: 'PV réception définitive conforme',
            echeanceStatus: 'warning',
            montant: '115.000',
            montantUnite: 'M FCFA',
            montantVal: 115,
            typeCaution: 'Marché Public',
            banqueGarante: 'NSIA Banque',
            hasGarantieBancaire: true,
            progression: 60,
            statut: 'en-attente',
            statutLabel: 'Instruction Mainlevée',
            avatarInitials: 'SE',
            avatarClass: 'avatar-amber',
            periodTag: 'month',
            perimetre: 'Santé & Équipements Médicaux'
        },
        {
            ref: 'MAR-2026-052',
            beneficiaire: 'Technologies & Télécoms',
            beneficiaireFull: 'Alpha Connect SA — Raccordement Fibre Administrative',
            subtext: 'Garantie échue sans certificat de fin de garantie',
            dateEmission: '15 Janv. 2026',
            echeance: 'Échue depuis 15j',
            echeanceSub: 'Appel en garantie possible',
            echeanceStatus: 'danger',
            montant: '65.000',
            montantUnite: 'M FCFA',
            montantVal: 65,
            typeCaution: 'Marché Public',
            banqueGarante: 'Coris Bank Int.',
            hasGarantieBancaire: true,
            progression: 20,
            statut: 'echu',
            statutLabel: 'Litige / Délai Dépassé',
            avatarInitials: 'TT',
            avatarClass: 'avatar-red',
            periodTag: 'q1',
            perimetre: 'Technologies, Numérique & Télécoms'
        }
    ];

    itemsConsignations: CautionnementItem[] = [
        {
            ref: 'CSG-2026-031',
            beneficiaire: 'Cour des Comptes',
            beneficiaireFull: 'Séquestre conservatoire contentieux N°2025/C08',
            subtext: 'Dépôt obligatoire ordonné par le Premier Président',
            dateEmission: '13 Mars 2026',
            echeance: 'Sous séquestre',
            echeanceSub: 'En attente arrêt définitif',
            echeanceStatus: 'normal',
            montant: '180.000',
            montantUnite: 'M FCFA',
            montantVal: 180,
            typeCaution: 'Consignation / Séquestre',
            banqueGarante: 'Caisse des Dépôts & Consignations (CDC-CI)',
            hasGarantieBancaire: true,
            progression: 100,
            statut: 'actif',
            statutLabel: 'Fonds Consignés',
            avatarInitials: 'CC',
            avatarClass: 'avatar-emerald',
            periodTag: 'today',
            perimetre: 'Cour des Comptes & Chambres'
        },
        {
            ref: 'CSG-2026-024',
            beneficiaire: 'Tribunal de Commerce',
            beneficiaireFull: 'Consignation pour tierce opposition Société Ivoire BTP',
            subtext: 'Garantie financière préalable à sursis d\'exécution',
            dateEmission: '08 Mars 2026',
            echeance: 'En délibéré',
            echeanceSub: 'Ordonnance de restitution attendue',
            echeanceStatus: 'warning',
            montant: '95.000',
            montantUnite: 'M FCFA',
            montantVal: 95,
            typeCaution: 'Consignation / Séquestre',
            banqueGarante: 'Trésorerie Principale Abidjan',
            hasGarantieBancaire: true,
            progression: 60,
            statut: 'en-attente',
            statutLabel: 'Instruction Restitution',
            avatarInitials: 'TC',
            avatarClass: 'avatar-amber',
            periodTag: 'week',
            perimetre: 'Tribunal de Commerce d\'Abidjan'
        },
        {
            ref: 'CSG-2026-018',
            beneficiaire: 'Douanes Ivoiriennes',
            beneficiaireFull: 'Garantie de transit pétrolier sous douane — Société GazCI',
            subtext: 'Apurement douanier non régularisé dans les délais',
            dateEmission: '22 Fév. 2026',
            echeance: 'Forclusion 60j',
            echeanceSub: 'Recouvrement forcé engagé',
            echeanceStatus: 'danger',
            montant: '320.000',
            montantUnite: 'M FCFA',
            montantVal: 320,
            typeCaution: 'Consignation / Séquestre',
            banqueGarante: 'SIB (Société Ivoirienne de Banque)',
            hasGarantieBancaire: true,
            progression: 15,
            statut: 'echu',
            statutLabel: 'Mise en Recouvrement',
            avatarInitials: 'DI',
            avatarClass: 'avatar-red',
            periodTag: 'month',
            perimetre: 'Direction Générale des Douanes'
        }
    ];

    get currentItems(): CautionnementItem[] {
        if (this.activeSubDomain === 'comptables') return this.itemsComptables;
        if (this.activeSubDomain === 'marches') return this.itemsMarches;
        return this.itemsConsignations;
    }

    filteredItems: CautionnementItem[] = [];

    // --- LOGIQUE DE FILTRAGE STRICT ET RÉACTIF ---
    updateFilteredItems() {
        let items = this.currentItems;

        // 1. Filtre par Périmètre
        if (this.activePerimetre && !this.activePerimetre.startsWith('Tous') && !this.activePerimetre.startsWith('Toutes')) {
            items = items.filter(i => i.perimetre === this.activePerimetre);
        }

        // 2. Filtre par Période (Hierarchical matching)
        const p = this.activePeriod.toLowerCase();
        if (p.includes('aujourd')) {
            items = items.filter(i => i.periodTag === 'today');
        } else if (p.includes('semaine')) {
            items = items.filter(i => i.periodTag === 'today' || i.periodTag === 'week');
        } else if (p.includes('mois') || p.includes('mars')) {
            items = items.filter(i => i.periodTag === 'today' || i.periodTag === 'week' || i.periodTag === 'month');
        } else if (p.includes('trimestre') || p.includes('t1')) {
            items = items.filter(i => i.periodTag !== 'y2025');
        } else if (p.includes('2025')) {
            items = items.filter(i => i.periodTag === 'y2025');
        }

        // 3. Filtre par Chips actifs
        if (this.filterChips.includes('Cautions > 20M FCFA')) {
            items = items.filter(i => i.montantVal >= 20);
        }
        if (this.filterChips.includes('Garantie bancaire active')) {
            items = items.filter(i => i.hasGarantieBancaire && i.statut !== 'echu');
        }
        if (this.filterChips.includes('Délai restant < 30j')) {
            items = items.filter(i => i.echeanceStatus === 'warning' || i.echeanceStatus === 'danger');
        }
        if (this.filterChips.includes('Attestation validée')) {
            items = items.filter(i => i.statut === 'actif');
        }

        // 4. Filtre par Statut (Table Quick Filter)
        if (this.tableFilter !== 'all') {
            items = items.filter(i => i.statut === this.tableFilter);
        }

        // 5. Recherche textuelle
        if (this.searchQuery.trim()) {
            const q = this.searchQuery.toLowerCase();
            items = items.filter(i => 
                i.ref.toLowerCase().includes(q) ||
                i.beneficiaire.toLowerCase().includes(q) ||
                i.beneficiaireFull.toLowerCase().includes(q) ||
                i.subtext.toLowerCase().includes(q) ||
                (i.banqueGarante && i.banqueGarante.toLowerCase().includes(q))
            );
        }

        this.filteredItems = items;
        this.cdr.detectChanges();
    }

    getCount(filter: 'all' | 'actif' | 'en-attente' | 'echu'): number {
        let baseItems = this.currentItems;
        if (this.activePerimetre && !this.activePerimetre.startsWith('Tous') && !this.activePerimetre.startsWith('Toutes')) {
            baseItems = baseItems.filter(i => i.perimetre === this.activePerimetre);
        }
        if (filter === 'all') return baseItems.length;
        return baseItems.filter(i => i.statut === filter).length;
    }

    setTableFilter(filter: 'all' | 'actif' | 'en-attente' | 'echu') {
        this.tableFilter = filter;
        this.updateFilteredItems();
    }

    // --- MOTEUR DE CALCUL RÉACTIF POUR KPIS (FORMAT EXACT TRÉSORERIE) ---
    get currentKpis() {
        const p = this.activePerimetre;
        const isSante = p.includes('Santé');
        const isEducation = p.includes('Éducation');
        const isFinances = p.includes('Finances');
        const isRegies = p.includes('Régies');
        const isBTP = p.includes('Infrastructures') || p.includes('BTP');
        const isEnergie = p.includes('Énergie');
        const isCourComptes = p.includes('Cour des Comptes');
        const isDouanes = p.includes('Douanes');

        const periodIsToday = this.activePeriod.includes('Aujourd');
        const periodIsWeek = this.activePeriod.includes('semaine');

        // SOUS-DOMAINE COMPTABLES & RÉGISSEURS
        if (this.activeSubDomain === 'comptables') {
            if (isSante) {
                return [
                    { titre: 'Montant Cautions Santé', valeur: '3.800', unite: 'Milliards FCFA', progress: 45, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 5.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Moyen Traitement', valeur: '1.8', unite: 'Jours ouvrés', progress: 92, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-1.4j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 5 jours', icon: 'fa-bolt', colorTheme: 'green' },
                    { titre: 'Taux Régularisation', valeur: '98.5%', unite: 'des volumes', progress: 98.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme (+8.5%)', badgeIcon: 'fa-check', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Relances Actives', valeur: '2', unite: 'Dossiers ordonnateurs', progress: 15, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Sous contrôle', badgeIcon: 'fa-check', bench: 'Moyenne: 0.5 / régie', icon: 'fa-bell', colorTheme: 'red' }
                ];
            } else if (isEducation) {
                return [
                    { titre: 'Montant Cautions Éducation', valeur: '5.200', unite: 'Milliards FCFA', progress: 65, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 8.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Moyen Traitement', valeur: '3.2', unite: 'Jours ouvrés', progress: 75, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-0.6j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 5 jours', icon: 'fa-bolt', colorTheme: 'green' },
                    { titre: 'Taux Régularisation', valeur: '91.2%', unite: 'des volumes', progress: 91.2, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Vigilance (+1.2%)', badgeIcon: 'fa-circle-exclamation', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Relances Actives', valeur: '6', unite: 'Dossiers ordonnateurs', progress: 40, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '2 critiques > 30j', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne: 1.2 / régie', icon: 'fa-bell', colorTheme: 'red' }
                ];
            } else if (isFinances) {
                return [
                    { titre: 'Montant Cautions Finances', valeur: '6.400', unite: 'Milliards FCFA', progress: 50, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 12.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Moyen Traitement', valeur: '1.2', unite: 'Jour ouvré', progress: 98, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Traitement éclair', badgeIcon: 'fa-bolt', bench: 'Cible : < 3 jours', icon: 'fa-bolt', colorTheme: 'green' },
                    { titre: 'Taux Régularisation', valeur: '99.4%', unite: 'des volumes', progress: 99.4, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme (+9.4%)', badgeIcon: 'fa-check', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Relances Actives', valeur: '1', unite: 'Dossier ordonnateur', progress: 8, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Régularisé ce jour', badgeIcon: 'fa-check', bench: 'Moyenne: 0.2 / régie', icon: 'fa-bell', colorTheme: 'red' }
                ];
            } else if (periodIsToday) {
                return [
                    { titre: 'Montant Cautions du Jour', valeur: '185.0', unite: 'Millions FCFA', progress: 15, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 500M / jour', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Moyen Traitement', valeur: '0.4', unite: 'Jour ouvré', progress: 95, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-0.3j vs S-1', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 1 jour', icon: 'fa-bolt', colorTheme: 'green' },
                    { titre: 'Taux Régularisation', valeur: '98.0%', unite: 'des volumes', progress: 98, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme (+8.0%)', badgeIcon: 'fa-check', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Relances Actives', valeur: '2', unite: 'Dossiers ordonnateurs', progress: 10, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Sous contrôle', badgeIcon: 'fa-check', bench: 'Moyenne: 1.5 / régie', icon: 'fa-bell', colorTheme: 'red' }
                ];
            }

            // Default Month (Mars 2026) — Format exact de Trésorerie
            return [
                { titre: 'Montant Cautions en cours', valeur: '1.200', unite: 'Milliards FCFA', progress: 48, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 2.500 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                { titre: 'Délai Moyen Traitement', valeur: '4.2', unite: 'Jours ouvrés', progress: 84, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-0.8j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 5 jours', icon: 'fa-bolt', colorTheme: 'green' },
                { titre: 'Taux Régularisation', valeur: '88.5%', unite: 'des volumes', progress: 88.5, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Vigilance (-1.5%)', badgeIcon: 'fa-circle-exclamation', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Relances Actives', valeur: '24', unite: 'Dossiers ordonnateurs', progress: 60, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '7 critiques > 45j', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne: 1.5 / caution', icon: 'fa-bell', colorTheme: 'red' }
            ];
        } else if (this.activeSubDomain === 'marches') {
            let label = isBTP ? 'BTP' : (isEnergie ? 'Énergie' : 'Marchés');
            let volume = isBTP ? '18.500' : (isEnergie ? '14.200' : '42.600');

            return [
                { titre: `Montant Cautions ${label}`, valeur: volume, unite: 'Milliards FCFA', progress: 55, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 60.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                { titre: 'Délai Moyen Traitement', valeur: '3.6', unite: 'Jours ouvrés', progress: 80, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-0.5j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 5 jours', icon: 'fa-bolt', colorTheme: 'green' },
                { titre: 'Taux Régularisation', valeur: '90.4%', unite: 'des volumes', progress: 90.4, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme (+0.4%)', badgeIcon: 'fa-check', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Relances Actives', valeur: '18', unite: 'Dossiers marchés', progress: 45, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '4 critiques > 45j', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne: 1.2 / marché', icon: 'fa-bell', colorTheme: 'red' }
            ];
        } else {
            let label = isCourComptes ? 'Cour Comptes' : (isDouanes ? 'Douanes' : 'Séquestres');
            let volume = isCourComptes ? '4.800' : (isDouanes ? '3.500' : '9.800');

            return [
                { titre: `Montant Séquestres ${label}`, valeur: volume, unite: 'Milliards FCFA', progress: 62, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 15.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                { titre: 'Délai Moyen Traitement', valeur: '3.8', unite: 'Jours ouvrés', progress: 85, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-0.4j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 5 jours', icon: 'fa-bolt', colorTheme: 'green' },
                { titre: 'Taux Régularisation', valeur: '76.4%', unite: 'des volumes', progress: 76.4, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Vigilance (-13.6%)', badgeIcon: 'fa-circle-exclamation', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Relances Actives', valeur: '31', unite: 'Dossiers contentieux', progress: 70, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '9 critiques > 60j', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne: 2.1 / séquestre', icon: 'fa-bell', colorTheme: 'red' }
            ];
        }
    }

    // --- MOTEUR DE CALCUL RÉACTIF POUR LE VISUALISEUR DE FLUX (SVG PIPELINE) ---
    get currentFlowData() {
        const p = this.activePerimetre;
        const isSante = p.includes('Santé');
        const isEducation = p.includes('Éducation');
        const isFinances = p.includes('Finances');

        if (this.activeSubDomain === 'comptables') {
            const label = isSante ? 'Santé Publique' : (isEducation ? 'Éducation Nationale' : (isFinances ? 'Économie & Finances' : 'Comptables Publics'));
            const total = isSante ? '3.8 Mds' : (isEducation ? '5.2 Mds' : (isFinances ? '6.4 Mds' : '18.4 Mds'));
            const valides = isSante ? '3.7 Mds' : (isEducation ? '5.0 Mds' : (isFinances ? '6.3 Mds' : '18.0 Mds'));
            const instruction = isSante ? '80 M' : (isEducation ? '150 M' : (isFinances ? '80 M' : '280 M'));
            const echu = isSante ? '20 M' : (isEducation ? '50 M' : (isFinances ? '20 M' : '120 M'));
            const count = isSante ? '48 Régisseurs & Caissiers' : (isEducation ? '92 Comptables DRENA' : (isFinances ? '34 Payeurs du Trésor' : '482 Régisseurs & Caissiers'));

            return {
                title: `Cycle de Consignation — ${label}`,
                sourceTitle: `1. CAUTIONS ${label.toUpperCase()}`,
                totalAmount: total,
                mandatsCount: count,
                validesAmount: valides,
                tauxValides: '97.8%',
                instructionAmount: instruction,
                instructionPct: '1.5%',
                echuAmount: echu,
                echuPct: '0.7%',
                tauxCouverture: '97.8%',
                cautionEspeces: isSante ? '2.5 Mds' : '12.6 Mds',
                cautionGarantie: isSante ? '1.3 Mds' : '5.8 Mds'
            };
        } else if (this.activeSubDomain === 'marches') {
            return {
                title: `Garanties de Marchés Publics — ${p.startsWith('Toutes') ? 'Toutes Autorités' : p}`,
                sourceTitle: '1. CAUTIONS ÉMISES ACCT',
                totalAmount: '42.6 Mds',
                mandatsCount: '124 Marchés d\'État',
                validesAmount: '38.5 Mds',
                tauxValides: '90.4%',
                instructionAmount: '2.8 Mds',
                instructionPct: '6.6%',
                echuAmount: '1.3 Mds',
                echuPct: '3.0%',
                tauxCouverture: '90.4%',
                cautionEspeces: '24.2 Mds',
                cautionGarantie: '18.4 Mds'
            };
        } else {
            return {
                title: `Flux des Séquestres & Dépôts — ${p.startsWith('Toutes') ? 'Toutes Juridictions' : p}`,
                sourceTitle: '1. DÉPÔTS ENREGISTRÉS',
                totalAmount: '9.8 Mds',
                mandatsCount: '215 Dossiers Juridictionnels',
                validesAmount: '7.5 Mds',
                tauxValides: '76.4%',
                instructionAmount: '1.6 Mds',
                instructionPct: '16.3%',
                echuAmount: '700 M',
                echuPct: '7.3%',
                tauxCouverture: '76.4%',
                cautionEspeces: '6.8 Mds',
                cautionGarantie: '3.0 Mds'
            };
        }
    }

    // --- MOTEUR DE CALCUL RÉACTIF POUR LE DONUT & ALERTES ---
    get currentDonutData() {
        const p = this.activePerimetre;
        const isSante = p.includes('Santé');
        const isEducation = p.includes('Éducation');
        const isFinances = p.includes('Finances');

        if (isSante) {
            return {
                totalVal: '3.8 Mds',
                totalSub: 'Santé Publique',
                slice1Dash: '60, 100',
                slice1Offset: '0',
                slice1Pct: 60,
                slice1Label: 'Cautions CHU',
                slice1FullLabel: 'Cautions des CHU & Grands Hôpitaux',
                slice1Amount: '2.28 Mds',

                slice2Dash: '28, 100',
                slice2Offset: '-60',
                slice2Pct: 28,
                slice2Label: 'Pharmacie PSP',
                slice2FullLabel: 'Pharmacie de la Santé Publique',
                slice2Amount: '1.06 Mds',

                slice3Dash: '12, 100',
                slice3Offset: '-88',
                slice3Pct: 12,
                slice3Label: 'Centres Ruraux',
                slice3FullLabel: 'Centres de Santé & Régies Rurales',
                slice3Amount: '0.46 Mds',

                alertTitle: 'Alerte Santé : 2 Attestations en instance de quitus',
                alertDesc: 'Les régies du CHU de Treichville et du CHR de Daloa doivent régulariser leur cautionnement d\'ici la fin du mois.'
            };
        } else if (isEducation) {
            return {
                totalVal: '5.2 Mds',
                totalSub: 'Éducation Nat.',
                slice1Dash: '50, 100',
                slice1Offset: '0',
                slice1Pct: 50,
                slice1Label: 'DRENA Abidjan',
                slice1FullLabel: 'Directions Régionales Abidjan 1 à 4',
                slice1Amount: '2.60 Mds',

                slice2Dash: '35, 100',
                slice2Offset: '-50',
                slice2Pct: 35,
                slice2Label: 'DRENA Intérieur',
                slice2FullLabel: 'Directions Régionales de l\'Intérieur',
                slice2Amount: '1.82 Mds',

                slice3Dash: '15, 100',
                slice3Offset: '-85',
                slice3Pct: 15,
                slice3Label: 'Lycées & Collèges',
                slice3FullLabel: 'Intendances des Grands Établissements',
                slice3Amount: '0.78 Mds',

                alertTitle: 'Alerte Éducation : Renouvellement annuel des régies d\'examens',
                alertDesc: '3 dossiers d\'intendants de Bouaké sont en attente d\'attestation définitive avant la session d\'examens.'
            };
        } else if (isFinances) {
            return {
                totalVal: '6.4 Mds',
                totalSub: 'Éco. & Finances',
                slice1Dash: '70, 100',
                slice1Offset: '0',
                slice1Pct: 70,
                slice1Label: 'Paierie Trésor',
                slice1FullLabel: 'Paierie Générale du Trésor',
                slice1Amount: '4.48 Mds',

                slice2Dash: '20, 100',
                slice2Offset: '-70',
                slice2Pct: 20,
                slice2Label: 'Recettes DGI',
                slice2FullLabel: 'Recettes des Impôts & Domaines',
                slice2Amount: '1.28 Mds',

                slice3Dash: '10, 100',
                slice3Offset: '-90',
                slice3Pct: 10,
                slice3Label: 'Affaires Étrangères',
                slice3FullLabel: 'Paierie des Postes à l\'Étranger',
                slice3Amount: '0.64 Mds',

                alertTitle: 'Conformité Finances : Quitus à 100% sur les caisses centrales',
                alertDesc: 'Toutes les garanties de la Paierie Générale sont conformes et enregistrées auprès de la BCEAO.'
            };
        } else {
            return {
                totalVal: '70.8 Mds',
                totalSub: 'Total Garanties',
                slice1Dash: '45, 100',
                slice1Offset: '0',
                slice1Pct: 45,
                slice1Label: 'Cautions Comptables',
                slice1FullLabel: 'Cautionnements Personnels & Solidaires',
                slice1Amount: '31.8 Mds',

                slice2Dash: '35, 100',
                slice2Offset: '-45',
                slice2Pct: 35,
                slice2Label: 'Marchés Publics',
                slice2FullLabel: 'Cautions Bancaires de Bonne Exécution',
                slice2Amount: '24.8 Mds',

                slice3Dash: '20, 100',
                slice3Offset: '-80',
                slice3Pct: 20,
                slice3Label: 'Séquestres & Justice',
                slice3FullLabel: 'Dépôts Judiciaires & Consignations CDC-CI',
                slice3Amount: '14.2 Mds',

                alertTitle: '4 Attestations comptables arrivant à échéance',
                alertDesc: 'Les régisseurs de Santé et d\'Éducation doivent régulariser leur précompte d\'ici 15 jours sous peine de suspension de signature.'
            };
        }
    }

    // --- MOTEUR DE CALCUL RÉACTIF POUR LA TÉLÉMÉTRIE LIVE ---
    get currentTelemetry() {
        const p = this.activePerimetre;
        const isSante = p.includes('Santé');
        const isEducation = p.includes('Éducation');
        const isFinances = p.includes('Finances');

        if (this.activeSubDomain === 'comptables') {
            if (isSante) {
                return {
                    totalDepot: '3,800 M FCFA',
                    restitue: '950 M FCFA',
                    soldeActif: '2,850 M FCFA'
                };
            } else if (isEducation) {
                return {
                    totalDepot: '5,200 M FCFA',
                    restitue: '1,300 M FCFA',
                    soldeActif: '3,900 M FCFA'
                };
            } else if (isFinances) {
                return {
                    totalDepot: '6,400 M FCFA',
                    restitue: '1,100 M FCFA',
                    soldeActif: '5,300 M FCFA'
                };
            }
            return {
                totalDepot: '18,400 M FCFA',
                restitue: '4,150 M FCFA',
                soldeActif: '14,250 M FCFA'
            };
        } else if (this.activeSubDomain === 'marches') {
            return {
                totalDepot: '42,600 M FCFA',
                restitue: '18,200 M FCFA',
                soldeActif: '24,400 M FCFA'
            };
        } else {
            return {
                totalDepot: '9,800 M FCFA',
                restitue: '3,250 M FCFA',
                soldeActif: '6,550 M FCFA'
            };
        }
    }

    // --- Switch Sub-Domains ---
    switchSubDomain(domain: 'comptables' | 'marches' | 'consignations') {
        this.activeSubDomain = domain;
        this.tableFilter = 'all';
        if (domain === 'comptables') this.activePerimetre = 'Tous les Ministères & Tutelles';
        else if (domain === 'marches') this.activePerimetre = 'Toutes les Autorités Contractantes';
        else this.activePerimetre = 'Toutes les Juridictions & Caisses';

        const labels = {
            comptables: 'Comptables Publics & Régisseurs',
            marches: 'Marchés Publics & Garanties',
            consignations: 'Consignations Judiciaires & Dépôts Spéciaux'
        };
        this.triggerToast(`Module actif : ${labels[domain]}`);
        this.updateFilteredItems();

        if (this.isAnalysisGenerated) {
            this.generateAnalysis();
        }
    }

    // --- View Mode ---
    setViewMode(mode: 'synthese' | 'avancee') {
        this.viewMode = mode;
        if (mode === 'synthese') {
            this.triggerToast('Affichage Synthèse Opérationnelle activé');
        } else {
            this.triggerToast('Affichage Analyses Avancées activé');
        }
    }

    // --- Chart Tabs ---
    setChartTab(tab: 'flux' | 'garant' | 'anciennete') {
        this.chartTab = tab;
        const labels = {
            flux: 'Cycle de Vie & Flux',
            garant: 'Répartition par Garant',
            anciennete: 'Pyramide d\'Ancienneté'
        };
        this.triggerToast(`Graphique actif : ${labels[tab]}`);
    }

    // --- Actions ---
    refreshData() {
        this.triggerToast('Synchronisation du registre des cautionnements effectuée...');
        this.updateFilteredItems();
    }

    exportData(format: 'PDF' | 'EXCEL' = 'EXCEL') {
        this.triggerToast(`Génération de l'export ${format} des attestations de cautionnement en cours...`);
    }

    triggerToast(message: string) {
        this.toastMessage = message;
        this.showToast = true;
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
        this.toastTimer = setTimeout(() => {
            this.showToast = false;
        }, 3000);
    }

    toggleMode(mode: 'classic' | 'dragdrop') {
        this.isDragDropMode = mode === 'dragdrop';
    }

    // --- ADVANCED ANALYSIS DYNAMIC CHARTS & TABLES ---
    barChartType: ChartType = 'bar';
    barChartData: ChartData<'bar'> = { labels: [], datasets: [] };

    get currentBarLabels(): string[] {
        return (this.barChartData?.labels || []).map(l => String(l));
    }

    getTooltipDrilldownHint(label: string): string {
        const l = (label || '').toLowerCase();
        if (l.includes('exercice') || l.includes('2024') || l.includes('2025') || l.includes('2026') || l.includes('2027') || l.includes('année')) {
            return '🔍 Cliquer pour forer : Passer aux Trimestres';
        }
        if (l.includes('trimestre') || l.includes('t1') || l.includes('t2') || l.includes('t3') || l.includes('t4')) {
            return '🔍 Cliquer pour forer : Passer aux Mois';
        }
        if (l.includes('janvier') || l.includes('février') || l.includes('fevrier') || l.includes('mars') || l.includes('avril') || l.includes('mai') || l.includes('juin') || l.includes('juillet') || l.includes('août') || l.includes('aout') || l.includes('septembre') || l.includes('octobre') || l.includes('novembre') || l.includes('décembre')) {
            return '🔍 Cliquer pour forer : Passer aux Semaines';
        }
        if (l.includes('semaine') || l.includes('sem')) {
            return '🔍 Cliquer pour forer : Passer aux Jours';
        }
        if (l.includes('lundi') || l.includes('mardi') || l.includes('mercredi') || l.includes('jeudi') || l.includes('vendredi')) {
            return '🔍 Cliquer pour forer : Passer aux Plages horaires';
        }
        return '🔍 Cliquer pour forer : Détail Temporel';
    }

    barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { family: "'Inter', sans-serif", size: 11, weight: 'bold' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                padding: 12,
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                callbacks: {
                    label: (context) => {
                        return ` ${context.dataset.label}: ${context.parsed.y} M FCFA`;
                    },
                    afterBody: (tooltipItems) => {
                        const label = tooltipItems[0]?.label || '';
                        return [`\n${this.getTooltipDrilldownHint(label)}`];
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { family: "'Inter', sans-serif", size: 10, weight: 'bold' } }
            },
            y: {
                border: { dash: [4, 4] },
                grid: { color: '#f1f5f9' },
                ticks: { font: { family: "'Inter', sans-serif", size: 10 } }
            }
        }
    };

    lineChartType: ChartType = 'line';
    lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
    lineChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { family: "'Inter', sans-serif", size: 11, weight: 'bold' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                padding: 12,
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { family: "'Inter', sans-serif", size: 10 } }
            },
            y: {
                border: { dash: [4, 4] },
                grid: { color: '#f1f5f9' },
                ticks: { font: { family: "'Inter', sans-serif", size: 10 } }
            }
        }
    };

    analysisTableHeaders: string[] = [];
    analysisTableData: any[] = [];
    isAnalysisGenerated = false;

    // Drilldown State Stack
    drilldownStack: {
        title: string;
        axis: string;
        categoriesWithIcons: { name: string; icon: string; subPeriod?: string }[];
        parentLabel: string;
        level: number;
    }[] = [];

    currentDrillLevel = 0;
    currentDrillLabel = '';

    private getDimensionCategories(axis: string, period: string): { name: string; icon: string; subPeriod?: string }[] {
        const periodLower = period.toLowerCase();

        if (periodLower.includes('aujourd\'hui') || periodLower.includes('today')) {
            return [
                { name: '08h00 - 10h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '10h00 - 12h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '12h00 - 14h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '14h00 - 16h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '16h00 - 18h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' }
            ];
        }

        if (periodLower.includes('semaine') || periodLower.includes('week')) {
            return [
                { name: 'Lundi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Mardi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Mercredi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Jeudi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Vendredi', icon: 'fa-calendar-day', subPeriod: 'semaine' }
            ];
        }

        if (periodLower.includes('mois') || periodLower.includes('month') || periodLower.includes('mars')) {
            return [
                { name: 'Semaine 1 (01-07)', icon: 'fa-calendar-week', subPeriod: 'Semaine' },
                { name: 'Semaine 2 (08-14)', icon: 'fa-calendar-week', subPeriod: 'Semaine' },
                { name: 'Semaine 3 (15-21)', icon: 'fa-calendar-week', subPeriod: 'Semaine' },
                { name: 'Semaine 4 (22-31)', icon: 'fa-calendar-week', subPeriod: 'Semaine' }
            ];
        }

        if (periodLower.includes('trimestre') || periodLower.includes('q1')) {
            return [
                { name: 'Janvier', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Février', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Mars', icon: 'fa-calendar-day', subPeriod: 'Mois' }
            ];
        }

        if (periodLower.includes('exercice') || periodLower.includes('2026') || periodLower.includes('2025')) {
            const yr = periodLower.includes('2025') ? '2025' : '2026';
            return [
                { name: `1er Trimestre (T1 ${yr})`, icon: 'fa-calendar', subPeriod: 'Trimestre 1' },
                { name: `2ème Trimestre (T2 ${yr})`, icon: 'fa-calendar', subPeriod: 'Trimestre 2' },
                { name: `3ème Trimestre (T3 ${yr})`, icon: 'fa-calendar', subPeriod: 'Trimestre 3' },
                { name: `4ème Trimestre (T4 ${yr})`, icon: 'fa-calendar', subPeriod: 'Trimestre 4' }
            ];
        }

        return [
            { name: 'Santé Publique', icon: 'fa-hospital' },
            { name: 'Éducation Nationale', icon: 'fa-graduation-cap' },
            { name: 'Économie & Finances', icon: 'fa-landmark' },
            { name: 'Infrastructures & BTP', icon: 'fa-road' },
            { name: 'Défense & Sécurité', icon: 'fa-shield-halved' }
        ];
    }

    private getPeriodTimeLabels(period: string): string[] {
        const p = period.toLowerCase();
        if (p.includes('aujourd\'hui')) return ['08h', '10h', '12h', '14h', '16h', '18h'];
        if (p.includes('semaine')) return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
        if (p.includes('mois')) return ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        if (p.includes('trimestre')) return ['Jan', 'Fév', 'Mar'];
        if (p.includes('2026') || p.includes('2025')) return ['T1', 'T2', 'T3', 'T4'];
        return ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    }

    private generateMockIndicatorValue(ind: string, period: string, catIndex: number, totalCats: number): { raw: number; formatted: string; unit: string; badgeClass: string } {
        const indLower = ind.toLowerCase();
        let baseVal = 25;
        let unit = 'M FCFA';
        let badge = 'badge-success';

        if (indLower.includes('taux')) {
            baseVal = 88 + ((catIndex * 3) % 11);
            unit = '%';
            badge = baseVal >= 95 ? 'badge-success' : (baseVal >= 90 ? 'badge-primary' : 'badge-warning');
        } else if (indLower.includes('délai') || indLower.includes('delai')) {
            baseVal = 2.4 + ((catIndex * 0.6) % 2.5);
            unit = 'Jours';
            badge = baseVal <= 3 ? 'badge-success' : 'badge-warning';
        } else if (indLower.includes('montant') || indLower.includes('volume') || indLower.includes('encours')) {
            baseVal = 15 + ((catIndex * 12) % 65);
            unit = 'Mds FCFA';
            badge = 'badge-primary';
        } else {
            baseVal = 40 + ((catIndex * 7) % 50);
            unit = 'U';
            badge = 'badge-neutral';
        }

        const raw = Number(baseVal.toFixed(1));
        const formatted = `${raw} ${unit}`;

        return { raw, formatted, unit, badgeClass: badge };
    }

    private generateTrendSeries(ind: string, period: string, length: number, current: number): number[] {
        const series: number[] = [];
        for (let i = 0; i < length; i++) {
            const progressRatio = (i + 1) / length;
            let val = Math.max(5, Math.round(current * (0.85 + (progressRatio * 0.3) + (Math.sin(i * 2) * 0.15))));
            series.push(val);
        }
        return series;
    }

    generateAnalysis(event?: any) {
        this.isAnalysisGenerated = true;
        if (event?.period) {
            this.activePeriod = event.period;
        }
        const period = this.activePeriod;
        const indicators = event?.indicators || this.currentSelectedIndicators;
        const axes = event?.axes || this.currentSelectedAxes;

        if (axes.length === 0 || indicators.length === 0) {
            this.barChartData = { labels: [], datasets: [] };
            this.lineChartData = { labels: [], datasets: [] };
            this.analysisTableData = [];
            this.analysisTableHeaders = [];
            return;
        }

        const primaryAxis = axes[0];
        const categoriesWithIcons = this.getDimensionCategories(primaryAxis, period);
        const categories = categoriesWithIcons.map(c => c.name);
        const timeLabels = this.getPeriodTimeLabels(period);

        const colorPalette = [
            { main: '#F77F00', light: 'rgba(247, 127, 0, 0.2)', border: '#F77F00' },
            { main: '#10b981', light: 'rgba(16, 185, 129, 0.2)', border: '#10b981' },
            { main: '#0284c7', light: 'rgba(2, 132, 199, 0.2)', border: '#0284c7' },
            { main: '#8b5cf6', light: 'rgba(139, 92, 246, 0.2)', border: '#8b5cf6' },
            { main: '#f59e0b', light: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b' }
        ];

        // 1. Bar Chart
        const barDatasets = indicators.map((ind: string, idx: number) => {
            const color = colorPalette[idx % colorPalette.length];
            const data = categories.map((_, catIdx) => {
                const mockObj = this.generateMockIndicatorValue(ind, period, catIdx, categories.length);
                return mockObj.raw;
            });

            return {
                data,
                label: ind,
                backgroundColor: color.main,
                borderRadius: 6,
                barPercentage: 0.65,
                categoryPercentage: 0.75
            };
        });

        this.barChartData = {
            labels: categories,
            datasets: barDatasets
        };

        // 2. Line Chart
        const lineDatasets = indicators.map((ind: string, idx: number) => {
            const color = colorPalette[idx % colorPalette.length];
            const total = barDatasets[idx].data.reduce((a: number, b: number) => a + b, 0);
            const avg = total / barDatasets[idx].data.length;
            const trendData = this.generateTrendSeries(ind, period, timeLabels.length, avg);

            return {
                data: trendData,
                label: ind,
                borderColor: color.border,
                backgroundColor: color.light,
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: color.border,
                pointBorderWidth: 2
            };
        });

        this.lineChartData = {
            labels: timeLabels,
            datasets: lineDatasets
        };

        // 3. Details Table
        this.analysisTableHeaders = [primaryAxis, ...indicators];
        this.analysisTableData = categoriesWithIcons.map((catObj, catIdx) => {
            const row: any = {
                AxisCategory: catObj.name,
                categoryIcon: catObj.icon,
                indicatorDetails: {}
            };

            indicators.forEach((ind: string) => {
                const valObj = this.generateMockIndicatorValue(ind, period, catIdx, categories.length);
                row[ind] = valObj.raw;
                row[ind + '_formatted'] = valObj.formatted;
                row[ind + '_unit'] = valObj.unit;
                row[ind + '_badge'] = valObj.badgeClass;
                row.indicatorDetails[ind] = valObj;
            });

            return row;
        });

        this.drilldownStack = [];
        this.currentDrillLevel = 0;
        this.currentDrillLabel = '';

        this.cdr.detectChanges();
        setTimeout(() => {
            this.chartDirectives?.forEach(c => c.update());
            this.cdr.detectChanges();
        }, 20);

        if (event) {
            this.triggerToast(`Analyse Cautionnement générée : ${primaryAxis} (${indicators.length} indicateurs)`);
        }
    }

    get currentTemporalLevelLabel(): string {
        if (this.drilldownStack.length === 0) return 'Vue Globale';
        const current = this.currentDrillLabel.toLowerCase();
        if (current.includes('exercice') || current.includes('2024') || current.includes('2025') || current.includes('2026') || current.includes('2027') || current.includes('année')) {
            return 'Trimestres';
        }
        if (current.includes('trimestre') || current.includes('t1') || current.includes('t2') || current.includes('t3') || current.includes('t4')) {
            return 'Mois';
        }
        if (current.includes('janvier') || current.includes('février') || current.includes('fevrier') || current.includes('mars') || current.includes('avril') || current.includes('mai') || current.includes('juin') || current.includes('juillet') || current.includes('août') || current.includes('aout') || current.includes('septembre') || current.includes('octobre') || current.includes('novembre') || current.includes('décembre')) {
            return 'Semaines';
        }
        if (current.includes('semaine') || current.includes('sem')) {
            return 'Jours';
        }
        if (current.includes('lundi') || current.includes('mardi') || current.includes('mercredi') || current.includes('jeudi') || current.includes('vendredi')) {
            return 'Plages horaires';
        }
        return `Trimestres (${this.currentDrillLabel})`;
    }

    private getDrilldownCategories(parentLabel: string): { name: string; icon: string; subPeriod?: string }[] {
        const labelLower = parentLabel.toLowerCase();

        if (labelLower.includes('08h') || labelLower.includes('10h') || labelLower.includes('12h') || labelLower.includes('14h') || labelLower.includes('16h')) {
            return [
                { name: `${parentLabel} — Guichet ACCT`, icon: 'fa-building-columns' },
                { name: `${parentLabel} — CDC-CI Dépôts`, icon: 'fa-vault' },
                { name: `${parentLabel} — Télé-transmission SIGFIP`, icon: 'fa-network-wired' }
            ];
        }

        if (labelLower.includes('lundi') || labelLower.includes('mardi') || labelLower.includes('mercredi') || labelLower.includes('jeudi') || labelLower.includes('vendredi')) {
            return [
                { name: '08h00 - 10h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '10h00 - 12h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '12h00 - 14h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '14h00 - 16h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '16h00 - 18h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' }
            ];
        }

        if (labelLower.includes('semaine') || labelLower.includes('sem')) {
            return [
                { name: 'Lundi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Mardi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Mercredi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Jeudi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Vendredi', icon: 'fa-calendar-day', subPeriod: 'semaine' }
            ];
        }

        if (labelLower.includes('janvier') || labelLower.includes('février') || labelLower.includes('fevrier') ||
            labelLower.includes('mars') || labelLower.includes('avril') || labelLower.includes('mai') ||
            labelLower.includes('juin') || labelLower.includes('juillet') || labelLower.includes('août') ||
            labelLower.includes('aout') || labelLower.includes('septembre') || labelLower.includes('octobre') ||
            labelLower.includes('novembre') || labelLower.includes('décembre')) {
            return [
                { name: 'Semaine 1 (01-07)', icon: 'fa-calendar-week', subPeriod: 'Semaine' },
                { name: 'Semaine 2 (08-14)', icon: 'fa-calendar-week', subPeriod: 'Semaine' },
                { name: 'Semaine 3 (15-21)', icon: 'fa-calendar-week', subPeriod: 'Semaine' },
                { name: 'Semaine 4 (22-31)', icon: 'fa-calendar-week', subPeriod: 'Semaine' }
            ];
        }

        if (labelLower.includes('trimestre 1') || labelLower.includes('t1') || labelLower.includes('1er trimestre')) {
            return [
                { name: 'Janvier', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Février', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Mars', icon: 'fa-calendar-day', subPeriod: 'Mois' }
            ];
        } else if (labelLower.includes('trimestre 2') || labelLower.includes('t2') || labelLower.includes('2ème trimestre')) {
            return [
                { name: 'Avril', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Mai', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Juin', icon: 'fa-calendar-day', subPeriod: 'Mois' }
            ];
        } else if (labelLower.includes('trimestre 3') || labelLower.includes('t3') || labelLower.includes('3ème trimestre')) {
            return [
                { name: 'Juillet', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Août', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Septembre', icon: 'fa-calendar-day', subPeriod: 'Mois' }
            ];
        } else if (labelLower.includes('trimestre 4') || labelLower.includes('t4') || labelLower.includes('4ème trimestre')) {
            return [
                { name: 'Octobre', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Novembre', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Décembre', icon: 'fa-calendar-day', subPeriod: 'Mois' }
            ];
        }

        const yearMatch = labelLower.match(/202[0-9]/);
        const yr = yearMatch ? yearMatch[0] : '2026';
        return [
            { name: `1er Trimestre (T1 ${yr})`, icon: 'fa-calendar', subPeriod: 'Trimestre 1' },
            { name: `2ème Trimestre (T2 ${yr})`, icon: 'fa-calendar', subPeriod: 'Trimestre 2' },
            { name: `3ème Trimestre (T3 ${yr})`, icon: 'fa-calendar', subPeriod: 'Trimestre 3' },
            { name: `4ème Trimestre (T4 ${yr})`, icon: 'fa-calendar', subPeriod: 'Trimestre 4' }
        ];
    }

    private getDrillTimeLabels(categories: string[]): string[] {
        if (!categories || categories.length === 0) return [];
        const first = categories[0].toLowerCase();
        if (first.includes('trimestre') || first.includes('t1')) return ['T1', 'T2', 'T3', 'T4'];
        if (first.includes('janvier') || first.includes('avril') || first.includes('juillet') || first.includes('octobre')) {
            return categories.map(m => m.substring(0, 3) + '.');
        }
        if (first.includes('semaine') || first.includes('sem')) return ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        if (first.includes('lundi') || first.includes('mardi')) return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
        if (first.includes('08h') || first.includes('10h')) return ['08h', '10h', '12h', '14h', '16h'];
        return categories.map(c => c.length > 12 ? c.substring(0, 10) + '...' : c);
    }

    drillDown(label: string, index?: number) {
        if (!this.isAnalysisGenerated) return;

        this.ngZone.run(() => {
            const indicators = this.currentSelectedIndicators;
            const period = this.activePeriod;

            this.drilldownStack.push({
                title: this.currentDrillLabel || (this.currentSelectedAxes[0] || 'Vue Globale'),
                axis: this.currentSelectedAxes[0] || 'Axe',
                categoriesWithIcons: this.analysisTableData.map(r => ({ name: r.AxisCategory, icon: r.categoryIcon })),
                parentLabel: label,
                level: this.currentDrillLevel
            });

            this.currentDrillLevel++;
            this.currentDrillLabel = label;

            const subCategoriesWithIcons = this.getDrilldownCategories(label);
            const categories = subCategoriesWithIcons.map(c => c.name);
            const timeLabels = this.getDrillTimeLabels(categories);

            const colorPalette = [
                { main: '#F77F00', light: 'rgba(247, 127, 0, 0.2)', border: '#F77F00' },
                { main: '#10b981', light: 'rgba(16, 185, 129, 0.2)', border: '#10b981' },
                { main: '#0284c7', light: 'rgba(2, 132, 199, 0.2)', border: '#0284c7' },
                { main: '#8b5cf6', light: 'rgba(139, 92, 246, 0.2)', border: '#8b5cf6' }
            ];

            const barDatasets = indicators.map((ind: string, idx: number) => {
                const color = colorPalette[idx % colorPalette.length];
                const data = categories.map((_, catIdx) => {
                    const mockObj = this.generateMockIndicatorValue(ind, period, catIdx + this.currentDrillLevel, categories.length);
                    return mockObj.raw;
                });

                return {
                    data,
                    label: ind,
                    backgroundColor: color.main,
                    borderRadius: 6,
                    barPercentage: 0.65,
                    categoryPercentage: 0.75
                };
            });

            this.barChartData = {
                labels: categories,
                datasets: barDatasets
            };

            const lineDatasets = indicators.map((ind: string, idx: number) => {
                const color = colorPalette[idx % colorPalette.length];
                const total = barDatasets[idx].data.reduce((a: number, b: number) => a + b, 0);
                const avg = total / barDatasets[idx].data.length;
                const trendData = this.generateTrendSeries(ind, period, timeLabels.length, avg);

                return {
                    data: trendData,
                    label: ind,
                    borderColor: color.border,
                    backgroundColor: color.light,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: color.border,
                    pointBorderWidth: 2
                };
            });

            this.lineChartData = {
                labels: timeLabels,
                datasets: lineDatasets
            };

            this.analysisTableHeaders = [`Détail : ${label}`, ...indicators];
            this.analysisTableData = subCategoriesWithIcons.map((catObj, catIdx) => {
                const row: any = {
                    AxisCategory: catObj.name,
                    categoryIcon: catObj.icon,
                    indicatorDetails: {}
                };

                indicators.forEach((ind: string) => {
                    const valObj = this.generateMockIndicatorValue(ind, period, catIdx + this.currentDrillLevel, categories.length);
                    row[ind] = valObj.raw;
                    row[ind + '_formatted'] = valObj.formatted;
                    row[ind + '_unit'] = valObj.unit;
                    row[ind + '_badge'] = valObj.badgeClass;
                    row.indicatorDetails[ind] = valObj;
                });

                return row;
            });

            this.triggerToast(`Forage temporel : ${label} (${categories.length} sous-niveaux)`);
            this.cdr.detectChanges();
            setTimeout(() => {
                this.chartDirectives?.forEach(c => c.update());
                this.cdr.detectChanges();
            }, 20);
        });
    }

    drillUp() {
        if (this.drilldownStack.length === 0) return;
        this.drilldownStack.pop();
        if (this.drilldownStack.length === 0) {
            this.generateAnalysis();
        } else {
            const previousStep = this.drilldownStack[this.drilldownStack.length - 1];
            this.drillDown(previousStep.parentLabel);
        }
    }

    resetDrilldown() {
        this.drilldownStack = [];
        this.currentDrillLevel = 0;
        this.currentDrillLabel = '';
        this.generateAnalysis();
        this.triggerToast('Vue d\'analyse réinitialisée au niveau initial');
    }

    onChartClick(event: any) {
        if (!event || !event.active || event.active.length === 0) return;
        const activePoint = event.active[0];
        const index = activePoint.index;
        const clickedLabel = this.barChartData.labels?.[index];
        if (clickedLabel) {
            this.drillDown(String(clickedLabel), index);
        }
    }
}
