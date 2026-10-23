import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

export interface CompteGestionItem {
    ref: string;
    titre: string;
    domaine: string;
    domaineKey: 'developpements' | 'balance' | 'reddition' | 'apurement';
    comptable: string;
    posteComptable: string;
    ministere: string;
    localite: string;
    exercice: string;
    dateTransmission: string;
    montant: string;
    montantVal: number;
    tauxConformite: number;
    statut: 'valide' | 'consolidation' | 'alerte';
    statutLabel: string;
    avatarInitials: string;
    avatarClass: string;
}

@Component({
    selector: 'app-gestion-compte',
    standalone: true,
    imports: [CommonModule, FormsModule, AnalyseSelectorComponent],
    templateUrl: './gestion-compte.component.html',
    styleUrl: './gestion-compte.component.scss'
})
export class GestionCompteComponent {

    // --- NAVIGATION & SUB-DOMAIN TABS ---
    activeSubDomain: 'developpements' | 'balance' | 'reddition' | 'apurement' = 'developpements';
    viewMode: 'synthese' | 'avancee' = 'synthese';

    // --- TOP FILTER STRIP ---
    activePeriod: string = 'Exercice 2026';
    periodsList: string[] = [
        'Ce mois-ci (Mars 2026)',
        '1er Trimestre 2026',
        'Exercice 2026',
        'Exercice Clôturé 2025',
        'Exercice 2024'
    ];

    activePerimetre: string = 'Tous les Postes Comptables';
    perimetresList: string[] = [
        'Tous les Postes Comptables',
        'TGE - Trésorerie Générale de l\'État',
        'PGT - Paierie Générale du Trésor',
        'RGF - Recette Générale des Finances',
        'PGA - Paierie Générale des Armées',
        'TP - Trésorerie Principale Abidjan Nord',
        'TG - Trésorerie Générale Yamoussoukro'
    ];

    // --- FILTER CHIPS WITH "+ AJOUTER UN FILTRE" LOGIC ---
    filterChips: string[] = [
        'Comptes Transmis Cour des Comptes',
        'Taux Apurement > 90%'
    ];

    allAvailableChips: string[] = [
        'Comptes Transmis Cour des Comptes',
        'Taux Apurement > 90%',
        'Pièces Justificatives Conformes',
        'Restes en Instance < 5%',
        'Concordance Balance Parfaite',
        'Quitus Définitif Obtenu',
        'Imputations Provisoires Soldées',
        'Mandats Rejetés < 2%',
        'Débiteurs Régularisés > 80%',
        'Dépenses sans Pièce = 0'
    ];

    isFilterDropdownOpen: boolean = false;

    toggleFilterDropdown(event: Event) {
        event.stopPropagation();
        this.isFilterDropdownOpen = !this.isFilterDropdownOpen;
    }

    @HostListener('document:click')
    onDocumentClick() {
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
        // Requirement: Removed chip is prepended to the dropdown list so it appears in '+ Ajouter un filtre'
        if (this.allAvailableChips.includes(chip)) {
            this.allAvailableChips = [chip, ...this.allAvailableChips.filter(c => c !== chip)];
        } else {
            this.allAvailableChips.unshift(chip);
        }
        this.triggerToast(`Filtre retiré : ${chip} (disponible dans '+ Ajouter un filtre')`);
        this.updateFilteredItems();
    }

    // --- CHART CONTROLS & STATE ---
    chart1Type: 'bar' | 'line' = 'bar';
    chart2Type: 'donut' | 'bar' = 'donut';

    // --- TABLE SEARCH & FILTER STATE ---
    searchQuery: string = '';
    tableFilter: 'all' | 'valide' | 'consolidation' | 'alerte' = 'all';

    // --- TOAST NOTIFICATION ---
    showToast: boolean = false;
    toastMessage: string = '';

    triggerToast(message: string) {
        this.toastMessage = message;
        this.showToast = true;
        setTimeout(() => {
            this.showToast = false;
        }, 3000);
    }

    // --- ACTIONS ---
    switchSubDomain(domain: 'developpements' | 'balance' | 'reddition' | 'apurement') {
        this.activeSubDomain = domain;
        this.updateFilteredItems();
        this.triggerToast(`Volet activé : ${this.getSubDomainLabel(domain)}`);
    }

    getSubDomainLabel(key: string): string {
        switch (key) {
            case 'developpements': return 'Développements Budgétaires & Titres';
            case 'balance': return 'Balance Générale & Concordance';
            case 'reddition': return 'Comptables Assignataires & Postes';
            case 'apurement': return 'Restes à Recouvrer & Apurement';
            default: return 'Compte de Gestion';
        }
    }

    selectPeriod(period: string) {
        this.activePeriod = period;
        this.updateFilteredItems();
        this.triggerToast(`Période sélectionnée : ${period}`);
    }

