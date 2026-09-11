import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

export interface LADeliverable {
    ref: string;
    ministere: string;
    ministereFull: string;
    subtext: string;
    dateEmission: string;
    echeance: string;
    echeanceSub: string;
    echeanceStatus: 'normal' | 'warning' | 'danger' | 'success';
    montant: string;
    montantUnite: string;
    progression: number;
    statut: 'en-cours' | 'retard' | 'regule';
    statutLabel: string;
    avatarInitials: string;
    avatarClass: string;
    periodTag: 'today' | 'week' | 'month' | 'q1' | 'y2026' | 'y2025';
    relancesCount?: number;
}

export interface BCDeliverable {
    ref: string;
    poste: string;
    posteFull: string;
    subtext: string;
    dateEmission: string;
    echeance: string;
    echeanceSub: string;
    echeanceStatus: 'normal' | 'warning' | 'danger' | 'success';
    montant: string;
    montantUnite: string;
    progression: number;
    statut: 'en-cours' | 'retard' | 'regule';
    statutLabel: string;
    avatarInitials: string;
    avatarClass: string;
    periodTag: 'today' | 'week' | 'month' | 'q1' | 'y2026' | 'y2025';
}

export interface CSDeliverable {
    ref: string;
    intitule: string;
    gestionnaire: string;
    subtext: string;
    dateEmission: string;
    echeance: string;
    echeanceSub: string;
    echeanceStatus: 'normal' | 'warning' | 'danger' | 'success';
    montant: string;
    montantUnite: string;
    progression: number;
    statut: 'en-cours' | 'retard' | 'regule';
    statutLabel: string;
    avatarInitials: string;
    avatarClass: string;
    periodTag: 'today' | 'week' | 'month' | 'q1' | 'y2026' | 'y2025';
}

@Component({
    selector: 'app-tresorerie',
    standalone: true,
    imports: [CommonModule, FormsModule, AnalyseSelectorComponent],
    templateUrl: './tresorerie.component.html',
    styleUrl: './tresorerie.component.scss'
})
export class TresorerieComponent {

    // Sub-domain state
    activeSubDomain: 'la' | 'bc' | 'cs' = 'la';

    // View Mode: 'synthese' (modern dashboard) or 'avancee' (multidimensional DWH selector)
    viewMode: 'synthese' | 'avancee' = 'synthese';

    // Chart mode
    chartTab: 'sankey' | 'ministere' | 'age' = 'sankey';

    // Table quick filter & search
    tableFilter: 'all' | 'en-cours' | 'retard' | 'regule' = 'all';
    searchQuery: string = '';

    // Active filters
    activePeriod: string = 'Ce mois-ci (Mars 2026)';
    activePerimetre: string = 'Tous les Ministères';
    filterChips: string[] = ['Délai > 30j', 'Seuil FCFA > 100M'];

    // Dropdown choices
    periodsList: string[] = [
        'Aujourd\'hui',
        'Cette semaine',
        'Ce mois-ci (Mars 2026)',
        '1er Trimestre 2026',
        'Exercice 2026',
        'Exercice 2025'
    ];

    perimetresLA: string[] = [
        'Tous les Ministères',
        'Éducation Nationale',
        'Santé Publique',
        'Infrastructures',
        'Défense',
        'Justice & Droits'
    ];

    perimetresBC: string[] = [
        'Tous les Postes Comptables',
        'Abidjan Nord',
        'Yamoussoukro',
        'San-Pedro',
        'Bouaké'
    ];

    perimetresCS: string[] = [
        'Tous les Comptes Spéciaux',
        'Fonds Spécial Énergie',
        'Compte Affectation Spéciale Route',
        'Fonds d\'Urgence Sanitaire'
    ];

    get currentPerimetres(): string[] {
        if (this.activeSubDomain === 'la') return this.perimetresLA;
        if (this.activeSubDomain === 'bc') return this.perimetresBC;
        return this.perimetresCS;
    }

    selectPeriod(period: string) {
        this.activePeriod = period;
        this.selectedPeriod = period;
        this.triggerToast(`Période sélectionnée : ${period}`);
    }

    selectPerimetre(perimetre: string) {
        this.activePerimetre = perimetre;
        this.triggerToast(`Périmètre sélectionné : ${perimetre}`);
    }

    // Toast notification feedback
    toastMessage: string = '';
    showToast: boolean = false;
    private toastTimer: any = null;

    // Legacy Selector Support
    isDragDropMode = false;
    selectedPeriod: string = 'Ce mois-ci';

    // --- Lettres d'Avance (LA) Data ---
    availableIndicatorsLA = [
        'Taux de LA en retard (> 60j)',
        'Taux d\'exécution des paiements',
        'Montant moyen reste à exécuter',
        'Taux de réponse aux relances'
    ];
    selectedIndicatorsLA = [
        'Montant total LA en cours',
        'Délai moyen de traitement',
        'Taux de régularisation LA'
    ];
    availableAxesLA = [
        'Processus (Réception/Paiement/Régul)',
        'Direction / Département',
        'Bénéficiaire spécifique',
        'Nombre de relances',
        'Type de dépense'
    ];
    selectedAxesLA = ['Ministère / Organisation', 'Temporel (Échéance)'];

