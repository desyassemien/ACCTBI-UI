import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

export interface StatItem {
    ref: string;
    titre: string;
    domaine: string;
    domaineKey: 'subventions' | 'engagements' | 'cooperation' | 'previsions';
    ministere: string;
    localite: string;
    periode: string;
    source: string;
    montant: string;
    montantVal: number;
    tauxRealisation: number;
    statut: 'valide' | 'consolidation' | 'alerte';
    statutLabel: string;
    avatarInitials: string;
    avatarClass: string;
}

@Component({
    selector: 'app-statistiques',
    standalone: true,
    imports: [CommonModule, FormsModule, AnalyseSelectorComponent, RouterLink],
    templateUrl: './statistiques.component.html',
    styleUrl: './statistiques.component.scss'
})
export class StatistiquesComponent {

    // --- NAVIGATION & SUB-DOMAIN TABS ---
    activeSubDomain: 'subventions' | 'engagements' | 'cooperation' | 'previsions' = 'subventions';
    viewMode: 'synthese' | 'avancee' = 'synthese';

    // --- TOP FILTER STRIP ---
    activePeriod: string = 'Ce mois-ci (Mars 2026)';
    periodsList: string[] = [
        'Aujourd\'hui',
        'Cette semaine',
        'Ce mois-ci (Mars 2026)',
        '1er Trimestre 2026',
        'Exercice 2026',
        'Exercice 2025'
    ];

    activePerimetre: string = 'Tous les Secteurs & Ministères';
    perimetresList: string[] = [
        'Tous les Secteurs & Ministères',
        'Santé & Protection Sociale',
        'Éducation & Formation',
        'Infrastructures & Équipements',
        'Agriculture & Développement',
        'Économie, Finances & Budget'
    ];

    // --- FILTER CHIPS WITH "+ AJOUTER UN FILTRE" LOGIC ---
    filterChips: string[] = ['Taux Exécution > 85%', 'Restes à Payer < 15%', 'Flux Consolidés'];
    allAvailableChips: string[] = [
        'Taux Exécution > 85%',
        'Restes à Payer < 15%',
        'Flux Consolidés',
        'Subventions Prioritaires',
        'Restes à Payer > 60j',
        'Écart PCS/PCC < 5%',
        'Prévisions Réalisées > 90%',
        'Obligations Cautionnées (OC)',
        'Lettres de Change (LC)',
        'Comptes Spéciaux Bailleurs',
        'TVA Secteur Électrique',
        'Flux Douaniers Webfontaine',
        'Délai Paiement < 20j',
        'Anomalies de Rapprochement'
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

    // --- TABLE SEARCH & FILTER STATE ---
    searchQuery: string = '';
    tableFilter: 'all' | 'valide' | 'consolidation' | 'alerte' = 'all';

    // --- TOAST NOTIFICATION ---
    showToast: boolean = false;
    toastMessage: string = '';
    private toastTimeout: any;

    triggerToast(message: string) {
        this.toastMessage = message;
        this.showToast = true;
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        this.toastTimeout = setTimeout(() => {
            this.showToast = false;
        }, 3200);
    }

    // --- ADVANCED OLAP DRAG & DROP SELECTOR STATE ---
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

    // --- REPORTS & DELIVERABLES CATALOG (16 INSTITUTIONAL DELIVERABLES) ---
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
        const id = this.rapportIds[index];
        return `/statistiques/rapport/${id}`;
    }

    subsections = [
        // BLOC 1: SUBVENTIONS & APPROVISIONNEMENTS
        {
            titre: 'Situation des Subventions et Appros',
            description: 'Suivi global des flux entrants par source et dotations',
            icon: 'fas fa-hand-holding-dollar',
            bloc: 1,
            badge: 'Mensuel',
            freqClass: 'badge-primary'
        },
        {
            titre: 'Détail par Entité Bénéficiaire',
            description: 'EPN, Communes, SODE, Conseils Généraux, Districts',
            icon: 'fas fa-building-columns',
            bloc: 1,
            badge: 'Hebdo',
            freqClass: 'badge-info'
        },
        {
            titre: 'Situation Approvisionnements ACCDP',
            description: 'Agents comptables centraux des dépôts et trésor',
            icon: 'fas fa-warehouse',
            bloc: 1,
            badge: 'Journalier',
            freqClass: 'badge-success'
        },
        // BLOC 2: TRÉSORERIE & ENGAGEMENTS
        {
            titre: 'Situation des OC & LC',
            description: 'Obligations Cautionnées et Lettres de Change échues',
            icon: 'fas fa-file-invoice-dollar',
            bloc: 2,
            badge: 'Mensuel',
            freqClass: 'badge-primary'
        },
        {
            titre: 'Situation des Restes à Payer (RAP)',
            description: 'Indicateur crucial - Engagements ordonnancés non soldés',
            icon: 'fas fa-hourglass-end',
            bloc: 2,
            badge: 'Critique',
            freqClass: 'badge-danger'
        },
        {
            titre: 'Situation des Dépenses Prioritaires',
            description: 'Suivi des règlements stratégiques et urgences d\'État',
            icon: 'fas fa-star',
            bloc: 2,
            badge: 'Hebdo',
            freqClass: 'badge-warning'
        },
        {
            titre: 'Situation Soldes Comptes Principaux',
            description: 'État global des comptes transversaux et du CUT',
            icon: 'fas fa-building',
            bloc: 2,
            badge: 'Temps réel',
            freqClass: 'badge-success'
        },
        // BLOC 3: COOPÉRATION RÉGIONALE & SECTEURS SPÉCIFIQUES
        {
            titre: 'Situation UEMOA (PCS)',
            description: 'Prélèvement Communautaire de Solidarité et reversements',
            icon: 'fas fa-earth-africa',
            bloc: 3,
            badge: 'Trimestriel',
            freqClass: 'badge-info'
        },
        {
            titre: 'Situation CEDEAO (PCC)',
            description: 'Prélèvement Communautaire de Compensation et suivi',
            icon: 'fas fa-globe-africa',
            bloc: 3,
            badge: 'Trimestriel',
            freqClass: 'badge-info'
        },
        {
            titre: 'Situation TVA Secteur Électrique',
            description: 'Indicateur fiscal spécifique à l\'énergie et concessions',
            icon: 'fas fa-bolt',
            bloc: 3,
            badge: 'Mensuel',
            freqClass: 'badge-primary'
        },
        {
            titre: 'Situation Plateforme Webfontaine',
            description: 'Suivi des collectes douanières et fiscales en guichet unique',
            icon: 'fas fa-network-wired',
            bloc: 3,
            badge: 'Journalier',
            freqClass: 'badge-success'
        },
        // BLOC 4: PRÉVISIONS & SOLDES
        {
            titre: 'Prévision des Mois & Macro-Trésorerie',
            description: 'Projection des flux financiers et capacité d\'anticipation',
            icon: 'fas fa-chart-line',
            bloc: 4,
            badge: 'Stratégique',
            freqClass: 'badge-primary'
        },
        {
            titre: 'Situation Compte Principal (CUT)',
            description: 'État de la liquidité globale centralisée au Trésor',
            icon: 'fas fa-vault',
            bloc: 4,
            badge: 'Temps réel',
            freqClass: 'badge-success'
        },
        {
            titre: 'Situation Compte C2D (France/AFD)',
            description: 'Contrat de Désendettement et Développement bilatéral',
            icon: 'fas fa-file-contract',
            bloc: 4,
            badge: 'Bailleurs',
            freqClass: 'badge-info'
        },
        {
            titre: 'Situation Compte BAD',
            description: 'Ressources de la Banque Africaine de Développement',
            icon: 'fas fa-landmark',
            bloc: 4,
            badge: 'Bailleurs',
            freqClass: 'badge-info'
        },
        {
            titre: 'Situation Compte Investissement',
            description: 'Fonds dédiés aux dépenses de capital et grands projets',
            icon: 'fas fa-trowel-bricks',
            bloc: 4,
            badge: 'Investissement',
            freqClass: 'badge-warning'
        }
    ];

