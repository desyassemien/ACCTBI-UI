# Analyse Comparative : Tableaux de Bord (Nouveau Document vs App Actuelle)

Ce document présente une analyse comparative entre les exigences fonctionnelles exprimées dans le nouveau document (`doc_acctbi_nouveau.txt`) et les indicateurs actuellement implémentés dans l'application ACCTBI (`indicateurs_services.md`). Il propose également une classification justifiée des nouveaux tableaux de bord dans les services existants, ainsi que des modèles d'intégration visuelle pour le Dashboard global.

## 1. Analyse Comparative : Similitudes et Différences

### 1.1. Similitudes (Alignement avec l'existant)
Plusieurs tableaux de bord demandés correspondent à des thématiques déjà couvertes par l'application :
- **Rapprochement et Écritures** : Le "Suivi des rapprochements des écritures" (écarts, comptes non balancés) s'aligne parfaitement avec les KPIs actuels du service **Comptabilité** (Écart de Concordance, Taux de rapprochement).
- **Opérations de Trésorerie et Liquidité** : Le "Suivi des opérations de trésorerie" et le "Suivi de la liquidité" font écho au service **Trésorerie** et à la **Vue Consolidée** (Solde bancaire consolidé, Position de trésorerie nette).
- **Dépenses de l'État** : Le "Suivi des dépenses de l'État" (taux d'avancement, top postes) est déjà en partie couvert par le service **Compte de Gestion** (Exécution des crédits) et le **Dashboard** (Top Postes Comptables).
- **Recettes et Impayés** : Le "Suivi des recettes" et des "effets impayés" trouve des similitudes avec le service **Régies** (Recettes perçues, Taux de chèques impayés).
- **Traitements et Rejets** : Le "Suivi des virements rejetés" correspond aux indicateurs de "Taux de mandats rejetés" dans **Compte de Gestion** ou aux anomalies dans **Règlement**.

### 1.2. Différences (Nouveaux Besoins et Lacunes)
Le nouveau document introduit des dimensions macro-économiques et analytiques qui ne sont pas explicitement modélisées dans l'interface actuelle :
- **Suivi de la Dette** : Concepts de Dette/PIB, taux de couverture. (Totalement absent de la version actuelle).
- **Soldes de Compensation** : Dimension nouvelle non identifiée dans l'existant.
- **Fonds des Bailleurs** : Bien que l'axe "Bailleur" existe dans le Compte de Gestion, le suivi fin de la "consommation des fonds" par bailleur manque.
- **Détail des Recettes (TVA, FER, Partagées)** : L'application actuelle consolide les recettes (Statistiques ou Régies), mais ne segmente pas spécifiquement en 100% État, partagées, TVA ou FER comme exigé.
- **Comptes hors CUT (Compte Unique du Trésor)** : Suivi spécifique des virements hors du système centralisé.
- **Modélisation et Prédictif** : "Optimisation de la trésorerie par modélisation des flux" requiert des fonctionnalités d'intelligence artificielle ou de projection avancées, actuellement basiques (Prévisions des mois dans Statistiques).

---

## 2. Classification et Justification dans les Services Existants

Afin de maintenir la cohérence de l'architecture de l'application, voici comment intégrer ces nouveaux tableaux de bord dans les modules existants :

| Nouveau Tableau de Bord | Service de Destination | Justification du Choix |
| :--- | :--- | :--- |
| **Suivi des rapprochements des écritures** | **Comptabilité** | C'est le cœur de métier de ce service (Rapprochement auto, Concordance BCEAO/ACCT). Les nouveaux indicateurs (comptes non balancés) viendront enrichir cette vue. |
| **Suivi des soldes de compte** | **Comptabilité** | Suivi du nombre de comptes (BNI, etc.) et de leurs volumes. Logique dans la concordance comptable globale. |
| **Suivi de la liquidité** & **Opérations de trésorerie** | **Trésorerie** | Intégration naturelle. Les ratios de liquidité, virements compte à compte, placements et solde CUT enrichiront l'analyse des flux actuels. |
| **Optimisation (modélisation)** | **Trésorerie** | Le module d'optimisation prédictive des flux financiers a sa place dans la gestion de trésorerie avancée en tant que nouvel onglet d'analyse. |
| **Suivi des traitements virements rejetés** | **Règlement** | Le service Règlement gère la finalisation des paiements. Les rejets et virements hors CUT y ont toute leur place en tant qu'anomalies de règlement. |
| **Suivi des virements hors CUT** | **Règlement** | Gestion des canaux de paiements dérogatoires ou externes. |
| **Suivi des recettes** & **Effets impayés** | **Régies** | Les régies sont les points de collecte primaires. Y intégrer la décomposition des recettes (TVA, FER, Collectivités) et le recouvrement des impayés est pertinent. |
| **Suivi des dépenses de l'État** | **Compte de Gestion** | Ce service gère déjà l'exécution budgétaire (LFI/LFR). Le top 10 des dépenses et le taux d'avancement s'y intègrent parfaitement. |
| **Suivi des fonds des bailleurs** | **Compte de Gestion** | Complète le suivi de l'exécution des crédits alloués par des entités externes. |
| **Suivi de la Dette** & **Soldes de compensation** | **Statistiques** | Données d'ordre macro-économique et stratégique. Le service Statistiques (qui gère déjà UEMOA, CEDEAO) est le plus apte à les héberger (Création d'un nouveau "Bloc 5 : Dette & Macro"). |

