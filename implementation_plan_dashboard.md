# Plan d'Implémentation : Refonte Exécutive du Dashboard ACCTBI

Ce plan détaille les étapes techniques pour transformer l'actuel tableau de bord global en un véritable outil de pilotage pour la Direction, intégrant les nouveaux indicateurs via un système d'onglets par service.

## Objectif

Créer une interface de "Cockpit" structurée sur 2 niveaux dynamiques :
1. **Un en-tête statique** pour les KPIs vitaux de l'État (Trésorerie, Dette, Exécution).
2. **Une zone dynamique par onglets** (Comptabilité, Trésorerie, Dette, Régies, etc.) affichant des widgets graphiques agrégés et modernes (Sankey, Jauges, Cartes de chaleur) sans surcharger la vue.

---

## Phase 1 : Architecture UI et Navigation (Le Squelette)

*   **Composant Cible :** `DashboardComponent` (`.html`, `.ts`, `.scss`)
*   **Actions :**
    *   Conserver la rangée supérieure des KPIs ("Cockpit").
    *   Concevoir et intégrer un menu de navigation par onglets (Tabs ou Pills) sous la section des alertes globales.
    *   Implémenter la logique dans le TypeScript pour gérer l'état de l'onglet sélectionné (`activeTab: string`).
    *   Structurer le HTML avec un `ngSwitch` (ou des conditions `@switch`/`@if` Angular 17+) pour afficher le bloc de graphiques correspondant au service actif.

## Phase 2 : Mise à jour du "Cockpit" Macro (KPIs globaux)

*   **Composant Cible :** `DashboardComponent` (Rangée des KPIs)
*   **Actions :**
    *   Modifier les "petites cartes" du haut pour inclure les nouveaux indicateurs prioritaires tirés du document : 
        *   Ratio Dette / PIB (Nouveau)
        *   Ratio de Liquidité (Nouveau)
    *   Appliquer un design moderne (mini-courbes d'évolution ou indicateurs de tendance vert/rouge).

## Phase 3 : Intégration des Widgets Agrégés par Onglet (Mockups UI)

Il s'agira de créer l'interface graphique (CSS/HTML) pour simuler ces nouvelles vues analytiques avant le raccordement aux vraies API.

1.  **Onglet "Trésorerie & Opérations"** :
    *   Mockup d'un mini-diagramme de flux (type Sankey ou graphique relationnel simplifié) illustrant les mouvements vers le CUT et les placements.
    *   Graphique d'évolution de la liquidité (Sparklines).
2.  **Onglet "Compte de Gestion & Dépenses"** :
    *   Graphique à barres horizontales pour le **Top 10 des Dépenses de l'État**.
    *   Jauge semi-circulaire (Gauge Chart) pour le taux d'avancement LFI/LFR.
3.  **Onglet "Dette & Macro-économie"** (Nouveau) :
    *   Graphique combiné (Barres pour le volume de dette, Ligne superposée pour l'évolution du Ratio/PIB).
4.  **Onglet "Régies & Recettes"** :
    *   Graphique à barres empilées 100% montrant la composition des recettes (État vs Collectivités vs TVA vs FER).
5.  **Onglet "Qualité & Rejets" (Règlement)** :
    *   Mockup d'une "Heatmap" (Carte de chaleur) des alertes (Impayés, Rejets de virements) pour identifier les pics d'anomalies.

## Phase 4 : Navigation Verticale ("Drill-down")

*   **Composant Cible :** Tous les widgets créés dans la Phase 3.
*   **Actions :**
    *   Ajout de la logique de routage (`routerLink` ou méthodes `goToDetail()`) sur les graphiques de synthèse pour rediriger l'utilisateur vers la page détaillée du service concerné.

---

## Vérification et Validation

*   **Tests Visuels :** Le changement d'onglet est fluide et affiche les bons widgets.
*   **Tests de Navigation :** Cliquer sur le graphique du "Top 10 des Dépenses" renvoie bien vers le composant `/gestion-compte`.
*   **UX/UI :** Respect scrupuleux du thème "Slate Glass" (ombres douces, bordures arrondies, couleurs professionnelles sans émojis).

> [!IMPORTANT]
> **Validation Requise**
> L'approche vous convient-elle ? Si oui, nous commencerons par la **Phase 1** (création du squelette à onglets dans le Dashboard).