    // --- COMPREHENSIVE MULTI-SECTOR DATASET (RICH & ACCURATE) ---
    allStatItems: StatItem[] = [
        // === SUBVENTIONS & APPROVISIONNEMENTS ===
        {
            ref: 'STAT-SUB-2026-001',
            titre: 'Subventions de Fonctionnement aux EPN de Santé',
            domaine: 'Subventions & Appros',
            domaineKey: 'subventions',
            ministere: 'Santé & Protection Sociale',
            localite: 'National / CHU & CHR',
            periode: 'Mars 2026',
            source: 'DGBF / Trésor Public',
            montant: '8.450 Mds FCFA',
            montantVal: 8.45,
            tauxRealisation: 94.2,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'SAN',
            avatarClass: 'bg-primary-soft'
        },
        {
            ref: 'STAT-SUB-2026-002',
            titre: 'Dotations Budgétaires aux Universités & Lycées',
            domaine: 'Subventions & Appros',
            domaineKey: 'subventions',
            ministere: 'Éducation & Formation',
            localite: 'Abidjan / Bouaké / Daloa',
            periode: 'Mars 2026',
            source: 'DGBF / DGTCP',
            montant: '6.200 Mds FCFA',
            montantVal: 6.20,
            tauxRealisation: 88.5,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'EDU',
            avatarClass: 'bg-info-soft'
        },
        {
            ref: 'STAT-SUB-2026-003',
            titre: 'Dotations au Fonds d\'Entretien Routier (FER)',
            domaine: 'Subventions & Appros',
            domaineKey: 'subventions',
            ministere: 'Infrastructures & Équipements',
            localite: 'Réseau Routier National',
            periode: 'Mars 2026',
            source: 'DGBF / AGEROUTE',
            montant: '14.800 Mds FCFA',
            montantVal: 14.80,
            tauxRealisation: 86.5,
            statut: 'consolidation',
            statutLabel: 'En consolidation',
            avatarInitials: 'INF',
            avatarClass: 'bg-warning-soft'
        },
        {
            ref: 'STAT-SUB-2026-004',
            titre: 'Subventions Intrants & Filières Cacao/Café',
            domaine: 'Subventions & Appros',
            domaineKey: 'subventions',
            ministere: 'Agriculture & Développement',
            localite: 'Coopératives de l\'Intérieur',
            periode: 'Mars 2026',
            source: 'Conseil Cacao-Café / Trésor',
            montant: '7.600 Mds FCFA',
            montantVal: 7.60,
            tauxRealisation: 91.0,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'AGR',
            avatarClass: 'bg-success-soft'
        },
        {
            ref: 'STAT-SUB-2026-005',
            titre: 'Approvisionnements Spéciaux des Postes ACCDP',
            domaine: 'Subventions & Appros',
            domaineKey: 'subventions',
            ministere: 'Économie, Finances & Budget',
            localite: 'Agences Comptables Dépôts',
            periode: 'Mars 2026',
            source: 'Comptabilité Centrale Trésor',
            montant: '16.400 Mds FCFA',
            montantVal: 16.40,
            tauxRealisation: 98.4,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'FIN',
            avatarClass: 'bg-primary-soft'
        },
        {
            ref: 'STAT-SUB-2026-006',
            titre: 'Bourses Nationales & Allocations d\'Études CROU',
            domaine: 'Subventions & Appros',
            domaineKey: 'subventions',
            ministere: 'Éducation & Formation',
            localite: 'Campus Universitaires Cocody & Abobo',
            periode: 'Mars 2026',
            source: 'Direction des Bourses / Trésor',
            montant: '3.120 Mds FCFA',
            montantVal: 3.12,
            tauxRealisation: 92.4,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'EDU',
            avatarClass: 'bg-info-soft'
        },
        {
            ref: 'STAT-SUB-2026-007',
            titre: 'Subvention Pharmacie de la Santé Publique (PSP)',
            domaine: 'Subventions & Appros',
            domaineKey: 'subventions',
            ministere: 'Santé & Protection Sociale',
            localite: 'Dépôts Centraux PSP CI',
            periode: 'Mars 2026',
            source: 'DGBF / Trésor Public',
            montant: '4.850 Mds FCFA',
            montantVal: 4.85,
            tauxRealisation: 96.8,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'SAN',
            avatarClass: 'bg-primary-soft'
        },
        {
            ref: 'STAT-SUB-2026-008',
            titre: 'Subventions Projets Pistes Rurales & Hydraulique',
            domaine: 'Subventions & Appros',
            domaineKey: 'subventions',
            ministere: 'Infrastructures & Équipements',
            localite: 'Régions Gbêkê, Poro, Cavally',
            periode: 'Mars 2026',
            source: 'Direction Générale des Infrastructures',
            montant: '5.400 Mds FCFA',
            montantVal: 5.40,
            tauxRealisation: 81.0,
            statut: 'alerte',
            statutLabel: 'En attente justification',
            avatarInitials: 'INF',
            avatarClass: 'bg-danger-soft'
        },

        // === TRÉSORERIE & ENGAGEMENTS (RAP / OC) ===
        {
            ref: 'STAT-ENG-2026-009',
            titre: 'Obligations Cautionnées Douanes & Impôts',
            domaine: 'Trésorerie & Engagements',
            domaineKey: 'engagements',
            ministere: 'Économie, Finances & Budget',
            localite: 'Guichet Portuaire Abidjan',
            periode: 'Mars 2026',
            source: 'Direction des Douanes CI',
            montant: '48.700 Mds FCFA',
            montantVal: 48.70,
            tauxRealisation: 96.0,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'FIN',
            avatarClass: 'bg-primary-soft'
        },
        {
            ref: 'STAT-ENG-2026-010',
            titre: 'Restes à Payer Fournisseurs d\'Infrastructures BTP',
            domaine: 'Trésorerie & Engagements',
            domaineKey: 'engagements',
            ministere: 'Infrastructures & Équipements',
            localite: 'Chantiers Nationaux',
            periode: 'Mars 2026',
            source: 'Chaîne Dépense SIGFiP',
            montant: '14.800 Mds FCFA',
            montantVal: 14.80,
            tauxRealisation: 68.4,
            statut: 'alerte',
            statutLabel: 'Seuil Critique > 60j',
            avatarInitials: 'INF',
            avatarClass: 'bg-danger-soft'
        },
        {
            ref: 'STAT-ENG-2026-011',
            titre: 'Engagements Matériel Biomédical & Hôpitaux',
            domaine: 'Trésorerie & Engagements',
            domaineKey: 'engagements',
            ministere: 'Santé & Protection Sociale',
            localite: 'Pharmacie de la Santé Publique',
            periode: 'Mars 2026',
            source: 'Dépenses Prioritaires ACCT',
            montant: '5.800 Mds FCFA',
            montantVal: 5.80,
            tauxRealisation: 95.0,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'SAN',
            avatarClass: 'bg-success-soft'
        },
        {
            ref: 'STAT-ENG-2026-012',
            titre: 'Restes à Payer Équipements Scolaires & Universités',
            domaine: 'Trésorerie & Engagements',
            domaineKey: 'engagements',
            ministere: 'Éducation & Formation',
            localite: 'Centres Régionaux CROU',
            periode: 'Mars 2026',
            source: 'Ordonnancement ACCT',
            montant: '4.150 Mds FCFA',
            montantVal: 4.15,
            tauxRealisation: 88.0,
            statut: 'consolidation',
            statutLabel: 'En consolidation',
            avatarInitials: 'EDU',
            avatarClass: 'bg-info-soft'
        },
        {
            ref: 'STAT-ENG-2026-013',
            titre: 'Engagements Pistes Rurales & Aménagements Hydro-Agricoles',
            domaine: 'Trésorerie & Engagements',
            domaineKey: 'engagements',
            ministere: 'Agriculture & Développement',
            localite: 'Zones Rurales Centre-Nord',
            periode: 'Mars 2026',
            source: 'Fonds Spéciaux Développement',
            montant: '3.400 Mds FCFA',
            montantVal: 3.40,
            tauxRealisation: 92.5,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'AGR',
            avatarClass: 'bg-warning-soft'
        },
        {
            ref: 'STAT-ENG-2026-014',
            titre: 'Engagements Fournitures Laboratoires & Écoles Primaires',
            domaine: 'Trésorerie & Engagements',
            domaineKey: 'engagements',
            ministere: 'Éducation & Formation',
            localite: 'DREN Abidjan, Yamoussoukro, Korhogo',
            periode: 'Mars 2026',
            source: 'Chaîne de la Dépense ACCT',
            montant: '2.800 Mds FCFA',
            montantVal: 2.80,
            tauxRealisation: 94.5,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'EDU',
            avatarClass: 'bg-info-soft'
        },

        // === INTÉGRATION RÉGIONALE (UEMOA / CEDEAO) ===
        {
            ref: 'STAT-COP-2026-015',
            titre: 'Prélèvement Communautaire de Solidarité (PCS UEMOA)',
            domaine: 'Intégration Régionale',
            domaineKey: 'cooperation',
            ministere: 'Économie, Finances & Budget',
            localite: 'Commission UEMOA',
            periode: 'T1 2026',
            source: 'Commission UEMOA / DGTCP',
            montant: '12.600 Mds FCFA',
            montantVal: 12.60,
            tauxRealisation: 98.0,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'FIN',
            avatarClass: 'bg-primary-soft'
        },
        {
            ref: 'STAT-COP-2026-016',
            titre: 'Programmes Sanitaires Régionaux UEMOA/OOAS',
            domaine: 'Intégration Régionale',
            domaineKey: 'cooperation',
            ministere: 'Santé & Protection Sociale',
            localite: 'Sous-région Ouest-Africaine',
            periode: 'T1 2026',
            source: 'Organisation Ouest-Africaine Santé',
            montant: '3.200 Mds FCFA',
            montantVal: 3.20,
            tauxRealisation: 99.1,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'SAN',
            avatarClass: 'bg-success-soft'
        },
        {
            ref: 'STAT-COP-2026-017',
            titre: 'Bourses et Mobilité Régionale CAMES / CEDEAO',
            domaine: 'Intégration Régionale',
            domaineKey: 'cooperation',
            ministere: 'Éducation & Formation',
            localite: 'Universités Régionales',
            periode: 'T1 2026',
            source: 'Commission CEDEAO Éducation',
            montant: '1.850 Mds FCFA',
            montantVal: 1.85,
            tauxRealisation: 98.2,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'EDU',
            avatarClass: 'bg-info-soft'
        },
        {
            ref: 'STAT-COP-2026-018',
            titre: 'Corridors et Postes Frontières Juxtaposés',
            domaine: 'Intégration Régionale',
            domaineKey: 'cooperation',
            ministere: 'Infrastructures & Équipements',
            localite: 'Frontières Noé / Laléraba',
            periode: 'T1 2026',
            source: 'UEMOA Infrastructures',
            montant: '11.400 Mds FCFA',
            montantVal: 11.40,
            tauxRealisation: 94.0,
            statut: 'consolidation',
            statutLabel: 'En consolidation',
            avatarInitials: 'INF',
            avatarClass: 'bg-warning-soft'
        },
        {
            ref: 'STAT-COP-2026-019',
            titre: 'Flux Commerciaux Céréaliers & Pastoralisme CEDEAO',
            domaine: 'Intégration Régionale',
            domaineKey: 'cooperation',
            ministere: 'Agriculture & Développement',
            localite: 'Corridors Nord / Sahel',
            periode: 'T1 2026',
            source: 'BIDC / CEDEAO Agriculture',
            montant: '6.500 Mds FCFA',
            montantVal: 6.50,
            tauxRealisation: 96.0,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'AGR',
            avatarClass: 'bg-success-soft'
        },

        // === PRÉVISIONS & SOLDES DWH ===
        {
            ref: 'STAT-PREV-2026-020',
            titre: 'Liquidité Globale Compte Unique du Trésor (CUT)',
            domaine: 'Prévisions & Soldes',
            domaineKey: 'previsions',
            ministere: 'Économie, Finances & Budget',
            localite: 'BCEAO Siège / ACCT',
            periode: 'Mars 2026',
            source: 'Direction de la Prévision',
            montant: '14.520 Mds FCFA',
            montantVal: 14.52,
            tauxRealisation: 96.5,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'FIN',
            avatarClass: 'bg-primary-soft'
        },
        {
            ref: 'STAT-PREV-2026-021',
            titre: 'Projections Budget d\'Investissement Éducation T2',
            domaine: 'Prévisions & Soldes',
            domaineKey: 'previsions',
            ministere: 'Éducation & Formation',
            localite: 'Lycées Professionnels & Campus',
            periode: 'Mars 2026',
            source: 'Direction de la Prévision DGBF',
            montant: '18.500 Mds FCFA',
            montantVal: 18.50,
            tauxRealisation: 94.1,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'EDU',
            avatarClass: 'bg-info-soft'
        },
        {
            ref: 'STAT-PREV-2026-022',
            titre: 'Prévisions Décaissements Grands Travaux & Routes',
            domaine: 'Prévisions & Soldes',
            domaineKey: 'previsions',
            ministere: 'Infrastructures & Équipements',
            localite: 'Projets Autoroutes & Ponts',
            periode: 'Mars 2026',
            source: 'DGTCP / Bailleurs',
            montant: '25.000 Mds FCFA',
            montantVal: 25.00,
            tauxRealisation: 89.0,
            statut: 'consolidation',
            statutLabel: 'En consolidation',
            avatarInitials: 'INF',
            avatarClass: 'bg-warning-soft'
        },
        {
            ref: 'STAT-PREV-2026-023',
            titre: 'Décaissements Fonds C2D France / Filières Rurales',
            domaine: 'Prévisions & Soldes',
            domaineKey: 'previsions',
            ministere: 'Agriculture & Développement',
            localite: 'Projets Filières Anacarde/Cacao',
            periode: 'Mars 2026',
            source: 'Agence Française Dév.',
            montant: '3.870 Mds FCFA',
            montantVal: 3.87,
            tauxRealisation: 95.0,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'AGR',
            avatarClass: 'bg-success-soft'
        },
        {
            ref: 'STAT-PREV-2026-024',
            titre: 'Prévisions Dépenses d\'Urgences Hospitalières T2',
            domaine: 'Prévisions & Soldes',
            domaineKey: 'previsions',
            ministere: 'Santé & Protection Sociale',
            localite: 'SAMU & Urgences Nationales',
            periode: 'Mars 2026',
            source: 'Ministère Santé / DGBF',
            montant: '12.200 Mds FCFA',
            montantVal: 12.20,
            tauxRealisation: 93.5,
            statut: 'valide',
            statutLabel: 'Consolidé',
            avatarInitials: 'SAN',
            avatarClass: 'bg-primary-soft'
        }
    ];