    selectPerimetre(perimetre: string) {
        this.activePerimetre = perimetre;
        this.updateFilteredItems();
        this.triggerToast(`Périmètre appliqué : ${perimetre}`);
    }

    setTableFilter(filter: 'all' | 'valide' | 'consolidation' | 'alerte') {
        this.tableFilter = filter;
        this.updateFilteredItems();
    }

    refreshData() {
        this.triggerToast('Actualisation des comptes de gestion et synchronisation Cour des Comptes...');
        this.updateFilteredItems();
    }

    exportExcel() {
        this.triggerToast('Génération de l\'export Excel consolidé du Compte de Gestion...');
    }

    exportPdf() {
        this.triggerToast('Téléchargement du Compte de Gestion certifié au format PDF...');
    }

    triggerAudit() {
        this.triggerToast('Audit de conformité DGTCP / Cour des Comptes lancé avec succès !');
    }

    // --- ADVANCED OLAP COMPONENT PROPS ---
    isDragDropMode: boolean = false;
    selectedPeriod: string = 'Exercice 2026';
    availableIndicators: string[] = [
        'Taux absorption crédits',
        'Écart LFI/LFR',
        'Délai moyen mandatement',
        'Montant moyen par mandat',
        'Taux imputations provisoires',
        'Taux imputations sans pièce',
        'Délai moyen régularisation',
        'Taux disponibilités bloquées'
    ];
    selectedIndicators: string[] = [
        'Taux exécution des crédits',
        'Taux mandats rejetés',
        'Délai moyen paiement'
    ];
    availableAxes: string[] = [
        'Poste Comptable',
        'Ministère Tutelle',
        'Nature Dépense',
        'Qualité Imputation',
        'Compte Balance',
        'Exercice Budgétaire'
    ];
    selectedAxes: string[] = ['Poste Comptable'];