---

## 3. Propositions d'Intégration sur le Dashboard Global (Vue Consolidée)

Pour le tableau de bord principal (Vue Consolidée), l'objectif est d'offrir une vision "Executive" en utilisant les modèles d'affichage visuels les plus performants :

### 3.1. Dépenses et Exécution Budgétaire
* **Top 10 Postes de Dépenses** :
  * *Composant UI* : **Graphique à barres horizontales (Horizontal Bar Chart)**.
  * *Pourquoi ?* : Permet une lecture facile des libellés de ministères/postes (souvent longs) classés par ordre décroissant de montant.
* **Taux d'Avancement des Dépenses (Réalisé vs Cible)** :
  * *Composant UI* : **Jauge (Gauge Chart) ou Bullet Chart**.
  * *Pourquoi ?* : Indique visuellement instantanément si l'état est dans le rouge, l'orange ou le vert par rapport à la cible annuelle.

### 3.2. Dette et Ratios
* **Évolution Dette / PIB** :
  * *Composant UI* : **Graphique combiné (Bar/Line Combo)**. Barres pour le volume de la dette, Ligne superposée pour l'évolution du ratio % PIB.
  * *Pourquoi ?* : Met en évidence la corrélation entre la valeur absolue (montant de la dette) et l'impact macro-économique (Ratio).

### 3.3. Trésorerie, Liquidité et Opérations
* **Opérations de Trésorerie (Virements, Placements, CUT)** :
  * *Composant UI* : **Diagramme de Sankey (Sankey Diagram)**.
  * *Pourquoi ?* : Excellent pour modéliser visuellement l'épaisseur et la direction des flux financiers entre différentes entités (ex: Comptes de Collecte -> Placements -> CUT).
* **Ratios de Liquidité et Solvabilité** :
  * *Composant UI* : **Cartes KPI avec Sparklines (mini-courbes)**.
  * *Pourquoi ?* : Donne instantanément la tendance temporelle sur les 30 derniers jours sans prendre la place d'un grand graphique.

### 3.4. Recettes et Fonds Bailleurs
* **Composition des Recettes (TVA, FER, État, Collectivités)** :
  * *Composant UI* : **Graphique à barres empilées 100% (100% Stacked Bar Chart)** ou **Treemap**.
  * *Pourquoi ?* : Montre la contribution proportionnelle de chaque composante à la recette globale de l'État.
* **Consommation Fonds Bailleurs** :
  * *Composant UI* : **Graphiques radiaux multiples (Multiple Radial Progress Bars)**.
  * *Pourquoi ?* : Un cercle de progression (jauge circulaire) par bailleur, permettant d'identifier très rapidement les sous-consommations.

### 3.5. Qualité et Anomalies (Rejets, Impayés, Rapprochements)
* **Virements Rejetés et Effets Impayés** :
  * *Composant UI* : **Liste d'Alertes dynamiques** et **Heatmap (Carte de Chaleur calendaire)**.
  * *Pourquoi ?* : Les délais dépassant le seuil de tolérance clignotent (DANGER/WARNING). La Heatmap calendaire permet d'identifier les jours ou périodes avec des pics anormaux de rejets.

---
### Conclusion
L'intégration du nouveau périmètre (`doc_acctbi_nouveau.txt`) peut s'appuyer en grande majorité sur l'architecture des services actuels. 
Les efforts de développement devront se concentrer sur :
1. L'intégration de **nouvelles librairies graphiques** (pour les diagrammes de Sankey, Jauges et Treemaps).
2. L'ajout d'une section macro-économique spécifique à la **Dette** (dans les Statistiques).
3. Le développement d'un moteur d'**analyse prédictive** pour la Trésorerie.