    filteredItems: StatItem[] = [];

    constructor() {
        this.updateFilteredItems();
    }

    switchSubDomain(domain: 'subventions' | 'engagements' | 'cooperation' | 'previsions') {
        this.activeSubDomain = domain;
        this.triggerToast(`Domaine sélectionné : ${this.getSubDomainLabel(domain)}`);
        this.updateFilteredItems();
    }

    getSubDomainLabel(domain: string): string {
        switch (domain) {
            case 'subventions': return 'Subventions & Approvisionnements';
            case 'engagements': return 'Trésorerie & Engagements (RAP/OC)';
            case 'cooperation': return 'Intégration Régionale (UEMOA/CEDEAO)';
            case 'previsions': return 'Prévisions Macro & Soldes';
            default: return 'Statistiques Générales';
        }
    }

    selectPeriod(p: string) {
        this.activePeriod = p;
        this.triggerToast(`Période sélectionnée : ${p}`);
        this.updateFilteredItems();
    }

    selectPerimetre(perim: string) {
        this.activePerimetre = perim;
        this.triggerToast(`Données actualisées pour : ${perim}`);
        this.updateFilteredItems();
    }

    setTableFilter(filter: 'all' | 'valide' | 'consolidation' | 'alerte') {
        this.tableFilter = filter;
        this.updateFilteredItems();
    }

