import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    imports: [CommonModule, FormsModule, AnalyseSelectorComponent],
    templateUrl: './comptabilite.component.html',
    styleUrl: './comptabilite.component.scss'
})
export class ComptabiliteComponent {

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
        this.selectedPeriod = period;
        this.triggerToast(`Période sélectionnée : ${period}`);
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
    isDragDropMode = false;
    selectedPeriod: string = 'Ce mois-ci';

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
    selectedAxes = ['Date (Jour/Mois/Exercice)'];

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
            this.triggerToast('Affichage Analyses Multidimensionnelles DWH activé');
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

    removeChip(chip: string) {
        this.filterChips = this.filterChips.filter(c => c !== chip);
        this.triggerToast(`Filtre "${chip}" supprimé`);
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
}