    // --- REPOSITORY DATA ---
    allCompteItems: CompteGestionItem[] = [
        // === 1. DÉVELOPPEMENTS BUDGÉTAIRES & TITRES ===
        {
            ref: 'CG-DEV-2026-001',
            titre: 'Développement des Dépenses de Personnel & Traitements',
            domaine: 'Développements Budgétaires',
            domaineKey: 'developpements',
            comptable: 'M. Kouassi Jean (Payeur Général)',
            posteComptable: 'PGT - Paierie Générale du Trésor',
            ministere: 'Fonction Publique & Économie',
            localite: 'Plateau, Abidjan',
            exercice: 'Exercice 2026',
            dateTransmission: '15 Mars 2026',
            montant: '18.450 Mds FCFA',
            montantVal: 18.45,
            tauxConformite: 96.8,
            statut: 'valide',
            statutLabel: 'Conforme Cour des Comptes',
            avatarInitials: 'PGT',
            avatarClass: 'bg-primary-soft'
        },
        {
            ref: 'CG-DEV-2026-002',
            titre: 'Titres de Recettes Fiscales & Douanières Consolidés',
            domaine: 'Développements Budgétaires',
            domaineKey: 'developpements',
            comptable: 'Mme Bamba Fatou (Receveur Général)',
            posteComptable: 'RGF - Recette Générale des Finances',
            ministere: 'Économie, Finances & Budget',
            localite: 'Port Autonome, Abidjan',
            exercice: 'Exercice 2026',
            dateTransmission: '18 Mars 2026',
            montant: '24.200 Mds FCFA',
            montantVal: 24.20,
            tauxConformite: 98.4,
            statut: 'valide',
            statutLabel: 'Conforme Cour des Comptes',
            avatarInitials: 'RGF',
            avatarClass: 'bg-success-soft'
        },
        {
            ref: 'CG-DEV-2026-003',
            titre: 'Mandatements Travaux Publics & Réseau Routier National',
            domaine: 'Développements Budgétaires',
            domaineKey: 'developpements',
            comptable: 'M. Traoré Mamadou (Trésorier Général)',
            posteComptable: 'TGE - Trésorerie Générale de l\'État',
            ministere: 'Infrastructures & Équipements',
            localite: 'Abidjan / Yamoussoukro',
            exercice: 'Exercice 2026',
            dateTransmission: '12 Mars 2026',
            montant: '12.800 Mds FCFA',
            montantVal: 12.80,
            tauxConformite: 88.5,
            statut: 'consolidation',
            statutLabel: 'En apurement',
            avatarInitials: 'TGE',
            avatarClass: 'bg-warning-soft'
        },
        {
            ref: 'CG-DEV-2026-004',
            titre: 'Dépenses Militaires & Approvisionnements Stratégiques',
            domaine: 'Développements Budgétaires',
            domaineKey: 'developpements',
            comptable: 'Col. Koné Lassina (Payeur Général)',
            posteComptable: 'PGA - Paierie Générale des Armées',
            ministere: 'Défense & Sécurité Intérieure',
            localite: 'État-Major, Abidjan',
            exercice: 'Exercice 2026',
            dateTransmission: '10 Mars 2026',
            montant: '7.600 Mds FCFA',
            montantVal: 7.60,
            tauxConformite: 94.2,
            statut: 'valide',
            statutLabel: 'Conforme Cour des Comptes',
            avatarInitials: 'PGA',
            avatarClass: 'bg-info-soft'
        },
        {
            ref: 'CG-DEV-2026-005',
            titre: 'Dotations aux Établissements Publics Nationaux (EPN)',
            domaine: 'Développements Budgétaires',
            domaineKey: 'developpements',
            comptable: 'Mme Diallo Awa (Trésorière Principale)',
            posteComptable: 'TP - Trésorerie Principale Abidjan Nord',
            ministere: 'Éducation & Formation',
            localite: 'Cocody, Abidjan',
            exercice: 'Exercice 2026',
            dateTransmission: '08 Mars 2026',
            montant: '5.400 Mds FCFA',
            montantVal: 5.40,
            tauxConformite: 91.0,
            statut: 'valide',
            statutLabel: 'Conforme Cour des Comptes',
            avatarInitials: 'TP',
            avatarClass: 'bg-primary-soft'
        },
        {
            ref: 'CG-DEV-2026-006',
            titre: 'Subventions aux Collectivités Territoriales du Bélier',
            domaine: 'Développements Budgétaires',
            domaineKey: 'developpements',
            comptable: 'M. Yao Kouamé (Trésorier Général)',
            posteComptable: 'TG - Trésorerie Générale Yamoussoukro',
            ministere: 'Intérieur & Décentralisation',
            localite: 'Région du Bélier',
            exercice: 'Exercice 2026',
            dateTransmission: '04 Mars 2026',
            montant: '3.150 Mds FCFA',
            montantVal: 3.15,
            tauxConformite: 82.0,
            statut: 'consolidation',
            statutLabel: 'En apurement',
            avatarInitials: 'TG',
            avatarClass: 'bg-warning-soft'
        },
        {
            ref: 'CG-DEV-2026-007',
            titre: 'Bons de Commande Fournitures Scolaires & Équipements',
            domaine: 'Développements Budgétaires',
            domaineKey: 'developpements',
            comptable: 'M. Koffi Serges (Fondé de Pouvoirs)',
            posteComptable: 'TP - Trésorerie Principale Abidjan Nord',
            ministere: 'Éducation & Formation',
            localite: 'DREN Abidjan',
            exercice: 'Exercice 2026',
            dateTransmission: '02 Mars 2026',
            montant: '1.250 Mds FCFA',
            montantVal: 1.25,
            tauxConformite: 64.5,
            statut: 'alerte',
            statutLabel: 'Pièces Manquantes',
            avatarInitials: 'TP',
            avatarClass: 'bg-danger-soft'
        },
        {
            ref: 'CG-DEV-2026-008',
            titre: 'Frais de Santé Hospitaliers & CMU - Centres Hospitaliers',
            domaine: 'Développements Budgétaires',
            domaineKey: 'developpements',
            comptable: 'Mme Soro Mariam (Payeuse Adjointe)',
            posteComptable: 'PGT - Paierie Générale du Trésor',
            ministere: 'Santé & Protection Sociale',
            localite: 'CHU Treichville',
            exercice: 'Exercice 2026',
            dateTransmission: '20 Fév 2026',
            montant: '4.800 Mds FCFA',
            montantVal: 4.80,
            tauxConformite: 95.5,
            statut: 'valide',
            statutLabel: 'Conforme Cour des Comptes',
            avatarInitials: 'PGT',
            avatarClass: 'bg-success-soft'
        },

        // === 2. BALANCE GÉNÉRALE & CONCORDANCE ===
        {
            ref: 'CG-BAL-2026-009',
            titre: 'Balance d\'Entrée & Rapprochement Comptable Clôture',
            domaine: 'Balance Générale',
            domaineKey: 'balance',
            comptable: 'M. Kouassi Jean (Payeur Général)',
            posteComptable: 'PGT - Paierie Générale du Trésor',
            ministere: 'Économie, Finances & Budget',
            localite: 'Siège DGTCP',
            exercice: 'Exercice 2026',
            dateTransmission: '14 Mars 2026',
            montant: '42.100 Mds FCFA',
            montantVal: 42.10,
            tauxConformite: 99.2,
            statut: 'valide',
            statutLabel: 'Conforme Cour des Comptes',
            avatarInitials: 'PGT',
            avatarClass: 'bg-primary-soft'
        },
        {
            ref: 'CG-BAL-2026-010',
            titre: 'Concordance des Comptes de Trésorerie BCEAO & CUT',
            domaine: 'Balance Générale',
            domaineKey: 'balance',
            comptable: 'M. Traoré Mamadou (Trésorier Général)',
            posteComptable: 'TGE - Trésorerie Générale de l\'État',
            ministere: 'Économie, Finances & Budget',
            localite: 'Banque Centrale BCEAO',
            exercice: 'Exercice 2026',
            dateTransmission: '16 Mars 2026',
            montant: '128.500 Mds FCFA',
            montantVal: 128.50,
            tauxConformite: 97.5,
            statut: 'valide',
            statutLabel: 'Conforme Cour des Comptes',
            avatarInitials: 'TGE',
            avatarClass: 'bg-success-soft'
        },
        {
            ref: 'CG-BAL-2026-011',
            titre: 'Balance des Comptes de Dépôts et Consignations (CDC)',
            domaine: 'Balance Générale',
            domaineKey: 'balance',
            comptable: 'Mme Bamba Fatou (Receveur Général)',
            posteComptable: 'RGF - Recette Générale des Finances',
            ministere: 'Justice & Droits de l\'Homme',
            localite: 'Palais de Justice, Abidjan',
            exercice: 'Exercice 2026',
            dateTransmission: '11 Mars 2026',
            montant: '8.400 Mds FCFA',
            montantVal: 8.40,
            tauxConformite: 86.0,
            statut: 'consolidation',
            statutLabel: 'En apurement',
            avatarInitials: 'RGF',
            avatarClass: 'bg-warning-soft'
        },
        {
            ref: 'CG-BAL-2026-012',
            titre: 'Rapprochement des Journaux de Paie & Retenues IGR/CNPS',
            domaine: 'Balance Générale',
            domaineKey: 'balance',
            comptable: 'Mme Diallo Awa (Trésorière Principale)',
            posteComptable: 'TP - Trésorerie Principale Abidjan Nord',
            ministere: 'Emploi & Protection Sociale',
            localite: 'Abidjan Nord',
            exercice: 'Exercice 2026',
            dateTransmission: '05 Mars 2026',
            montant: '3.900 Mds FCFA',
            montantVal: 3.90,
            tauxConformite: 71.2,
            statut: 'alerte',
            statutLabel: 'Écart de Rapprochement',
            avatarInitials: 'TP',
            avatarClass: 'bg-danger-soft'
        },
        {
            ref: 'CG-BAL-2026-020',
            titre: 'Journal des Opérations Diverses & Écritures d\'Ordre',
            domaine: 'Balance Générale',
            domaineKey: 'balance',
            comptable: 'Col. Koné Lassina (Payeur Général)',
            posteComptable: 'PGA - Paierie Générale des Armées',
            ministere: 'Défense & Sécurité Intérieure',
            localite: 'Abidjan',
            exercice: 'Exercice 2026',
            dateTransmission: '09 Mars 2026',
            montant: '6.700 Mds FCFA',
            montantVal: 6.70,
            tauxConformite: 94.0,
            statut: 'valide',
            statutLabel: 'Conforme Cour des Comptes',
            avatarInitials: 'PGA',
            avatarClass: 'bg-info-soft'
        },
        {
            ref: 'CG-BAL-2026-021',
            titre: 'Balance Générale des Comptes de Trésorerie Régionale Bélier',
            domaine: 'Balance Générale',
            domaineKey: 'balance',
            comptable: 'M. Yao Kouamé (Trésorier Général)',
            posteComptable: 'TG - Trésorerie Générale Yamoussoukro',
            ministere: 'Économie, Finances & Budget',
            localite: 'Yamoussoukro',
            exercice: 'Exercice 2026',
            dateTransmission: '07 Mars 2026',
            montant: '11.200 Mds FCFA',
            montantVal: 11.20,
            tauxConformite: 89.2,
            statut: 'consolidation',
            statutLabel: 'En apurement',
            avatarInitials: 'TG',
            avatarClass: 'bg-warning-soft'
        },

        // === 3. COMPTABLES ASSIGNATAIRES & REDDITION ===
        {
            ref: 'CG-RED-2026-013',
            titre: 'Dossier de Reddition Annuelle - Compte de Gestion TGE',
            domaine: 'Reddition des Comptes',
            domaineKey: 'reddition',
            comptable: 'M. Traoré Mamadou (Trésorier Général)',
            posteComptable: 'TGE - Trésorerie Générale de l\'État',
            ministere: 'Économie, Finances & Budget',
            localite: 'Cour des Comptes, Abidjan',
            exercice: 'Exercice 2026',
            dateTransmission: '15 Mars 2026',
            montant: '86.400 Mds FCFA',
            montantVal: 86.40,
            tauxConformite: 98.7,
            statut: 'valide',
            statutLabel: 'Quitus Transmis',
            avatarInitials: 'TGE',
            avatarClass: 'bg-primary-soft'
        },
        {
            ref: 'CG-RED-2026-014',
            titre: 'États de Fin d\'Exercice & Procès-Verbaux PGT',
            domaine: 'Reddition des Comptes',
            domaineKey: 'reddition',
            comptable: 'M. Kouassi Jean (Payeur Général)',
            posteComptable: 'PGT - Paierie Générale du Trésor',
            ministere: 'Économie, Finances & Budget',
            localite: 'Cour des Comptes',
            exercice: 'Exercice 2026',
            dateTransmission: '18 Mars 2026',
            montant: '54.200 Mds FCFA',
            montantVal: 54.20,
            tauxConformite: 96.0,
            statut: 'valide',
            statutLabel: 'Quitus Transmis',
            avatarInitials: 'PGT',
            avatarClass: 'bg-success-soft'
        },
        {
            ref: 'CG-RED-2026-015',
            titre: 'Inventaire des Titres de Recettes & Pièces Justificatives RGF',
            domaine: 'Reddition des Comptes',
            domaineKey: 'reddition',
            comptable: 'Mme Bamba Fatou (Receveur Général)',
            posteComptable: 'RGF - Recette Générale des Finances',
            ministere: 'Économie, Finances & Budget',
            localite: 'Cour des Comptes',
            exercice: 'Exercice 2026',
            dateTransmission: '10 Mars 2026',
            montant: '38.750 Mds FCFA',
            montantVal: 38.75,
            tauxConformite: 89.0,
            statut: 'consolidation',
            statutLabel: 'En cours d\'instruction',
            avatarInitials: 'RGF',
            avatarClass: 'bg-warning-soft'
        },
        {
            ref: 'CG-RED-2026-016',
            titre: 'Dossier de Clôture & Certificats de Conformité Armées',
            domaine: 'Reddition des Comptes',
            domaineKey: 'reddition',
            comptable: 'Col. Koné Lassina (Payeur Général)',
            posteComptable: 'PGA - Paierie Générale des Armées',
            ministere: 'Défense & Sécurité Intérieure',
            localite: 'Cour des Comptes',
            exercice: 'Exercice 2026',
            dateTransmission: '01 Mars 2026',
            montant: '14.100 Mds FCFA',
            montantVal: 14.10,
            tauxConformite: 93.4,
            statut: 'valide',
            statutLabel: 'Quitus Transmis',
            avatarInitials: 'PGA',
            avatarClass: 'bg-info-soft'
        },
        {
            ref: 'CG-RED-2026-022',
            titre: 'Bordereaux de Dépôt des Comptes de Gestion Décentralisés',
            domaine: 'Reddition des Comptes',
            domaineKey: 'reddition',
            comptable: 'M. Yao Kouamé (Trésorier Général)',
            posteComptable: 'TG - Trésorerie Générale Yamoussoukro',
            ministere: 'Intérieur & Décentralisation',
            localite: 'Cour des Comptes',
            exercice: 'Exercice 2026',
            dateTransmission: '28 Fév 2026',
            montant: '7.800 Mds FCFA',
            montantVal: 7.80,
            tauxConformite: 73.0,
            statut: 'alerte',
            statutLabel: 'Pièces Justificatives Incomplètes',
            avatarInitials: 'TG',
            avatarClass: 'bg-danger-soft'
        },

        // === 4. RESTES À RECOUVRER & APUREMENT ===
        {
            ref: 'CG-APU-2026-017',
            titre: 'Apurement des Imputations Provisoires de Dépenses (IPD)',
            domaine: 'Restes & Apurement',
            domaineKey: 'apurement',
            comptable: 'M. Kouassi Jean (Payeur Général)',
            posteComptable: 'PGT - Paierie Générale du Trésor',
            ministere: 'Santé & Protection Sociale',
            localite: 'Siège DGTCP',
            exercice: 'Exercice 2026',
            dateTransmission: '16 Mars 2026',
            montant: '2.450 Mds FCFA',
            montantVal: 2.45,
            tauxConformite: 92.0,
            statut: 'valide',
            statutLabel: 'Régularisé',
            avatarInitials: 'PGT',
            avatarClass: 'bg-success-soft'
        },
        {
            ref: 'CG-APU-2026-018',
            titre: 'Recouvrement des Débiteurs Divers & Restes à Payer (RAP)',
            domaine: 'Restes & Apurement',
            domaineKey: 'apurement',
            comptable: 'M. Traoré Mamadou (Trésorier Général)',
            posteComptable: 'TGE - Trésorerie Générale de l\'État',
            ministere: 'Infrastructures & Équipements',
            localite: 'Trésor Public',
            exercice: 'Exercice 2026',
            dateTransmission: '14 Mars 2026',
            montant: '4.800 Mds FCFA',
            montantVal: 4.80,
            tauxConformite: 84.5,
            statut: 'consolidation',
            statutLabel: 'En apurement',
            avatarInitials: 'TGE',
            avatarClass: 'bg-warning-soft'
        },
        {
            ref: 'CG-APU-2026-019',
            titre: 'Régularisation des Avances de Régie sans Justificatifs > 90j',
            domaine: 'Restes & Apurement',
            domaineKey: 'apurement',
            comptable: 'M. Yao Kouamé (Trésorier Général)',
            posteComptable: 'TG - Trésorerie Générale Yamoussoukro',
            ministere: 'Agriculture & Développement',
            localite: 'Région Centre',
            exercice: 'Exercice 2026',
            dateTransmission: '06 Mars 2026',
            montant: '890 M FCFA',
            montantVal: 0.89,
            tauxConformite: 58.0,
            statut: 'alerte',
            statutLabel: 'Seuil Critique Dépassement',
            avatarInitials: 'TG',
            avatarClass: 'bg-danger-soft'
        },
        {
            ref: 'CG-APU-2026-023',
            titre: 'Ordres de Recettes en Instance sur Marchés Publics',
            domaine: 'Restes & Apurement',
            domaineKey: 'apurement',
            comptable: 'Mme Bamba Fatou (Receveur Général)',
            posteComptable: 'RGF - Recette Générale des Finances',
            ministere: 'Économie, Finances & Budget',
            localite: 'Abidjan',
            exercice: 'Exercice 2026',
            dateTransmission: '12 Mars 2026',
            montant: '3.120 Mds FCFA',
            montantVal: 3.12,
            tauxConformite: 96.5,
            statut: 'valide',
            statutLabel: 'Régularisé',
            avatarInitials: 'RGF',
            avatarClass: 'bg-primary-soft'
        }
    ];