    private matchesPerimetre(itemMinistere: string): boolean {
        if (this.activePerimetre === 'Tous les Secteurs & Ministères') return true;
        const p = this.activePerimetre.toLowerCase();
        const m = itemMinistere.toLowerCase();
        if (p.includes('santé') && m.includes('santé')) return true;
        if (p.includes('éduc') && (m.includes('éduc') || m.includes('formation'))) return true;
        if (p.includes('infra') && m.includes('infra')) return true;
        if (p.includes('agri') && m.includes('agri')) return true;
        if (p.includes('écono') && (m.includes('écono') || m.includes('finan') || m.includes('budget'))) return true;
        return false;
    }

    updateFilteredItems() {
        let items = [...this.allStatItems];

        // 1. Filter by Active Subdomain
        items = items.filter(i => i.domaineKey === this.activeSubDomain);

        // 2. Filter by Perimeter / Sector
        items = items.filter(i => this.matchesPerimetre(i.ministere));

        // 3. Filter by Search Query
        if (this.searchQuery.trim()) {
            const q = this.searchQuery.toLowerCase().trim();
            items = items.filter(i =>
                i.ref.toLowerCase().includes(q) ||
                i.titre.toLowerCase().includes(q) ||
                i.ministere.toLowerCase().includes(q) ||
                i.source.toLowerCase().includes(q) ||
                i.localite.toLowerCase().includes(q)
            );
        }

        // 4. Filter by Status Pill
        if (this.tableFilter !== 'all') {
            items = items.filter(i => i.statut === this.tableFilter);
        }

        // 5. Filter by Chips
        if (this.filterChips.includes('Restes à Payer > 60j') && this.tableFilter === 'all') {
            items = items.filter(i => i.statut === 'alerte');
        }
        if (this.filterChips.includes('Taux Exécution > 85%')) {
            items = items.filter(i => i.tauxRealisation >= 80);
        }
        if (this.filterChips.includes('Flux Consolidés') && this.tableFilter === 'all') {
            items = items.filter(i => i.statut === 'valide' || i.statut === 'consolidation');
        }

        this.filteredItems = items;
    }

    getCount(type: 'all' | 'valide' | 'consolidation' | 'alerte'): number {
        let items = this.allStatItems.filter(i => i.domaineKey === this.activeSubDomain);
        items = items.filter(i => this.matchesPerimetre(i.ministere));
        if (type === 'all') return items.length;
        return items.filter(i => i.statut === type).length;
    }

    // --- DYNAMIC CHART DATA RESPONSIVE TO SECTOR ---
    get currentBarChartData() {
        const p = this.activePerimetre;
        if (p.includes('Santé')) {
            return [
                { label: 'Jan', val: 84 },
                { label: 'Fév', val: 91 },
                { label: 'Mar', val: 96 },
                { label: 'Avr', val: 88 },
                { label: 'Mai', val: 93 },
                { label: 'Juin', val: 97 }
            ];
        }
        if (p.includes('Éducation')) {
            return [
                { label: 'Jan', val: 78 },
                { label: 'Fév', val: 82 },
                { label: 'Mar', val: 89 },
                { label: 'Avr', val: 85 },
                { label: 'Mai', val: 91 },
                { label: 'Juin', val: 94 }
            ];
        }
        if (p.includes('Infrastructures')) {
            return [
                { label: 'Jan', val: 68 },
                { label: 'Fév', val: 74 },
                { label: 'Mar', val: 86 },
                { label: 'Avr', val: 79 },
                { label: 'Mai', val: 85 },
                { label: 'Juin', val: 89 }
            ];
        }
        if (p.includes('Agriculture')) {
            return [
                { label: 'Jan', val: 72 },
                { label: 'Fév', val: 80 },
                { label: 'Mar', val: 91 },
                { label: 'Avr', val: 86 },
                { label: 'Mai', val: 88 },
                { label: 'Juin', val: 93 }
            ];
        }
        if (p.includes('Économie')) {
            return [
                { label: 'Jan', val: 92 },
                { label: 'Fév', val: 95 },
                { label: 'Mar', val: 98 },
                { label: 'Avr', val: 94 },
                { label: 'Mai', val: 97 },
                { label: 'Juin', val: 99 }
            ];
        }
        return [
            { label: 'Jan', val: 85 },
            { label: 'Fév', val: 72 },
            { label: 'Mar', val: 94 },
            { label: 'Avr', val: 78 },
            { label: 'Mai', val: 90 },
            { label: 'Juin', val: 96 }
        ];
    }

    get currentLinePoints(): string {
        const bars = this.currentBarChartData;
        const xs = [20, 80, 160, 240, 320, 400];
        return bars.map((b, i) => `${xs[i]},${Math.round(135 - (b.val * 1.1))}`).join(' ');
    }

    get currentLineCircles() {
        const bars = this.currentBarChartData;
        const xs = [20, 80, 160, 240, 320, 400];
        return bars.map((b, i) => ({
            cx: xs[i],
            cy: Math.round(135 - (b.val * 1.1)),
            val: b.val
        }));
    }