    // --- Deliverables Datasets with Multi-Period Support ---
    deliverablesLA: LADeliverable[] = [
        // Today & this week
        {
            ref: 'LA-2026-092',
            ministere: 'Santé Publique',
            ministereFull: 'Santé Publique & Couverture Maladie',
            subtext: 'Ravitaillement d\'urgence vaccins pédiatriques',
            dateEmission: '12 Mars 2026',
            echeance: 'Dans 28 jours',
            echeanceSub: '09 Avril 2026',
            echeanceStatus: 'normal',
            montant: '850.000',
            montantUnite: 'M FCFA',
            progression: 95,
            statut: 'en-cours',
            statutLabel: 'En cours',
            avatarInitials: 'SP',
            avatarClass: 'avatar-emerald',
            periodTag: 'today',
            relancesCount: 0
        },
        {
            ref: 'LA-2026-090',
            ministere: 'Infrastructures',
            ministereFull: 'Infrastructures & Équipements',
            subtext: 'Réfection ponton maritime Abidjan',
            dateEmission: '09 Mars 2026',
            echeance: 'Dans 18 jours',
            echeanceSub: '30 Mars 2026',
            echeanceStatus: 'normal',
            montant: '1.200',
            montantUnite: 'Mds FCFA',
            progression: 80,
            statut: 'en-cours',
            statutLabel: 'En cours',
            avatarInitials: 'IN',
            avatarClass: 'avatar-amber',
            periodTag: 'week',
            relancesCount: 0
        },
        // Current Month (Mars 2026)
        {
            ref: 'LA-2026-089',
            ministere: 'Éducation Nationale',
            ministereFull: 'Éducation Nationale & Alphabétisation',
            subtext: 'Acquisition kits examens session 2026',
            dateEmission: '02 Mars 2026',
            echeance: 'Dans 14 jours',
            echeanceSub: '28 Mars 2026',
            echeanceStatus: 'warning',
            montant: '18.500',
            montantUnite: 'Mds FCFA',
            progression: 70,
            statut: 'en-cours',
            statutLabel: 'En cours',
            avatarInitials: 'EP',
            avatarClass: 'avatar-blue',
            periodTag: 'month',
            relancesCount: 1
        },
        {
            ref: 'LA-2026-074',
            ministere: 'Santé Publique',
            ministereFull: 'Santé Publique & Couverture Maladie',
            subtext: 'Campagne d\'urgence vaccination Est',
            dateEmission: '18 Fév 2026',
            echeance: 'Régularisé',
            echeanceSub: '10 Mars 2026',
            echeanceStatus: 'success',
            montant: '14.200',
            montantUnite: 'Mds FCFA',
            progression: 100,
            statut: 'regule',
            statutLabel: 'Régularisé',
            avatarInitials: 'SP',
            avatarClass: 'avatar-emerald',
            periodTag: 'month'
        },
        {
            ref: 'LA-2026-052',
            ministere: 'Infrastructures',
            ministereFull: 'Infrastructures & Équipements',
            subtext: 'Réfection axe routier corridor Nord',
            dateEmission: '10 Janv 2026',
            echeance: '+18j de retard',
            echeanceSub: 'Échu le 20 Fév 2026',
            echeanceStatus: 'danger',
            montant: '8.500',
            montantUnite: 'Mds FCFA',
            progression: 25,
            statut: 'retard',
            statutLabel: 'En retard',
            avatarInitials: 'IN',
            avatarClass: 'avatar-amber',
            periodTag: 'month',
            relancesCount: 3
        },
        {
            ref: 'LA-2026-041',
            ministere: 'Défense',
            ministereFull: 'Ministère de la Défense',
            subtext: 'Opérations spéciales logistique frontières',
            dateEmission: '05 Janv 2026',
            echeance: '+26j de retard',
            echeanceSub: 'Échu le 12 Fév 2026',
            echeanceStatus: 'danger',
            montant: '4.600',
            montantUnite: 'Mds FCFA',
            progression: 15,
            statut: 'retard',
            statutLabel: 'Critique',
            avatarInitials: 'MD',
            avatarClass: 'avatar-purple',
            periodTag: 'month',
            relancesCount: 4
        },
        {
            ref: 'LA-2026-033',
            ministere: 'Justice & Droits',
            ministereFull: 'Ministère de la Justice & Garde des Sceaux',
            subtext: 'Numérisation des greffes tribunaux',
            dateEmission: '12 Fév 2026',
            echeance: 'Dans 22 jours',
            echeanceSub: '05 Avril 2026',
            echeanceStatus: 'normal',
            montant: '2.150',
            montantUnite: 'Mds FCFA',
            progression: 85,
            statut: 'en-cours',
            statutLabel: 'En cours',
            avatarInitials: 'JU',
            avatarClass: 'avatar-indigo',
            periodTag: 'month'
        },
        // 2025 Archive records
        {
            ref: 'LA-2025-142',
            ministere: 'Santé Publique',
            ministereFull: 'Santé Publique & Hygiène',
            subtext: 'Dotation hôpital régional Korhogo',
            dateEmission: '15 Nov 2025',
            echeance: 'Régularisé',
            echeanceSub: 'Clos le 20 Déc 2025',
            echeanceStatus: 'success',
            montant: '6.400',
            montantUnite: 'Mds FCFA',
            progression: 100,
            statut: 'regule',
            statutLabel: 'Régularisé',
            avatarInitials: 'SP',
            avatarClass: 'avatar-emerald',
            periodTag: 'y2025'
        },
        {
            ref: 'LA-2025-118',
            ministere: 'Défense',
            ministereFull: 'Ministère de la Défense',
            subtext: 'Sécurisation transfrontalière exercice 2025',
            dateEmission: '10 Oct 2025',
            echeance: 'Régularisé',
            echeanceSub: 'Clos le 15 Déc 2025',
            echeanceStatus: 'success',
            montant: '12.800',
            montantUnite: 'Mds FCFA',
            progression: 100,
            statut: 'regule',
            statutLabel: 'Régularisé',
            avatarInitials: 'MD',
            avatarClass: 'avatar-purple',
            periodTag: 'y2025'
        },
        {
            ref: 'LA-2025-084',
            ministere: 'Éducation Nationale',
            ministereFull: 'Éducation Nationale & Alphabétisation',
            subtext: 'Rentrée scolaire 2025-2026 manuels',
            dateEmission: '05 Sept 2025',
            echeance: 'Régularisé',
            echeanceSub: 'Clos le 10 Nov 2025',
            echeanceStatus: 'success',
            montant: '22.100',
            montantUnite: 'Mds FCFA',
            progression: 100,
            statut: 'regule',
            statutLabel: 'Régularisé',
            avatarInitials: 'EP',
            avatarClass: 'avatar-blue',
            periodTag: 'y2025'
        }
    ];