    filteredItems: CompteGestionItem[] = [];

    constructor() {
        this.updateFilteredItems();
    }

    matchesPerimetre(itemPosteOrMinistere: string): boolean {
        if (this.activePerimetre === 'Tous les Postes Comptables') return true;
        const p = this.activePerimetre.toLowerCase();
        const target = itemPosteOrMinistere.toLowerCase();
        if (p.includes('tge') && target.includes('tge')) return true;
        if (p.includes('pgt') && target.includes('pgt')) return true;
        if (p.includes('rgf') && target.includes('rgf')) return true;
        if (p.includes('pga') && target.includes('pga')) return true;
        if (p.includes('nord') && target.includes('nord')) return true;
        if (p.includes('yamoussoukro') && target.includes('yamoussoukro')) return true;
        return false;
    }

    updateFilteredItems() {
        let items = [...this.allCompteItems];

        // 1. Filter by Active Subdomain
        items = items.filter(i => i.domaineKey === this.activeSubDomain);

        // 2. Filter by Perimeter / Poste
        items = items.filter(i => this.matchesPerimetre(i.posteComptable));

        // 3. Filter by Search Query
        if (this.searchQuery.trim()) {
            const q = this.searchQuery.toLowerCase().trim();
            items = items.filter(i =>
                i.ref.toLowerCase().includes(q) ||
                i.titre.toLowerCase().includes(q) ||
                i.comptable.toLowerCase().includes(q) ||
                i.posteComptable.toLowerCase().includes(q) ||
                i.ministere.toLowerCase().includes(q) ||
                i.localite.toLowerCase().includes(q)
            );
        }

        // 4. Filter by Status Pill
        if (this.tableFilter !== 'all') {
            items = items.filter(i => i.statut === this.tableFilter);
        }

        // 5. Dynamic Filter Chips Handling
        // Every single active chip filters rows progressively!
        for (const chip of this.filterChips) {
            if (chip === 'Taux Apurement > 90%') {
                items = items.filter(i => i.tauxConformite >= 90);
            } else if (chip === 'Pièces Justificatives Conformes') {
                items = items.filter(i => i.statut === 'valide' || i.tauxConformite >= 93);
            } else if (chip === 'Comptes Transmis Cour des Comptes') {
                items = items.filter(i => i.statut !== 'alerte');
            } else if (chip === 'Restes en Instance < 5%') {
                items = items.filter(i => i.tauxConformite >= 92);
            } else if (chip === 'Concordance Balance Parfaite') {
                items = items.filter(i => i.tauxConformite >= 96);
            } else if (chip === 'Quitus Définitif Obtenu') {
                items = items.filter(i => i.tauxConformite >= 95 && i.statut === 'valide');
            } else if (chip === 'Imputations Provisoires Soldées') {
                items = items.filter(i => i.tauxConformite >= 88);
            } else if (chip === 'Mandats Rejetés < 2%') {
                items = items.filter(i => i.tauxConformite >= 91);
            } else if (chip === 'Débiteurs Régularisés > 80%') {
                items = items.filter(i => i.tauxConformite >= 85);
            } else if (chip === 'Dépenses sans Pièce = 0') {
                items = items.filter(i => i.statut === 'valide');
            }
        }

        this.filteredItems = items;
    }