    get currentDonutData() {
        const p = this.activePerimetre;
        if (p.includes('Santé')) {
            return {
                rate: '94.8%',
                rateDash: 94.8,
                title: 'Secteur Santé & Social',
                sub: 'Allocation par pôle de dépense sanitaire',
                metrics: [
                    { label: 'Centres Hospitaliers Universitaires (CHU)', val: '52%', color: '#F77F00' },
                    { label: 'Pharmacie de la Santé Publique (PSP)', val: '33%', color: '#10b981' },
                    { label: 'Programmes de Prévention & Vaccins', val: '15%', color: '#0284c7' }
                ]
            };
        }
        if (p.includes('Éducation')) {
            return {
                rate: '92.4%',
                rateDash: 92.4,
                title: 'Secteur Éducation & Supérieur',
                sub: 'Répartition bourses, campus et salaires',
                metrics: [
                    { label: 'Universités & Grandes Écoles', val: '48%', color: '#F77F00' },
                    { label: 'Centres Régionaux CROU & Bourses', val: '32%', color: '#10b981' },
                    { label: 'Enseignement Technique & Pro.', val: '20%', color: '#0284c7' }
                ]
            };
        }
        if (p.includes('Infrastructures')) {
            return {
                rate: '86.5%',
                rateDash: 86.5,
                title: 'Infrastructures & Travaux',
                sub: 'Ventilation BTP, voirie et ponts',
                metrics: [
                    { label: 'Fonds Entretien Routier (FER)', val: '58%', color: '#F77F00' },
                    { label: 'Grands Ouvrages d\'Art & Ponts', val: '27%', color: '#10b981' },
                    { label: 'Pistes Rurales de Désenclavement', val: '15%', color: '#0284c7' }
                ]
            };
        }
        if (p.includes('Agriculture')) {
            return {
                rate: '93.2%',
                rateDash: 93.2,
                title: 'Agriculture & Filières Rurales',
                sub: 'Soutien aux filières et coopératives',
                metrics: [
                    { label: 'Filière Cacao-Café & Intrants', val: '50%', color: '#F77F00' },
                    { label: 'Filière Anacarde & Céréales', val: '30%', color: '#10b981' },
                    { label: 'Hydraulique Pastorale & Élevage', val: '20%', color: '#0284c7' }
                ]
            };
        }
        if (p.includes('Économie')) {
            return {
                rate: '98.5%',
                rateDash: 98.5,
                title: 'Finances Publiques & Trésor',
                sub: 'Mobilisation des recettes et CUT',
                metrics: [
                    { label: 'Compte Unique du Trésor (CUT)', val: '62%', color: '#F77F00' },
                    { label: 'Obligations Cautionnées (OC)', val: '26%', color: '#10b981' },
                    { label: 'Comptes Bailleurs & C2D', val: '12%', color: '#0284c7' }
                ]
            };
        }
        return {
            rate: '91.4%',
            rateDash: 91.4,
            title: 'Répartition Sectorielle & Ratios',
            sub: 'Poids budgétaire par typologie d\'agrégat',
            metrics: [
                { label: 'Secteur Social & Éducatif', val: '54%', color: '#F77F00' },
                { label: 'Infrastructures & Équipements', val: '28%', color: '#10b981' },
                { label: 'Autres Comptes & Dépôts', val: '18%', color: '#0284c7' }
            ]
        };
    }

