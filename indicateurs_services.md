# Analyse des Indicateurs et Graphiques par Service - ACCTBI

Ce document présente une analyse détaillée des indicateurs de performance (KPIs) et des visualisations graphiques implémentés dans l'application ACCTBI, structurés par service.

## Table des Matières
1. [Vue Consolidée (Tableau de Bord Global)](#1-vue-consolidée-tableau-de-bord-global)
2. [Service Comptabilité](#2-service-comptabilité)
3. [Service Trésorerie](#3-service-trésorerie)
4. [Service Cautionnement et Dépôt](#4-service-cautionnement-et-dépôt)
5. [Service des Régies](#5-service-des-régies)
6. [Service Règlement](#6-service-règlement)
7. [Service Statistiques](#7-service-statistiques)
8. [Service Compte de Gestion](#8-service-compte-de-gestion)

---

## 1. Vue Consolidée (Tableau de Bord Global)
La vue consolidée offre un aperçu stratégique de la situation financière du Trésor Public.

### Indicateurs Clés (KPIs)
- **Position Trésorerie Nette** : État global des liquidités.
- **Total Restes à Payer** : Engagements financiers non soldés.
- **Taux d'Exécution Budgétaire** : Performance de la consommation des crédits.
- **Solde Bancaire Consolidé** : Somme des avoirs sur tous les comptes bancaires.
- **Opérations en Attente** : Flux nécessitant une action immédiate.

### Compteurs d'Activité Quotidienne
- Règlements effectués
- Mandats émis
- Nouveaux cautionnements
- Recettes perçues (Régies)

### Graphiques et Visualisations
- **Évolution de la Trésorerie (12 mois)** : Graphique en barres ou lignes montrant la tendance temporelle des liquidités.
- **Répartition Budgétaire** : Graphique en anneau (doughnut) distinguant Fonctionnement, Investissement, Disponible et Gelé.
- **Top Postes Comptables** : Tableau classant les entités par volume de fonds.

---

## 2. Service Comptabilité
Ce service se concentre sur la fiabilité des données comptables et le rapprochement bancaire.

### Indicateurs Clés (KPIs)
- **Taux de Rapprochement Automatique** : Efficacité du moteur de réconciliation (Seuil > 85%).
- **Délai Moyen de Rapprochement** : Rapidité de traitement des flux (Objectif < 3 jours).
- **Écart de Concordance BCEAO/ACCT** : Précision comptable (Seuil < 0.1%).
- **Taux de Régularisation** : Capacité à solder les comptes d'imputation provisoire.

### Graphiques et Visualisations
- **Concordance Bancaire** : Vue circulaire (pie/doughnut) comparant les montants rapprochés vs les écarts.
- **Analyse de Répartition par Organigramme** : Histogramme montrant la distribution des fonds par Ministère (Santé, Éducation, Équipement, etc.).

---

## 3. Service Trésorerie
Le service Trésorerie est divisé en deux sous-domaines : les Lettres d'Avance (LA) et les Bons de Caisse (BC).

### Sous-domaine : Lettres d'Avance (LA)
- **KPIs** : Montant total en cours, Délai moyen de traitement, Taux de régularisation, Nombre de relances actives.
- **Graphiques** : Analyse des flux par diagramme de Sankey (en attente de données réelles) et répartition par statut de régularisation.

### Sous-domaine : Bons de Caisse (BC)
- **KPIs** : Nombre de BC en circulation, Montant moyen par BC, Taux de couverture approvisionnement, Taux d'écarts détectés.
- **Graphiques** : Analyse de la fréquentation des caisses et répartition géographique par poste comptable.

---

## 4. Service Cautionnement et Dépôt
Gestion des garanties financières et des dépôts au Trésor.

### Indicateurs Clés (KPIs)
- **Taux de Cautionnement Actif** : Pourcentage de garanties valides.
- **Montant Moyen de Caution** : Valeur moyenne des engagements par fonction.
- **Délai Moyen d'Émission** : Temps de délivrance des attestations.
- **Taux de Précompte** : Efficacité de la collecte à la source.

### Graphiques et Visualisations
- **Couverture par Ministère** : Graphique circulaire montrant la part de chaque ministère dans les cautionnements.
- **Analyse Financière** : Comparaison des cautionnements nominatifs vs garanties chèques vs précomptes.

---

## 5. Service des Régies
Suivi des opérations effectuées par les régisseurs sur l'ensemble du territoire.

### Indicateurs Clés (KPIs)
- **Nombre de Régies Actives** : Maillage territorial opérationnel.
- **Recettes Perçues** : Volume financier collecté par les régies.
- **Taux de Chèques Impayés** : Risque sur les encaissements.
- **Rotation des Fonds** : Vitesse de reversement des fonds au Trésor.

### Graphiques et Visualisations
- **Évolution Recettes vs Dépenses** : Histogramme comparatif des flux entrants et sortants des régies.
- **Répartition par Nature de Recette** : Ventilation des collectes (Fiscales, Domaines, Autres).

---

## 6. Service Règlement
Gestion centralisée des paiements et des documents officiels.

### Indicateurs Clés (KPIs)
- **Délai Moyen de Règlement** : Temps écoulé entre l'émission et le paiement effectif.
- **Taux d'Imputations Provisoires** : Part des écritures non encore catégorisées.
- **Paiements dans les délais** : Respect du calendrier réglementaire.
- **Rapprochement ACCT-ACCD** : Concordance entre la comptabilité centrale et les agences.

### Graphiques et Visualisations
- **Flux de Règlements par Nature** : Histogramme empilé distinguant les flux de débit et de crédit.
- **Indicateurs de Performance** : Barres de progression pour le suivi des seuils critiques (Répartition impôts, IP sans pièces).

---

## 7. Service Statistiques
Ce service regroupe les rapports consolidés organisés en 4 blocs majeurs.

### Bloc 1 : Subventions et Approvisionnements
- **KPIs** : Taux d'exécution des subventions, Délai moyen de paiement, Concentration par bénéficiaire.
- **Graphique** : Taux d'exécution (Bar/Pie) vs Restes à liquider.

### Bloc 2 : Trésorerie et Engagements
- **KPIs** : Taux d'Obligations Cautionnées (OC), Taux de Restes à Payer (RAP) global, Ancienneté moyenne des RAP.
- **Graphique** : Évolution temporelle des Restes à Payer.

### Bloc 3 : Coopération Régionale
- **KPIs** : Ratio UEMOA/Total dépenses, Ratio CEDEAO/Total dépenses, Écart PCS/PCC.
- **Graphique** : Évolution de la part régionale dans les dépenses publiques (Stacked Area).

### Bloc 4 : Prévisions et Soldes
- **KPIs** : Taux de réalisation des prévisions, Solde du Compte Principal, Solde du Compte C2D.
- **Graphique** : Comparaison Prévisions vs Réalisations (Histogramme).

---

## 8. Service Compte de Gestion
Ce service assure le suivi de l'exécution budgétaire et la gestion des mandats.

### Indicateurs Clés (KPIs)
- **Taux d'Exécution des Crédits** : Performance de la consommation des enveloppes allouées.
- **Taux d'Absorption des Crédits** : Capacité à utiliser les ressources disponibles.
- **Taux de Mandats Rejetés** : Indicateur de qualité de la chaîne de mandatement.
- **Délai Moyen de Mandatement** : Rapidité de traitement administratif des dépenses.

### Graphiques et Visualisations
- **Exécution Budgétaire** : Comparaison entre Loi de Finances Initiale (LFI), Loi de Finances Rectificative (LFR) et Réalisé (Bar/Line/Area).
- **Mandats et Imputations** : Ventilation par nature des dépenses (Pie/Donut/Bar).
- **Disponibilités** : Histogramme empilé montrant les parts Disponible, Engagée et Bloquée.
- **Balance Comptable** : Vue comparative des débits, crédits et soldes par compte.

### Tableaux et Rapports
- **Situation Détaillée** : Ventilation par Bailleur (SODE, EPN, Collectivités) avec suivi du cycle LFI/LFR/Engagé/Mandaté/Payé.

---

## Synthèse des Visualisations Générales
La majorité des pages utilisent un **Sélecteur d'Analyse dynamique** permettant de :
- Filtrer par période (Ce mois, ce trimestre, année en cours, personnalisé).
- Sélectionner les indicateurs à afficher (Glisser-Déposer).
- Définir les axes d'analyse (Géographique, Organisationnel, Temporel).

Les graphiques sont interactifs et permettent pour la plupart un basculement entre les vues **Barre**, **Ligne** et **Circulaire** (Pie) pour une meilleure lecture des données.