    getCount(type: 'all' | 'valide' | 'consolidation' | 'alerte'): number {
        let items = this.allCompteItems.filter(i => i.domaineKey === this.activeSubDomain);
        items = items.filter(i => this.matchesPerimetre(i.posteComptable));

        // Filter according to active chips (excluding status pills)
        for (const chip of this.filterChips) {
            if (chip === 'Taux Apurement > 90%') {
                items = items.filter(i => i.tauxConformite >= 90);
            } else if (chip === 'Pièces Justificatives Conformes') {
                items = items.filter(i => i.statut === 'valide' || i.tauxConformite >= 93);
            } else if (chip === 'Restes en Instance < 5%') {
                items = items.filter(i => i.tauxConformite >= 92);
            } else if (chip === 'Concordance Balance Parfaite') {
                items = items.filter(i => i.tauxConformite >= 96);
            } else if (chip === 'Quitus Définitif Obtenu') {
                items = items.filter(i => i.tauxConformite >= 95 && i.statut === 'valide');
            } else if (chip === 'Imputations Provisoires Soldées') {
                items = items.filter(i => i.tauxConformite >= 88);
            } else if (chip === 'Mandats Rejetés < 2%') {
                items = items.filter(i => i.tauxConformite >= 91);
            } else if (chip === 'Débiteurs Régularisés > 80%') {
                items = items.filter(i => i.tauxConformite >= 85);
            } else if (chip === 'Dépenses sans Pièce = 0') {
                items = items.filter(i => i.statut === 'valide');
            }
        }

        if (type === 'all') return items.length;
        return items.filter(i => i.statut === type).length;
    }