    // --- DYNAMIC KPI METRICS FULLY RESPONSIVE TO SECTOR SELECTION ---
    get currentKpis() {
        const p = this.activePerimetre;
        const isSante = p.includes('Santé');
        const isEducation = p.includes('Éducation');
        const isInfra = p.includes('Infrastructures');
        const isAgri = p.includes('Agriculture');
        const isFinance = p.includes('Économie');

        // SUBVENTIONS
        if (this.activeSubDomain === 'subventions') {
            if (isSante) {
                return [
                    { titre: 'Subventions Décaissées Santé', valeur: '8.450', unite: 'Mds FCFA', progress: 94.2, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Objectif atteint (+4.2%)', badgeIcon: 'fa-arrow-trend-up', bench: 'Seuil légal: 80%-100%', icon: 'fa-hospital', colorTheme: 'orange' },
                    { titre: 'Délai Paiement Santé', valeur: '14.2', unite: 'Jours ouvrés', progress: 85, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-3.8j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Objectif : < 30j', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Justification EPN', valeur: '96.8%', unite: 'des dotations', progress: 96.8, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme (+6.8%)', badgeIcon: 'fa-check', bench: 'Cible : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Concentration Top 3 CHU', valeur: '44.5%', unite: 'du volume global', progress: 44.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Diversifié', badgeIcon: 'fa-check', bench: 'Plafond : < 50%', icon: 'fa-users-viewfinder', colorTheme: 'blue' }
                ];
            }
            if (isEducation) {
                return [
                    { titre: 'Dotations Éducation & Univ.', valeur: '6.200', unite: 'Mds FCFA', progress: 88.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Dans les prévisions', badgeIcon: 'fa-arrow-trend-up', bench: 'Dotation: 7.000 Mds', icon: 'fa-graduation-cap', colorTheme: 'orange' },
                    { titre: 'Délai Versement Bourses', valeur: '12.0', unite: 'Jours ouvrés', progress: 88, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Traitement accéléré', badgeIcon: 'fa-bolt', bench: 'Objectif : < 15j', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Justification Campus', valeur: '92.4%', unite: 'des dotations', progress: 92.4, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme (+2.4%)', badgeIcon: 'fa-check', bench: 'Cible : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Dossiers Bourses en cours', valeur: '1', unite: 'Session en validation', progress: 10, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Calendrier tenu', badgeIcon: 'fa-check', bench: 'Objectif : 0 retard', icon: 'fa-users-viewfinder', colorTheme: 'blue' }
                ];
            }
            if (isInfra) {
                return [
                    { titre: 'Dotations Fonds Routier', valeur: '14.800', unite: 'Mds FCFA', progress: 86.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Tranches débloquées', badgeIcon: 'fa-check', bench: 'Budget : 17.000 Mds', icon: 'fa-road', colorTheme: 'orange' },
                    { titre: 'Délai Déblocage Chantiers', valeur: '19.0', unite: 'Jours ouvrés', progress: 75, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Norme BTP respectée', badgeIcon: 'fa-check', bench: 'Cible : < 25j', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Réalisation Voirie', valeur: '86.5%', unite: 'des linéaires', progress: 86.5, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme', badgeIcon: 'fa-check', bench: 'Cible : > 80%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Chantiers en attente avis', valeur: '2', unite: 'Validations ACCT', progress: 20, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'En revue technique', badgeIcon: 'fa-triangle-exclamation', bench: 'Tolérance : < 5', icon: 'fa-bell', colorTheme: 'red' }
                ];
            }
            if (isAgri) {
                return [
                    { titre: 'Subventions Filières Agricoles', valeur: '7.600', unite: 'Mds FCFA', progress: 91.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Campagne soutenue', badgeIcon: 'fa-arrow-trend-up', bench: 'Dotation: 8.500 Mds', icon: 'fa-wheat-awn', colorTheme: 'orange' },
                    { titre: 'Délai Paiement Coopératives', valeur: '15.0', unite: 'Jours ouvrés', progress: 82, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-5j vs N-1', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 20j', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Justification Intrants', valeur: '94.0%', unite: 'des volumes', progress: 94.0, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme (+4.0%)', badgeIcon: 'fa-check', bench: 'Cible : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Coopératives Vérifiées', valeur: '48', unite: 'Structures rurales', progress: 96, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Contrôles à 96%', badgeIcon: 'fa-check', bench: 'Cible : 50', icon: 'fa-users-viewfinder', colorTheme: 'blue' }
                ];
            }
            if (isFinance) {
                return [
                    { titre: 'Appros Trésor & Dépôts', valeur: '16.400', unite: 'Mds FCFA', progress: 98.4, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Taux record (+8.4%)', badgeIcon: 'fa-arrow-trend-up', bench: 'Dotation: 16.500 Mds', icon: 'fa-vault', colorTheme: 'orange' },
                    { titre: 'Délai Centralisation Dépôts', valeur: '2.0', unite: 'Jours ouvrés', progress: 96, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Temps réel CUT', badgeIcon: 'fa-bolt', bench: 'Cible : < 3j', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Rapatriement Trésor', valeur: '99.4%', unite: 'des encaissements', progress: 99.4, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conformité totale', badgeIcon: 'fa-check', bench: 'Cible : > 98%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Écarts Solde Comptable', valeur: '0', unite: 'Anomalie détectée', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Équilibre parfait', badgeIcon: 'fa-check', bench: 'Tolérance : 0', icon: 'fa-bell', colorTheme: 'green' }
                ];
            }
            // Global default for Subventions
            return [
                { titre: 'Taux Exécution Subventions', valeur: '87.5%', unite: 'des dotations votées', progress: 87.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Seuil atteint (+7.5%)', badgeIcon: 'fa-arrow-trend-up', bench: 'Seuil : 80%-100%', icon: 'fa-hand-holding-dollar', colorTheme: 'orange' },
                { titre: 'Délai Moyen Subventions', valeur: '18.0', unite: 'Jours ouvrés', progress: 78, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-4.2j vs 2025', badgeIcon: 'fa-arrow-trend-down', bench: 'Objectif : < 30j', icon: 'fa-stopwatch', colorTheme: 'green' },
                { titre: 'Concentration Bénéficiaires', valeur: '52.3%', unite: 'Top 3 entités', progress: 52.3, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Vigilance (+2.3%)', badgeIcon: 'fa-circle-exclamation', bench: 'Cible : Top 3 < 50%', icon: 'fa-users-viewfinder', colorTheme: 'blue' },
                { titre: 'Écart de Rapprochement ACCDP', valeur: '2', unite: 'Dossiers à régulariser', progress: 15, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '1 critique > 45j', badgeIcon: 'fa-triangle-exclamation', bench: 'Tolérance solde : 0', icon: 'fa-bell', colorTheme: 'red' }
            ];
        }

        // ENGAGEMENTS (RAP / OC)
        if (this.activeSubDomain === 'engagements') {
            if (isEducation) {
                return [
                    { titre: 'RAP Écoles & Universités', valeur: '4.150', unite: 'Mds FCFA', progress: 78, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Dépenses maîtrisées', badgeIcon: 'fa-check', bench: 'Seuil RAP: < 5.0 Mds', icon: 'fa-graduation-cap', colorTheme: 'orange' },
                    { titre: 'Ancienneté RAP Éducation', valeur: '22', unite: 'Jours calendaires', progress: 88, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Apurement rapide', badgeIcon: 'fa-bolt', bench: 'Cible légale: < 45j', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Rapprochement Factures', valeur: '94.5%', unite: 'des bordereaux', progress: 94.5, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme (+4.5%)', badgeIcon: 'fa-check', bench: 'Cible : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Litiges Fournisseurs Scolaires', valeur: '0', unite: 'Blocage', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Zéro contentieux', badgeIcon: 'fa-check', bench: 'Tolérance : 0', icon: 'fa-bell', colorTheme: 'green' }
                ];
            }
            if (isInfra) {
                return [
                    { titre: 'RAP BTP & Grands Chantiers', valeur: '14.800', unite: 'Mds FCFA', progress: 85, progressColor: 'red', badgeClass: 'badge-danger', badgeText: 'Seuil élevé (+3.8%)', badgeIcon: 'fa-triangle-exclamation', bench: 'Plafond : 12.000 Mds', icon: 'fa-trowel-bricks', colorTheme: 'red' },
                    { titre: 'Ancienneté RAP Travaux', valeur: '68', unite: 'Jours calendaires', progress: 68, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Proche seuil 90j', badgeIcon: 'fa-circle-exclamation', bench: 'Alerte légale : > 90j', icon: 'fa-calendar-clock', colorTheme: 'green' },
                    { titre: 'Taux Validation Décomptes', valeur: '72.0%', unite: 'des attachements', progress: 72.0, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Contrôles en cours', badgeIcon: 'fa-hourglass-half', bench: 'Cible : > 85%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Chantiers avec RAP > 60j', valeur: '3', unite: 'Tronçons autoroutiers', progress: 30, progressColor: 'red', badgeClass: 'badge-danger', badgeText: 'Plan apurement actif', badgeIcon: 'fa-triangle-exclamation', bench: 'Tolérance : 0', icon: 'fa-bell', colorTheme: 'red' }
                ];
            }
            if (isSante) {
                return [
                    { titre: 'Engagements Matériel Médical', valeur: '5.800', unite: 'Mds FCFA', progress: 80, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Commandes validées', badgeIcon: 'fa-check', bench: 'Plafond : 7.000 Mds', icon: 'fa-hospital', colorTheme: 'orange' },
                    { titre: 'Ancienneté RAP Santé', valeur: '42', unite: 'Jours calendaires', progress: 85, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Dans les normes', badgeIcon: 'fa-check', bench: 'Seuil d\'alerte : > 90j', icon: 'fa-calendar-clock', colorTheme: 'green' },
                    { titre: 'Taux Rapprochement Pharmacie', valeur: '96.0%', unite: 'des livraisons', progress: 96.0, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme (+6%)', badgeIcon: 'fa-check', bench: 'Cible : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Factures en litige hôpitaux', valeur: '1', unite: 'Dossier pharmacie', progress: 8, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'En régularisation', badgeIcon: 'fa-circle-exclamation', bench: 'Tolérance : < 3', icon: 'fa-bell', colorTheme: 'red' }
                ];
            }
            if (isAgri) {
                return [
                    { titre: 'Engagements Pistes Rurales', valeur: '3.400', unite: 'Mds FCFA', progress: 88, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Engagements validés', badgeIcon: 'fa-check', bench: 'Budget : 4.000 Mds', icon: 'fa-wheat-awn', colorTheme: 'orange' },
                    { titre: 'Ancienneté RAP Filières', valeur: '31', unite: 'Jours calendaires', progress: 90, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Règlements à jour', badgeIcon: 'fa-check', bench: 'Cible : < 45j', icon: 'fa-stopwatch', colorTheme: 'green' },
                    { titre: 'Taux Rapprochement Bailleurs', valeur: '95.0%', unite: 'des dossiers BAD', progress: 95.0, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme (+5%)', badgeIcon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Alertes Décomptes Agricoles', valeur: '0', unite: 'Blocage', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Aucune alerte', badgeIcon: 'fa-check', bench: 'Tolérance : 0', icon: 'fa-bell', colorTheme: 'green' }
                ];
            }
            if (isFinance) {
                return [
                    { titre: 'Taux OC en Portefeuille', valeur: '48.700', unite: 'Mds FCFA', progress: 82, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Limite: 60.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Taux Restes à Payer Dépôts', valeur: '4.2%', unite: 'des dépôts Trésor', progress: 95, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Excellent contrôle', badgeIcon: 'fa-check', bench: 'Seuil : < 10%', icon: 'fa-hourglass-end', colorTheme: 'green' },
                    { titre: 'Délai Régularisation Trésor', valeur: '5.0', unite: 'Jours ouvrés', progress: 90, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Apurement immédiat', badgeIcon: 'fa-bolt', bench: 'Cible : < 7j', icon: 'fa-stopwatch', colorTheme: 'blue' },
                    { titre: 'Alertes Rapprochement Banques', valeur: '0', unite: 'Écart BCEAO', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Concordance totale', badgeIcon: 'fa-check', bench: 'Tolérance : 0', icon: 'fa-bell', colorTheme: 'green' }
                ];
            }
            return [
                { titre: 'Taux OC en Portefeuille', valeur: '48.700', unite: 'Mds FCFA', progress: 82, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Limite: 60.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                { titre: 'Taux Restes à Payer Global', valeur: '12.4%', unite: 'du budget ordonnancé', progress: 62, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Sous le seuil (-2.6%)', badgeIcon: 'fa-check', bench: 'Seuil d\'alerte: < 15%', icon: 'fa-hourglass-end', colorTheme: 'blue' },
                { titre: 'Ancienneté Moyenne RAP', valeur: '75', unite: 'Jours calendaires', progress: 75, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Seuil légal 90j', badgeIcon: 'fa-circle-exclamation', bench: 'Alerte : > 90j', icon: 'fa-calendar-clock', colorTheme: 'green' },
                { titre: 'RAP Critiques > 90 Jours', valeur: '3', unite: 'Engagements majeurs', progress: 30, progressColor: 'red', badgeClass: 'badge-danger', badgeText: 'Apurement requis', badgeIcon: 'fa-triangle-exclamation', bench: 'Tolérance RAP : 0', icon: 'fa-bell', colorTheme: 'red' }
            ];
        }

        // COOPERATION REGIONALE
        if (this.activeSubDomain === 'cooperation') {
            if (isEducation) {
                return [
                    { titre: 'Bourses Mobilité Régionale', valeur: '1.850', unite: 'Mds FCFA', progress: 92, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Fonds débloqués', badgeIcon: 'fa-check', bench: 'Accords UEMOA CAMES', icon: 'fa-graduation-cap', colorTheme: 'blue' },
                    { titre: 'Conformité Normes CAMES', valeur: '98.2%', unite: 'des diplômes homologués', progress: 98.2, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Excellente convergence', badgeIcon: 'fa-check', bench: 'Seuil : > 95%', icon: 'fa-award', colorTheme: 'green' },
                    { titre: 'Délai Virement Étudiants', valeur: '4.0', unite: 'Jours ouvrés', progress: 90, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Virements BCEAO directs', badgeIcon: 'fa-bolt', bench: 'Cible : < 5j', icon: 'fa-stopwatch', colorTheme: 'blue' },
                    { titre: 'Écart de reversement UEMOA', valeur: '0', unite: 'Litige', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Zéro écart', badgeIcon: 'fa-check', bench: 'Tolérance : 0', icon: 'fa-bell', colorTheme: 'green' }
                ];
            }
            if (isInfra) {
                return [
                    { titre: 'Corridors Régionaux UEMOA', valeur: '11.400', unite: 'Mds FCFA', progress: 94, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Financement conjoint', badgeIcon: 'fa-check', bench: 'Fonds UEMOA/BIDC', icon: 'fa-road', colorTheme: 'blue' },
                    { titre: 'Respect Gabarits & Poids', valeur: '94.0%', unite: 'des contrôles essieux', progress: 94.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Règlement 14 UEMOA', badgeIcon: 'fa-check', bench: 'Norme : > 90%', icon: 'fa-scale-balanced', colorTheme: 'green' },
                    { titre: 'Postes Frontières Juxtaposés', valeur: '3', unite: 'Gares ouvertes', progress: 100, progressColor: 'green', badgeClass: 'badge-success', badgeText: '100% opérationnels', badgeIcon: 'fa-check', bench: 'Cible : 3', icon: 'fa-building-flag', colorTheme: 'blue' },
                    { titre: 'Retards Décaissements BIDC', valeur: '1', unite: 'Dossier frontière', progress: 12, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'En déblocage', badgeIcon: 'fa-circle-exclamation', bench: 'Tolérance : < 2', icon: 'fa-bell', colorTheme: 'red' }
                ];
            }
            if (isSante) {
                return [
                    { titre: 'Programmes Sanitaires OOAS', valeur: '3.200', unite: 'Mds FCFA', progress: 99.1, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Excellente exécution', badgeIcon: 'fa-check', bench: 'Fonds UEMOA Santé', icon: 'fa-hospital', colorTheme: 'blue' },
                    { titre: 'Couverture Vaccinale UEMOA', valeur: '96.5%', unite: 'des objectifs régionaux', progress: 96.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme (+6.5%)', badgeIcon: 'fa-check', bench: 'Cible : > 90%', icon: 'fa-award', colorTheme: 'green' },
                    { titre: 'Délai Transferts Bailleurs', valeur: '3.5', unite: 'Jours ouvrés', progress: 92, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Virements fluides', badgeIcon: 'fa-bolt', bench: 'Cible : < 5j', icon: 'fa-stopwatch', colorTheme: 'blue' },
                    { titre: 'Écarts Subventions OMS', valeur: '0', unite: 'Anomalie', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Zéro anomalie', badgeIcon: 'fa-check', bench: 'Tolérance : 0', icon: 'fa-bell', colorTheme: 'green' }
                ];
            }
            if (isAgri) {
                return [
                    { titre: 'Corridors Céréaliers CEDEAO', valeur: '6.500', unite: 'Mds FCFA', progress: 96.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Flux fluides', badgeIcon: 'fa-check', bench: 'Accords CEDEAO Agri', icon: 'fa-wheat-awn', colorTheme: 'orange' },
                    { titre: 'Transhumance Pastorale UEMOA', valeur: '98.0%', unite: 'de conformité certificats', progress: 98.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Contrôles sanitaires ok', badgeIcon: 'fa-check', bench: 'Norme : > 95%', icon: 'fa-award', colorTheme: 'green' },
                    { titre: 'Fluidité Postes Nord', valeur: '1.2', unite: 'Heure par convoi', progress: 95, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Passage express', badgeIcon: 'fa-bolt', bench: 'Cible : < 2h', icon: 'fa-stopwatch', colorTheme: 'blue' },
                    { titre: 'Alertes Sanitaires Bétail', valeur: '0', unite: 'Foyer détecté', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Sécurité totale', badgeIcon: 'fa-check', bench: 'Tolérance : 0', icon: 'fa-bell', colorTheme: 'green' }
                ];
            }
            if (isFinance) {
                return [
                    { titre: 'Prélèvement Solidarité UEMOA (PCS)', valeur: '12.600', unite: 'Mds FCFA', progress: 98.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Reversement conforme', badgeIcon: 'fa-check', bench: 'Commission UEMOA', icon: 'fa-earth-africa', colorTheme: 'blue' },
                    { titre: 'Compensation CEDEAO (PCC)', valeur: '8.450', unite: 'Mds FCFA', progress: 94.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Flux régularisés', badgeIcon: 'fa-check', bench: 'Cible atteinte', icon: 'fa-globe-africa', colorTheme: 'orange' },
                    { titre: 'Écart Concordance PCS/PCC', valeur: '2.1%', unite: 'd\'écart constaté', progress: 97, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme (-7.9%)', badgeIcon: 'fa-check', bench: 'Seuil légal : < 10%', icon: 'fa-scale-balanced', colorTheme: 'blue' },
                    { titre: 'Alertes Fiscales Webfontaine', valeur: '0', unite: 'Écart dédouanement', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Zéro divergence', badgeIcon: 'fa-check', bench: 'Zéro défaut', icon: 'fa-bell', colorTheme: 'green' }
                ];
            }
            return [
                { titre: 'Prélèvement Solidarité UEMOA (PCS)', valeur: '24.3%', unite: 'du volume régional', progress: 81, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Tendance positive', badgeIcon: 'fa-arrow-trend-up', bench: 'Reversement conforme', icon: 'fa-earth-africa', colorTheme: 'blue' },
                { titre: 'Compensation CEDEAO (PCC)', valeur: '42.1%', unite: 'du volume régional', progress: 75, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Flux stabilisés', badgeIcon: 'fa-check', bench: 'Cible atteinte', icon: 'fa-globe-africa', colorTheme: 'orange' },
                { titre: 'Écart de Concordance PCS/PCC', valeur: '8.1%', unite: 'd\'écart maximum', progress: 81, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme (-1.9%)', badgeIcon: 'fa-check', bench: 'Seuil légal : < 10%', icon: 'fa-scale-balanced', colorTheme: 'blue' },
                { titre: 'Alertes Fiscales Webfontaine', valeur: '1', unite: 'Écart dédouanement', progress: 8, progressColor: 'red', badgeClass: 'badge-danger', badgeText: 'Contrôle douane requis', badgeIcon: 'fa-triangle-exclamation', bench: 'Zéro défaut', icon: 'fa-bell', colorTheme: 'red' }
            ];
        }

        // PREVISIONS & SOLDES
        if (isEducation) {
            return [
                { titre: 'Prévisions Budget Éducation T2', valeur: '18.500', unite: 'Mds FCFA', progress: 94.1, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Précision élevée (+4.1%)', badgeIcon: 'fa-arrow-trend-up', bench: 'Marge : ±10%', icon: 'fa-graduation-cap', colorTheme: 'green' },
                { titre: 'Tirages BAD Projet Éducation', valeur: '4.650', unite: 'Mds FCFA', progress: 71.5, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Tranche en cours', badgeIcon: 'fa-hourglass-half', bench: 'Objectif : 6.500 Mds', icon: 'fa-landmark', colorTheme: 'orange' },
                { titre: 'Taux Couverture Dépenses Univ.', valeur: '98.5%', unite: 'des engagements', progress: 98.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Sécurisé à 98.5%', badgeIcon: 'fa-check', bench: 'Cible : > 95%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Écarts Prévisionnels Scolaires', valeur: '1', unite: 'Ligne équipement', progress: 10, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Écart minime (< 2%)', badgeIcon: 'fa-check', bench: 'Tolérance : < 3', icon: 'fa-bell', colorTheme: 'green' }
            ];
        }
        if (isInfra) {
            return [
                { titre: 'Prévisions Décaissements Travaux', valeur: '25.000', unite: 'Mds FCFA', progress: 89.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Cadence soutenue', badgeIcon: 'fa-arrow-trend-up', bench: 'Budget : 28.000 Mds', icon: 'fa-trowel-bricks', colorTheme: 'green' },
                { titre: 'Fonds Bailleurs Investissement', valeur: '15.200', unite: 'Mds FCFA', progress: 85.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Tranches mobilisées', badgeIcon: 'fa-check', bench: 'BAD / BOAD / BID', icon: 'fa-vault', colorTheme: 'orange' },
                { titre: 'Précision Modèle Prévisionnel', valeur: '92.0%', unite: 'de fiabilité', progress: 92.0, progressColor: 'amber', badgeClass: 'badge-success', badgeText: 'Conforme', badgeIcon: 'fa-check', bench: 'Marge : ±15%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Lignes en dépassement prévision', valeur: '2', unite: 'Ouvrages d\'art', progress: 20, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Ajustement requis', badgeIcon: 'fa-triangle-exclamation', bench: 'Tolérance : < 3', icon: 'fa-bell', colorTheme: 'red' }
            ];
        }
        if (isSante) {
            return [
                { titre: 'Prévisions Urgences Hospitalières', valeur: '12.200', unite: 'Mds FCFA', progress: 93.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Dotations T2 sécurisées', badgeIcon: 'fa-check', bench: 'Budget : 13.000 Mds', icon: 'fa-hospital', colorTheme: 'green' },
                { titre: 'Décaissements Fonds Santé AFD', valeur: '5.400', unite: 'Mds FCFA', progress: 88.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Tranche libérée', badgeIcon: 'fa-bolt', bench: 'C2D Santé CI', icon: 'fa-vault', colorTheme: 'orange' },
                { titre: 'Taux Couverture Besoins Médicaux', valeur: '97.0%', unite: 'des structures publiques', progress: 97.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Haute disponibilité', badgeIcon: 'fa-check', bench: 'Cible : > 95%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Alertes Dépassement Dotations', valeur: '0', unite: 'CHU', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Zéro dérive', badgeIcon: 'fa-check', bench: 'Tolérance : 0', icon: 'fa-bell', colorTheme: 'green' }
            ];
        }
        if (isAgri) {
            return [
                { titre: 'Projections Fonds Filières C2D', valeur: '3.870', unite: 'Mds FCFA', progress: 95.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Fonds mobilisés', badgeIcon: 'fa-check', bench: 'C2D Développement Rural', icon: 'fa-wheat-awn', colorTheme: 'green' },
                { titre: 'Financements Bailleurs Ruraux', valeur: '6.200', unite: 'Mds FCFA', progress: 90.0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Tranches FIDA débloquées', badgeIcon: 'fa-check', bench: 'FIDA / BAD Rural', icon: 'fa-landmark', colorTheme: 'orange' },
                { titre: 'Taux Mobilisation Campagne', valeur: '96.2%', unite: 'des crédits de campagne', progress: 96.2, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Campagne soutenue', badgeIcon: 'fa-check', bench: 'Cible : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Écarts Saisonniers Trésorerie', valeur: '1', unite: 'Ligne intrants', progress: 8, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Écart mineur', badgeIcon: 'fa-check', bench: 'Tolérance : < 3', icon: 'fa-bell', colorTheme: 'green' }
            ];
        }
        if (isFinance) {
            return [
                { titre: 'Solde Compte Principal (CUT)', valeur: '14.520', unite: 'Mds FCFA', progress: 96.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Liquidité optimale', badgeIcon: 'fa-check', bench: 'BCEAO Siège central', icon: 'fa-vault', colorTheme: 'green' },
                { titre: 'Encours Trésor Compte C2D', valeur: '3.870', unite: 'Mds FCFA', progress: 85.0, progressColor: 'blue', badgeClass: 'badge-success', badgeText: 'Fonds bilatéraux AFD', badgeIcon: 'fa-check', bench: 'Désendettement & Dév.', icon: 'fa-file-contract', colorTheme: 'blue' },
                { titre: 'Précision Prévisions Macro', valeur: '98.2%', unite: 'de fiabilité', progress: 98.2, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Modèle certifié', badgeIcon: 'fa-award', bench: 'Marge : ±5%', icon: 'fa-chart-line', colorTheme: 'orange' },
                { titre: 'Écarts Prévisions vs Réalisé', valeur: '0', unite: 'Anomalie', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Zéro divergence', badgeIcon: 'fa-check', bench: 'Tolérance : 0', icon: 'fa-bell', colorTheme: 'green' }
            ];
        }
        return [
            { titre: 'Taux Réalisation Prévisions', valeur: '91.2%', unite: 'de précision macro', progress: 91.2, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Haute fiabilité (+3.2%)', badgeIcon: 'fa-arrow-trend-up', bench: 'Marge tolérée : ±15%', icon: 'fa-chart-line', colorTheme: 'green' },
            { titre: 'Solde Compte Principal (CUT)', valeur: '14.520', unite: 'Mds FCFA', progress: 78, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Liquidité optimale', badgeIcon: 'fa-check', bench: 'BCEAO Siège central', icon: 'fa-vault', colorTheme: 'orange' },
            { titre: 'Encours Trésor Compte C2D', valeur: '3.870', unite: 'Mds FCFA', progress: 65, progressColor: 'blue', badgeClass: 'badge-success', badgeText: 'Fonds bilatéraux AFD', badgeIcon: 'fa-check', bench: 'Désendettement & Dév.', icon: 'fa-file-contract', colorTheme: 'blue' },
            { titre: 'Écarts Prévisions vs Réalisé', valeur: '4', unite: 'Lignes budgétaires', progress: 28, progressColor: 'red', badgeClass: 'badge-warning', badgeText: 'Ajustement T2 requis', badgeIcon: 'fa-triangle-exclamation', bench: 'Seuil : < 5 lignes', icon: 'fa-bell', colorTheme: 'red' }
        ];
    }

    // --- REFRESH & EXPORT ACTIONS ---
    refreshData() {
        this.updateFilteredItems();
        this.triggerToast('Données et agrégats statistiques synchronisés avec succès');
    }

    exportExcel() {
        this.triggerToast('Exportation du recueil statistique Excel en cours...');
    }

    exportPdf() {
        this.triggerToast('Génération du rapport de synthèse statistique PDF...');
    }
}
