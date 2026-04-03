import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class RapportService {
    private rapports: Record<string, any> = {
        // BLOC 1: SUBVENTIONS & APPROVISIONNEMENTS
        'subventions-approvisionnements': {
            titre: 'Situation des Subventions et Approvisionnements',
            description: 'Suivi global des flux entrants par source',
            bloc: 1,
            filtres: ['Tous', 'Ministère', 'Région', 'Type Source'],
            stats: [
                { label: 'Total Subventions', valeur: '14.23 Mds', info: 'YTD', tendance: 'up' },
                { label: 'Taux Exécution', valeur: '87.5%', info: 'Seuil 80%-100%', tendance: 'up' },
                { label: 'Délai Moyen', valeur: '18 jours', info: 'Objectif < 30j', tendance: 'up' },
                { label: 'Bénéficiaires Actifs', valeur: '342', info: 'En cours', tendance: 'neutral' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Source', 'Montant (FCFA)', 'Exécuté', 'Reste', 'Taux %', 'Délai (j)'],
            donnees: [
                { source: 'État Central', montant_fcfa: '8,500,000,000', execute: '7,437,500,000', reste: '1,062,500,000', taux: '87.5%', delai: '18' },
                { source: 'Bailleurs Extérieurs', montant_fcfa: '3,200,000,000', execute: '2,880,000,000', reste: '320,000,000', taux: '90.0%', delai: '15' },
                { source: 'Collectivités', montant_fcfa: '2,530,000,000', execute: '2,148,050,000', reste: '381,950,000', taux: '84.9%', delai: '21' }
            ]
        },
        'entites-detail': {
            titre: 'Détail par Entité',
            description: 'Situation spécifique pour les EPN, Communes, SODE, Conseils Généraux et Districts',
            bloc: 1,
            filtres: ['Tous', 'EPN', 'Communes', 'SODE', 'Conseils Généraux', 'Districts'],
            stats: [
                { label: 'Nombre Entités', valeur: '847', info: 'Total accrédités', tendance: 'neutral' },
                { label: 'Exécution Moyenne', valeur: '85.2%', info: 'Toutes catégories', tendance: 'up' },
                { label: 'Montant Total', valeur: '14.23 Mds', info: 'Allocations actives', tendance: 'up' },
                { label: 'Entités en Alerte', valeur: '23', info: 'Retards > 30j', tendance: 'down' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Entité', 'Type', 'Montant (FCFA)', 'Exécuté %', 'Statut'],
            donnees: [
                { entite: 'EPN Santé 1', type: 'EPN', montant_fcfa: '2,100,000,000', execute: '89.5%', statut: '✓ À jour' },
                { entite: 'Commune Yamoussoukro', type: 'Commune', montant_fcfa: '850,000,000', execute: '76.2%', statut: '⚠ Retard' },
                { entite: 'SODE Énergie', type: 'SODE', montant_fcfa: '1,500,000,000', execute: '92.1%', statut: '✓ À jour' },
                { entite: 'Conseil Gén. Gagnoa', type: 'Conseil Gén.', montant_fcfa: '450,000,000', execute: '64.8%', statut: '⚠ Retard' }
            ]
        },
        'approvisionnements-accdp': {
            titre: 'Situation Approvisionnements ACCDP',
            description: 'Agents comptables centraux des dépôts',
            bloc: 1,
            filtres: ['Tous', 'ACCDP Principal', 'ACCDP Région', 'Par Agence'],
            stats: [
                { label: 'Montant Approvisionné', valeur: '12.4 Mds', info: 'Total exercice', tendance: 'up' },
                { label: 'Taux Consommation', valeur: '94.8%', info: 'Alerte si > 95%', tendance: 'up' },
                { label: 'Agents Approvisionnés', valeur: '156', info: 'Actifs', tendance: 'neutral' },
                { label: 'Soldes Disponibles', valeur: '642 Mls', info: 'En float', tendance: 'neutral' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['ACCDP', 'Approvisionné', 'Consommé', 'Taux %', 'Solde'],
            donnees: [
                { accdp: 'ACCDP Principal', approvisionne: '6,850,000,000', consomme: '6,507,500,000', taux: '95.0%', solde: '342,500,000' },
                { accdp: 'ACCDP Région Ouest', approvisionne: '3,200,000,000', execute: '3,008,000,000', taux: '94.0%', solde: '192,000,000' },
                { accdp: 'ACCDP Région Est', approvisionne: '2,350,000,000', execute: '2,223,750,000', taux: '94.6%', solde: '126,250,000' }
            ]
        },

        // BLOC 2: TRÉSORERIE & ENGAGEMENTS
        'oc-lc': {
            titre: 'Situation des OC & LC',
            description: 'Obligations Cautionnées et Lettres de Change',
            bloc: 2,
            filtres: ['Tous', 'OC', 'LC', 'Par Banque', 'Par Échéance'],
            stats: [
                { label: 'Montant Total OC/LC', valeur: '48.7 Mds', info: 'En portefeuille', tendance: 'neutral' },
                { label: 'OC en Alerte', valeur: '12', info: 'À échéance < 30j', tendance: 'down' },
                { label: 'Couverture Garantie', valeur: '98.2%', info: 'Seuil 100%', tendance: 'up' },
                { label: 'Délai Moyen', valeur: '87 jours', info: 'Moyenne pondérée', tendance: 'neutral' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Type', 'Montant (FCFA)', 'Bénéficiaire', 'Échéance', 'Statut'],
            donnees: [
                { type: 'OC', montant_fcfa: '35,200,000,000', beneficiaire: 'Banque Nationale', echéance: '15/04/2026', statut: '✓ Normal' },
                { type: 'OC', montant_fcfa: '8,500,000,000', beneficiaire: 'BCEAO', echéance: '02/06/2026', statut: '✓ Normal' },
                { type: 'LC', montant_fcfa: '5,000,000,000', beneficiaire: 'BACI', echéance: '30/03/2026', statut: '⚠ Alerte' }
            ]
        },
        'restes-a-payer': {
            titre: 'Situation des Restes à Payer',
            description: 'Indicateur crucial - Engagements non soldés',
            bloc: 2,
            filtres: ['Tous', 'Par Ministère', 'Par Ancienneté', 'Retards > 30j'],
            stats: [
                { label: 'Total RAP', valeur: '1.09 Mds', info: '12.4% des crédits', tendance: 'neutral' },
                { label: 'Ancienneté Moy.', valeur: '75 jours', info: 'Alerte > 90j', tendance: 'up' },
                { label: 'RAP > 90 jours', valeur: '287 Mls', info: 'À prioritiser', tendance: 'down' },
                { label: 'Ministères Impactés', valeur: '18', info: '45% du total', tendance: 'down' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Ministère', 'Montant RAP (FCFA)', 'Ancienneté (j)', 'Pcentage %', 'Priorité'],
            donnees: [
                { ministere: 'Ministère Santé', montant_rap: '450,000,000', anciennete: '82', pcentage: '41.3%', priorite: 'Haute' },
                { ministere: 'Ministère Éducation', montant_rap: '320,000,000', anciennete: '65', pcentage: '29.4%', priorite: 'Moyenne' },
                { ministere: 'Ministère Infrastructure', montant_rap: '320,000,000', anciennete: '98', pcentage: '29.4%', priorite: 'Très Haute' }
            ]
        },
        'depenses-prioritaires': {
            titre: 'Situation des Dépenses Prioritaires',
            description: 'Suivi des règlements stratégiques/urgents',
            bloc: 2,
            filtres: ['Tous Priorités', 'Très Urgent', 'Urgent', 'Suivi Régulier'],
            stats: [
                { label: 'Total Prioritaires', valeur: '16.18 Mds', info: 'En gestion', tendance: 'neutral' },
                { label: 'Taux Paiement', valeur: '94.2%', info: 'Seuil > 95%', tendance: 'up' },
                { label: 'Délai Moyen', valeur: '5.2 jours', info: 'Objectif < 7j', tendance: 'up' },
                { label: 'Retards Détectés', valeur: '3', info: 'À régulariser', tendance: 'down' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Description', 'Montant (FCFA)', 'Niveau Priorité', 'Statut Paiement', 'Délai (j)'],
            donnees: [
                { description: 'Salaires Fonctionnaires', montant_fcfa: '8,500,000,000', niveau_priorite: 'Très Urgent', statut_paiement: '✓ Payé', delai: '2' },
                { description: 'Intérêts Externes', montant_fcfa: '4,200,000,000', niveau_priorite: 'Urgent', statut_paiement: '✓ Payé', delai: '4' },
                { description: 'Services Essentiels', montant_fcfa: '3,480,000,000', niveau_priorite: 'Urgent', statut_paiement: '⚠ Retard', delai: '8' }
            ]
        },
        'soldes-comptes': {
            titre: 'Situation Soldes Comptes Principaux',
            description: 'État global des comptes transversaux',
            bloc: 2,
            filtres: ['Tous Comptes', 'Principal', 'Secondaires', 'Spécialisés'],
            stats: [
                { label: 'Solde Total', valeur: '14.52 Mds', info: 'Liquidité globale', tendance: 'up' },
                { label: 'Compte Principal', valeur: '9.87 Mds', info: 'Position nette', tendance: 'up' },
                { label: 'Comptes Secondaires', valeur: '3.21 Mds', info: 'Dont C2D', tendance: 'neutral' },
                { label: 'Comptes Spécialisés', valeur: '1.44 Mds', info: 'BAD, Inv, etc.', tendance: 'neutral' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Compte', 'Solde Ouverture', 'Mouvement', 'Solde Fermeture', 'Tendance'],
            donnees: [
                { compte: 'Principal', solde_ouverture: '12,300,000,000', mouvement: '-2,430,000,000', solde_fermeture: '9,870,000,000', tendance: '↓ -19.7%' },
                { compte: 'C2D', solde_ouverture: '2,100,000,000', mouvement: '1,770,000,000', solde_fermeture: '3,870,000,000', tendance: '↑ +84.3%' },
                { compte: 'BAD', solde_ouverture: '800,000,000', mouvement: '640,000,000', solde_fermeture: '1,440,000,000', tendance: '↑ +80.0%' }
            ]
        },

        // BLOC 3: COOPÉRATION RÉGIONALE & SECTEURS SPÉCIFIQUES
        'uemoa-pcs': {
            titre: 'Situation UEMOA (PCS)',
            description: 'Prélèvement Communautaire de Solidarité',
            bloc: 3,
            filtres: ['Tous', 'Par Pays', 'Par Trimestre', 'Comparatif Régional'],
            stats: [
                { label: 'Montant Total PCS', valeur: '3.45 Mds', info: 'Cotisation annuelle', tendance: 'neutral' },
                { label: 'Taux de Prélèvement', valeur: '0.65%', info: 'Du commerce', tendance: 'neutral' },
                { label: 'Répartition CI', valeur: '24.3%', info: 'Part Côte d\'Ivoire', tendance: 'up' },
                { label: 'Collecte YTD', valeur: '867 Mls', info: 'Sur 863 Mls prévus', tendance: 'up' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Pays', 'Montant (FCFA)', 'Collecte YTD', 'Taux %', 'Situation'],
            donnees: [
                { pays: 'Côte d\'Ivoire', montant_fcfa: '840,000,000', collecte_ytd: '840,000,000', taux: '100.0%', situation: '✓ Versé' },
                { pays: 'Sénégal', montant_fcfa: '1,230,000,000', collecte_ytd: '920,000,000', taux: '74.8%', situation: '⚠ En cours' },
                { pays: 'Mali', montant_fcfa: '890,000,000', collecte_ytd: '667,500,000', taux: '75.0%', situation: '⚠ En cours' }
            ]
        },
        'cedeao-pcc': {
            titre: 'Situation CEDEAO (PCC)',
            description: 'Prélèvement Communautaire de Compensation',
            bloc: 3,
            filtres: ['Tous', 'Par Produit', 'Par Trimestre', 'Flux Commerciaux'],
            stats: [
                { label: 'Montant Total PCC', valeur: '6.82 Mds', info: 'Compensation douane', tendance: 'up' },
                { label: 'Taux Moyen', valeur: '5.2%', info: 'Tarif appliqué', tendance: 'neutral' },
                { label: 'Répartition CI', valeur: '42.1%', info: 'Plus grande économie', tendance: 'up' },
                { label: 'Collecte YTD', valeur: '2.45 Mds', info: 'Croissance +18%', tendance: 'up' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Pays', 'Montant (FCFA)', 'Collecte YTD', 'Variation YoY %', 'Dynamique'],
            donnees: [
                { pays: 'Côte d\'Ivoire', montant_fcfa: '2,870,000,000', collecte_ytd: '2,870,000,000', variation_yoy: '+22.5%', dynamique: '↑ Forte hausse' },
                { pays: 'Nigeria', montant_fcfa: '2,100,000,000', collecte_ytd: '1,680,000,000', variation_yoy: '+8.3%', dynamique: '→ Stable' },
                { pays: 'Ghana', montant_fcfa: '1,412,000,000', collecte_ytd: '1,059,000,000', variation_yoy: '-5.2%', dynamique: '↓ Baisse' }
            ]
        },
        'tva-electricite': {
            titre: 'Situation TVA Secteur Électrique',
            description: 'Indicateur fiscal spécifique à l\'énergie',
            bloc: 3,
            filtres: ['Tous', 'Par Distributeur', 'Par Région', 'Tendance Mensuelle'],
            stats: [
                { label: 'TVA Collectée', valeur: '34.5 Mds', info: 'Année complète', tendance: 'up' },
                { label: 'Taux Collection', valeur: '96.8%', info: 'Sur facturée', tendance: 'up' },
                { label: 'YTD Collecte', valeur: '8.6 Mds', info: 'vs 8.2 Mds prev.', tendance: 'up' },
                { label: 'Délai Remise', valeur: '4.2 jours', info: 'Moyen', tendance: 'up' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Distributeur', 'Montant Facturé', 'TVA 18%', 'Collectée', 'Remise (j)'],
            donnees: [
                { distributeur: 'CIE Distribution', montant_facture: '42,300,000,000', tva_18: '7,614,000,000', collectee: '7,614,000,000', remise: '3' },
                { distributeur: 'Eni Energia', montant_facture: '8,500,000,000', tva_18: '1,530,000,000', collectee: '1,487,100,000', remise: '6' },
                { distributeur: 'SENELEC (import)', montant_facture: '2,100,000,000', tva_18: '378,000,000', collectee: '378,000,000', remise: '4' }
            ]
        },
        'webfontaine': {
            titre: 'Situation Webfontaine',
            description: 'Suivi plateforme douanière/fiscale',
            bloc: 3,
            filtres: ['Tous', 'Importations', 'Exportations', 'Par Catégorie'],
            stats: [
                { label: 'Redevances Perçues', valeur: '2.34 Mds', info: 'Année YTD', tendance: 'up' },
                { label: 'Dossiers Traités', valeur: '8,421', info: 'Cumulé M1-M3', tendance: 'up' },
                { label: 'Taux Conformité', valeur: '97.4%', info: 'Dossiers complets', tendance: 'up' },
                { label: 'Délai Moyen', valeur: '2.1 jours', info: 'Processing', tendance: 'up' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Type Transaction', 'Nombre Dossiers', 'Montant (FCFA)', 'Redevance', 'Statut'],
            donnees: [
                { type_transaction: 'Importations', nombre_dossiers: '4,820', montant_fcfa: '121,580,000,000', redevance: '1,458,960,000', statut: '✓ Normal' },
                { type_transaction: 'Exportations', nombre_dossiers: '2,130', montant_fcfa: '42,350,000,000', redevance: '634,050,000', statut: '✓ Normal' },
                { type_transaction: 'Entreposage', nombre_dossiers: '1,471', montant_fcfa: '18,720,000,000', redevance: '280,800,000', statut: '✓ À jour' }
            ]
        },

        // BLOC 4: PRÉVISIONS & SOLDES
        'previsions-mois': {
            titre: 'Prévision des Mois',
            description: 'Projection flux financiers - Capacité d\'anticipation',
            bloc: 4,
            filtres: ['Tous Mois', 'Scénario Optimiste', 'Scénario Central', 'Scénario Prudent'],
            stats: [
                { label: 'Entrées Prévues (avril)', valeur: '21.4 Mds', info: 'Scénario central', tendance: 'neutral' },
                { label: 'Sorties Budgétées', valeur: '18.7 Mds', info: 'Base LFI/LFR', tendance: 'neutral' },
                { label: 'Position Nette', valeur: '+2.7 Mds', info: 'Surplus prévu', tendance: 'up' },
                { label: 'Confiance Prévision', valeur: '91.2%', info: 'Écart moyen ±6.8%', tendance: 'up' }
            ],
            periodeDebut: '01/04/2026',
            periodeFin: '30/06/2026',
            colonnes: ['Mois', 'Entrées Prévues', 'Sorties Prévues', 'Position Nette', 'Confiance %'],
            donnees: [
                { mois: 'Avril 2026', entrees_prevues: '21,400,000,000', sorties_prevues: '18,700,000,000', position_nette: '2,700,000,000', confiance: '92.3%' },
                { mois: 'Mai 2026', entrees_prevues: '19,850,000,000', sorties_prevues: '19,300,000,000', position_nette: '550,000,000', confiance: '89.1%' },
                { mois: 'Juin 2026', entrees_prevues: '22,100,000,000', sorties_prevues: '21,200,000,000', position_nette: '900,000,000', confiance: '91.5%' }
            ]
        },
        'compte-principal': {
            titre: 'Situation Compte Principal',
            description: 'État de la liquidité globale',
            bloc: 4,
            filtres: ['Soldes Par Jour', 'Mouvements Cumulés', 'Prévisions', 'Historique'],
            stats: [
                { label: 'Solde Actuel', valeur: '9.87 Mds', info: 'À date 18/03', tendance: 'up' },
                { label: 'Mouvements YTD', valeur: '-2.43 Mds', info: 'Consommation nette', tendance: 'down' },
                { label: 'Entrées YTD', valeur: '31.2 Mds', info: 'Recettes toutes sources', tendance: 'up' },
                { label: 'Sorties YTD', valeur: '33.6 Mds', info: 'Dépenses payées', tendance: 'down' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Date', 'Solde Ouverture', 'Entrées du Jour', 'Sorties du Jour', 'Solde Fermeture'],
            donnees: [
                { date: '15/03/2026', solde_ouverture: '9,850,000,000', entrees_du_jour: '2,100,000,000', sorties_du_jour: '2,063,000,000', solde_fermeture: '9,887,000,000' },
                { date: '16/03/2026', solde_ouverture: '9,887,000,000', entrees_du_jour: '1,200,000,000', sorties_du_jour: '1,300,000,000', solde_fermeture: '9,787,000,000' },
                { date: '18/03/2026', solde_ouverture: '9,787,000,000', entrees_du_jour: '1,750,000,000', sorties_du_jour: '1,650,000,000', solde_fermeture: '9,887,000,000' }
            ]
        },
        'compte-c2d': {
            titre: 'Situation Compte C2D',
            description: 'Contrat Désendettement & Développement',
            bloc: 4,
            filtres: ['Tous', 'Par Programme', 'Par Secteur', 'Engagements/Décaissements'],
            stats: [
                { label: 'Solde C2D', valeur: '3.87 Mds', info: 'Disponible', tendance: 'up' },
                { label: 'Engagements YTD', valeur: '1.23 Mds', info: 'Taux 31.8%', tendance: 'up' },
                { label: 'Décaissements YTD', valeur: '987 Mls', info: 'Taux 25.5%', tendance: 'up' },
                { label: 'Programme Actifs', valeur: '12', info: 'En exécution', tendance: 'neutral' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Programme', 'Allocation', 'Engagements', 'Décaissements', 'Taux %'],
            donnees: [
                { programme: 'Infrastructure Santé', allocation: '850,000,000', engagements: '350,000,000', decaissements: '280,000,000', taux: '32.9%' },
                { programme: 'Éducation Primaire', allocation: '620,000,000', engagements: '240,000,000', decaissements: '192,000,000', taux: '30.9%' },
                { programme: 'Routes Rurales', allocation: '1,400,000,000', engagements: '632,000,000', decaissements: '515,000,000', taux: '36.8%' }
            ]
        },
        'compte-bad': {
            titre: 'Situation Compte BAD',
            description: 'Ressources Banque Africaine Développement',
            bloc: 4,
            filtres: ['Tous', 'Par Secteur', 'Par Type Financement', 'Cofinancement'],
            stats: [
                { label: 'Solde BAD', valeur: '1.44 Mds', info: 'Liquidité', tendance: 'up' },
                { label: 'Engagement Total', valeur: '2.8 Mds', info: 'Portefeuille actif', tendance: 'neutral' },
                { label: 'Décaissements YTD', valeur: '420 Mls', info: 'Taux 28.4%', tendance: 'up' },
                { label: 'Projets en Cours', valeur: '7', info: 'Infrastructure et Social', tendance: 'neutral' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Projet', 'Secteur', 'Montant BAD', 'Décaissé YTD', 'Progression %'],
            donnees: [
                { projet: 'Autoroute Yaoundé-Douala', secteur: 'Transport', montant_bad: '1,200,000,000', decaise_ytd: '180,000,000', progression: '15.0%' },
                { projet: 'Port Autonome Abidjan', secteur: 'Logistique', montant_bad: '800,000,000', decaise_ytd: '160,000,000', progression: '20.0%' },
                { projet: 'Énergie Renouvelable', secteur: 'Énergies', montant_bad: '800,000,000', decaise_ytd: '80,000,000', progression: '10.0%' }
            ]
        },
        'compte-investissement': {
            titre: 'Situation Compte Investissement',
            description: 'Fonds dédiés aux dépenses de capital',
            bloc: 4,
            filtres: ['Tous', 'Par Ministère', 'Par Projet', 'État d\'Avancement'],
            stats: [
                { label: 'Allocation Annuelle', valeur: '45.2 Mds', info: 'Budget d\'investissement', tendance: 'neutral' },
                { label: 'Engagements YTD', valeur: '14.3 Mds', info: 'Taux 31.6%', tendance: 'up' },
                { label: 'Décaissements YTD', valeur: '11.8 Mds', info: 'Taux 26.1%', tendance: 'up' },
                { label: 'Projets Actifs', valeur: '38', info: 'En différentes phases', tendance: 'up' }
            ],
            periodeDebut: '01/01/2026',
            periodeFin: '18/03/2026',
            colonnes: ['Secteur', 'Allocation', 'Engagements YTD', 'Décaissements YTD', 'Avancement %'],
            donnees: [
                { secteur: 'Infrastructure', allocation: '18,500,000,000', engagements_ytd: '6,200,000,000', decaissements_ytd: '4,960,000,000', avancement: '26.8%' },
                { secteur: 'Éducation-Santé', allocation: '12,300,000,000', engagements_ytd: '4,100,000,000', decaissements_ytd: '3,690,000,000', avancement: '30.0%' },
                { secteur: 'Agriculture', allocation: '8,200,000,000', engagements_ytd: '2,850,000,000', decaissements_ytd: '2,280,000,000', avancement: '27.8%' }
            ]
        }
    };

    getRapportById(id: string): any {
        return this.rapports[id] || null;
    }

    getAllRapportIds(): string[] {
        return Object.keys(this.rapports);
    }

    getRapportsByBloc(bloc: number): any[] {
        return Object.values(this.rapports).filter(r => r.bloc === bloc);
    }
}