    // --- DYNAMIC CHARTS & KPIS RESPONSIVE TO ACTIVE FILTERS & FILTERED ITEMS ---
    get currentKpis() {
        const items = this.filteredItems;
        if (items.length === 0) {
            return [
                { titre: 'Taux Exécution Crédits', valeur: '0.0%', unite: 'Assignés', icon: 'fa-file-invoice-dollar', colorTheme: 'orange', progress: 0, progressColor: 'orange', badgeClass: 'badge-warning', badgeIcon: 'fa-triangle-exclamation', badgeText: 'Aucune donnée', bench: 'Seuil 85-98%' },
                { titre: 'Taux Apurement', valeur: '0.0%', unite: 'Comptes', icon: 'fa-scale-balanced', colorTheme: 'green', progress: 0, progressColor: 'green', badgeClass: 'badge-warning', badgeIcon: 'fa-shield-halved', badgeText: 'Aucune donnée', bench: 'Obj. Cour des Cptes > 90%' },
                { titre: 'Restes en Instance', valeur: '0 M', unite: 'FCFA', icon: 'fa-clock-rotate-left', colorTheme: 'blue', progress: 0, progressColor: 'blue', badgeClass: 'badge-info', badgeIcon: 'fa-check', badgeText: '0 Mds', bench: 'Seuil < 5% volume' },
                { titre: 'Conformité des Pièces', valeur: '0.0%', unite: 'Transmises', icon: 'fa-stamp', colorTheme: 'red', progress: 0, progressColor: 'green', badgeClass: 'badge-info', badgeIcon: 'fa-certificate', badgeText: '0 pièce', bench: '0 validée' }
            ];
        }

        const avgConformite = items.reduce((acc, i) => acc + i.tauxConformite, 0) / items.length;
        const totalBudget = items.reduce((acc, i) => acc + i.montantVal, 0);
        const validCount = items.filter(i => i.statut === 'valide').length;
        const alerteCount = items.filter(i => i.statut === 'alerte').length;
        const restesAmount = (totalBudget * (100 - avgConformite) / 100);

        const execRate = Math.min(99.6, (avgConformite * 0.95)).toFixed(1);
        const apurRate = avgConformite.toFixed(1);
        const piecesCount = Math.round(totalBudget * 380);

        return [
            { 
                titre: 'Taux Exécution Crédits', 
                valeur: `${execRate}%`, 
                unite: 'Assignés', 
                icon: 'fa-file-invoice-dollar', 
                colorTheme: 'orange', 
                progress: parseFloat(execRate), 
                progressColor: parseFloat(execRate) >= 90 ? 'green' : 'orange', 
                badgeClass: parseFloat(execRate) >= 90 ? 'badge-success' : 'badge-info', 
                badgeIcon: 'fa-check', 
                badgeText: parseFloat(execRate) >= 90 ? 'Excellente' : 'Régulier', 
                bench: `Total : ${totalBudget.toFixed(2)} Mds` 
            },
            { 
                titre: 'Taux Apurement', 
                valeur: `${apurRate}%`, 
                unite: `${validCount}/${items.length} cpts`, 
                icon: 'fa-scale-balanced', 
                colorTheme: 'green', 
                progress: parseFloat(apurRate), 
                progressColor: parseFloat(apurRate) >= 90 ? 'green' : (parseFloat(apurRate) >= 75 ? 'orange' : 'red'), 
                badgeClass: parseFloat(apurRate) >= 90 ? 'badge-success' : 'badge-warning', 
                badgeIcon: parseFloat(apurRate) >= 90 ? 'fa-shield-halved' : 'fa-triangle-exclamation', 
                badgeText: parseFloat(apurRate) >= 90 ? 'Conforme' : 'À régulariser', 
                bench: 'Obj. Cour des Cptes > 90%' 
            },
            { 
                titre: 'Restes en Instance', 
                valeur: restesAmount >= 1 ? `${restesAmount.toFixed(3)} Mds` : `${Math.round(restesAmount * 1000)} M`, 
                unite: 'FCFA', 
                icon: 'fa-clock-rotate-left', 
                colorTheme: 'blue', 
                progress: Math.min(100, Math.round((100 - avgConformite) * 2.5)), 
                progressColor: alerteCount > 0 ? 'red' : 'blue', 
                badgeClass: alerteCount > 0 ? 'badge-warning' : 'badge-info', 
                badgeIcon: 'fa-arrow-down', 
                badgeText: alerteCount > 0 ? `${alerteCount} en alerte` : 'Sous contrôle', 
                bench: 'Seuil < 5% volume' 
            },
            { 
                titre: 'Conformité des Pièces', 
                valeur: `${(Math.min(99.8, avgConformite + 1.2)).toFixed(1)}%`, 
                unite: 'Transmises', 
                icon: 'fa-stamp', 
                colorTheme: 'red', 
                progress: Math.min(100, avgConformite + 1.2), 
                progressColor: 'green', 
                badgeClass: 'badge-success', 
                badgeIcon: 'fa-certificate', 
                badgeText: `${validCount} validés`, 
                bench: `${piecesCount.toLocaleString()} pièces certifiées` 
            }
        ];
    }

