# ARCHITECTURE BI & DWH - ACCT CÔTE D'IVOIRE
## Fichier de Contexte Complet - Référence Technique & KPI

---

## TABLE DES MATIÈRES
1. [Vue d'Ensemble](#1-vue-densemble)
2. [Service Comptabilité](#2-service-comptabilité)
3. [Service Cautionnement et Dépôt](#3-service-cautionnement-et-dépôt)
4. [Service Statistiques](#4-service-statistiques)
5. [Service des Régies](#5-service-des-régies)
6. [Service Compte de Gestion](#6-service-compte-de-gestion)
7. [Service Trésorerie](#7-service-trésorerie)
8. [Service Règlement](#8-service-règlement)
9. [Matrice des Acteurs](#9-matrice-des-acteurs)
10. [Glossaire](#10-glossaire)
11. [DASHBOARD D'ACCUEIL GLOBAL (PAGE D'ACCUEIL)](#11-dashboard-daccueil-global-page-daccueil)

---

## 1. VUE D'ENSEMBLE

### 1.1 Contexte Organisationnel
| Attribut | Valeur |
|----------|--------|
| **Organisme** | ACCT (Agence de Coordination et de Contrôle des Transferts) |
| **Pays** | Côte d'Ivoire |
| **Domaine** | Contrôle budgétaire et financier de l'État |
| **Architecture** | Data Warehouse (DWH) avec gouvernance OSADC |

### 1.2 Architecture Générale

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOUVERNANCE OSADC                            │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────┐    ┌─────────────┐    ┌─────────────────────┐
│  SOURCE DE      │───→│    DWH      │───→│  COUCHE PRÉSENTATION │
│  DONNÉES        │    │    ACCT     │    │                     │
│                 │    │             │    │  - Situation        │
│ • ASTER (BD)    │    │ • Compta    │    │  - Tableau de bord  │
│ • BCEAO (PDF)   │    │ • Trésorerie│    │  - Prédiction       │
│ • IMPÔT (PDF)   │    │ • Caution   │    │  - Décision         │
│ • RÈGLEMENT     │    │ • Régies    │    │  - Analyse          │
│ • REGISSEURS    │    │ • Stat      │    │  - Suivi et contrôle│
│ • BANQUE COMM.  │    │ • Compte G. │    │                     │
└─────────────────┘    │ • Règlement │    └─────────────────────┘
                       └─────────────┘              │
                              │            ┌────────┴────────┐
                              ↓            │  • Directeur    │
                       ┌─────────────┐     │  • Fondés pouv. │
                       │  ARCHIVAGE  │     │  • Chef service │
                       └─────────────┘     │  • Agents       │
                                           └─────────────────┘
```

### 1.3 Processus ETL Standard

| Phase | Actions | Outils/Techniques |
|-------|---------|-------------------|
| **Extraction** | Récupération sources | Connecteurs BD, OCR PDF, API |
| **Filtrage** | Sélection pertinente | Règles métier, Qualité données |
| **Transformation** | Conversion, normalisation | Mapping, Enrichissement |
| **Nettoyage** | Correction, déduplication | Algorithmes fuzzy, Validation |
| **Intégration** | Chargement DWH | ETL incrémental, Historisation |

---

## 2. SERVICE COMPTABILITÉ

### 2.1 Objectif
Gestion de la comptabilité générale, rapprochements bancaires et imputations fiscales.

### 2.2 Sources de Données

| Source | Type | Contenu | Fréquence |
|--------|------|---------|-----------|
| BCEAO | PDF/DOC | Soldes, débits/crédits en instance | Quotidienne |
| ACCT (SYDEC) | WinDev/PDF | Avis de crédit/débit, soldes | Quotidienne |
| IMPÔT | PDF/DOC | Recettes fiscales | Mensuelle |

### 2.3 KPI et Indicateurs Clés

| Catégorie | KPI | Formule | Seuil d'Alerte |
|-----------|-----|---------|----------------|
| **Rapprochement** | Taux de rapprochement automatique | (Lignes rapprochées auto / Total lignes) × 100 | < 85% |
| | Délai moyen de rapprochement | Σ(Dates rapprochement - Dates opération) / Nb opérations | > 3 jours |
| | Écart de concordance BCEAO/ACCT | |Solde BCEAO - Solde ACCT| | > 0.1% du solde |
| **Imputations** | Volume imputations provisoires | Σ Montants imputations provisoires | Croissance > 10%/mois |
| | Taux de régularisation | (Imputations régularisées / Total imputations) × 100 | < 90% |
| | Ancienneté moyenne imputations | Σ(Jours ouverts) / Nb imputations | > 30 jours |
| **Fiscalité** | Répartition recettes par nature | Montant nature / Total recettes | Anomalie si variation > 15% |
| | Taux de collecte TVA | TVA collectée / TVA attendue | < 95% |

### 2.4 Axes d'Analyse

| Axe | Dimensions | Visualisation Recommandée |
|-----|-----------|---------------------------|
| Temporel | Jour, Semaine, Mois, Exercice | Courbe temporelle |
| Bancaire | Compte, Agence, Type opération | Tableau croisé, Heatmap |
| Fiscal | Nature impôt, Contribuable, Région | Camembert, Carte géographique |
| Qualité | Taux erreur, Délai traitement | Jauge, Histogramme |

### 2.5 Livrables

- Certificat de Concordance Bancaire (CCB) - Excel
- Compte d'Imputation Provisoire - Excel
- Quote Parts d'Impôts - Excel
- Rapprochement ACCT-ACCD

---

## 3. SERVICE CAUTIONNEMENT ET DÉPÔT

### 3.1 Objectif
Gestion des garanties financières liées aux nominations et fonctions des agents publics.

### 3.2 Modèle de Données

**Hub Central** : Suivi cautionnement
- Suivi et contrôle des cautionnements
- Suivi des profils des nominés
- Suivi des précomptes et indemnités
- Situation des chèques/ordres émis
- Statistiques des dépôts

**Entités Satellites** :
| Entité | Attributs Principaux |
|--------|---------------------|
| Arrêté de nomination | N°, Date, Description |
| Ministère | Département, Direction, Situation géographique |
| Fonction | Matricule, Nom, Date prise/fin, Validité |
| Chèque | N°, Montant, Banque, Ordre, Date émission |
| Attestation de Cautionnement | N°, Description, Date, Durée, Autorité |
| Précompte | N°, Montant précompté, Montant indemnité, Dates |
| Dépôt | N°, Montant, Date |
| Ordre de Paiement | N°, Montant, Banque, Date |
| Ordre de Cautionnement | N°, Montant, Date |

### 3.3 KPI et Indicateurs Clés

| Catégorie | KPI | Formule | Seuil d'Alerte |
|-----------|-----|---------|----------------|
| **Couverture** | Taux de cautionnement actif | (Cautionnements actifs / Total cautionnements) × 100 | < 95% |
| | Montant moyen caution par fonction | Σ Montants / Nb cautionnements | Anomalie si écart > 2σ |
| | Délai moyen émission attestation | Date attestation - Date arrêté | > 5 jours ouvrés |
| **Précomptes** | Taux de précompte appliqué | (Précomptes appliqués / Éligibles) × 100 | < 98% |
| | Montant moyen précompte | Σ Précomptes / Nb agents | Suivi tendance |
| | Délai moyen remboursement | Date remboursement - Date fin fonction | > 30 jours |
| **Gestion** | Taux de régularisation des dépôts | (Dépôts régularisés / Total dépôts) × 100 | < 90% |
| | Ancienneté moyenne dépôts non régularisés | Σ Jours / Nb dépôts en attente | > 180 jours |
| | Concentration par ministère | Top 3 ministères / Total cautionnements | > 60% |
| **Chèques** | Taux de chèques émis sans provision | (Chèques sans provision / Total émis) × 100 | > 0% |
| | Délai moyen encaissement chèque | Date encaissement - Date émission | > 15 jours |

### 3.4 Axes d'Analyse

| Axe | Dimensions | Visualisation Recommandée |
|-----|-----------|---------------------------|
| Administratif | Ministère, Direction, Département | Treemap, Tableau hiérarchique |
| Temporel | Date nomination, Durée fonction, Échéances | Diagramme de Gantt |
| Financier | Montant caution, Précompte, Indemnité | Boîte à moustaches, Histogramme |
| Géographique | Région, Ville | Carte choroplèthe |
| Qualité | Délai traitement, Taux erreur | Graphique de contrôle |

### 3.5 Livrables

- Situation des précomptes par période/fonction/matricule/nom
- Situation des chèques émis
- Situation statistique des dépôts

---

## 4. SERVICE STATISTIQUES

### 4.1 Objectif
Analyse statistique consolidée des finances publiques et reporting régional (UEMOA/CEDEAO).

### 4.2 Sources de Données

| Source | Contenu | Fréquence |
|--------|---------|-----------|
| RÈGLEMENT | Pièces justificatives | Quotidienne |
| BCEAO | Relevés bancaires | Quotidienne |
| BNI | Relevés bancaires | Quotidienne |
| BACI F/R | Relevés bancaires (Francs/Réels) | Quotidienne |

### 4.3 KPI et Indicateurs Clés

| Catégorie | KPI | Formule | Seuil d'Alerte |
|-----------|-----|---------|----------------|
| **Subventions** | Taux d'exécution des subventions | (Montant payé / Montant programmé) × 100 | < 80% ou > 100% |
| | Délai moyen paiement subventions | Date paiement - Date demande | > 30 jours |
| | Concentration par bénéficiaire | Top 5 bénéficiaires / Total | > 50% |
| **Restes à Payer** | Taux de restes à payer | (Restes à payer / Crédits ouverts) × 100 | > 15% |
| | Ancienneté moyenne RAP | Σ Jours RAP / Nb RAP | > 90 jours |
| | Évolution RAP (glissant 12 mois) | (RAP N - RAP N-12) / RAP N-12 | > +20% |
| **Dépenses Prioritaires** | Taux de respect des priorités | (Dépenses prioritaires payées / Total prioritaires) × 100 | < 95% |
| | Délai moyen paiement prioritaires | Σ Délais / Nb paiements | > 7 jours |
| **Intégration Régionale** | Ratio UEMOA/Total dépenses | Dépenses UEMOA / Total dépenses | Suivi tendance |
| | Ratio CEDEAO/Total dépenses | Dépenses CEDEAO / Total dépenses | Suivi tendance |
| | Écart PCS/PCC | |Position UEMOA - Position CEDEAO| | > 10% |
| **Prévisions** | Taux de réalisation des prévisions | (Réalisé / Prévu) × 100 | Écart > ±15% |
| | Volatilité des prévisions | Écart-type des écarts prévu/réalisé | > 20% |

### 4.4 Axes d'Analyse

| Axe | Dimensions | Visualisation Recommandée |
|-----|-----------|---------------------------|
| Institutionnel | UEMOA, CEDEAO, État, Collectivités | Graphique comparatif |
| Temporel | Mois, Trimestre, Année, Exercice | Courbe, Graphique en cascade |
| Géographique | Pays UEMOA, Régions CEDEAO | Carte, Cartogramme |
| Sectoriel | Ministère, Programme, Projet | Treemap, Sunburst |
| Financier | Nature dépense, Source financement | Matrice, Heatmap |

### 4.5 Livrables (11 rapports)

1. Situation des OC & LC (Obligations Cautionnées & Lettres de Change)
2. Situation des subventions et approvisionnement (général)
3. Situation des subventions par bénéficiaire (EPN-COMMUNE-SODE-CONSEILS GÉNÉRAUX/DISTRICT)
4. Situation des restes à payer
5. Situation des appro ACCDP
6. Situation des dépenses prioritaires
7. Situation UEMOA (PCS)
8. Situation CEDEAO (PCC)
9. Situation WEBFONTAINE
10. Situation TVA secteur électrique
11. Prévision des mois - Soldes comptes Principal-C2D-BAD-Investissement

---

## 5. SERVICE DES RÉGIES

### 5.1 Objectif
Gestion des régies de recettes et de dépenses (agents habilités à encaisser/décaisser).

### 5.2 Modèle de Données

**Hub Central** : Gestion des régies
- Situation mensuelle des recettes
- Situation mensuelle des dépenses
- Suivi et contrôle des régisseurs
- Identification des régisseurs

**Entités Satellites** :
| Entité | Attributs |
|--------|-----------|
| RÉGISSEUR | Matricule, Nom, Prénom, Fonction, Photo, Provenance |
| RECETTE | N° compte, Date, Montant, Provenance |
| PIÈCES | N° pièce, Date émission, Provenance, Date |
| MINISTÈRE | Section, Nom, Direction, Département |
| CHÈQUE | N°, Montant, Date émission, Date réception |
| BÉNÉFICIAIRE | Identifiant, Nom, Prénom, Description |
| DÉPENSES | N° compte, Date, Montant |
| BANQUE | Identifiant, Nom, Agence |
| ORGANISME | Identifiant, Nom, Lieu, Date création, Validité |

### 5.3 KPI et Indicateurs Clés

| Catégorie | KPI | Formule | Seuil d'Alerte |
|-----------|-----|---------|----------------|
| **Activité** | Nombre de régies actives | Count distinct régisseurs actifs | Diminution > 10% |
| | Montant moyen par régie | (Recettes + Dépenses) / Nb régies | Anomalie si écart > 3σ |
| | Taux de rotation des régies | (Régies clôturées / Total) × 100 | > 20%/an |
| **Recettes** | Taux de croissance des recettes | (Recettes N - Recettes N-1) / Recettes N-1 | Variation > ±25% |
| | Délai moyen remise recettes | Date remise - Date encaissement | > 48 heures |
| | Taux de recettes sans pièces justificatives | (Recettes sans PJ / Total) × 100 | > 5% |
| **Dépenses** | Taux de croissance des dépenses | (Dépenses N - Dépenses N-1) / Dépenses N-1 | Variation > ±25% |
| | Délai moyen paiement | Date paiement - Date demande | > 5 jours |
| | Taux de dépenses contrôlées | (Dépenses vérifiées / Total) × 100 | < 100% |
| **Contrôle** | Taux de régies auditées | (Régies auditées / Total) × 100 | < 100%/trimestre |
| | Nombre d'anomalies détectées | Count anomalies | Augmentation > 20% |
| | Montant des écarts détectés | Σ Écarts | > 1% du flux |
| **Gestion** | Délai moyen traitement chèques | Date réception - Date émission | > 10 jours |
| | Taux de chèques impayés | (Chèques impayés / Total reçus) × 100 | > 2% |

### 5.4 Axes d'Analyse

| Axe | Dimensions | Visualisation Recommandée |
|-----|-----------|---------------------------|
| Opérationnel | Type opération (recette/dépense), Nature | Histogramme empilé |
| Temporel | Jour, Semaine, Mois, Heure (pointe) | Heatmap calendrier |
| Géographique | Région, Ville, Localité | Carte avec bulles |
| Organisationnel | Ministère, Direction, Service | Organigramme, Treemap |
| Régisseur | Ancienneté, Volume, Historique | Matrice BCG (volume/fréquence) |
| Bancaire | Banque, Agence, Mode paiement | Graphique réseau |

### 5.5 Livrables

- Situation mensuelle des recettes
- Situation mensuelle des dépenses
- Suivi et contrôle des régisseurs
- Identification des régisseurs

---

## 6. SERVICE COMPTE DE GESTION

### 6.1 Objectif
Suivi de l'exécution budgétaire et production des balances comptables.

### 6.2 Sources de Données

| Source | Contenu |
|--------|---------|
| SIGFIP | Mandats (SODE, EPN, COLLECTIVIT2, AUTRES), Avis de crédits |
| PEC-MER | Mandats (SODE, EPN, COLLECTIVIT2, AUTRES), Avis de crédits |
| ASTER | Mandats (SODE, EPN, COLLECTIVIT2, AUTRES), Avis de crédits |
| RÈGLEMENT | Mandats (SODE, EPN, COLLECTIVIT2, AUTRES), Avis de crédits |
| COMPTABILITÉ | CCB et CIP |

### 6.3 Modules DWH Spécifiques

| Module | Fonction |
|--------|----------|
| **Compensations** | ACCT-ACCD-IMPÔT-EPN/SODE |
| **Automatisations** | Registres + Cahier de transmission |

### 6.4 KPI et Indicateurs Clés

| Catégorie | KPI | Formule | Seuil d'Alerte |
|-----------|-----|---------|----------------|
| **Exécution Budgétaire** | Taux d'exécution des crédits | (Réalisé / Ouvert) × 100 | < 85% ou > 98% |
| | Taux d'absorption des crédits | (Engagé / Ouvert) × 100 | < 90% à T-2 mois |
| | Écart LFI/LFR | (LFR - LFI) / LFI | > ±10% |
| **Mandats** | Délai moyen de mandatement | Date mandatement - Date engagement | > 10 jours |
| | Taux de mandats rejetés | (Rejetés / Total) × 100 | > 5% |
| | Montant moyen par mandat | Σ Montants / Nb mandats | Suivi tendance |
| **Imputations** | Taux d'imputations provisoires | (Provisoires / Total) × 100 | > 15% |
| | Délai moyen de régularisation | Date régul. - Date imputation | > 30 jours |
| | Taux d'imputations sans pièce | (Sans PJ / Total) × 100 | > 2% |
| **Disponibilités** | Taux de couverture des engagements | (Disponible / Engagé) × 100 | < 110% |
| | Délai moyen de paiement | Date paiement - Date mandatement | > 15 jours |
| | Taux de disponibilités bloquées | (Bloquées / Total) × 100 | > 10% |
| **Balance** | Équilibre balance 3 chiffres | |Dépenses - Recettes - Solde| | > 0.01% |
| | Taux de lignes lettrées | (Lettrées / Total) × 100 | < 95% |

### 6.5 Axes d'Analyse

| Axe | Dimensions | Visualisation Recommandée |
|-----|-----------|---------------------------|
| Budgétaire | LFI, LFR, Reports, Supplémentaires | Graphique en cascade (waterfall) |
| Temporel | Mois cumulé, Trimestre, Exercice | Courbe cumulée vs objectif |
| Organisationnel | Bailleur (SODE, EPN, etc.), Ministère | Matrice, Treemap |
| Comptable | Compte, Chapitre, Article | Tableau hiérarchique drill-down |
| Qualité | Taux erreur, Délai, Rework | Graphique de Pareto |

### 6.6 Livrables

- Suivi des correspondances
- Situation du développement des dépenses budgétaires
- Balance à 3 chiffres
- Situation des imputations provisoires (recettes/dépenses)
- Situation sur les disponibilités
- Situation du compte de gestion
- Relevé

---

## 7. SERVICE TRÉSORERIE

### 7.1 Objectif Global
Pilotage de la liquidité, gestion des flux financiers et optimisation des disponibilités.

### 7.2 Sous-Domaines
- Gestion des Lettres d'Avance
- Gestion des Bons de Caisse

---

### 7.3 SOUS-DOMAINE : GESTION DES LETTRES D'AVANCE

#### Objectif
Suivi des avances de fonds aux agents et régularisations.

#### Entités
| Entité | Attributs |
|--------|-----------|
| Ministères | Section, Description |
| Bénéficiaire | Référence, Direction, Département |
| Date | Date réception, Date exécution |
| Lettre Avance | Référence, Objets, Montant |
| Poste Comptable | Référence, Nom, Compte, Montant |
| Paiement | Compte provisoire, Montant, Montant exécuté, Reste à exécuter |
| Transmission | Référence, Date transmission |
| Régularisation | Référence pièce, Statut, Montant régularisé, Reste à régulariser |
| Relance | Référence, Date relance, Nombre de relance |
| BV | Référence, Montant, Date |

#### KPI et Indicateurs Clés

| Catégorie | KPI | Formule | Seuil d'Alerte |
|-----------|-----|---------|----------------|
| **Stock** | Montant total lettres d'avance en cours | Σ Montants non régularisés | > Plafond budgétaire |
| | Nombre moyen de LA par agent | Total LA / Nb agents | > 2 simultanées |
| | Délai moyen de traitement | Date exécution - Date réception | > 5 jours |
| **Régularisation** | Taux de régularisation | (Régularisées / Total) × 100 | < 90% |
| | Délai moyen de régularisation | Date régul. - Date LA | > 60 jours |
| | Taux de LA en retard | (LA > 60j / Total) × 100 | > 15% |
| **Relances** | Nombre moyen de relances par LA | Σ Relances / Nb LA | > 2 |
| | Taux de réponse aux relances | (Régul. après relance / Relances) × 100 | < 70% |
| | Délai moyen après relance | Date régul. - Date relance | > 30 jours |
| **Paiement** | Taux d'exécution des paiements | (Montant exécuté / Montant LA) × 100 | < 95% |
| | Montant moyen reste à exécuter | Σ Reste / Nb LA en cours | > 20% du montant initial |

#### Axes d'Analyse

| Axe | Dimensions | Visualisation Recommandée |
|-----|-----------|---------------------------|
| Processus | Étape (réception, paiement, régularisation) | Diagramme de flux (Sankey) |
| Temporel | Durée de vie de la LA, Échéances | Chronogramme avec alertes |
| Financier | Montant, Reste à exécuter/régulariser | Graphique en cascade |
| Organisationnel | Ministère, Direction, Bénéficiaire | Treemap, Tableau hiérarchique |
| Qualité | Nombre relances, Délais | Histogramme, Boîte à moustaches |

---

### 7.4 SOUS-DOMAINE : GESTION DES BONS DE CAISSE

#### Objectif
Gestion des paiements en espèces et suivi des caisses.

#### Entités
| Entité | Attributs |
|--------|-----------|
| Bon de caisse | Référence, Montant |
| Prise en charge | Référence, Date |
| Approvisionnement | Numcompte, Date appro, Montant, Statut |
| BV | Référence bv, Date, Montant |
| Poste comptable | Identifiant, Lieu, NumCompte, Montant |
| Bénéficiaire | Identifiant, Nom, Téléphone, Fonction |
| Régularisation | Référence, Statut, Montant régularisé, Reste |

#### KPI et Indicateurs Clés

| Catégorie | KPI | Formule | Seuil d'Alerte |
|-----------|-----|---------|----------------|
| **Stock** | Nombre de BC en circulation | Count BC non soldés | > Seuil de gestion |
| | Montant moyen par BC | Σ Montants / Nb BC | Anomalie si > 3σ |
| | Durée moyenne de vie d'un BC | Date régul. - Date émission | > 30 jours |
| **Approvisionnement** | Taux de couverture des approvisionnements | (Appro réalisé / Besoin prévu) × 100 | < 90% ou > 110% |
| | Délai moyen d'approvisionnement | Date appro - Date demande | > 3 jours |
| | Taux d'approvisionnements urgents | (Urgents / Total) × 100 | > 20% |
| **Régularisation** | Taux de régularisation des BC | (Régularisés / Total) × 100 | < 95% |
| | Délai moyen de régularisation | Date régul. - Date prise en charge | > 15 jours |
| | Taux de BC en retard | (BC > 15j / Total) × 100 | > 10% |
| **Contrôle** | Taux de BC vérifiés | (Vérifiés / Total) × 100 | < 100% |
| | Montant des écarts détectés | Σ |Montant BC - Montant pièces|| > 1% du flux |

#### Axes d'Analyse

| Axe | Dimensions | Visualisation Recommandée |
|-----|-----------|---------------------------|
| Opérationnel | Statut (en cours, régularisé, en retard) | Diagramme circulaire |
| Temporel | Heure, Jour, Semaine (pointes d'activité) | Heatmap calendrier |
| Géographique | Lieu, Poste comptable | Carte avec concentration |
| Financier | Montant, Cumul, Évolution | Courbe, Histogramme cumulé |
| Qualité | Écarts, Délais, Anomalies | Graphique de contrôle |

---

### 7.5 TRÉSORERIE GLOBALE - ARCHITECTURE COMPLÈTE

#### Sources de Données

| Source | Contenu |
|--------|---------|
| BCEAO | Recettes des comptes, Soldes après fermeture |
| APPRO | CGRAE (Pensions), SOLDE (Bon de caisse), Postes comptables, SODE |
| Effets de commerce | Obligations Cautionnées (OC), Lettres de change |
| Plan de trésorerie entrée | Prévisions de flux entrants |

#### KPI et Indicateurs Clés

| Catégorie | KPI | Formule | Seuil d'Alerte |
|-----------|-----|---------|----------------|
| **Liquidité** | Position de trésorerie nette | Disponible - Engagé à court terme | < 10% des besoins |
| | Couverture du besoin en fonds de roulement | Trésorerie / BFR | < 1.2 |
| | Délai moyen de rotation des disponibilités | 365 / (Dépenses annuelles / Trésorerie moyenne) | > 45 jours |
| **Prévisions** | Taux de réalisation des prévisions d'entrées | (Entrées réalisées / Prévues) × 100 | Écart > ±20% |
| | Taux de réalisation des prévisions de sorties | (Sorties réalisées / Prévues) × 100 | Écart > ±15% |
| | Écart plan de trésorerie | |Réalisé - Prévu| / Prévu | > 25% |
| **Effets de Commerce** | Montant total OC en portefeuille | Σ Montants OC | > Limite autorisée |
| | Échéance moyenne des OC | Σ (Montant × Jours) / Total | < 30 jours ou > 180 jours |
| | Taux de couverture des OC | (Garanties / Montant OC) × 100 | < 100% |
| **Bancaire** | Concentration par banque | Top banque / Total | > 40% |
| | Coût moyen des services bancaires | Frais bancaires / Volume traité | Augmentation > 10% |
| | Taux d'utilisation des lignes de trésorerie | (Utilisé / Autorisé) × 100 | > 80% |
| **Approvisionnements** | Répartition fonctionnement/investissement | Appro FCT / (Appro FCT + Appro INV) | Suivi vs LFI |
| | Taux de consommation des approvisionnements | (Consommé / Approvisionné) × 100 | > 95% (alerte saturation) |

#### Axes d'Analyse

| Axe | Dimensions | Visualisation Recommandée |
|-----|-----------|---------------------------|
| Temporel | Jour, Semaine, Mois, Échéances (courte/moyenne/longue) | Courbe de trésorerie, Diagramme de Gantt |
| Bancaire | Banque, Compte, Type (principal/secondaire) | Matrice de concentration |
| Flux | Entrées vs Sorties, Cumul | Graphique de trésorerie (flux nets) |
| Instrument | OC, LC, Virement, Chèque, Espèce | Répartition par instrument |
| Projet | Fonctionnement, Investissement, Par bailleur | Tableau de bord multi-projets |

#### Livrables

1. Situation de trésorerie
2. Tableau de bord trésorerie
3. Situation agrégées des pensions et bon de caisse par banque
4. Situation de couverture de divers bon de caisse
5. Situation OC à échéance proche
6. Situation OC à échéance lointaine
7. Plan de trésorerie sortie
8. Situation sur les postes comptables les plus approvisionnés
9. Cumul appro fonctionnement
10. Cumul appro investissement

---

## 8. SERVICE RÈGLEMENT

### 8.1 Objectif
Gestion centralisée des paiements, rapprochements et imputations.

### 8.2 Sources de Données

| Source | Contenu |
|--------|---------|
| BCEAO | Soldes, Débits/Crédits en instance |
| ACCT | Avis crédit/débit, Soldes, Dépenses avec/sans LA |
| IMPÔT | Recettes fiscales |

### 8.3 KPI et Indicateurs Clés

| Catégorie | KPI | Formule | Seuil d'Alerte |
|-----------|-----|---------|----------------|
| **Rapprochement** | Taux de rapprochement automatique | (Lignes rapprochées auto / Total) × 100 | < 85% |
| | Délai moyen de rapprochement | Σ Délais / Nb opérations | > 2 jours |
| | Écart de concordance | |Solde Bancaire - Solde Comptable| | > 0.05% |
| **Paiements** | Délai moyen de règlement | Date règlement - Date réception facture | > 30 jours |
| | Taux de paiements dans les délais | (Dans délai / Total) × 100 | < 90% |
| | Montant moyen par règlement | Σ Montants / Nb règlements | Suivi tendance |
| **Imputations** | Taux d'imputations provisoires | (Provisoires / Total) × 100 | > 10% |
| | Délai moyen de régularisation IP | Date régul. - Date imputation | > 20 jours |
| | Taux d'imputations sans pièce | (Sans PJ / Total) × 100 | > 3% |
| **Fiscalité** | Taux de répartition correcte des impôts | (Correctement répartis / Total) × 100 | < 98% |
| | Délai moyen de transmission des quote-parts | Date transmission - Date perception | > 10 jours |
| **Inter-agences** | Taux de rapprochement ACCT-ACCD | (Lignes concordées / Total) × 100 | < 95% |
| | Délai moyen de réconciliation | Date accord - Date constat écart | > 5 jours |

### 8.4 Axes d'Analyse

| Axe | Dimensions | Visualisation Recommandée |
|-----|-----------|---------------------------|
| Opérationnel | Type opération (débit/crédit), Nature | Histogramme empilé |
| Temporel | Date valeur, Date opération, Échéance | Ligne de temps, Calendrier |
| Bancaire | Banque, Agence, Canal | Répartition géographique |
| Fournisseur/Bénéficiaire | Top tiers, Ancienneté relation | Graphique de Pareto |
| Qualité | Écarts, Rejets, Retours | Graphique de contrôle, Pareto |

### 8.5 Livrables

- Certificat de Concordance Bancaire (CCB)
- Compte d'Imputation Provisoire
- Quote Parts d'Impôts
- Rapprochement ACCT-ACCD

---

## 9. MATRICE DES ACTEURS

### 9.1 Droits d'Accès par Service

| Acteur | Comptabilité | Cautionnement | Statistiques | Régies | Compte Gestion | Trésorerie | Règlement |
|--------|:------------:|:-------------:|:------------:|:------:|:--------------:|:----------:|:---------:|
| **Directeur ACCT** | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture |
| **Fondés de pouvoir** | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture |
| **Chef de service** | Lecture (tout) / Écriture (son domaine) | Lecture (tout) / Écriture (son domaine) | Lecture | Lecture (tout) / Écriture (son domaine) | Lecture (tout) / Écriture (son domaine) | Lecture (tout) / Écriture (son domaine) | Lecture (tout) / Écriture (son domaine) |
| **Agents** | Lecture (filtrée) / Écriture (limitée) | Lecture (filtrée) / Écriture (limitée) | Lecture | Lecture (filtrée) / Écriture (limitée) | Lecture (filtrée) / Écriture (limitée) | Lecture (filtrée) / Écriture (limitée) | Lecture (filtrée) / Écriture (limitée) |

### 9.2 Types de Présentation par Profil

| Acteur | Type de Présentation | Granularité | Fréquence |
|--------|---------------------|-------------|-----------|
| **Directeur ACCT** | Tableaux de bord stratégiques, Prédictions, Décisions | Agrégé, Haut niveau | Quotidien |
| **Fondés de pouvoir** | Analyses détaillées, Suivi et contrôle | Détaillé, Tous niveaux | Quotidien |
| **Chef de service** | Situations, Tableaux de bord opérationnels | Opérationnel, Service | Quotidien/Hebdo |
| **Agents** | Suivi opérationnel, Données brutes filtrées | Transactionnel | Quotidien |

---

## 10. GLOSSAIRE

| Terme | Définition |
|-------|------------|
| **ACCT** | Agence de Coordination et de Contrôle des Transferts |
| **ACCD** | Agence de Comptabilité et de Contrôle des Dépenses |
| **BCEAO** | Banque Centrale des États de l'Afrique de l'Ouest |
| **CCB** | Certificat de Concordance Bancaire |
| **CEDEAO** | Communauté Économique des États de l'Afrique de l'Ouest |
| **CIP** | Compte d'Imputation Provisoire |
| **DWH** | Data Warehouse (Entrepôt de données) |
| **EPN** | Établissement Public National |
| **ETL** | Extract, Transform, Load |
| **LA** | Lettre d'Avance |
| **LFI** | Loi de Finances Initiale |
| **LFR** | Loi de Finances Rectificative |
| **OC** | Obligation Cautionnée |
| **OSADC** | Organisation de la Sécurité et de l'Administration des Données Centrales |
| **PCS** | Position de la Côte d'Ivoise (UEMOA) |
| **PCC** | Position de la Côte d'Ivoise (CEDEAO) |
| **RAP** | Restes à Payer |
| **SODE** | Société de Développement de l'Entreprise |
| **SYDEC** | Système de Décentralisation des Crédits |
| **UEMOA** | Union Économique et Monétaire Ouest Africaine |

---

## ANNEXE : TABLEAU RÉCAPITULATIF DES KPI PAR SERVICE

| Service | Nombre KPI | Catégories Principales | Priorité |
|---------|:----------:|------------------------|:--------:|
| Comptabilité | 9 | Rapprochement, Imputations, Fiscalité | Haute |
| Cautionnement et Dépôt | 12 | Couverture, Précomptes, Gestion, Chèques | Moyenne |
| Statistiques | 11 | Subventions, RAP, Priorités, Intégration régionale | Haute |
| Régies | 12 | Activité, Recettes, Dépenses, Contrôle | Haute |
| Compte de Gestion | 11 | Exécution budgétaire, Mandats, Imputations, Disponibilités | Haute |
| Trésorerie (Global) | 13 | Liquidité, Prévisions, Effets de commerce, Bancaire | Critique |
| Lettres d'Avance | 9 | Stock, Régularisation, Relances, Paiement | Moyenne |
| Bons de Caisse | 9 | Stock, Approvisionnement, Régularisation, Contrôle | Moyenne |
| Règlement | 10 | Rapprochement, Paiements, Imputations, Fiscalité | Haute |

---

## 11. DASHBOARD D'ACCUEIL GLOBAL (PAGE D'ACCUEIL)

### 11.1 Objectif
Fournir une vue consolidée et synthétique de l'ensemble de l'activité de l'ACCT en un coup d'œil, avec accès rapide aux détails par service.

### 11.2 Structure du Dashboard
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DASHBOARD ACCT - VUE GLOBALE                            │
│                         Date : [Automatique]                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  [KPI CRITIQUES]    [ALERTES EN COURS]    [ACTIVITÉ DU JOUR]              │
│  • Trésorerie       • X RAP en retard       • X règlements effectués       │
│  • RAP Global       • X LA non régularisées • X mandats émis               │
│  • Exécution LFI    • X écarts bancaires    • X nouveaux cautionnements    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [GRAPHIQUE 1 : TRÉSORERIE 12 MOIS]    [GRAPHIQUE 2 : RÉPARTITION BUDGÉTAIRE]│
│  Entrées vs Sorties cumulées           Fonctionnement / Investissement      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [CARTE : CONCENTRATION GÉOGRAPHIQUE]  [TABLEAU : TOP 5 ALERTES]           │
│  Régies / Subventions par région       Prioritaires à traiter               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [INDICATEURS PAR SERVICE - MINI VUES]                                      │
│  [Compta] [Caution] [Stat] [Régies] [Cpte Gestion] [Tréso] [Règlement]     │
└─────────────────────────────────────────────────────────────────────────────┘


### 11.3 Indicateurs Transversaux du Dashboard

#### A. KPI CRITIQUES (Cartes en haut de page)

| Indicateur | Formule | Source | Seuil Alerte | Actualisation |
|------------|---------|--------|--------------|---------------|
| **Position Trésorerie Nette** | Disponible - Engagé à court terme | Trésorerie | < 10% besoins | Temps réel |
| **Total Restes à Payer** | Σ RAP tous services | Statistiques + Compte Gestion | > 15% crédits | Quotidien |
| **Taux Exécution Budgétaire Global** | Réalisé total / Ouvert total | Compte de Gestion | < 85% ou > 98% | Hebdomadaire |
| **Solde Bancaire Consolidé** | Σ Soldes BCEAO + BNI + BACI | Règlement + Comptabilité | Variation > 10%/j | Temps réel |
| **Nombre d'Opérations en Attente** | LA non régul. + BC en circ. + IP ouvertes | Trésorerie + Comptabilité | > Seuil service | Temps réel |

#### B. ALERTES ET SIGNALEMENTS (Panneau latéral)

| Alerte | Déclencheur | Service | Priorité |
|--------|-------------|---------|----------|
| RAP > 90 jours | Ancienneté moyenne RAP dépassée | Statistiques | 🔴 Haute |
| LA > 60 jours sans régularisation | Délai LA dépassé | Trésorerie | 🔴 Haute |
| Écart concordance > 0.1% | Écart BCEAO/ACCT | Comptabilité | 🔴 Haute |
| Cautionnement échu non régularisé | Date fin + 30j dépassée | Cautionnement | 🟡 Moyenne |
| Régie non auditée > 90j | Dernier audit dépassé | Régies | 🟡 Moyenne |
| Prévision vs Réalisation > ±20% | Écart trésorerie | Trésorerie | 🟡 Moyenne |
| Mandat rejeté | Taux rejet > 5% | Compte de Gestion | 🟢 À suivre |

#### C. ACTIVITÉ DU JOUR (Compteur dynamique)

| Métrique | Source | Visualisation |
|----------|--------|---------------|
| Règlements effectués | Règlement | Compteur + tendance vs veille |
| Mandats émis | Compte de Gestion | Compteur + cumul mensuel |
| Nouveaux cautionnements | Cautionnement | Compteur + file d'attente |
| Recettes perçues (Régies) | Régies | Compteur + objectif jour |
| Lettres d'avance traitées | Trésorerie | Compteur + délai moyen |

---

### 11.4 Graphiques Principaux du Dashboard

#### Graphique 1 : Courbe de Trésorerie sur 12 Mois Glissants
Type : Courbe à double axe
Axe X : Mois (M-12 à M)
Axe Y Gauche : Montants (FCFA) - Entrées (vert) / Sorties (rouge)
Axe Y Droite : Solde cumulé (bleu)
Données : Agrégation BCEAO + BNI + BACI + Prévisions


#### Graphique 2 : Répartition Budgétaire Fonctionnement/Investissement

Type : Donut ou Demi-circulaire
Segments :
       Fonctionnement (en cours %)
       Investissement (en cours %)
       Disponible (restant %)
       Gelé/Blocé (si applicable)
       Données : Compte de Gestion + Approvisionnements


#### Graphique 3 : Heatmap des Activités par Service et Temps
Type : Heatmap (calendrier)
X : Semaines du mois
Y : Services (Compta, Tréso, Régies, etc.)
Intensité : Volume d'opérations (couleur du bleu clair au rouge foncé)
Objectif : Identifier les pics d'activité et anticiper les besoins
plain
Copy

#### Graphique 4 : Carte de Performance des Services (Scorecard)
Type : Tableau de bord type "Scorecard" avec jauges
Lignes : Les 7 services
Colonnes :
Nom du service
KPI principal (valeur)
Tendance (flèche vs période précédente)
État (🟢 OK / 🟡 Attention / 🔴 Alerte)
Lien vers détail


---

### 11.5 Mini-Vues par Service (Widgets rétractables)

Chaque service dispose d'un widget résumé sur le dashboard :

| Service | Indicateur Principal | Métrique Secondaire | Lien Rapide |
|---------|---------------------|---------------------|-------------|
| **Comptabilité** | Taux rapprochement BCEAO | Volume IP en attente | Voir CCB |
| **Cautionnement** | Montant total cautions actives | Nbre attestations en cours | Voir précomptes |
| **Statistiques** | Taux exécution subventions | Montant RAP global | Voir UEMOA/CEDEAO |
| **Régies** | Nombre régies actives | Recettes vs Dépenses jour | Voir contrôle |
| **Compte Gestion** | Taux exécution crédits | Délai moyen mandatement | Voir balance |
| **Trésorerie** | Position trésorerie | Échéances OC 30j | Voir plan de trésorerie |
| **Règlement** | Volume règlements jour | Taux paiement dans délais | Voir concordance |

---

### 11.6 Tableau Récapitulatif des Alertes Prioritaires

| Rang | Alerte | Service | Critère | Action suggérée |
|:----:|--------|---------|---------|-----------------|
| 1 | Rupture trésorerie prévue | Trésorerie | Solde < besoins 7j | Déclencher ligne de trésorerie |
| 2 | RAP critique | Statistiques | > 20% crédits ou > 120j | Réunion urgence bailleurs |
| 3 | Écart bancaire non expliqué | Comptabilité | > 0.5% solde | Investigation immédiate |
| 4 | LA frauduleuse suspectée | Trésorerie | > 3 relances sans réponse | Audit interne |
| 5 | Cautionnement sans couverture | Cautionnement | Chèque sans provision | Blocage nomination |
| 6 | Régie anomalie | Régies | Écart > 5% recettes | Contrôle sur place |
| 7 | Dérapage budgétaire | Compte Gestion | > 100% LFI | Demande LFR |

---

### 11.7 Filtres et Paramètres du Dashboard

| Filtre | Options | Application |
|--------|---------|-------------|
| **Période** | Aujourd'hui, Semaine, Mois, Exercice | Tous les indicateurs |
| **Service** | Tous ou sélection multiple | Filtre widgets |
| **Bailleur** | État, UEMOA, CEDEAO, SODE, EPN... | Données budgétaires |
| **Région** | Toutes ou par district | Données géographiques |
| **Niveau d'alerte** | Tous, Critique, Moyenne, Faible | Filtre alertes |

---

### 11.8 Spécifications Techniques d'Affichage

| Élément | Spécification |
|---------|---------------|
| **Rafraîchissement** | Temps réel pour trésorerie, Quotidien pour autres |
| **Responsive** | Adaptation grille 3 colonnes (desktop) / 1 colonne (mobile) |
| **Export** | PDF quotidien automatique + Excel sur demande |
| **Accessibilité** | Contraste élevé, taille texte ajustable |
| **Sécurité** | Masquage montants sensibles selon profil |

---

### 11.9 Exemple de Configuration par Profil Utilisateur

#### Profil : Directeur ACCT
- Vue complète tous les indicateurs
- Accès aux données sensibles (montants bruts)
- Bouton "Décision rapide" pour valider alertes
- Export stratégique vers Présidence

#### Profil : Chef de Service
- Vue son service en détail + autres services agrégés
- Alertes prioritaires de son domaine
- Comparaison performance vs autres services

#### Profil : Agent
- Vue opérationnelle limitée à son périmètre
- Tâches à effectuer (todo list dynamique)
- Saisie des données et validation

---

*Cette section Dashboard complète la documentation technique en ajoutant la couche présentation globale nécessaire à la prise de décision au niveau directionnel.*

**Total KPI identifiés : 96**

---

*Document généré le : 11 mars 2026*
*Version : 2.0 - Fichier Complet avec KPI*
*Auteur : Assistant IA - Architecture BI & DWH ACCT*