    // --- Bons de Caisse (BC) Data with Multi-Period Support ---
    availableIndicatorsBC = [
        'Taux d\'approvisionnements urgents',
        'Délai moyen de régularisation BC',
        'Taux de BC vérifiés',
        'Montant des écarts détectés'
    ];
    selectedIndicatorsBC = [
        'Nombre de BC en circulation',
        'Montant moyen par BC',
        'Taux de couverture appro'
    ];
    availableAxesBC = [
        'Heure / Jour (Pointes)',
        'Géographique (Région)',
        'Type de bénéficiaire',
        'Instrument (Espèce/Chèque)',
        'Qualité (Anomalies)'
    ];
    selectedAxesBC = ['Poste Comptable', 'Statut (En cours/Régul)'];

    deliverablesBC: BCDeliverable[] = [
        {
            ref: 'BC-8890',
            poste: 'Abidjan Nord',
            posteFull: 'Trésorerie Principale Abidjan Nord',
            subtext: 'Approvisionnement guichet central',
            dateEmission: '12 Mars 2026',
            echeance: 'En cours',
            echeanceSub: 'Échéance ce jour',
            echeanceStatus: 'normal',
            montant: '15.000',
            montantUnite: 'M FCFA',
            progression: 90,
            statut: 'en-cours',
            statutLabel: 'En circulation',
            avatarInitials: 'AN',
            avatarClass: 'avatar-blue',
            periodTag: 'today'
        },
        {
            ref: 'BC-8842',
            poste: 'Abidjan Nord',
            posteFull: 'Trésorerie Principale Abidjan Nord',
            subtext: 'Approvisionnement caisse secondaire',
            dateEmission: '12 Mars 2026',
            echeance: 'En cours',
            echeanceSub: 'Échéance 19 Mars 2026',
            echeanceStatus: 'normal',
            montant: '45.000',
            montantUnite: 'M FCFA',
            progression: 60,
            statut: 'en-cours',
            statutLabel: 'En circulation',
            avatarInitials: 'AN',
            avatarClass: 'avatar-blue',
            periodTag: 'month'
        },
        {
            ref: 'BC-8850',
            poste: 'Yamoussoukro',
            posteFull: 'Poste Comptable Yamoussoukro Capitale',
            subtext: 'Règlement dépenses courantes',
            dateEmission: '11 Mars 2026',
            echeance: 'Pris en charge',
            echeanceSub: 'Validation bordereau OK',
            echeanceStatus: 'normal',
            montant: '28.500',
            montantUnite: 'M FCFA',
            progression: 80,
            statut: 'en-cours',
            statutLabel: 'Pris en charge',
            avatarInitials: 'YK',
            avatarClass: 'avatar-purple',
            periodTag: 'month'
        },
        {
            ref: 'BC-8861',
            poste: 'San-Pedro',
            posteFull: 'Trésorerie Régionale San-Pedro Port',
            subtext: 'Apurement dépenses portuaires',
            dateEmission: '10 Mars 2026',
            echeance: 'Régularisé',
            echeanceSub: 'Quittance archivée',
            echeanceStatus: 'success',
            montant: '12.000',
            montantUnite: 'M FCFA',
            progression: 100,
            statut: 'regule',
            statutLabel: 'Régularisé',
            avatarInitials: 'SP',
            avatarClass: 'avatar-emerald',
            periodTag: 'month'
        },
        {
            ref: 'BC-8872',
            poste: 'Bouaké',
            posteFull: 'Poste Comptable Bouaké Centre',
            subtext: 'Régularisation relances manquantes',
            dateEmission: '05 Mars 2026',
            echeance: '+7j retard',
            echeanceSub: 'Échu le 10 Mars 2026',
            echeanceStatus: 'danger',
            montant: '32.000',
            montantUnite: 'M FCFA',
            progression: 20,
            statut: 'retard',
            statutLabel: 'En retard',
            avatarInitials: 'BK',
            avatarClass: 'avatar-amber',
            periodTag: 'month'
        },
        {
            ref: 'BC-7720',
            poste: 'Abidjan Nord',
            posteFull: 'Trésorerie Principale Abidjan Nord',
            subtext: 'Bordereau annuel clôturé',
            dateEmission: '20 Déc 2025',
            echeance: 'Régularisé',
            echeanceSub: 'Exercice 2025 clos',
            echeanceStatus: 'success',
            montant: '54.000',
            montantUnite: 'M FCFA',
            progression: 100,
            statut: 'regule',
            statutLabel: 'Régularisé',
            avatarInitials: 'AN',
            avatarClass: 'avatar-blue',
            periodTag: 'y2025'
        }
    ];

