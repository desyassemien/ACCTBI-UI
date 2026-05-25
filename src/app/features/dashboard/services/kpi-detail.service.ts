import { Injectable } from '@angular/core';

interface KpiDetail {
    title: string;
    value: string;
    unit: string;
    chartData: {
        labels: string[];
        data: number[];
        color: string;
    };
    tableHeaders: string[];
    tableData: Array<{ [key: string]: string | number | Array<Record<string, string | number>> }>;
    chartType: 'bar' | 'line';
}

@Injectable({
    providedIn: 'root'
})
export class KpiDetailService {

    getKpiDetails(kpiId: string): KpiDetail | null {
        const kpiDataMap: { [key: string]: KpiDetail } = {
            '4': {
                title: 'Solde Bancaire Consolidé',
                value: '15.42 B',
                unit: 'FCFA',
                chartData: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
                    data: [12500000000, 13200000000, 12800000000, 14100000000, 13900000000, 15200000000, 14800000000, 15900000000, 16100000000, 15800000000, 15600000000, 15423000000],
                    color: '#D4A017'
                },
                tableHeaders: ['Institution Bancaire', 'Solde (FCFA)', 'Devises', 'Évolution'],
                tableData: [
                    { 'Institution Bancaire': 'Banque Centrale BCEAO', 'Solde (FCFA)': '8,500,000,000', 'Devises': 'XOF', 'Évolution': '+2.5%' },
                    { 'Institution Bancaire': 'Trésor Principal Abidjan', 'Solde (FCFA)': '4,200,000,000', 'Devises': 'XOF', 'Évolution': '+1.2%' },
                    { 'Institution Bancaire': 'Trésor Région Yamoussoukro', 'Solde (FCFA)': '2,100,000,000', 'Devises': 'XOF', 'Évolution': '-0.8%' },
                    { 'Institution Bancaire': 'Comptes de Correspondants', 'Solde (FCFA)': '623,000,000', 'Devises': 'USD/EUR', 'Évolution': '+3.1%' }
                ],
                chartType: 'line'
            },
            '1': {
                title: 'Position Trésorerie Nette',
                value: '12.45 B',
                unit: 'FCFA',
                chartData: {
                    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8', 'Sem 9', 'Sem 10', 'Sem 11', 'Sem 12'],
                    data: [10200000000, 11300000000, 11800000000, 12100000000, 12400000000, 12900000000, 12700000000, 13100000000, 12800000000, 12600000000, 12500000000, 12450000000],
                    color: '#1B3A6B'
                },
                tableHeaders: ['Composante', 'Montant (FCFA)', 'Variante', 'Tendance'],
                tableData: [
                    { 'Composante': 'Disponibilités Immédiates', 'Montant (FCFA)': '8,900,000,000', 'Variante': 'Trésor + Banques', 'Tendance': '+3.2%' },
                    { 'Composante': 'Crédits à Court Terme', 'Montant (FCFA)': '2,100,000,000', 'Variante': 'Avances à Régulariser', 'Tendance': '+1.8%' },
                    { 'Composante': 'Engagements Assimilés', 'Montant (FCFA)': '1,450,000,000', 'Variante': 'Cautionnements', 'Tendance': '-0.5%' }
                ],
                chartType: 'line'
            },
            '5': {
                title: 'Opérations en Attente',
                value: '12',
                unit: 'Nombre',
                chartData: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
                    data: [8, 12, 10, 15, 14, 9, 11, 13, 12, 10, 11, 12],
                    color: '#E65100'
                },
                tableHeaders: ['Type Opération', 'Nombre', 'Montant (FCFA)', 'Depuis (jours)'],
                tableData: [
                    {
                        'Type Opération': 'Mandats en Attente',
                        'Nombre': '5',
                        'Montant (FCFA)': '850,000,000',
                        'Depuis (jours)': '3',
                        details: [
                            { 'Mandat': 'M-001', 'Statut': 'En attente', 'Montant': '170,000,000', 'Bénéficiaire': 'Société A' },
                            { 'Mandat': 'M-002', 'Statut': 'En attente', 'Montant': '180,000,000', 'Bénéficiaire': 'Société B' },
                            { 'Mandat': 'M-003', 'Statut': 'En attente', 'Montant': '160,000,000', 'Bénéficiaire': 'Société C' },
                            { 'Mandat': 'M-004', 'Statut': 'En attente', 'Montant': '180,000,000', 'Bénéficiaire': 'Société D' },
                            { 'Mandat': 'M-005', 'Statut': 'En attente', 'Montant': '160,000,000', 'Bénéficiaire': 'Société E' }
                        ]
                    },
                    { 'Type Opération': 'Lettres d\'Avance', 'Nombre': '3', 'Montant (FCFA)': '420,000,000', 'Depuis (jours)': '7' },
                    { 'Type Opération': 'Chèques Émis Non Présentés', 'Nombre': '2', 'Montant (FCFA)': '150,000,000', 'Depuis (jours)': '15' },
                    { 'Type Opération': 'Écart Bureau-Encaisse', 'Nombre': '2', 'Montant (FCFA)': '25,500,000', 'Depuis (jours)': '1' }
                ],
                chartType: 'line'
            },
            '2': {
                title: 'Total Restes à Payer',
                value: '320 M',
                unit: 'FCFA',
                chartData: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
                    data: [250000000, 280000000, 310000000, 335000000, 320000000, 305000000, 315000000, 330000000, 325000000, 318000000, 322000000, 320000000],
                    color: '#B71C1C'
                },
                tableHeaders: ['Service Créancier', 'Montant RAP (FCFA)', 'Ancienneté', 'Priorité'],
                tableData: [
                    { 'Service Créancier': 'Infrastructure & Travaux Publics', 'Montant RAP (FCFA)': '125,000,000', 'Ancienneté': '45 jours', 'Priorité': 'Haute' },
                    { 'Service Créancier': 'Éducation Nationale', 'Montant RAP (FCFA)': '85,000,000', 'Ancienneté': '32 jours', 'Priorité': 'Haute' },
                    { 'Service Créancier': 'Santé Publique', 'Montant RAP (FCFA)': '65,000,000', 'Ancienneté': '28 jours', 'Priorité': 'Moyenne' },
                    { 'Service Créancier': 'Défense & Sécurité', 'Montant RAP (FCFA)': '45,000,000', 'Ancienneté': '15 jours', 'Priorité': 'Moyenne' }
                ],
                chartType: 'line'
            },
            '3': {
                title: 'Taux Exécution Budgétaire',
                value: '85.8',
                unit: 'PERCENT',
                chartData: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
                    data: [18.5, 32.4, 45.2, 54.1, 61.8, 68.9, 73.2, 77.5, 80.4, 82.9, 84.5, 85.8],
                    color: '#2E7D32'
                },
                tableHeaders: ['Ligne Budgétaire', 'Budget (FCFA)', 'Exécuté (FCFA)', 'Taux %'],
                tableData: [
                    { 'Ligne Budgétaire': 'Fonctionnement Ministères', 'Budget (FCFA)': '450,000,000,000', 'Exécuté (FCFA)': '386,000,000,000', 'Taux %': '85.8%' },
                    { 'Ligne Budgétaire': 'Investissements Publics', 'Budget (FCFA)': '200,000,000,000', 'Exécuté (FCFA)': '168,000,000,000', 'Taux %': '84.0%' },
                    { 'Ligne Budgétaire': 'Intérêts de la Dette', 'Budget (FCFA)': '80,000,000,000', 'Exécuté (FCFA)': '78,400,000,000', 'Taux %': '98.0%' },
                    { 'Ligne Budgétaire': 'Transferts et Subventions', 'Budget (FCFA)': '120,000,000,000', 'Exécuté (FCFA)': '102,000,000,000', 'Taux %': '85.0%' }
                ],
                chartType: 'bar'
            }
        };

        // KPIs activité quotidienne (Section 11.3.C)
        const activityDataMap: { [key: string]: KpiDetail } = {
            'activite-recettes': {
                title: 'Recettes perçues (Régies)',
                value: '2.4 B',
                unit: 'FCFA',
                chartData: {
                    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                    data: [2100000000, 2200000000, 2050000000, 2400000000, 2600000000, 1800000000, 1200000000],
                    color: '#1976d2'
                },
                tableHeaders: ['Régie Perception', 'Montant (FCFA)', 'Nombre Opérations', 'Tendance'],
                tableData: [
                    { 'Régie Perception': 'Recette Générale Finances', 'Montant (FCFA)': '1,200,000,000', 'Nombre Opérations': '324', 'Tendance': '+8%' },
                    { 'Régie Perception': 'Douanes et Droits Indirects', 'Montant (FCFA)': '650,000,000', 'Nombre Opérations': '156', 'Tendance': '+5%' },
                    { 'Régie Perception': 'Impôts Directs', 'Montant (FCFA)': '380,000,000', 'Nombre Opérations': '89', 'Tendance': '+12%' },
                    { 'Régie Perception': 'Patrimoine de l\'État', 'Montant (FCFA)': '170,000,000', 'Nombre Opérations': '42', 'Tendance': '+2%' }
                ],
                chartType: 'line'
            },
            'activite-reglements': {
                title: 'Règlements effectués',
                value: '45',
                unit: 'Nombre',
                chartData: {
                    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                    data: [42, 38, 45, 52, 58, 15, 5],
                    color: '#4caf50'
                },
                tableHeaders: ['Type Règlement', 'Nombre', 'Montant (FCFA)', 'État'],
                tableData: [
                    { 'Type Règlement': 'Virement Bancaire', 'Nombre': '22', 'Montant (FCFA)': '850,000,000', 'État': 'Complété' },
                    { 'Type Règlement': 'Chèque', 'Nombre': '15', 'Montant (FCFA)': '245,000,000', 'État': 'Complété' },
                    { 'Type Règlement': 'Prélèvement', 'Nombre': '6', 'Montant (FCFA)': '105,000,000', 'État': 'En cours' },
                    { 'Type Règlement': 'Espèces', 'Nombre': '2', 'Montant (FCFA)': '1,200,000', 'État': 'Complété' }
                ],
                chartType: 'bar'
            },
            'activite-mandats': {
                title: 'Mandats émis',
                value: '128',
                unit: 'Nombre',
                chartData: {
                    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                    data: [120, 130, 125, 135, 142, 25, 10],
                    color: '#1976d2'
                },
                tableHeaders: ['Type Mandat', 'Nombre', 'Montant Total (FCFA)', 'Moyenne/Mandat'],
                tableData: [
                    { 'Type Mandat': 'Mandat de Dépense', 'Nombre': '85', 'Montant Total (FCFA)': '2,850,000,000', 'Moyenne/Mandat': '33,529,412' },
                    { 'Type Mandat': 'Trésor Payeur', 'Nombre': '28', 'Montant Total (FCFA)': '420,000,000', 'Moyenne/Mandat': '15,000,000' },
                    { 'Type Mandat': 'Dépense de Personnel', 'Nombre': '12', 'Montant Total (FCFA)': '180,000,000', 'Moyenne/Mandat': '15,000,000' },
                    { 'Type Mandat': 'Autres', 'Nombre': '3', 'Montant Total (FCFA)': '50,000,000', 'Moyenne/Mandat': '16,666,667' }
                ],
                chartType: 'line'
            },
            'activite-cautionnements': {
                title: 'Nouveaux cautionnements',
                value: '8',
                unit: 'Nombre',
                chartData: {
                    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                    data: [6, 8, 10, 12, 15, 2, 0],
                    color: '#ff9800'
                },
                tableHeaders: ['Type Cautionnement', 'Nombre', 'Montant (FCFA)', 'Durée Moyenne'],
                tableData: [
                    { 'Type Cautionnement': 'Cautionnement de Marché', 'Nombre': '4', 'Montant (FCFA)': '450,000,000', 'Durée Moyenne': '540 jours' },
                    { 'Type Cautionnement': 'Cautionnement Douanier', 'Nombre': '2', 'Montant (FCFA)': '250,000,000', 'Durée Moyenne': '180 jours' },
                    { 'Type Cautionnement': 'Cautionnement de Versement', 'Nombre': '1', 'Montant (FCFA)': '80,000,000', 'Durée Moyenne': '120 jours' },
                    { 'Type Cautionnement': 'Autres Cautionnements', 'Nombre': '1', 'Montant (FCFA)': '70,000,000', 'Durée Moyenne': '365 jours' }
                ],
                chartType: 'bar'
            }
        };

        return kpiDataMap[kpiId] || activityDataMap[kpiId] || null;
    }
}