    get currentBarChartData() {
        const items = this.filteredItems;
        const baseRate = items.length ? Math.round(items.reduce((acc, i) => acc + i.tauxConformite, 0) / items.length) : 80;
        return [
            { label: 'Jan', val: Math.max(50, Math.min(99, baseRate - 12)) },
            { label: 'Fév', val: Math.max(55, Math.min(99, baseRate - 6)) },
            { label: 'Mar', val: Math.max(60, Math.min(99, baseRate)) },
            { label: 'Avr', val: Math.max(58, Math.min(99, baseRate - 4)) },
            { label: 'Mai', val: Math.max(65, Math.min(99, baseRate + 2)) },
            { label: 'Juin', val: Math.max(70, Math.min(99, baseRate + 5)) }
        ];
    }

    get currentDonutData() {
        const items = this.filteredItems;
        if (items.length === 0) {
            return {
                rate: '0%',
                rateDash: '0',
                metrics: [
                    { label: 'Comptes Conformes', val: '0%', color: '#10b981' },
                    { label: 'En Instruction', val: '0%', color: '#F77F00' },
                    { label: 'Alertes / Écarts', val: '0%', color: '#ef4444' }
                ]
            };
        }

        const validCount = items.filter(i => i.statut === 'valide').length;
        const consolCount = items.filter(i => i.statut === 'consolidation').length;
        const alerteCount = items.filter(i => i.statut === 'alerte').length;
        const total = items.length;

        const validPct = ((validCount / total) * 100).toFixed(1);
        const consolPct = ((consolCount / total) * 100).toFixed(1);
        const alertePct = ((alerteCount / total) * 100).toFixed(1);

        const avgConformite = (items.reduce((acc, i) => acc + i.tauxConformite, 0) / total).toFixed(1);

        return {
            rate: `${avgConformite}%`,
            rateDash: avgConformite,
            metrics: [
                { label: 'Comptes Conformes', val: `${validPct}% (${validCount})`, color: '#10b981' },
                { label: 'En Instruction', val: `${consolPct}% (${consolCount})`, color: '#F77F00' },
                { label: 'Alertes / Écarts', val: `${alertePct}% (${alerteCount})`, color: '#ef4444' }
            ]
        };
    }

    get currentTelemetry() {
        const items = this.filteredItems;
        const totalBudget = items.reduce((acc, i) => acc + i.montantVal, 0);
        const validCount = items.filter(i => i.statut === 'valide').length;
        const avgConformite = items.length ? (items.reduce((acc, i) => acc + i.tauxConformite, 0) / items.length) : 0;
        const restesAmount = (totalBudget * (100 - avgConformite) / 100);

        return {
            budgetGere: `${totalBudget.toFixed(3)} Mds FCFA`,
            comptesCertifies: `${validCount} / ${items.length} (${items.length ? Math.round((validCount / items.length) * 100) : 0}%)`,
            restesInstance: restesAmount >= 1 ? `${restesAmount.toFixed(3)} Mds FCFA` : `${Math.round(restesAmount * 1000)} M FCFA`
        };
    }
}