    // --- Comptes Spéciaux (CS) Data with Multi-Period Support ---
    deliverablesCS: CSDeliverable[] = [
        {
            ref: 'CS-902-12',
            intitule: 'Fonds Spécial Énergie',
            gestionnaire: 'Ministère des Mines & Énergie',
            subtext: 'Projets d\'électrification rurale',
            dateEmission: '01 Janv 2026',
            echeance: 'Solde Conforme',
            echeanceSub: 'Revue mensuelle OK',
            echeanceStatus: 'success',
            montant: '15.200',
            montantUnite: 'Mds FCFA',
            progression: 92,
            statut: 'regule',
            statutLabel: 'Conforme',
            avatarInitials: 'FE',
            avatarClass: 'avatar-blue',
            periodTag: 'month'
        },
        {
            ref: 'CS-904-45',
            intitule: 'Compte Affectation Spéciale Route',
            gestionnaire: 'Fonds d\'Entretien Routier (FER)',
            subtext: 'Maintenance des voies interurbaines',
            dateEmission: '15 Janv 2026',
            echeance: 'Exécution 65%',
            echeanceSub: 'En cours normal',
            echeanceStatus: 'normal',
            montant: '22.400',
            montantUnite: 'Mds FCFA',
            progression: 65,
            statut: 'en-cours',
            statutLabel: 'En cours',
            avatarInitials: 'CR',
            avatarClass: 'avatar-purple',
            periodTag: 'month'
        },
        {
            ref: 'CS-907-88',
            intitule: 'Fonds d\'Urgence Sanitaire',
            gestionnaire: 'Ministère de la Santé',
            subtext: 'Ravitaillement stocks de contingence',
            dateEmission: '01 Fév 2026',
            echeance: 'Solde Négatif',
            echeanceSub: 'Dépassement de 250M',
            echeanceStatus: 'danger',
            montant: '5.250',
            montantUnite: 'Mds FCFA',
            progression: 15,
            statut: 'retard',
            statutLabel: 'Dépassement',
            avatarInitials: 'FS',
            avatarClass: 'avatar-amber',
            periodTag: 'month'
        },
        {
            ref: 'CS-800-01',
            intitule: 'Compte Affectation Spéciale Route',
            gestionnaire: 'Fonds d\'Entretien Routier (FER)',
            subtext: 'Programme national ponts et chaussées 2025',
            dateEmission: '10 Mars 2025',
            echeance: 'Clos conforme',
            echeanceSub: 'Apurement total',
            echeanceStatus: 'success',
            montant: '35.000',
            montantUnite: 'Mds FCFA',
            progression: 100,
            statut: 'regule',
            statutLabel: 'Conforme',
            avatarInitials: 'CR',
            avatarClass: 'avatar-purple',
            periodTag: 'y2025'
        }
    ];

