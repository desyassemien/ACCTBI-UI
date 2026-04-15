import { Injectable } from '@angular/core';

interface ChartData {
    labels: string[];
    data: number[];
    color: string;
}

interface TableRow {
    [key: string]: string | number | TableRow[];
}

interface KpiDetails {
    title: string;
    value: string;
    unit: string;
    chartData: ChartData;
    tableHeaders: string[];
    tableData: TableRow[];
    chartType: 'line' | 'area' | 'pie' | 'donut';
}

@Injectable({
    providedIn: 'root'
})
export class KpiDetailService {

    private kpiDetails: { [key: string]: KpiDetails } = {
        '1': {
            title: 'Position Trésorerie Nette',
            value: '12,450,000,000',
            unit: 'FCFA',
            chartType: 'line',
            chartData: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                data: [12000000000, 11800000000, 12200000000, 12500000000, 12300000000, 12450000000],
                color: '#1B3A6B'
            },
            tableHeaders: ['Période', 'Montant', 'Variation', 'Tendance'],
            tableData: [
                { 'Période': 'Janvier 2024', 'Montant': '12,000,000,000 FCFA', 'Variation': '+2.5%', 'Tendance': '↑' },
                { 'Période': 'Février 2024', 'Montant': '11,800,000,000 FCFA', 'Variation': '-1.7%', 'Tendance': '↓' },
                { 'Période': 'Mars 2024', 'Montant': '12,200,000,000 FCFA', 'Variation': '+3.4%', 'Tendance': '↑' },
                { 'Période': 'Avril 2024', 'Montant': '12,500,000,000 FCFA', 'Variation': '+2.5%', 'Tendance': '↑' },
                { 'Période': 'Mai 2024', 'Montant': '12,300,000,000 FCFA', 'Variation': '-1.6%', 'Tendance': '↓' },
                { 'Période': 'Juin 2024', 'Montant': '12,450,000,000 FCFA', 'Variation': '+1.2%', 'Tendance': '↑' }
            ]
        },
        '2': {
            title: 'Total Restes à Payer',
            value: '320,000,000',
            unit: 'FCFA',
            chartType: 'area',
            chartData: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                data: [280000000, 290000000, 310000000, 315000000, 318000000, 320000000],
                color: '#B71C1C'
            },
            tableHeaders: ['Période', 'Montant', 'Variation', 'Tendance'],
            tableData: [
                { 'Période': 'Janvier 2024', 'Montant': '280,000,000 FCFA', 'Variation': '+3.2%', 'Tendance': '↑' },
                { 'Période': 'Février 2024', 'Montant': '290,000,000 FCFA', 'Variation': '+3.6%', 'Tendance': '↑' },
                { 'Période': 'Mars 2024', 'Montant': '310,000,000 FCFA', 'Variation': '+6.9%', 'Tendance': '↑' },
                { 'Période': 'Avril 2024', 'Montant': '315,000,000 FCFA', 'Variation': '+1.6%', 'Tendance': '↑' },
                { 'Période': 'Mai 2024', 'Montant': '318,000,000 FCFA', 'Variation': '+1.0%', 'Tendance': '↑' },
                { 'Période': 'Juin 2024', 'Montant': '320,000,000 FCFA', 'Variation': '+0.6%', 'Tendance': '↑' }
            ]
        },
        '3': {
            title: 'Taux Exécution Budgétaire',
            value: '85.8',
            unit: '%',
            chartType: 'line',
            chartData: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                data: [78.5, 80.2, 82.1, 83.7, 85.1, 85.8],
                color: '#2E7D32'
            },
            tableHeaders: ['Période', 'Taux', 'Variation', 'Tendance'],
            tableData: [
                { 'Période': 'Janvier 2024', 'Taux': '78.5%', 'Variation': '+2.1%', 'Tendance': '↑' },
                { 'Période': 'Février 2024', 'Taux': '80.2%', 'Variation': '+2.1%', 'Tendance': '↑' },
                { 'Période': 'Mars 2024', 'Taux': '82.1%', 'Variation': '+2.4%', 'Tendance': '↑' },
                { 'Période': 'Avril 2024', 'Taux': '83.7%', 'Variation': '+2.0%', 'Tendance': '↑' },
                { 'Période': 'Mai 2024', 'Taux': '85.1%', 'Variation': '+1.7%', 'Tendance': '↑' },
                { 'Période': 'Juin 2024', 'Taux': '85.8%', 'Variation': '+0.8%', 'Tendance': '↑' }
            ]
        },
        '4': {
            title: 'Solde Bancaire Consolidé',
            value: '15,423,000,000',
            unit: 'FCFA',
            chartType: 'area',
            chartData: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                data: [15200000000, 15150000000, 15300000000, 15400000000, 15450000000, 15423000000],
                color: '#D4A017'
            },
            tableHeaders: ['Période', 'Montant', 'Variation', 'Tendance'],
            tableData: [
                { 'Période': 'Janvier 2024', 'Montant': '15,200,000,000 FCFA', 'Variation': '+1.2%', 'Tendance': '↑' },
                { 'Période': 'Février 2024', 'Montant': '15,150,000,000 FCFA', 'Variation': '-0.3%', 'Tendance': '↓' },
                { 'Période': 'Mars 2024', 'Montant': '15,300,000,000 FCFA', 'Variation': '+1.0%', 'Tendance': '↑' },
                { 'Période': 'Avril 2024', 'Montant': '15,400,000,000 FCFA', 'Variation': '+0.7%', 'Tendance': '↑' },
                { 'Période': 'Mai 2024', 'Montant': '15,450,000,000 FCFA', 'Variation': '+0.3%', 'Tendance': '↑' },
                { 'Période': 'Juin 2024', 'Montant': '15,423,000,000 FCFA', 'Variation': '-0.2%', 'Tendance': '↓' }
            ]
        },
        '5': {
            title: 'Opérations en Attente',
            value: '12',
            unit: '',
            chartType: 'line',
            chartData: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                data: [8, 9, 10, 11, 12, 12],
                color: '#E65100'
            },
            tableHeaders: ['Période', 'Nombre', 'Variation', 'Tendance'],
            tableData: [
                { 'Période': 'Janvier 2024', 'Nombre': '8', 'Variation': '+12.5%', 'Tendance': '↑' },
                { 'Période': 'Février 2024', 'Nombre': '9', 'Variation': '+12.5%', 'Tendance': '↑' },
                { 'Période': 'Mars 2024', 'Nombre': '10', 'Variation': '+11.1%', 'Tendance': '↑' },
                { 'Période': 'Avril 2024', 'Nombre': '11', 'Variation': '+10.0%', 'Tendance': '↑' },
                { 'Période': 'Mai 2024', 'Nombre': '12', 'Variation': '+9.1%', 'Tendance': '↑' },
                { 'Période': 'Juin 2024', 'Nombre': '12', 'Variation': '0%', 'Tendance': '-' }
            ]
        },

        // ─── Activités Journalières ────────────────────────────────────────────
        'activite-reglements': {
            title: 'Règlements Effectués',
            value: '45',
            unit: 'opérations',
            chartType: 'area',
            chartData: {
                labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                data: [38, 42, 35, 50, 45, 20, 10],
                color: '#2E7D32'
            },
            tableHeaders: ['Référence', 'Bénéficiaire', 'Montant (FCFA)', 'Heure', 'Statut'],
            tableData: [
                { 'Référence': 'REG-2024-001', 'Bénéficiaire': 'SOGECI SA', 'Montant (FCFA)': '45,000,000', 'Heure': '08:32', 'Statut': 'Validé', details: [{ 'Compte débit': '40100001', 'Compte crédit': '50200003', 'Motif': 'Prestation Q1 2024', 'Validateur': 'A. Koné' }] },
                { 'Référence': 'REG-2024-002', 'Bénéficiaire': 'AGEROUTE', 'Montant (FCFA)': '120,000,000', 'Heure': '09:15', 'Statut': 'Validé', details: [{ 'Compte débit': '40100002', 'Compte crédit': '50200010', 'Motif': 'Travaux route A3', 'Validateur': 'M. Diabaté' }] },
                { 'Référence': 'REG-2024-003', 'Bénéficiaire': 'CIDT', 'Montant (FCFA)': '80,500,000', 'Heure': '10:00', 'Statut': 'En cours', details: [{ 'Compte débit': '40100003', 'Compte crédit': '50200015', 'Motif': 'Subvention agricole', 'Validateur': 'Pending' }] },
                { 'Référence': 'REG-2024-004', 'Bénéficiaire': 'STMB', 'Montant (FCFA)': '25,000,000', 'Heure': '11:20', 'Statut': 'Validé', details: [] },
                { 'Référence': 'REG-2024-005', 'Bénéficiaire': 'CHU Cocody', 'Montant (FCFA)': '60,000,000', 'Heure': '14:05', 'Statut': 'Validé', details: [] }
            ]
        },
        'activite-mandats': {
            title: 'Mandats Émis',
            value: '128',
            unit: 'mandats',
            chartType: 'line',
            chartData: {
                labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                data: [110, 120, 105, 135, 128, 60, 30],
                color: '#1B3A6B'
            },
            tableHeaders: ['N° Mandat', 'Ordonnateur', 'Montant (FCFA)', 'Date', 'Nature'],
            tableData: [
                { 'N° Mandat': 'MAN-2024-0801', 'Ordonnateur': 'Min. Finances', 'Montant (FCFA)': '350,000,000', 'Date': '13/04/2024', 'Nature': 'Fonctionnement', details: [{ 'Chapitre': '21-001', 'Article': '601', 'Paragraphe': '01', 'Bénéficiaire': 'DGBF' }] },
                { 'N° Mandat': 'MAN-2024-0802', 'Ordonnateur': 'Min. Éducation', 'Montant (FCFA)': '500,000,000', 'Date': '13/04/2024', 'Nature': 'Investissement', details: [] },
                { 'N° Mandat': 'MAN-2024-0803', 'Ordonnateur': 'Min. Santé', 'Montant (FCFA)': '200,000,000', 'Date': '13/04/2024', 'Nature': 'Fonctionnement', details: [] },
                { 'N° Mandat': 'MAN-2024-0804', 'Ordonnateur': 'Min. Agriculture', 'Montant (FCFA)': '180,000,000', 'Date': '13/04/2024', 'Nature': 'Subvention', details: [] },
                { 'N° Mandat': 'MAN-2024-0805', 'Ordonnateur': 'Min. Transport', 'Montant (FCFA)': '420,000,000', 'Date': '13/04/2024', 'Nature': 'Investissement', details: [] }
            ]
        },
        'activite-cautionnements': {
            title: 'Nouveaux Cautionnements',
            value: '8',
            unit: 'dossiers',
            chartType: 'pie',
            chartData: {
                labels: ['En cours', 'Approuvés', 'Rejetés', 'En révision'],
                data: [3, 3, 1, 1],
                color: '#D4A017'
            },
            tableHeaders: ['N° Dossier', 'Entreprise', 'Montant (FCFA)', 'Type', 'Statut'],
            tableData: [
                { 'N° Dossier': 'CAUT-2024-0451', 'Entreprise': 'BTP Afrique SARL', 'Montant (FCFA)': '250,000,000', 'Type': 'Marché public', 'Statut': 'Approuvé', details: [] },
                { 'N° Dossier': 'CAUT-2024-0452', 'Entreprise': 'GREEN ENERGY CI', 'Montant (FCFA)': '180,000,000', 'Type': 'Concession', 'Statut': 'En cours', details: [] },
                { 'N° Dossier': 'CAUT-2024-0453', 'Entreprise': 'TRANSIT PLUS', 'Montant (FCFA)': '95,000,000', 'Type': 'Licence', 'Statut': 'En révision', details: [] },
                { 'N° Dossier': 'CAUT-2024-0454', 'Entreprise': 'SODECI', 'Montant (FCFA)': '850,000,000', 'Type': 'DSP', 'Statut': 'Approuvé', details: [] },
                { 'N° Dossier': 'CAUT-2024-0455', 'Entreprise': 'IMPEX GROUP', 'Montant (FCFA)': '45,000,000', 'Type': 'Marché public', 'Statut': 'Rejeté', details: [] }
            ]
        },
        'activite-recettes': {
            title: 'Recettes Perçues (Régies)',
            value: '2.4B',
            unit: 'FCFA',
            chartType: 'area',
            chartData: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                data: [1800000000, 2000000000, 1900000000, 2200000000, 2300000000, 2400000000],
                color: '#0288D1'
            },
            tableHeaders: ['Régie', 'Montant (FCFA)', 'Objectif (FCFA)', 'Taux', 'Tendance'],
            tableData: [
                { 'Régie': 'Régie Abidjan Centre', 'Montant (FCFA)': '850,000,000', 'Objectif (FCFA)': '900,000,000', 'Taux': '94.4%', 'Tendance': '↑', details: [] },
                { 'Régie': 'Régie Cocody', 'Montant (FCFA)': '420,000,000', 'Objectif (FCFA)': '400,000,000', 'Taux': '105.0%', 'Tendance': '↑', details: [] },
                { 'Régie': 'Régie Yopougon', 'Montant (FCFA)': '380,000,000', 'Objectif (FCFA)': '420,000,000', 'Taux': '90.5%', 'Tendance': '↓', details: [] },
                { 'Régie': 'Régie Plateau', 'Montant (FCFA)': '520,000,000', 'Objectif (FCFA)': '500,000,000', 'Taux': '104.0%', 'Tendance': '↑', details: [] },
                { 'Régie': 'Régie Bouaké', 'Montant (FCFA)': '230,000,000', 'Objectif (FCFA)': '250,000,000', 'Taux': '92.0%', 'Tendance': '↓', details: [] }
            ]
        },

        // ─── Graphiques ────────────────────────────────────────────────────────
        'chart-tresorerie': {
            title: 'Évolution de la Trésorerie',
            value: '12,450,000,000',
            unit: 'FCFA',
            chartType: 'area',
            chartData: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
                data: [11200000000, 11500000000, 11800000000, 12000000000, 11700000000, 12100000000, 12300000000, 12150000000, 12400000000, 12200000000, 12350000000, 12450000000],
                color: '#1B3A6B'
            },
            tableHeaders: ['Mois', 'Entrées (FCFA)', 'Sorties (FCFA)', 'Solde Net (FCFA)', 'Variation'],
            tableData: [
                { 'Mois': 'Janvier 2024', 'Entrées (FCFA)': '3,200,000,000', 'Sorties (FCFA)': '2,900,000,000', 'Solde Net (FCFA)': '11,200,000,000', 'Variation': '-', details: [] },
                { 'Mois': 'Février 2024', 'Entrées (FCFA)': '3,500,000,000', 'Sorties (FCFA)': '2,800,000,000', 'Solde Net (FCFA)': '11,500,000,000', 'Variation': '+2.7%', details: [] },
                { 'Mois': 'Mars 2024', 'Entrées (FCFA)': '3,800,000,000', 'Sorties (FCFA)': '3,100,000,000', 'Solde Net (FCFA)': '11,800,000,000', 'Variation': '+2.6%', details: [] },
                { 'Mois': 'Avril 2024', 'Entrées (FCFA)': '4,100,000,000', 'Sorties (FCFA)': '3,500,000,000', 'Solde Net (FCFA)': '12,000,000,000', 'Variation': '+1.7%', details: [] },
                { 'Mois': 'Mai 2024', 'Entrées (FCFA)': '3,600,000,000', 'Sorties (FCFA)': '3,700,000,000', 'Solde Net (FCFA)': '11,700,000,000', 'Variation': '-2.5%', details: [] },
                { 'Mois': 'Juin 2024', 'Entrées (FCFA)': '4,300,000,000', 'Sorties (FCFA)': '3,600,000,000', 'Solde Net (FCFA)': '12,100,000,000', 'Variation': '+3.4%', details: [] },
                { 'Mois': 'Juillet 2024', 'Entrées (FCFA)': '4,200,000,000', 'Sorties (FCFA)': '3,500,000,000', 'Solde Net (FCFA)': '12,300,000,000', 'Variation': '+1.7%', details: [] },
                { 'Mois': 'Août 2024', 'Entrées (FCFA)': '3,900,000,000', 'Sorties (FCFA)': '3,850,000,000', 'Solde Net (FCFA)': '12,150,000,000', 'Variation': '-1.2%', details: [] },
                { 'Mois': 'Septembre 2024', 'Entrées (FCFA)': '4,500,000,000', 'Sorties (FCFA)': '3,800,000,000', 'Solde Net (FCFA)': '12,400,000,000', 'Variation': '+2.1%', details: [] },
                { 'Mois': 'Octobre 2024', 'Entrées (FCFA)': '4,000,000,000', 'Sorties (FCFA)': '4,100,000,000', 'Solde Net (FCFA)': '12,200,000,000', 'Variation': '-1.6%', details: [] },
                { 'Mois': 'Novembre 2024', 'Entrées (FCFA)': '4,200,000,000', 'Sorties (FCFA)': '3,800,000,000', 'Solde Net (FCFA)': '12,350,000,000', 'Variation': '+1.2%', details: [] },
                { 'Mois': 'Décembre 2024', 'Entrées (FCFA)': '4,600,000,000', 'Sorties (FCFA)': '4,300,000,000', 'Solde Net (FCFA)': '12,450,000,000', 'Variation': '+0.8%', details: [] }
            ]
        },
        'chart-budget': {
            title: 'Répartition Budgétaire',
            value: '100%',
            unit: 'Budget Total',
            chartType: 'donut',
            chartData: {
                labels: ['Fonctionnement', 'Investissement', 'Disponible', 'Gelé/Bloqué'],
                data: [60, 30, 8, 2],
                color: '#1B3A6B'
            },
            tableHeaders: ['Catégorie', 'Montant (FCFA)', 'Pourcentage', 'Statut'],
            tableData: [
                { 'Catégorie': 'Fonctionnement', 'Montant (FCFA)': '9,253,800,000', 'Pourcentage': '60%', 'Statut': 'Normal', details: [{ 'Sous-catégorie': 'Personnel', 'Montant': '5,500,000,000', 'Taux': '59%' }, { 'Sous-catégorie': 'Matériel', 'Montant': '2,300,000,000', 'Taux': '25%' }, { 'Sous-catégorie': 'Services', 'Montant': '1,453,800,000', 'Taux': '16%' }] },
                { 'Catégorie': 'Investissement', 'Montant (FCFA)': '4,626,900,000', 'Pourcentage': '30%', 'Statut': 'Normal', details: [{ 'Sous-catégorie': 'Infrastructure', 'Montant': '3,000,000,000', 'Taux': '65%' }, { 'Sous-catégorie': 'Équipements', 'Montant': '1,626,900,000', 'Taux': '35%' }] },
                { 'Catégorie': 'Disponible', 'Montant (FCFA)': '1,233,840,000', 'Pourcentage': '8%', 'Statut': 'Attention', details: [] },
                { 'Catégorie': 'Gelé/Bloqué', 'Montant (FCFA)': '308,460,000', 'Pourcentage': '2%', 'Statut': 'Critique', details: [] }
            ]
        },

        // ─── Alertes ───────────────────────────────────────────────────────────
        'alertes': {
            title: 'Alertes et Signalements',
            value: '4',
            unit: 'alertes actives',
            chartType: 'pie',
            chartData: {
                labels: ['DANGER', 'WARNING', 'INFO'],
                data: [3, 1, 0],
                color: '#B71C1C'
            },
            tableHeaders: ['Service', 'Type', 'Titre', 'Description', 'Date'],
            tableData: [
                { 'Service': 'Statistiques', 'Type': '🔴 DANGER', 'Titre': 'RAP > 90 jours', 'Description': "Ancienneté moyenne des Restes à Payer dépassée.", 'Date': '13/04/2024', details: [{ 'ID Alerte': 'a1', 'Créée le': '10/04/2024', 'Délai Max': '90 jours', 'Valeur actuelle': '95 jours', 'Action': 'Contacter ordonnateur' }] },
                { 'Service': 'Trésorerie', 'Type': '🔴 DANGER', 'Titre': 'LA > 60 jours', 'Description': "Lettres d'Avance non régularisées après délai.", 'Date': '12/04/2024', details: [{ 'ID Alerte': 'a2', 'Créée le': '11/04/2024', 'Délai Max': '60 jours', 'Valeur actuelle': '68 jours', 'Action': 'Émission ordre de recette' }] },
                { 'Service': 'Comptabilité', 'Type': '🔴 DANGER', 'Titre': 'Écart concordance > 0.1%', 'Description': 'Écart critique détecté entre BCEAO et ACCT.', 'Date': '13/04/2024', details: [] },
                { 'Service': 'Cautionnement', 'Type': '🟡 WARNING', 'Titre': 'Cautionnement échu', 'Description': 'Cautionnement non régularisé (Date fin + 30j).', 'Date': '13/04/2024', details: [] }
            ]
        },

        // ─── Top Postes Comptables ─────────────────────────────────────────────
        'top-postes': {
            title: 'Top Postes Comptables Approvisionnés',
            value: '1,093,000,000',
            unit: 'FCFA total',
            chartType: 'area',
            chartData: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                data: [950000000, 980000000, 1010000000, 1040000000, 1070000000, 1093000000],
                color: '#3D5A8C'
            },
            tableHeaders: ['Poste Comptable', 'Montant (FCFA)', 'Évolution', 'Objectif', 'Taux réalisation'],
            tableData: [
                { 'Poste Comptable': 'Trésorerie Paierie Générale', 'Montant (FCFA)': '450,000,000', 'Évolution': '+5%', 'Objectif': '430,000,000', 'Taux réalisation': '104.7%', details: [{ 'Mois': 'Janvier', 'Montant': '380,000,000' }, { 'Mois': 'Février', 'Montant': '400,000,000' }, { 'Mois': 'Mars', 'Montant': '420,000,000' }, { 'Mois': 'Avril', 'Montant': '440,000,000' }, { 'Mois': 'Mai', 'Montant': '450,000,000' }] },
                { 'Poste Comptable': 'Recette Générale des Finances', 'Montant (FCFA)': '320,000,000', 'Évolution': '+2%', 'Objectif': '315,000,000', 'Taux réalisation': '101.6%', details: [] },
                { 'Poste Comptable': 'Trésorerie Principale Cocody', 'Montant (FCFA)': '150,000,000', 'Évolution': '-1%', 'Objectif': '160,000,000', 'Taux réalisation': '93.8%', details: [] },
                { 'Poste Comptable': 'Trésorerie Principale Yopougon', 'Montant (FCFA)': '95,000,000', 'Évolution': '+8%', 'Objectif': '90,000,000', 'Taux réalisation': '105.6%', details: [] },
                { 'Poste Comptable': 'Trésorerie Régionale Bouaké', 'Montant (FCFA)': '78,000,000', 'Évolution': '+4%', 'Objectif': '80,000,000', 'Taux réalisation': '97.5%', details: [] }
            ]
        }
    };

    getKpiDetails(kpiId: string): KpiDetails | null {
        const kpi = this.kpiDetails[kpiId];
        if (!kpi) return null;

        // Enrichir dynamiquement chaque ligne avec le détail par service
        const enrichedTableData = kpi.tableData.map(row => {
            return {
                ...row,
                details: [
                    { 'Service': 'Direction Générale', 'Budget Alloué': '150,000,000 FCFA', 'Dépenses': '120,000,000 FCFA', 'Statut': 'Normal' },
                    { 'Service': 'Ressources Humaines', 'Budget Alloué': '80,000,000 FCFA', 'Dépenses': '75,000,000 FCFA', 'Statut': 'Alerte' },
                    { 'Service': 'Département IT', 'Budget Alloué': '200,000,000 FCFA', 'Dépenses': '210,000,000 FCFA', 'Statut': 'Critique' },
                    { 'Service': 'Marketing & Com', 'Budget Alloué': '50,000,000 FCFA', 'Dépenses': '20,000,000 FCFA', 'Statut': 'Normal' },
                    { 'Service': 'Logistique', 'Budget Alloué': '100,000,000 FCFA', 'Dépenses': '95,000,000 FCFA', 'Statut': 'Alerte' }
                ]
            };
        });

        return {
            ...kpi,
            tableData: enrichedTableData
        };
    }
}
