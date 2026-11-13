import { Component, OnInit, ChangeDetectorRef, NgZone, ViewChildren, QueryList, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

export interface ComptaOperation {
    ref: string;
    compte: string;
    nature: string;
    libelle: string;
    dateOp: string;
    echeanceSub?: string;
    montant: string;
    montantUnite: string;
    typeOp: 'debit' | 'credit';
    progression: number;
    statut: 'rapproche' | 'en-cours' | 'ecart';
    statutLabel: string;
    avatarInitials: string;
    avatarClass: string;
    poste: string;
    periodTag: 'today' | 'week' | 'month' | 'q1' | 'y2026' | 'y2025';
}

export interface JournalEntry {
    ref: string;
    journal: string;
    piece: string;
    libelle: string;
    dateOp: string;
    montant: string;
    montantUnite: string;
    statut: 'rapproche' | 'en-cours' | 'ecart';
    statutLabel: string;
    avatarInitials: string;
    avatarClass: string;
    poste: string;
    periodTag: 'today' | 'week' | 'month' | 'q1' | 'y2026' | 'y2025';
}

export interface BalanceAccount {
    compte: string;
    intitule: string;
    classe: string;
    soldeDebiteur: string;
    soldeCrediteur: string;
    progression: number;
    statut: 'rapproche' | 'en-cours' | 'ecart';
    statutLabel: string;
    avatarInitials: string;
    avatarClass: string;
    poste: string;
    periodTag: 'today' | 'week' | 'month' | 'q1' | 'y2026' | 'y2025';
}

@Component({
    selector: 'app-comptabilite',
    standalone: true,
    imports: [CommonModule, FormsModule, AnalyseSelectorComponent, BaseChartDirective],
    templateUrl: './comptabilite.component.html',
    styleUrl: './comptabilite.component.scss'
})
export class ComptabiliteComponent implements OnInit {

    constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

    @ViewChildren(BaseChartDirective) chartDirectives?: QueryList<BaseChartDirective>;

    // Sub-modules: 'rapprochement' | 'journaux' | 'balance'
    activeSubDomain: 'rapprochement' | 'journaux' | 'balance' = 'rapprochement';

    // View Mode: 'synthese' or 'avancee'
    viewMode: 'synthese' | 'avancee' = 'synthese';

    // Chart mode tab
    chartTab: 'concordance' | 'nature' | 'evolution' = 'concordance';

    // Table filter & search
    tableFilter: 'all' | 'rapproche' | 'en-cours' | 'ecart' = 'all';
    searchQuery: string = '';

    // Active filters
    activePeriod: string = 'Ce mois-ci (Mars 2026)';
    activePoste: string = 'Tous les Postes & Banques';
    filterChips: string[] = ['Écarts non justifiés', 'Opérations > 50M'];
    allAvailableChips: string[] = [
        'Écarts non justifiés',
        'Opérations > 50M',
        'Suspends > 60 jours',
        'Écritures Provisoires',
        'BCEAO Direct',
        'Postes Régionaux'
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

    postesList: string[] = [
        'Tous les Postes & Banques',
        'BCEAO Siège & Agence',
        'Trésorerie Principale Abidjan',
        'Trésorerie Régionale Yamoussoukro',
        'Trésorerie Régionale San-Pedro',
        'Trésorerie Régionale Bouaké'
    ];

    selectPeriod(period: string) {
        this.activePeriod = period;
        this.triggerToast(`Période sélectionnée : ${period}`);
        if (this.isAnalysisGenerated) {
            this.generateAnalysis();
        }
    }

    selectPoste(poste: string) {
        this.activePoste = poste;
        this.triggerToast(`Périmètre sélectionné : ${poste}`);
    }

    // Toast notification
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

    availableIndicators = [
        'Vol. imputations provisoires',
        'Ancienneté moy. imputations',
        'Répartition recettes par nature',
        'Taux de collecte TVA'
    ];
    selectedIndicators = [
        'Taux rapprochement auto',
        'Délai moyen rapprochement',
        'Écart concordance BCEAO/ACCT'
    ];

    availableAxes = [
        'Poste comptable',
        'Agence',
        'Type opération',
        'Nature impôt',
        'Contribuable',
        'Région',
        'Taux erreur'
    ];
    selectedAxes = ['Poste comptable'];

    // --- Deliverables Datasets with Multi-Period & Multi-Poste ---
    operationsRapprochement: ComptaOperation[] = [
        // Today & this week
        {
            ref: 'OP-2026-118',
            compte: 'Compte 5120 - BCEAO',
            nature: 'Virement trésor interbancaire',
            libelle: 'Transfert de liquidités compensation BCEAO',
            dateOp: '12 Mars 2026',
            echeanceSub: 'Télé-compensation OK',
            montant: '1.250',
            montantUnite: 'M FCFA',
            typeOp: 'credit',
            progression: 100,
            statut: 'rapproche',
            statutLabel: 'Rapproché',
            avatarInitials: 'BC',
            avatarClass: 'avatar-emerald',
            poste: 'BCEAO Siège & Agence',
            periodTag: 'today'
        },
        {
            ref: 'OP-2026-112',
            compte: 'Compte 5120 - BCEAO Principal',
            nature: 'Avis de crédit direct',
            libelle: 'Encaissement redevances douanières transit',
            dateOp: '11 Mars 2026',
            echeanceSub: 'Vérification quittance en cours',
            montant: '84.300',
            montantUnite: 'M FCFA',
            typeOp: 'credit',
            progression: 75,
            statut: 'en-cours',
            statutLabel: 'En cours',
            avatarInitials: 'AC',
            avatarClass: 'avatar-indigo',
            poste: 'BCEAO Siège & Agence',
            periodTag: 'week'
        },
        // Month (Mars 2026)
        {
            ref: 'OP-2026-088',
            compte: 'Compte 4711 - Trésor',
            nature: 'Régularisation transferts',
            libelle: 'Virement BCEAO salaires fonctionnaires Mars',
            dateOp: '12 Mars 2026',
            echeanceSub: 'Bordereau vérifié',
            montant: '45.000',
            montantUnite: 'M FCFA',
            typeOp: 'debit',
            progression: 100,
            statut: 'rapproche',
            statutLabel: 'Rapproché',
            avatarInitials: 'RT',
            avatarClass: 'avatar-emerald',
            poste: 'Trésorerie Principale Abidjan',
            periodTag: 'month'
        },
        {
            ref: 'OP-2026-092',
            compte: 'Compte 4712 - Banque',
            nature: 'Virements non identifiés',
            libelle: 'Recettes fiscales dématérialisées guichet Abidjan',
            dateOp: '10 Mars 2026',
            echeanceSub: 'Délai d\'instruction 48h',
            montant: '120.500',
            montantUnite: 'M FCFA',
            typeOp: 'credit',
            progression: 65,
            statut: 'en-cours',
            statutLabel: 'En instruction',
            avatarInitials: 'VN',
            avatarClass: 'avatar-amber',
            poste: 'Trésorerie Principale Abidjan',
            periodTag: 'month'
        },
        {
            ref: 'OP-2026-097',
            compte: 'Compte 4780 - Caisses',
            nature: 'Ajustement de caisse',
            libelle: 'Écart de conversion devises agence San-Pedro',
            dateOp: '05 Mars 2026',
            echeanceSub: 'Contrôle TPG validé',
            montant: '8.250',
            montantUnite: 'M FCFA',
            typeOp: 'debit',
            progression: 100,
            statut: 'rapproche',
            statutLabel: 'Rapproché',
            avatarInitials: 'AC',
            avatarClass: 'avatar-blue',
            poste: 'Trésorerie Régionale San-Pedro',
            periodTag: 'month'
        },
        {
            ref: 'OP-2026-104',
            compte: 'Compte 4711 - Trésor',
            nature: 'Frais de mandat en suspens',
            libelle: 'Commission bancaire sur émission euro-obligations',
            dateOp: '01 Mars 2026',
            echeanceSub: 'Écart persistant +11j',
            montant: '235.000',
            montantUnite: 'M FCFA',
            typeOp: 'debit',
            progression: 20,
            statut: 'ecart',
            statutLabel: 'Écart à justifier',
            avatarInitials: 'FM',
            avatarClass: 'avatar-purple',
            poste: 'Trésorerie Régionale Bouaké',
            periodTag: 'month'
        },
        // 2025 Archive
        {
            ref: 'OP-2025-904',
            compte: 'Compte 5120 - BCEAO',
            nature: 'Solde de clôture 2025',
            libelle: 'Arrêté des comptes exercice 2025 validé',
            dateOp: '31 Déc 2025',
            echeanceSub: 'Exercice clos',
            montant: '182.400',
            montantUnite: 'Mds FCFA',
            typeOp: 'credit',
            progression: 100,
            statut: 'rapproche',
            statutLabel: 'Rapproché',
            avatarInitials: 'BC',
            avatarClass: 'avatar-emerald',
            poste: 'BCEAO Siège & Agence',
            periodTag: 'y2025'
        }
    ];

    operationsJournaux: JournalEntry[] = [
        {
            ref: 'JRN-2026-140',
            journal: 'Journal Banque BCEAO',
            piece: 'PC-2026-904',
            libelle: 'Règlement mandats de paiement T1',
            dateOp: '12 Mars 2026',
            montant: '85.200',
            montantUnite: 'M FCFA',
            statut: 'rapproche',
            statutLabel: 'Validé',
            avatarInitials: 'JB',
            avatarClass: 'avatar-blue',
            poste: 'BCEAO Siège & Agence',
            periodTag: 'month'
        },
        {
            ref: 'JRN-2026-141',
            journal: 'Journal Opérations Diverses',
            piece: 'OD-2026-033',
            libelle: 'Imputation frais bancaires et commissions',
            dateOp: '11 Mars 2026',
            montant: '3.450',
            montantUnite: 'M FCFA',
            statut: 'rapproche',
            statutLabel: 'Validé',
            avatarInitials: 'OD',
            avatarClass: 'avatar-purple',
            poste: 'Trésorerie Principale Abidjan',
            periodTag: 'month'
        },
        {
            ref: 'JRN-2026-142',
            journal: 'Journal Caisse Centrale',
            piece: 'CS-2026-112',
            libelle: 'Approvisionnement régie des recettes',
            dateOp: '10 Mars 2026',
            montant: '15.000',
            montantUnite: 'M FCFA',
            statut: 'en-cours',
            statutLabel: 'En revue',
            avatarInitials: 'JC',
            avatarClass: 'avatar-amber',
            poste: 'Trésorerie Régionale Yamoussoukro',
            periodTag: 'month'
        },
        {
            ref: 'JRN-2026-143',
            journal: 'Journal Règlement Fournisseurs',
            piece: 'FR-2026-551',
            libelle: 'Factures d\'infrastructures routières',
            dateOp: '08 Mars 2026',
            montant: '142.800',
            montantUnite: 'M FCFA',
            statut: 'ecart',
            statutLabel: 'Pièce manquante',
            avatarInitials: 'RF',
            avatarClass: 'avatar-purple',
            poste: 'Trésorerie Régionale Bouaké',
            periodTag: 'month'
        },
        {
            ref: 'JRN-2025-990',
            journal: 'Journal Clôture Annuelle',
            piece: 'CL-2025-001',
            libelle: 'Écritures d\'inventaire clôture 2025',
            dateOp: '31 Déc 2025',
            montant: '420.000',
            montantUnite: 'Mds FCFA',
            statut: 'rapproche',
            statutLabel: 'Validé',
            avatarInitials: 'CL',
            avatarClass: 'avatar-emerald',
            poste: 'BCEAO Siège & Agence',
            periodTag: 'y2025'
        }
    ];

    operationsBalance: BalanceAccount[] = [
        {
            compte: '101 - Capital & Dotations',
            intitule: 'Dotation initiale État de Côte d\'Ivoire',
            classe: 'Classe 1 - Capitaux',
            soldeDebiteur: '0',
            soldeCrediteur: '150.000 Mds',
            progression: 100,
            statut: 'rapproche',
            statutLabel: 'Équilibré',
            avatarInitials: 'C1',
            avatarClass: 'avatar-blue',
            poste: 'BCEAO Siège & Agence',
            periodTag: 'month'
        },
        {
            compte: '471 - Dépenses à Régulariser',
            intitule: 'Lettres d\'Avance & Bons d\'approvisionnement',
            classe: 'Classe 4 - Tiers',
            soldeDebiteur: '15.423 Mds',
            soldeCrediteur: '14.223 Mds',
            progression: 92,
            statut: 'en-cours',
            statutLabel: 'En régularisation',
            avatarInitials: 'C4',
            avatarClass: 'avatar-amber',
            poste: 'Trésorerie Principale Abidjan',
            periodTag: 'month'
        },
        {
            compte: '512 - Banques & Trésor',
            intitule: 'Comptes courants BCEAO et banques commerciales',
            classe: 'Classe 5 - Trésorerie',
            soldeDebiteur: '182.400 Mds',
            soldeCrediteur: '0',
            progression: 98,
            statut: 'rapproche',
            statutLabel: 'Conforme',
            avatarInitials: 'C5',
            avatarClass: 'avatar-emerald',
            poste: 'BCEAO Siège & Agence',
            periodTag: 'month'
        }
    ];

    // --- DYNAMIC KPIS ACCORDING TO PERIOD & POSTE ---
    get currentKpis() {
        const isToday = this.activePeriod.includes('Aujourd');
        const isWeek = this.activePeriod.includes('semaine');
        const isQ1 = this.activePeriod.includes('1er Trimestre');
        const isY2026 = this.activePeriod.includes('Exercice 2026');
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        if (this.activeSubDomain === 'rapprochement') {
            if (this.activePoste === 'BCEAO Siège & Agence') {
                return [
                    { titre: 'Rapprochement BCEAO', valeur: '98.5%', unite: 'des écritures', progress: 98.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Quasi-parfait', badgeIcon: 'fa-check', bench: 'Seuil : > 95%', icon: 'fa-robot', colorTheme: 'green' },
                    { titre: 'Délai Rapprochement', valeur: '0.8', unite: 'Jour ouvré', progress: 95, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Flux direct', badgeIcon: 'fa-bolt', bench: 'Objectif < 1j', icon: 'fa-stopwatch', colorTheme: 'blue' },
                    { titre: 'Écart BCEAO / ACCT', valeur: '0.00%', unite: 'Écart nul', progress: 100, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Concordance totale', badgeIcon: 'fa-check-double', bench: 'Tolérance 0%', icon: 'fa-scale-balanced', colorTheme: 'green' },
                    { titre: 'Suspensions Actives', valeur: '2', unite: 'Écritures sas', progress: 10, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Régularisées ce jour', badgeIcon: 'fa-check', bench: 'Moyenne : 2', icon: 'fa-circle-check', colorTheme: 'orange' }
                ];
            } else if (this.activePoste === 'Trésorerie Régionale Bouaké') {
                return [
                    { titre: 'Rapprochement Bouaké', valeur: '89.2%', unite: 'des écritures', progress: 89.2, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Vigilance (-0.8%)', badgeIcon: 'fa-circle-exclamation', bench: 'Seuil : > 90%', icon: 'fa-robot', colorTheme: 'orange' },
                    { titre: 'Délai Rapprochement', valeur: '2.4', unite: 'Jours ouvrés', progress: 65, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: '+0.4j retard', badgeIcon: 'fa-arrow-trend-up', bench: 'Objectif < 2j', icon: 'fa-stopwatch', colorTheme: 'orange' },
                    { titre: 'Écart BCEAO / ACCT', valeur: '0.08%', unite: 'Tolérance limite', progress: 60, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Seuil approche', badgeIcon: 'fa-triangle-exclamation', bench: 'Seuil max < 0.10%', icon: 'fa-scale-balanced', colorTheme: 'red' },
                    { titre: 'Suspensions Actives', valeur: '9', unite: 'Dossiers à réviser', progress: 65, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '3 en relance', badgeIcon: 'fa-bell', bench: 'Moyenne : 4', icon: 'fa-triangle-exclamation', colorTheme: 'red' }
                ];
            } else if (isToday) {
                return [
                    { titre: 'Taux Rapprochement Jour', valeur: '99.2%', unite: 'des écritures', progress: 99.2, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Excellence opérationnelle', badgeIcon: 'fa-check', bench: 'Cible jour > 95%', icon: 'fa-robot', colorTheme: 'green' },
                    { titre: 'Délai Moyen Apurement', valeur: '0.3', unite: 'Jour ouvré', progress: 98, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Traitement instantané', badgeIcon: 'fa-bolt', bench: 'Objectif < 1j', icon: 'fa-stopwatch', colorTheme: 'blue' },
                    { titre: 'Écart BCEAO / ACCT', valeur: '0.00%', unite: 'Tolérance nulle', progress: 100, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme', badgeIcon: 'fa-check-double', bench: 'Seuil < 0.10%', icon: 'fa-scale-balanced', colorTheme: 'green' },
                    { titre: 'Suspensions Actives', valeur: '1', unite: 'Dossier', progress: 5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'En apurement', badgeIcon: 'fa-check', bench: 'Moyenne : 1', icon: 'fa-circle-check', colorTheme: 'orange' }
                ];
            } else if (isWeek) {
                return [
                    { titre: 'Rapprochement Semaine', valeur: '97.5%', unite: 'des écritures', progress: 97.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Très satisfaisant', badgeIcon: 'fa-check', bench: 'Seuil > 90%', icon: 'fa-robot', colorTheme: 'green' },
                    { titre: 'Délai Moyen Apurement', valeur: '0.8', unite: 'Jour ouvré', progress: 92, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-0.3j vs S-1', badgeIcon: 'fa-arrow-trend-down', bench: 'Objectif < 2j', icon: 'fa-stopwatch', colorTheme: 'blue' },
                    { titre: 'Écart BCEAO / ACCT', valeur: '0.01%', unite: 'Concordance haute', progress: 10, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme', badgeIcon: 'fa-shield-halved', bench: 'Seuil < 0.10%', icon: 'fa-scale-balanced', colorTheme: 'orange' },
                    { titre: 'Suspensions Actives', valeur: '5', unite: 'Dossiers', progress: 20, progressColor: 'orange', badgeClass: 'badge-warning', badgeText: 'En régularisation', badgeIcon: 'fa-clock', bench: 'Moyenne : 8', icon: 'fa-triangle-exclamation', colorTheme: 'red' }
                ];
            } else if (isY2025) {
                return [
                    { titre: 'Taux Rapprochement 2025', valeur: '98.6%', unite: 'Bilan clôturé', progress: 98.6, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Exercice audité', badgeIcon: 'fa-check', bench: 'Seuil > 90%', icon: 'fa-robot', colorTheme: 'green' },
                    { titre: 'Délai Moyen 2025', valeur: '1.0', unite: 'Jour ouvré', progress: 90, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme ACCT', badgeIcon: 'fa-check', bench: 'Objectif < 2j', icon: 'fa-stopwatch', colorTheme: 'blue' },
                    { titre: 'Écart BCEAO / ACCT', valeur: '0.00%', unite: 'Écart nul', progress: 100, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Arrêté conforme', badgeIcon: 'fa-check-double', bench: 'Tolérance 0%', icon: 'fa-scale-balanced', colorTheme: 'green' },
                    { titre: 'Suspensions 2025', valeur: '0', unite: 'Dossier restant', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Tous apurés', badgeIcon: 'fa-check', bench: 'Soldé', icon: 'fa-circle-check', colorTheme: 'green' }
                ];
            }

            // Default Month
            return [
                { titre: 'Taux Rapprochement Auto', valeur: '94.8%', unite: 'des écritures', progress: 94.8, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Objectif atteint', badgeIcon: 'fa-check', bench: 'Seuil cible : > 90%', icon: 'fa-robot', colorTheme: 'green' },
                { titre: 'Délai Moyen Apurement', valeur: '1.1', unite: 'Jours ouvrés', progress: 88, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-0.4j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Objectif : < 2 jours', icon: 'fa-stopwatch', colorTheme: 'blue' },
                { titre: 'Écart BCEAO / ACCT', valeur: '0.02%', unite: 'Tolérance minime', progress: 20, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Dans les limites', badgeIcon: 'fa-shield-halved', bench: 'Seuil max : < 0.10%', icon: 'fa-scale-balanced', colorTheme: 'orange' },
                { titre: 'Suspensions Actives', valeur: '18', unite: 'Dossiers non lettrés', progress: 45, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: '4 en relance > 10j', badgeIcon: 'fa-circle-exclamation', bench: 'Moyenne : 12 / mois', icon: 'fa-triangle-exclamation', colorTheme: 'red' }
            ];
        }

        // JOURNAUX
        if (this.activeSubDomain === 'journaux') {
            const count = isToday ? '85' : (isWeek ? '420' : (isY2025 ? '145 000' : '12 840'));
            return [
                { titre: 'Écritures Validées', valeur: count, unite: 'Lignes traitées', progress: 92, progressColor: 'green', badgeClass: 'badge-success', badgeText: '+14% vs N-1', badgeIcon: 'fa-arrow-trend-up', bench: 'Clôture à J+3', icon: 'fa-book-bookmark', colorTheme: 'green' },
                { titre: 'Écritures en Attente', valeur: isToday ? '4' : '142', unite: 'Bordereaux sas', progress: 30, progressColor: 'orange', badgeClass: 'badge-warning', badgeText: 'En revue réviseur', badgeIcon: 'fa-clock', bench: 'Plafond : 200', icon: 'fa-file-lines', colorTheme: 'orange' },
                { titre: 'Taux Imputation Prov.', valeur: '2.4%', unite: 'Compte 47', progress: 24, progressColor: 'blue', badgeClass: 'badge-success', badgeText: 'Sous contrôle', badgeIcon: 'fa-check', bench: 'Objectif : < 5%', icon: 'fa-folder-tree', colorTheme: 'blue' },
                { titre: 'Anomalies Détectées', valeur: isToday ? '0' : '5', unite: 'Rejets validation', progress: 15, progressColor: 'red', badgeClass: isToday ? 'badge-success' : 'badge-danger', badgeText: isToday ? 'Aucune' : 'À corriger', badgeIcon: isToday ? 'fa-check' : 'fa-circle-xmark', bench: 'Cible : 0 rejet', icon: 'fa-bug', colorTheme: 'red' }
            ];
        }

        // BALANCE
        const soldeMvt = isToday ? '1.250 Mds' : (isWeek ? '8.450 Mds' : (isY2025 ? '420.000 Mds' : '348.520 Mds'));
        return [
            { titre: 'Total Mouvements Débit', valeur: soldeMvt, unite: 'FCFA', progress: 75, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Équilibre parfait', badgeIcon: 'fa-check-double', bench: 'Delta Débit/Crédit: 0', icon: 'fa-landmark', colorTheme: 'green' },
            { titre: 'Total Mouvements Crédit', valeur: soldeMvt, unite: 'FCFA', progress: 75, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Concordance totale', badgeIcon: 'fa-check-double', bench: 'Validation TPG OK', icon: 'fa-vault', colorTheme: 'blue' },
            { titre: 'Comptes Mouvementés', valeur: isToday ? '42' : '1 245', unite: 'Comptes actifs', progress: 82, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Exercice 2026', badgeIcon: 'fa-list-check', bench: 'Plan comptable ACCT', icon: 'fa-diagram-project', colorTheme: 'orange' },
            { titre: 'Comptes en Solde Anormal', valeur: isToday ? '0' : '1', unite: 'Alerte classe 4', progress: 10, progressColor: 'red', badgeClass: isToday ? 'badge-success' : 'badge-danger', badgeText: isToday ? 'Aucun' : 'Audit requis', badgeIcon: 'fa-flag', bench: 'Seuil : 0 compte', icon: 'fa-flag', colorTheme: 'red' }
        ];
    }

    // --- DYNAMIC FLOW DATA (CONCORDANCE) ---
    get currentFlowData() {
        const isToday = this.activePeriod.includes('Aujourd');
        const isWeek = this.activePeriod.includes('semaine');
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        if (isToday) {
            return {
                totalVolume: '1.250 Mds FCFA',
                lettreAutoAmount: '1.240 Mds FCFA',
                instructionAmount: '10 M FCFA',
                ecartAmount: '0 FCFA',
                tauxAuto: '99.2%',
                debitLettre: '1.240 Mds',
                ecartNet: '0.00 FCFA'
            };
        } else if (isWeek) {
            return {
                totalVolume: '8.450 Mds FCFA',
                lettreAutoAmount: '8.240 Mds FCFA',
                instructionAmount: '180 M FCFA',
                ecartAmount: '30 M FCFA',
                tauxAuto: '97.5%',
                debitLettre: '8.240 Mds',
                ecartNet: '4.2 M FCFA'
            };
        } else if (isY2025) {
            return {
                totalVolume: '420.000 Mds FCFA',
                lettreAutoAmount: '414.120 Mds FCFA',
                instructionAmount: '5.880 Mds FCFA',
                ecartAmount: '0 FCFA',
                tauxAuto: '98.6%',
                debitLettre: '414.120 Mds',
                ecartNet: '0.00 FCFA'
            };
        }

        return {
            totalVolume: '348.520 Mds FCFA',
            lettreAutoAmount: '330.396 Mds FCFA',
            instructionAmount: '13.243 Mds FCFA',
            ecartAmount: '4.881 Mds FCFA',
            tauxAuto: '94.8%',
            debitLettre: '330.396 Mds',
            ecartNet: '69.7 M FCFA'
        };
    }

    // --- DYNAMIC TELEMETRY DATA (LIVE BAR) ---
    get currentTelemetry() {
        const isToday = this.activePeriod.includes('Aujourd');
        const isWeek = this.activePeriod.includes('semaine');
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        if (isToday) {
            return {
                totalDebit: '1,250,000 M',
                totalCredit: '1,250,000 M',
                ecartBrut: '0.00 FCFA'
            };
        } else if (isWeek) {
            return {
                totalDebit: '8,450,000 M',
                totalCredit: '8,450,000 M',
                ecartBrut: '0.00 FCFA'
            };
        } else if (isY2025) {
            return {
                totalDebit: '420,000,000 M',
                totalCredit: '420,000,000 M',
                ecartBrut: '0.00 FCFA'
            };
        }

        return {
            totalDebit: '348,520,000 M',
            totalCredit: '348,520,000 M',
            ecartBrut: '0.00 FCFA'
        };
    }

    // --- Switch Sub-Domains ---
    switchSubDomain(domain: 'rapprochement' | 'journaux' | 'balance') {
        this.activeSubDomain = domain;
        this.tableFilter = 'all';
        const labels = {
            rapprochement: 'Rapprochement Bancaire',
            journaux: 'Journaux Comptables',
            balance: 'Balance Générale des Comptes'
        };
        this.triggerToast(`Module actif : ${labels[domain]}`);
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
    setChartTab(tab: 'concordance' | 'nature' | 'evolution') {
        this.chartTab = tab;
        const labels = {
            concordance: 'Concordance Bancaire',
            nature: 'Par Nature d\'Écriture',
            evolution: 'Évolution Mensuelle'
        };
        this.triggerToast(`Graphique actif : ${labels[tab]}`);
    }

    // --- Table Filter ---
    setTableFilter(filter: 'all' | 'rapproche' | 'en-cours' | 'ecart') {
        this.tableFilter = filter;
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
        }
    }

    removeChip(chip: string) {
        this.filterChips = this.filterChips.filter(c => c !== chip);
        if (this.allAvailableChips.includes(chip)) {
            this.allAvailableChips = [chip, ...this.allAvailableChips.filter(c => c !== chip)];
        } else {
            this.allAvailableChips.unshift(chip);
        }
        this.triggerToast(`Filtre "${chip}" replacé dans la liste d'ajout`);
    }

    // --- Filtered Getters with Period & Poste ---
    get filteredOperations(): ComptaOperation[] {
        const isToday = this.activePeriod.includes('Aujourd');
        const isWeek = this.activePeriod.includes('semaine');
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        return this.operationsRapprochement.filter(item => {
            const matchesFilter = this.tableFilter === 'all' || item.statut === this.tableFilter;
            const matchesPoste = this.activePoste === 'Tous les Postes & Banques' ||
                item.poste.toLowerCase().includes(this.activePoste.toLowerCase());

            let matchesPeriod = true;
            if (isToday) {
                matchesPeriod = item.periodTag === 'today';
            } else if (isWeek) {
                matchesPeriod = item.periodTag === 'today' || item.periodTag === 'week';
            } else if (isY2025) {
                matchesPeriod = item.periodTag === 'y2025';
            } else {
                matchesPeriod = item.periodTag !== 'y2025';
            }

            const q = this.searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                item.ref.toLowerCase().includes(q) ||
                item.compte.toLowerCase().includes(q) ||
                item.nature.toLowerCase().includes(q) ||
                item.libelle.toLowerCase().includes(q);
            return matchesFilter && matchesPoste && matchesPeriod && matchesSearch;
        });
    }

    get filteredJournaux(): JournalEntry[] {
        const isToday = this.activePeriod.includes('Aujourd');
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        return this.operationsJournaux.filter(item => {
            const matchesFilter = this.tableFilter === 'all' || item.statut === this.tableFilter;
            const matchesPoste = this.activePoste === 'Tous les Postes & Banques' ||
                item.poste.toLowerCase().includes(this.activePoste.toLowerCase());

            let matchesPeriod = true;
            if (isToday) {
                matchesPeriod = item.periodTag === 'today';
            } else if (isY2025) {
                matchesPeriod = item.periodTag === 'y2025';
            } else {
                matchesPeriod = item.periodTag !== 'y2025';
            }

            const q = this.searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                item.ref.toLowerCase().includes(q) ||
                item.journal.toLowerCase().includes(q) ||
                item.libelle.toLowerCase().includes(q) ||
                item.piece.toLowerCase().includes(q);
            return matchesFilter && matchesPoste && matchesPeriod && matchesSearch;
        });
    }

    get filteredBalance(): BalanceAccount[] {
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        return this.operationsBalance.filter(item => {
            const matchesFilter = this.tableFilter === 'all' || item.statut === this.tableFilter;
            const matchesPoste = this.activePoste === 'Tous les Postes & Banques' ||
                item.poste.toLowerCase().includes(this.activePoste.toLowerCase());

            const matchesPeriod = isY2025 ? item.periodTag === 'y2025' : item.periodTag !== 'y2025';

            const q = this.searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                item.compte.toLowerCase().includes(q) ||
                item.intitule.toLowerCase().includes(q) ||
                item.classe.toLowerCase().includes(q);
            return matchesFilter && matchesPoste && matchesPeriod && matchesSearch;
        });
    }

    getCount(type: 'all' | 'rapproche' | 'en-cours' | 'ecart'): number {
        if (this.activeSubDomain === 'rapprochement') {
            const list = this.filteredOperations;
            if (type === 'all') return list.length;
            return list.filter(o => o.statut === type).length;
        } else if (this.activeSubDomain === 'journaux') {
            const list = this.filteredJournaux;
            if (type === 'all') return list.length;
            return list.filter(o => o.statut === type).length;
        } else {
            const list = this.filteredBalance;
            if (type === 'all') return list.length;
            return list.filter(o => o.statut === type).length;
        }
    }

    // --- Actions ---
    refreshData() {
        this.triggerToast('Synchronisation du grand livre en temps réel effectuée...');
    }

    exportData(format: 'PDF' | 'EXCEL' = 'PDF') {
        this.triggerToast(`Génération de l'export ${format} des écritures en cours...`);
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

    // --- Legacy Selector Methods ---
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
        if (l.includes('janvier') || l.includes('février') || l.includes('fevrier') ||
            l.includes('mars') || l.includes('avril') || l.includes('mai') ||
            l.includes('juin') || l.includes('juillet') || l.includes('août') ||
            l.includes('aout') || l.includes('septembre') || l.includes('octobre') ||
            l.includes('novembre') || l.includes('décembre') || l.includes('decembre')) {
            return '🔍 Cliquer pour forer : Passer aux Semaines';
        }
        if (l.includes('semaine') || l.includes('sem')) {
            return '🔍 Cliquer pour forer : Passer aux Jours';
        }
        if (l.includes('lundi') || l.includes('mardi') || l.includes('mercredi') || l.includes('jeudi') || l.includes('vendredi')) {
            return '🔍 Cliquer pour forer : Passer aux Plages horaires';
        }
        return '🔍 Cliquer pour forer : Détail par Trimestre';
    }

    barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements, chart) => {
            if (elements && elements.length > 0) {
                const index = elements[0].index;
                const label = chart.data.labels?.[index] as string;
                if (label) {
                    this.drillDown(label, index);
                }
            }
        },
        onHover: (event, elements) => {
            const nativeEvent = event.native;
            if (nativeEvent && nativeEvent.target) {
                (nativeEvent.target as HTMLElement).style.cursor = elements.length > 0 ? 'pointer' : 'default';
            }
        },
        plugins: { 
            legend: { 
                display: true, 
                position: 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { size: 12, weight: 600 }
                }
            },
            tooltip: {
                backgroundColor: '#0f172a',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                footerFont: { size: 11, weight: 'bold', style: 'italic' },
                footerColor: '#fb923c',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    afterBody: (tooltipItems) => {
                        if (!tooltipItems || tooltipItems.length === 0) return '';
                        const label = tooltipItems[0].label || '';
                        return '\n' + this.getTooltipDrilldownHint(label);
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11, weight: 500 }, color: '#64748b' }
            },
            y: {
                grid: { color: '#f1f5f9' },
                ticks: { font: { size: 11 }, color: '#64748b' }
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
                display: true, 
                position: 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { size: 12, weight: 600 }
                }
            },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 10,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11, weight: 500 }, color: '#64748b' }
            },
            y: {
                grid: { color: '#f1f5f9' },
                ticks: { font: { size: 11 }, color: '#64748b' }
            }
        }
    };

    analysisTableData: any[] = [];
    analysisTableHeaders: string[] = [];
    isAnalysisGenerated: boolean = false;

    // Drilldown State Tracking
    drilldownStack: {
        title: string;
        parentLabel: string;
        barData: ChartData<'bar'>;
        lineData: ChartData<'line'>;
        tableHeaders: string[];
        tableData: any[];
    }[] = [];
    currentDrillLabel: string = '';
    currentDrillLevel: number = 0;

    ngOnInit() {
        // Initial setup
    }

    onChartClick(event: { event?: any; active?: any[] }) {
        if (event.active && event.active.length > 0) {
            const index = event.active[0].index;
            const label = this.barChartData.labels?.[index] as string;
            if (label) {
                this.drillDown(label, index);
            }
        }
    }

    // --- Deterministic Mock Data Engine ---
    private getDimensionCategories(axis: string, period: string): { name: string; icon: string }[] {
        const axisLower = axis.toLowerCase();
        if (axisLower.includes('poste')) {
            return [
                { name: 'BCEAO Siège & Agence', icon: 'fa-landmark' },
                { name: 'Trésorerie P. Abidjan', icon: 'fa-building-columns' },
                { name: 'Trésorerie R. Yamoussoukro', icon: 'fa-building' },
                { name: 'Trésorerie R. San-Pedro', icon: 'fa-ship' },
                { name: 'Trésorerie R. Bouaké', icon: 'fa-city' }
            ];
        } else if (axisLower.includes('agence')) {
            return [
                { name: 'Agence Plateau-Banque', icon: 'fa-building-columns' },
                { name: 'Agence Cocody-Trésor', icon: 'fa-vault' },
                { name: 'Agence Yamoussoukro Ville', icon: 'fa-building' },
                { name: 'Agence San-Pedro Port', icon: 'fa-anchor' },
                { name: 'Agence Bouaké Commerce', icon: 'fa-shop' }
            ];
        } else if (axisLower.includes('type') || (axisLower.includes('nature') && !axisLower.includes('impôt'))) {
            return [
                { name: 'Virements Interbancaires BCEAO', icon: 'fa-arrows-rotate' },
                { name: 'Avis de Crédit Directs', icon: 'fa-file-invoice-dollar' },
                { name: 'Régularisations Transferts', icon: 'fa-scale-balanced' },
                { name: 'Ajustements Caisses & Devises', icon: 'fa-money-bill-transfer' },
                { name: 'Frais & Commissions Mandats', icon: 'fa-receipt' }
            ];
        } else if (axisLower.includes('impôt')) {
            return [
                { name: 'TVA & Taxes Assimilées', icon: 'fa-receipt' },
                { name: 'Impôt sur le Revenu & Salaires', icon: 'fa-user-tie' },
                { name: 'Droits de Douane & Transit', icon: 'fa-truck-front' },
                { name: 'Droits d\'Enregistrement & Timbre', icon: 'fa-stamp' },
                { name: 'Taxes Pétrolières & Énergie', icon: 'fa-gas-pump' }
            ];
        } else if (axisLower.includes('contribuable')) {
            return [
                { name: 'Grandes Entreprises (DGE)', icon: 'fa-building' },
                { name: 'Moyennes Entreprises (DME)', icon: 'fa-store' },
                { name: 'Particuliers & Professions', icon: 'fa-user' },
                { name: 'Établissements Publics (EPN)', icon: 'fa-landmark-dome' },
                { name: 'Collectivités Territoriales', icon: 'fa-tree-city' }
            ];
        } else if (axisLower.includes('région')) {
            return [
                { name: 'District Autonome d\'Abidjan', icon: 'fa-map-pin' },
                { name: 'Région du Bélier (Yamoussoukro)', icon: 'fa-map-pin' },
                { name: 'Région de San-Pedro', icon: 'fa-map-pin' },
                { name: 'Région du Gbêkê (Bouaké)', icon: 'fa-map-pin' },
                { name: 'Région du Poro (Korhogo)', icon: 'fa-map-pin' }
            ];
        } else if (axisLower.includes('erreur') || axisLower.includes('taux erreur')) {
            return [
                { name: 'Concordance Parfaite (0.00%)', icon: 'fa-circle-check' },
                { name: 'Écarts Minimes (< 0.05%)', icon: 'fa-circle-info' },
                { name: 'Écarts Modérés (0.05% - 0.20%)', icon: 'fa-triangle-exclamation' },
                { name: 'Suspensions Critiques (> 0.20%)', icon: 'fa-circle-exclamation' }
            ];
        } else if (axisLower.includes('date')) {
            if (period.includes('Aujourd')) {
                return [
                    { name: '08h - 10h', icon: 'fa-clock' },
                    { name: '10h - 12h', icon: 'fa-clock' },
                    { name: '12h - 14h', icon: 'fa-clock' },
                    { name: '14h - 16h', icon: 'fa-clock' },
                    { name: '16h - 18h', icon: 'fa-clock' }
                ];
            } else if (period.includes('semaine')) {
                return [
                    { name: 'Lundi', icon: 'fa-calendar-day' },
                    { name: 'Mardi', icon: 'fa-calendar-day' },
                    { name: 'Mercredi', icon: 'fa-calendar-day' },
                    { name: 'Jeudi', icon: 'fa-calendar-day' },
                    { name: 'Vendredi', icon: 'fa-calendar-day' }
                ];
            } else if (period.includes('trimestre')) {
                return [
                    { name: 'Mois 1 (Janvier)', icon: 'fa-calendar' },
                    { name: 'Mois 2 (Février)', icon: 'fa-calendar' },
                    { name: 'Mois 3 (Mars)', icon: 'fa-calendar' }
                ];
            } else if (period.includes('2025') || period.includes('année') || period.includes('Exercice')) {
                return [
                    { name: 'Trimestre 1', icon: 'fa-calendar' },
                    { name: 'Trimestre 2', icon: 'fa-calendar' },
                    { name: 'Trimestre 3', icon: 'fa-calendar' },
                    { name: 'Trimestre 4', icon: 'fa-calendar' }
                ];
            } else {
                return [
                    { name: 'Semaine 1 (01-07)', icon: 'fa-calendar-week' },
                    { name: 'Semaine 2 (08-14)', icon: 'fa-calendar-week' },
                    { name: 'Semaine 3 (15-21)', icon: 'fa-calendar-week' },
                    { name: 'Semaine 4 (22-31)', icon: 'fa-calendar-week' }
                ];
            }
        }
        
        return [
            { name: 'Catégorie Principale', icon: 'fa-folder' },
            { name: 'Catégorie Secondaire A', icon: 'fa-folder' },
            { name: 'Catégorie Secondaire B', icon: 'fa-folder' },
            { name: 'Catégorie Régionale', icon: 'fa-folder' }
        ];
    }

    private getPeriodTimeLabels(period: string): string[] {
        if (period.includes('Aujourd')) {
            return ['08h00', '10h30', '13h00', '15h30', '18h00'];
        } else if (period.includes('semaine')) {
            return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        } else if (period.includes('trimestre') || period.includes('Trimestre')) {
            return ['Mois 1 (Jan)', 'Mois 2 (Fév)', 'Mois 3 (Mar)'];
        } else if (period.includes('2025')) {
            return ['T1 2025', 'T2 2025', 'T3 2025', 'T4 2025'];
        } else if (period.includes('année') || period.includes('2026') || period.includes('Exercice')) {
            return ['T1 2026', 'T2 2026', 'T3 2026 (Proj)', 'T4 2026 (Proj)'];
        } else if (period.includes('Personnalisé')) {
            return ['Début', 'Phase 1', 'Phase 2', 'Clôture'];
        }
        // Default Month
        return ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'];
    }

    private generateMockIndicatorValue(ind: string, period: string, catIdx: number, catCount: number): { raw: number; formatted: string; unit: string; badgeClass: string } {
        const indLower = ind.toLowerCase();
        
        // Period scale factors
        let scaleFactor = 1.0;
        let periodBias = 0;
        if (period.includes('Aujourd')) {
            scaleFactor = 0.05;
            periodBias = 2.0; // Higher accuracy for daily check
        } else if (period.includes('semaine')) {
            scaleFactor = 0.25;
            periodBias = 1.0;
        } else if (period.includes('trimestre')) {
            scaleFactor = 3.0;
            periodBias = 0.5;
        } else if (period.includes('2025')) {
            scaleFactor = 12.0;
            periodBias = 1.8; // Audited 2025 has high rates
        } else if (period.includes('année') || period.includes('2026')) {
            scaleFactor = 12.0;
            periodBias = 0.8;
        }

        // Specific Indicator logic
        if (indLower.includes('taux rapprochement auto') || indLower.includes('taux de rapprochement')) {
            const baseRates = [98.5, 96.2, 94.8, 92.4, 89.2];
            const raw = Math.min(99.9, Math.max(80.0, Number((baseRates[catIdx % baseRates.length] + periodBias).toFixed(1))));
            const formatted = raw.toFixed(1) + ' %';
            const badgeClass = raw >= 95 ? 'badge-success' : (raw >= 90 ? 'badge-warning' : 'badge-danger');
            return { raw, formatted, unit: '%', badgeClass };
        } 
        
        if (indLower.includes('délai moyen rapprochement') || indLower.includes('délai moyen')) {
            const baseDelays = [0.8, 1.1, 1.4, 1.9, 2.4];
            const raw = Math.max(0.2, Number((baseDelays[catIdx % baseDelays.length] - (periodBias * 0.1)).toFixed(1)));
            const formatted = raw.toFixed(1) + ' j';
            const badgeClass = raw <= 1.0 ? 'badge-success' : (raw <= 2.0 ? 'badge-warning' : 'badge-danger');
            return { raw, formatted, unit: 'j', badgeClass };
        }

        if (indLower.includes('écart concordance') || indLower.includes('ecart concordance') || indLower.includes('écart')) {
            const baseEcarts = [0.00, 0.01, 0.02, 0.05, 0.08];
            const raw = Number((baseEcarts[catIdx % baseEcarts.length]).toFixed(2));
            const formatted = raw.toFixed(2) + ' %';
            const badgeClass = raw === 0 ? 'badge-success' : (raw <= 0.05 ? 'badge-warning' : 'badge-danger');
            return { raw, formatted, unit: '%', badgeClass };
        }

        if (indLower.includes('vol. imputations provisoires') || indLower.includes('imputations provisoires')) {
            const baseVols = [45.0, 120.5, 32.8, 8.25, 235.0];
            const raw = Math.round(baseVols[catIdx % baseVols.length] * scaleFactor * 10) / 10;
            const unit = (scaleFactor >= 10) ? 'Mds FCFA' : 'M FCFA';
            const formatted = raw.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' ' + unit;
            const badgeClass = raw > 100 * scaleFactor ? 'badge-danger' : 'badge-info';
            return { raw, formatted, unit, badgeClass };
        }

        if (indLower.includes('ancienneté moy. imputations') || indLower.includes('ancienneté')) {
            const baseDays = [1.8, 3.4, 5.2, 7.8, 12.5];
            const raw = Number((baseDays[catIdx % baseDays.length]).toFixed(1));
            const formatted = raw.toFixed(1) + ' j';
            const badgeClass = raw <= 3.0 ? 'badge-success' : (raw <= 7.0 ? 'badge-warning' : 'badge-danger');
            return { raw, formatted, unit: 'j', badgeClass };
        }

        if (indLower.includes('répartition recettes par nature') || indLower.includes('recettes')) {
            const baseRecettes = [191.6, 104.5, 52.3, 24.8, 12.0];
            const raw = Math.round(baseRecettes[catIdx % baseRecettes.length] * scaleFactor * 10) / 10;
            const unit = (scaleFactor >= 10) ? 'Mds FCFA' : 'M FCFA';
            const formatted = raw.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' ' + unit;
            const badgeClass = 'badge-success';
            return { raw, formatted, unit, badgeClass };
        }

        if (indLower.includes('taux de collecte tva') || indLower.includes('tva')) {
            const baseTva = [96.4, 93.8, 91.2, 88.5, 85.0];
            const raw = Math.min(99.5, Number((baseTva[catIdx % baseTva.length] + periodBias).toFixed(1)));
            const formatted = raw.toFixed(1) + ' %';
            const badgeClass = raw >= 92 ? 'badge-success' : 'badge-warning';
            return { raw, formatted, unit: '%', badgeClass };
        }

        // Generic fallback for any custom indicator
        const raw = Math.round((50 + (catIdx * 12) + (scaleFactor * 10)) * 10) / 10;
        return { raw, formatted: raw.toString(), unit: 'pts', badgeClass: 'badge-info' };
    }

    private generateTrendSeries(ind: string, period: string, timePointsCount: number, baseAvg: number): number[] {
        const indLower = ind.toLowerCase();
        const isRate = indLower.includes('taux') || indLower.includes('écart');
        
        const series: number[] = [];
        let current = baseAvg;
        for (let i = 0; i < timePointsCount; i++) {
            const progressRatio = (i + 1) / timePointsCount;
            let val = 0;
            if (isRate) {
                // Rates usually improve slightly over time
                val = Math.min(99.9, Math.max(70.0, current + (progressRatio * 1.5) + (Math.sin(i) * 0.8)));
                series.push(Number(val.toFixed(1)));
            } else if (indLower.includes('délai') || indLower.includes('ancienneté')) {
                // Delays decrease over time
                val = Math.max(0.3, current - (progressRatio * 0.4) + (Math.cos(i) * 0.2));
                series.push(Number(val.toFixed(1)));
            } else {
                // Volumes fluctuate per period
                val = Math.max(1, Math.round(current * (0.85 + (progressRatio * 0.3) + (Math.sin(i * 2) * 0.15))));
                series.push(val);
            }
        }
        return series;
    }

    generateAnalysis(event?: any) {
        this.isAnalysisGenerated = true;
        if (event?.period) {
            this.activePeriod = event.period;
        }
        const period = this.activePeriod;
        const indicators = event?.indicators || this.selectedIndicators;
        const axes = event?.axes || this.selectedAxes;
        
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

        // Curated color palette
        const colorPalette = [
            { main: '#F77F00', light: 'rgba(247, 127, 0, 0.2)', border: '#F77F00' }, // Orange Brand
            { main: '#10b981', light: 'rgba(16, 185, 129, 0.2)', border: '#10b981' }, // Green
            { main: '#0284c7', light: 'rgba(2, 132, 199, 0.2)', border: '#0284c7' },   // Blue
            { main: '#8b5cf6', light: 'rgba(139, 92, 246, 0.2)', border: '#8b5cf6' }, // Purple
            { main: '#f59e0b', light: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b' }, // Amber
            { main: '#06b6d4', light: 'rgba(6, 182, 212, 0.2)', border: '#06b6d4' },   // Cyan
            { main: '#ec4899', light: 'rgba(236, 72, 153, 0.2)', border: '#ec4899' }  // Pink
        ];

        // 1. Generate Bar Chart Datasets
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

        // 2. Generate Temporal Line Chart Datasets
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

        // 3. Generate Details Data Table matching exactly the values
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
            this.triggerToast(`Analyse générée : ${primaryAxis} sur ${period} (${indicators.length} indicateurs)`);
        }
    }

    get currentTemporalLevelLabel(): string {
        if (this.drilldownStack.length === 0) {
            return 'Vue Globale';
        }
        const current = this.currentDrillLabel.toLowerCase();
        if (current.includes('exercice') || current.includes('2024') || current.includes('2025') || current.includes('2026') || current.includes('2027') || current.includes('année')) {
            return 'Trimestres';
        }
        if (current.includes('trimestre') || current.includes('t1') || current.includes('t2') || current.includes('t3') || current.includes('t4')) {
            return 'Mois';
        }
        if (current.includes('janvier') || current.includes('février') || current.includes('fevrier') ||
            current.includes('mars') || current.includes('avril') || current.includes('mai') ||
            current.includes('juin') || current.includes('juillet') || current.includes('août') ||
            current.includes('aout') || current.includes('septembre') || current.includes('octobre') ||
            current.includes('novembre') || current.includes('décembre') || current.includes('decembre')) {
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

    // --- PURE TEMPORAL DRILLDOWN ENGINE ---
    private getDrilldownCategories(parentLabel: string): { name: string; icon: string; subPeriod?: string }[] {
        const labelLower = parentLabel.toLowerCase();

        // 1. Plages horaires -> Sous-détail final
        if (labelLower.includes('08h') || labelLower.includes('10h') || labelLower.includes('12h') || labelLower.includes('14h') || labelLower.includes('16h')) {
            return [
                { name: `${parentLabel} — Sas 47`, icon: 'fa-clock' },
                { name: `${parentLabel} — Lettré Direct`, icon: 'fa-check-double' },
                { name: `${parentLabel} — Télé-transmission`, icon: 'fa-network-wired' }
            ];
        }

        // 2. Jours -> Plages horaires
        if (labelLower.includes('lundi') || labelLower.includes('mardi') || labelLower.includes('mercredi') || labelLower.includes('jeudi') || labelLower.includes('vendredi') || labelLower.includes('samedi')) {
            return [
                { name: '08h00 - 10h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '10h00 - 12h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '12h00 - 14h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '14h00 - 16h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' },
                { name: '16h00 - 18h00', icon: 'fa-clock', subPeriod: 'Aujourd\'hui' }
            ];
        }

        // 3. Semaines -> Jours de la semaine
        if (labelLower.includes('semaine') || labelLower.includes('sem')) {
            return [
                { name: 'Lundi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Mardi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Mercredi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Jeudi', icon: 'fa-calendar-day', subPeriod: 'semaine' },
                { name: 'Vendredi', icon: 'fa-calendar-day', subPeriod: 'semaine' }
            ];
        }

        // 4. Mois -> Semaines du mois
        if (labelLower.includes('janvier') || labelLower.includes('février') || labelLower.includes('fevrier') ||
            labelLower.includes('mars') || labelLower.includes('avril') || labelLower.includes('mai') ||
            labelLower.includes('juin') || labelLower.includes('juillet') || labelLower.includes('août') ||
            labelLower.includes('aout') || labelLower.includes('septembre') || labelLower.includes('octobre') ||
            labelLower.includes('novembre') || labelLower.includes('décembre') || labelLower.includes('decembre')) {
            return [
                { name: 'Semaine 1 (01-07)', icon: 'fa-calendar-week', subPeriod: 'Semaine' },
                { name: 'Semaine 2 (08-14)', icon: 'fa-calendar-week', subPeriod: 'Semaine' },
                { name: 'Semaine 3 (15-21)', icon: 'fa-calendar-week', subPeriod: 'Semaine' },
                { name: 'Semaine 4 (22-31)', icon: 'fa-calendar-week', subPeriod: 'Semaine' }
            ];
        }

        // 5. Trimestres -> Mois du trimestre
        if (labelLower.includes('trimestre 1') || labelLower.includes('t1') || labelLower.includes('1er trimestre')) {
            return [
                { name: 'Janvier', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Février', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Mars', icon: 'fa-calendar-day', subPeriod: 'Mois' }
            ];
        } else if (labelLower.includes('trimestre 2') || labelLower.includes('t2') || labelLower.includes('2ème trimestre') || labelLower.includes('2e trimestre')) {
            return [
                { name: 'Avril', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Mai', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Juin', icon: 'fa-calendar-day', subPeriod: 'Mois' }
            ];
        } else if (labelLower.includes('trimestre 3') || labelLower.includes('t3') || labelLower.includes('3ème trimestre') || labelLower.includes('3e trimestre')) {
            return [
                { name: 'Juillet', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Août', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Septembre', icon: 'fa-calendar-day', subPeriod: 'Mois' }
            ];
        } else if (labelLower.includes('trimestre 4') || labelLower.includes('t4') || labelLower.includes('4ème trimestre') || labelLower.includes('4e trimestre')) {
            return [
                { name: 'Octobre', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Novembre', icon: 'fa-calendar-day', subPeriod: 'Mois' },
                { name: 'Décembre', icon: 'fa-calendar-day', subPeriod: 'Mois' }
            ];
        }

        // 6. Années / Exercice ou Entité racine (Poste, Agence, etc.) -> 4 Trimestres
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
        if (first.includes('trimestre') || first.includes('t1')) {
            return ['T1', 'T2', 'T3', 'T4'];
        }
        if (first.includes('janvier') || first.includes('avril') || first.includes('juillet') || first.includes('octobre') || first.includes('février') || first.includes('mars')) {
            return categories.map(m => m.substring(0, 3) + '.');
        }
        if (first.includes('semaine') || first.includes('sem')) {
            return ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        }
        if (first.includes('lundi') || first.includes('mardi')) {
            return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
        }
        if (first.includes('08h') || first.includes('10h')) {
            return ['08h', '10h', '12h', '14h', '16h'];
        }
        return categories.map(c => c.length > 12 ? c.substring(0, 10) + '...' : c);
    }

    drillDown(label: string, index?: number) {
        if (!this.isAnalysisGenerated) return;

        this.ngZone.run(() => {
            const indicators = this.selectedIndicators;
            const period = this.selectedPeriod;

            // Save current level in stack
            this.drilldownStack.push({
                title: this.currentDrillLabel || (this.selectedAxes[0] || 'Vue Globale'),
                parentLabel: label,
                barData: JSON.parse(JSON.stringify(this.barChartData)),
                lineData: JSON.parse(JSON.stringify(this.lineChartData)),
                tableHeaders: [...this.analysisTableHeaders],
                tableData: JSON.parse(JSON.stringify(this.analysisTableData))
            });

            this.currentDrillLabel = label;
            this.currentDrillLevel++;

            const subCategories = this.getDrilldownCategories(label);
            const categories = subCategories.map(s => s.name);
            const subTimeLabels = this.getDrillTimeLabels(categories);

            const colorPalette = [
                { main: '#F77F00', light: 'rgba(247, 127, 0, 0.2)', border: '#F77F00' },
                { main: '#10b981', light: 'rgba(16, 185, 129, 0.2)', border: '#10b981' },
                { main: '#0284c7', light: 'rgba(2, 132, 199, 0.2)', border: '#0284c7' },
                { main: '#8b5cf6', light: 'rgba(139, 92, 246, 0.2)', border: '#8b5cf6' },
                { main: '#f59e0b', light: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b' }
            ];

            // 1. Bar Chart Drilldown
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
                labels: [...categories],
                datasets: barDatasets
            };

            // 2. Line Chart Drilldown
            const lineDatasets = indicators.map((ind: string, idx: number) => {
                const color = colorPalette[idx % colorPalette.length];
                const total = barDatasets[idx].data.reduce((a: number, b: number) => a + b, 0);
                const avg = total / barDatasets[idx].data.length;
                const trendData = this.generateTrendSeries(ind, period, subTimeLabels.length, avg);

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
                labels: [...subTimeLabels],
                datasets: lineDatasets
            };

            // 3. Table Drilldown
            const drillHeader = `Période / Détail (${label})`;
            this.analysisTableHeaders = [drillHeader, ...indicators];
            this.analysisTableData = subCategories.map((catObj, catIdx) => {
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

            this.cdr.detectChanges();
            setTimeout(() => {
                this.chartDirectives?.forEach(c => c.update());
                this.cdr.detectChanges();
            }, 10);

            this.triggerToast(`Niveau temporel : ${label}`);
        });
    }

    drillUp() {
        if (this.drilldownStack.length === 0) return;
        this.ngZone.run(() => {
            const previousState = this.drilldownStack.pop();
            if (previousState) {
                this.barChartData = { ...previousState.barData };
                this.lineChartData = { ...previousState.lineData };
                this.analysisTableHeaders = [...previousState.tableHeaders];
                this.analysisTableData = [...previousState.tableData];
                this.currentDrillLevel--;
                this.currentDrillLabel = this.drilldownStack.length > 0 
                    ? this.drilldownStack[this.drilldownStack.length - 1].parentLabel 
                    : '';
                this.cdr.detectChanges();
                setTimeout(() => {
                    this.chartDirectives?.forEach(c => c.update());
                    this.cdr.detectChanges();
                }, 10);
                this.triggerToast(`Retour : ${previousState.title}`);
            }
        });
    }

    resetDrilldown() {
        if (this.drilldownStack.length === 0) return;
        this.ngZone.run(() => {
            const rootState = this.drilldownStack[0];
            this.barChartData = { ...rootState.barData };
            this.lineChartData = { ...rootState.lineData };
            this.analysisTableHeaders = [...rootState.tableHeaders];
            this.analysisTableData = [...rootState.tableData];
            this.drilldownStack = [];
            this.currentDrillLevel = 0;
            this.currentDrillLabel = '';
            this.cdr.detectChanges();
            setTimeout(() => {
                this.chartDirectives?.forEach(c => c.update());
                this.cdr.detectChanges();
            }, 10);
            this.triggerToast('Retour à l\'analyse initiale');
        });
    }
}