    // --- DYNAMIC MOCK KPIS (BASED ON SUB-DOMAIN, PERIOD & PERIMETRE) ---
    get currentKpis() {
        const isToday = this.activePeriod.includes('Aujourd');
        const isWeek = this.activePeriod.includes('semaine');
        const isQ1 = this.activePeriod.includes('1er Trimestre');
        const isY2026 = this.activePeriod.includes('Exercice 2026');
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        // LA SUB-DOMAIN
        if (this.activeSubDomain === 'la') {
            if (this.activePerimetre === 'Santé Publique') {
                return [
                    { titre: 'Montant LA Santé', valeur: '14.200', unite: 'Mds FCFA', progress: 100, progressColor: 'green', badgeClass: 'badge-success', badgeText: '100% Régularisé', badgeIcon: 'fa-check', bench: 'Conforme ACCT', icon: 'fa-file-invoice-dollar', colorTheme: 'green' },
                    { titre: 'Délai Traitement Santé', valeur: '1.5', unite: 'Jours ouvrés', progress: 95, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Optimal', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible < 5j', icon: 'fa-bolt', colorTheme: 'blue' },
                    { titre: 'Taux Régularisation', valeur: '100%', unite: 'des volumes', progress: 100, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Parfait', badgeIcon: 'fa-check', bench: 'Seuil légal > 90%', icon: 'fa-award', colorTheme: 'green' },
                    { titre: 'Relances Actives', valeur: '0', unite: 'Dossier', progress: 0, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Aucune anomalie', badgeIcon: 'fa-check', bench: 'Moyenne : 0', icon: 'fa-bell', colorTheme: 'orange' }
                ];
            } else if (this.activePerimetre === 'Défense') {
                return [
                    { titre: 'Montant LA Défense', valeur: '4.600', unite: 'Mds FCFA', progress: 15, progressColor: 'red', badgeClass: 'badge-danger', badgeText: 'Retard Critique', badgeIcon: 'fa-triangle-exclamation', bench: 'Plafond: 5.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'red' },
                    { titre: 'Délai Traitement Défense', valeur: '9.5', unite: 'Jours ouvrés', progress: 20, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '+4.5j retard', badgeIcon: 'fa-arrow-trend-up', bench: 'Cible < 5j', icon: 'fa-bolt', colorTheme: 'red' },
                    { titre: 'Taux Régularisation', valeur: '15.0%', unite: 'des volumes', progress: 15, progressColor: 'red', badgeClass: 'badge-danger', badgeText: 'Critique (< 30%)', badgeIcon: 'fa-circle-exclamation', bench: 'Seuil légal > 90%', icon: 'fa-award', colorTheme: 'red' },
                    { titre: 'Relances Actives', valeur: '4', unite: 'Relances TPG', progress: 85, progressColor: 'red', badgeClass: 'badge-danger', badgeText: 'Sommation envoyée', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne : 1.5', icon: 'fa-bell', colorTheme: 'red' }
                ];
            } else if (isToday) {
                return [
                    { titre: 'Montant LA du Jour', valeur: '185.0', unite: 'Millions FCFA', progress: 15, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Flux journalier', badgeIcon: 'fa-check', bench: 'Plafond jour: 500M', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Moyen Traitement', valeur: '0.4', unite: 'Jour ouvré', progress: 95, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Traitement éclair', badgeIcon: 'fa-bolt', bench: 'Cible < 1j', icon: 'fa-bolt', colorTheme: 'green' },
                    { titre: 'Taux Régularisation', valeur: '98.0%', unite: 'des volumes', progress: 98, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Excellent', badgeIcon: 'fa-check', bench: 'Seuil > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Relances Actives', valeur: '1', unite: 'Dossier', progress: 5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Sous contrôle', badgeIcon: 'fa-check', bench: 'Moyenne: 1.5', icon: 'fa-bell', colorTheme: 'green' }
                ];
            } else if (isWeek) {
                return [
                    { titre: 'Montant LA Semaine', valeur: '640.0', unite: 'Millions FCFA', progress: 30, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond hebdo: 1 Md', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Moyen Traitement', valeur: '1.8', unite: 'Jours ouvrés', progress: 90, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Dans les délais', badgeIcon: 'fa-bolt', bench: 'Cible < 3j', icon: 'fa-bolt', colorTheme: 'green' },
                    { titre: 'Taux Régularisation', valeur: '94.2%', unite: 'des volumes', progress: 94.2, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme (+4.2%)', badgeIcon: 'fa-check', bench: 'Seuil > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Relances Actives', valeur: '6', unite: 'Dossiers', progress: 25, progressColor: 'orange', badgeClass: 'badge-warning', badgeText: '2 urgentes', badgeIcon: 'fa-bell', bench: 'Moyenne: 1.5', icon: 'fa-bell', colorTheme: 'red' }
                ];
            } else if (isQ1) {
                return [
                    { titre: 'Montant LA Cumul T1', valeur: '4.850', unite: 'Milliards FCFA', progress: 65, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond T1 OK', badgeIcon: 'fa-check', bench: 'Plafond: 7.500 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Moyen Traitement', valeur: '3.8', unite: 'Jours ouvrés', progress: 85, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-0.5j vs 2025', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible < 5j', icon: 'fa-bolt', colorTheme: 'green' },
                    { titre: 'Taux Régularisation T1', valeur: '91.4%', unite: 'des volumes', progress: 91.4, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Objectif atteint', badgeIcon: 'fa-check', bench: 'Seuil légal > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Relances Actives T1', valeur: '58', unite: 'Cumul trimestre', progress: 50, progressColor: 'orange', badgeClass: 'badge-warning', badgeText: '12 critiques', badgeIcon: 'fa-bell', bench: 'Moyenne: 1.5', icon: 'fa-bell', colorTheme: 'red' }
                ];
            } else if (isY2026) {
                return [
                    { titre: 'Montant LA Année 2026', valeur: '15.423', unite: 'Milliards FCFA', progress: 55, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 25.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                    { titre: 'Délai Moyen 2026', valeur: '4.0', unite: 'Jours ouvrés', progress: 82, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme aux normes', badgeIcon: 'fa-check', bench: 'Cible < 5j', icon: 'fa-bolt', colorTheme: 'green' },
                    { titre: 'Taux Régularisation 2026', valeur: '89.0%', unite: 'des volumes', progress: 89, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Vigilance (-1.0%)', badgeIcon: 'fa-circle-exclamation', bench: 'Seuil légal > 90%', icon: 'fa-award', colorTheme: 'blue' },
                    { titre: 'Relances Actives 2026', valeur: '142', unite: 'Total dossiers', progress: 65, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '18 critiques', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne: 1.5', icon: 'fa-bell', colorTheme: 'red' }
                ];
            } else if (isY2025) {
                return [
                    { titre: 'Montant LA Exercice 2025', valeur: '18.900', unite: 'Milliards FCFA', progress: 100, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Exercice clos', badgeIcon: 'fa-check', bench: 'Plafond: 20.000 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'green' },
                    { titre: 'Délai Moyen 2025', valeur: '5.1', unite: 'Jours ouvrés', progress: 75, progressColor: 'blue', badgeClass: 'badge-success', badgeText: 'Bilan annuel', badgeIcon: 'fa-check', bench: 'Cible < 5j', icon: 'fa-bolt', colorTheme: 'blue' },
                    { titre: 'Taux Régularisation 2025', valeur: '96.5%', unite: 'Apurement final', progress: 96.5, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme (+6.5%)', badgeIcon: 'fa-check', bench: 'Seuil légal > 90%', icon: 'fa-award', colorTheme: 'green' },
                    { titre: 'Relances 2025 Closes', valeur: '18', unite: 'Dossiers soldés', progress: 100, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Tous apurés', badgeIcon: 'fa-check', bench: '100% traités', icon: 'fa-bell', colorTheme: 'green' }
                ];
            }

            // Default Month (Mars 2026)
            return [
                { titre: 'Montant LA en cours', valeur: '1.200', unite: 'Milliards FCFA', progress: 48, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Plafond respecté', badgeIcon: 'fa-check', bench: 'Plafond: 2.500 Mds', icon: 'fa-file-invoice-dollar', colorTheme: 'orange' },
                { titre: 'Délai Moyen Traitement', valeur: '4.2', unite: 'Jours ouvrés', progress: 84, progressColor: 'green', badgeClass: 'badge-success', badgeText: '-0.8j vs Fév', badgeIcon: 'fa-arrow-trend-down', bench: 'Cible : < 5 jours', icon: 'fa-bolt', colorTheme: 'green' },
                { titre: 'Taux Régularisation', valeur: '88.5%', unite: 'des volumes', progress: 88.5, progressColor: 'amber', badgeClass: 'badge-warning', badgeText: 'Vigilance (-1.5%)', badgeIcon: 'fa-circle-exclamation', bench: 'Seuil légal : > 90%', icon: 'fa-award', colorTheme: 'blue' },
                { titre: 'Relances Actives', valeur: '24', unite: 'Dossiers ordonnateurs', progress: 60, progressColor: 'red', badgeClass: 'badge-danger', badgeText: '7 critiques > 45j', badgeIcon: 'fa-triangle-exclamation', bench: 'Moyenne: 1.5 / LA', icon: 'fa-bell', colorTheme: 'red' }
            ];
        }

        // BC SUB-DOMAIN
        if (this.activeSubDomain === 'bc') {
            const count = isToday ? '35' : (isWeek ? '120' : (isY2025 ? '890' : '458'));
            const montantMoy = isToday ? '85 000' : '125 000';
            return [
                { titre: 'BC en Circulation', valeur: count, unite: 'Bons actifs', progress: 52, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Dans les limites', badgeIcon: 'fa-check', bench: 'Plafond : 600 bons', icon: 'fa-money-check-dollar', colorTheme: 'orange' },
                { titre: 'Montant Moyen BC', valeur: montantMoy, unite: 'FCFA / bon', progress: 68, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Stable', badgeIcon: 'fa-check', bench: 'Plafond : 500 000 FCFA', icon: 'fa-coins', colorTheme: 'green' },
                { titre: 'Couverture Appro.', valeur: '98.2%', unite: 'des guichets', progress: 98.2, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Optimal (+1.2%)', badgeIcon: 'fa-arrow-trend-up', bench: 'Seuil légal : > 95%', icon: 'fa-vault', colorTheme: 'blue' },
                { titre: 'Écarts Détectés', valeur: '0.02%', unite: 'Taux anomalie', progress: 10, progressColor: 'green', badgeClass: 'badge-success', badgeText: 'Conforme', badgeIcon: 'fa-shield-halved', bench: 'Seuil max : < 1%', icon: 'fa-scale-balanced', colorTheme: 'red' }
            ];
        }

        // CS SUB-DOMAIN
        return [
            { titre: 'Comptes Spéciaux Actifs', valeur: isY2025 ? '78' : '84', unite: 'Comptes Trésor', progress: 70, progressColor: 'orange', badgeClass: 'badge-success', badgeText: 'Audit validé', badgeIcon: 'fa-check', bench: 'Plafond : 100 comptes', icon: 'fa-wallet', colorTheme: 'orange' },
            { titre: 'Solde Total Disponibilités', valeur: isToday ? '42.920' : (isY2025 ? '38.400' : '42.850'), unite: 'Milliards FCFA', progress: 85, progressColor: 'green', badgeClass: 'badge-success', badgeText: '+3.4% vs T4', badgeIcon: 'fa-arrow-trend-up', bench: 'Réserve min : 30 Mds', icon: 'fa-piggy-bank', colorTheme: 'green' },
            { titre: 'Taux d\'Exécution Budgétaire', valeur: isY2025 ? '98.0%' : '64.2%', unite: 'Engagé / Dotation', progress: 64.2, progressColor: 'blue', badgeClass: 'badge-warning', badgeText: isY2025 ? 'Clos 100%' : 'Normal T1', badgeIcon: 'fa-clock', bench: 'Cible T1 : 65%', icon: 'fa-chart-pie', colorTheme: 'blue' },
            { titre: 'Comptes en Dépassement', valeur: isY2025 ? '0' : '2', unite: 'Alertes inspection', progress: 20, progressColor: 'red', badgeClass: 'badge-danger', badgeText: isY2025 ? 'Aucun' : 'Bloqués', badgeIcon: 'fa-lock', bench: 'Tolérance : 0', icon: 'fa-triangle-exclamation', colorTheme: 'red' }
        ];
    }

    // --- DYNAMIC FLOW DATA (SANKEY STREAM) ---
    get currentFlowData() {
        const isToday = this.activePeriod.includes('Aujourd');
        const isWeek = this.activePeriod.includes('semaine');
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        if (this.activeSubDomain === 'la') {
            if (isToday) {
                return {
                    totalEmission: '185 M FCFA',
                    mandatsCount: '12 Mandats émis',
                    reguleAmount: '160 M FCFA',
                    enCoursAmount: '20 M FCFA',
                    retardAmount: '5 M FCFA',
                    deblocageMoyen: '4h chrono',
                    apurementRapide: '95.0% (< 24h)',
                    impactNet: '- 15 M FCFA'
                };
            } else if (isWeek) {
                return {
                    totalEmission: '950 M FCFA',
                    mandatsCount: '38 Mandats émis',
                    reguleAmount: '780 M FCFA',
                    enCoursAmount: '120 M FCFA',
                    retardAmount: '50 M FCFA',
                    deblocageMoyen: '24h chrono',
                    apurementRapide: '88.0% (< 5j)',
                    impactNet: '- 100 M FCFA'
                };
            } else if (isY2025) {
                return {
                    totalEmission: '180.000 Mds',
                    mandatsCount: '1 450 Mandats émis',
                    reguleAmount: '172.000 Mds',
                    enCoursAmount: '6.000 Mds',
                    retardAmount: '2.000 Mds',
                    deblocageMoyen: '72h chrono',
                    apurementRapide: '96.0% (< 15j)',
                    impactNet: '- 1.500 Mds'
                };
            }
            return {
                totalEmission: '15.423 Mds',
                mandatsCount: '142 Mandats émis',
                reguleAmount: '10.025 Mds',
                enCoursAmount: '3.084 Mds',
                retardAmount: '2.314 Mds',
                deblocageMoyen: '48h chrono',
                apurementRapide: '72.4% (< 15j)',
                impactNet: '- 1.200 Mds'
            };
        } else if (this.activeSubDomain === 'bc') {
            return {
                totalEmission: isToday ? '15.0 M FCFA' : '458 M FCFA',
                mandatsCount: isToday ? '18 Bons actifs' : '458 Bons actifs',
                reguleAmount: isToday ? '12.5 M FCFA' : '297.7 M FCFA',
                enCoursAmount: isToday ? '2.0 M FCFA' : '91.6 M FCFA',
                retardAmount: isToday ? '0.5 M FCFA' : '68.7 M FCFA',
                deblocageMoyen: '12h chrono',
                apurementRapide: '98.2% (< 48h)',
                impactNet: '- 45 M FCFA'
            };
        } else {
            return {
                totalEmission: isY2025 ? '38.400 Mds' : '42.850 Mds',
                mandatsCount: isY2025 ? '78 Comptes gérés' : '84 Comptes gérés',
                reguleAmount: isY2025 ? '37.000 Mds' : '27.850 Mds',
                enCoursAmount: isY2025 ? '1.400 Mds' : '8.570 Mds',
                retardAmount: isY2025 ? '0 Mds' : '6.430 Mds',
                deblocageMoyen: '24h chrono',
                apurementRapide: '85.4% (< 7j)',
                impactNet: '- 5.250 Mds'
            };
        }
    }

    // --- DYNAMIC TELEMETRY DATA (LIVE BAR) ---
    get currentTelemetry() {
        const isToday = this.activePeriod.includes('Aujourd');
        const isWeek = this.activePeriod.includes('semaine');
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        if (isToday) {
            return {
                engage: '185,000 M',
                justifie: '170,000 M',
                solde: '15,000 M'
            };
        } else if (isWeek) {
            return {
                engage: '950,000 M',
                justifie: '850,000 M',
                solde: '100,000 M'
            };
        } else if (isY2025) {
            return {
                engage: '180,000,000 M',
                justifie: '178,500,000 M',
                solde: '1,500,000 M'
            };
        }
        return {
            engage: '15,423,000 M',
            justifie: '14,223,000 M',
            solde: '1,200,000 M'
        };
    }

    // --- Switch Sub-Domains ---
    switchSubDomain(domain: 'la' | 'bc' | 'cs') {
        this.activeSubDomain = domain;
        this.tableFilter = 'all';
        if (domain === 'la') this.activePerimetre = 'Tous les Ministères';
        else if (domain === 'bc') this.activePerimetre = 'Tous les Postes Comptables';
        else this.activePerimetre = 'Tous les Comptes Spéciaux';
        const names = {
            la: "Lettres d'Avance (LA)",
            bc: "Bons de Caisse (BC)",
            cs: "Comptes Spéciaux (CS)"
        };
        this.triggerToast(`Vue active : ${names[domain]}`);
    }

    // --- View Modes ---
    setViewMode(mode: 'synthese' | 'avancee') {
        this.viewMode = mode;
        if (mode === 'synthese') {
            this.triggerToast('Affichage Synthèse Opérationnelle activé');
        } else {
            this.triggerToast('Affichage Analyses Multidimensionnelles DWH activé');
        }
    }

    // --- Chart Tabs ---
    setChartTab(tab: 'sankey' | 'ministere' | 'age') {
        this.chartTab = tab;
        const labels = {
            sankey: 'Flux Sankey',
            ministere: 'Par Ministère',
            age: 'Pyramide des Âges'
        };
        this.triggerToast(`Vue analytique : ${labels[tab]}`);
    }

    // --- Table Filtering ---
    setTableFilter(filter: 'all' | 'en-cours' | 'retard' | 'regule') {
        this.tableFilter = filter;
    }

    removeChip(chip: string) {
        this.filterChips = this.filterChips.filter(c => c !== chip);
        this.triggerToast(`Filtre "${chip}" supprimé`);
    }

    // --- Filtered deliverables getters ---
    get filteredDeliverablesLA(): LADeliverable[] {
        const isToday = this.activePeriod.includes('Aujourd');
        const isWeek = this.activePeriod.includes('semaine');
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        return this.deliverablesLA.filter(item => {
            const matchesFilter = this.tableFilter === 'all' || item.statut === this.tableFilter;
            const matchesPerimetre = this.activePerimetre === 'Tous les Ministères' ||
                item.ministere.toLowerCase().includes(this.activePerimetre.toLowerCase()) ||
                item.ministereFull.toLowerCase().includes(this.activePerimetre.toLowerCase());

            let matchesPeriod = true;
            if (isToday) {
                matchesPeriod = item.periodTag === 'today';
            } else if (isWeek) {
                matchesPeriod = item.periodTag === 'today' || item.periodTag === 'week';
            } else if (isY2025) {
                matchesPeriod = item.periodTag === 'y2025';
            } else {
                // Month / Q1 / Exercice 2026: include 2026 items
                matchesPeriod = item.periodTag !== 'y2025';
            }

            const q = this.searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                item.ref.toLowerCase().includes(q) ||
                item.ministere.toLowerCase().includes(q) ||
                item.ministereFull.toLowerCase().includes(q) ||
                item.subtext.toLowerCase().includes(q);
            return matchesFilter && matchesPerimetre && matchesPeriod && matchesSearch;
        });
    }

    get filteredDeliverablesBC(): BCDeliverable[] {
        const isToday = this.activePeriod.includes('Aujourd');
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        return this.deliverablesBC.filter(item => {
            const matchesFilter = this.tableFilter === 'all' || item.statut === this.tableFilter;
            const matchesPerimetre = this.activePerimetre === 'Tous les Postes Comptables' ||
                item.poste.toLowerCase().includes(this.activePerimetre.toLowerCase()) ||
                item.posteFull.toLowerCase().includes(this.activePerimetre.toLowerCase());

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
                item.poste.toLowerCase().includes(q) ||
                item.posteFull.toLowerCase().includes(q) ||
                item.subtext.toLowerCase().includes(q);
            return matchesFilter && matchesPerimetre && matchesPeriod && matchesSearch;
        });
    }

    get filteredDeliverablesCS(): CSDeliverable[] {
        const isY2025 = this.activePeriod.includes('Exercice 2025');

        return this.deliverablesCS.filter(item => {
            const matchesFilter = this.tableFilter === 'all' || item.statut === this.tableFilter;
            const matchesPerimetre = this.activePerimetre === 'Tous les Comptes Spéciaux' ||
                item.intitule.toLowerCase().includes(this.activePerimetre.toLowerCase()) ||
                item.gestionnaire.toLowerCase().includes(this.activePerimetre.toLowerCase());

            const matchesPeriod = isY2025 ? item.periodTag === 'y2025' : item.periodTag !== 'y2025';

            const q = this.searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                item.ref.toLowerCase().includes(q) ||
                item.intitule.toLowerCase().includes(q) ||
                item.gestionnaire.toLowerCase().includes(q);
            return matchesFilter && matchesPerimetre && matchesPeriod && matchesSearch;
        });
    }

    // Counts for table tabs
    getCount(type: 'all' | 'en-cours' | 'retard' | 'regule'): number {
        if (this.activeSubDomain === 'la') {
            const list = this.filteredDeliverablesLA;
            if (type === 'all') return list.length;
            return list.filter(d => d.statut === type).length;
        } else if (this.activeSubDomain === 'bc') {
            const list = this.filteredDeliverablesBC;
            if (type === 'all') return list.length;
            return list.filter(d => d.statut === type).length;
        } else {
            const list = this.filteredDeliverablesCS;
            if (type === 'all') return list.length;
            return list.filter(d => d.statut === type).length;
        }
    }

    // --- Action Triggers ---
    refreshData() {
        this.triggerToast('Synchronisation des données en temps réel effectuée...');
    }

    exportData(format: 'PDF' | 'EXCEL' = 'PDF') {
        this.triggerToast(`Génération de l'export ${format} en cours...`);
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

    updateIndicators(indicators: string[]) {
        if (this.activeSubDomain === 'la') {
            this.selectedIndicatorsLA = indicators;
        } else {
            this.selectedIndicatorsBC = indicators;
        }
    }

    updateAvailableIndicators(indicators: string[]) {
        if (this.activeSubDomain === 'la') {
            this.availableIndicatorsLA = indicators;
        } else {
            this.availableIndicatorsBC = indicators;
        }
    }

    updateAxes(axes: string[]) {
        if (this.activeSubDomain === 'la') {
            this.selectedAxesLA = axes;
        } else {
            this.selectedAxesBC = axes;
        }
    }

    updateAvailableAxes(axes: string[]) {
        if (this.activeSubDomain === 'la') {
            this.availableAxesLA = axes;
        } else {
            this.availableAxesBC = axes;
        }
    }
}
