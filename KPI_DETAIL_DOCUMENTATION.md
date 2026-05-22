# Documentation - Modification Dashboard avec Détails KPI

## 📋 Vue d'ensemble
Les cards KPI et d'activité quotidienne du dashboard sont maintenant cliquables. Au clic, une page dédiée s'ouvre affichant:
- **Graphique à gauche** (Barre/Courbe switchable) 
- **Tableau détaillé à droite** avec données contextuelles

## 📁 Fichiers créés

### 1. **kpi-detail/kpi-detail.component.ts**
Composant standalone pour afficher les détails d'un KPI.

**Fonctionnalités:**
- Charge les données via paramètre route `:id`
- Toggle chart type (bar/line)
- Affiche graphique dynamique et tableau
- Bouton retour au dashboard

### 2. **kpi-detail/kpi-detail.component.html**
Template responsive avec:
- En-tête avec valeur KPI et bouton retour
- Colonne gauche: Graphique SVG (mock bar/line)
- Colonne droite: Tableau Bootstrap responsive
- Grille responsive (col-12 col-lg-7 / col-lg-5)

### 3. **kpi-detail/kpi-detail.component.scss**
Styles incluant:
- Cartes avec border-radius 16px
- Hover effects sur graphiques
- SVG gradient pour ligne chart
- Responsive design (max-width: 991px)

### 4. **services/kpi-detail.service.ts**
Service injectable qui retourne les données contextuelles pour chaque KPI:

**KPIs couverts:**
```
'4'  → Solde Bancaire Consolidé
'1'  → Position Trésorerie Nette
'5'  → Opérations en Attente
'2'  → Total Restes à Payer
'3'  → Taux Exécution Budgétaire
```

**Activités couvertes:**
```
'activite-recettes'        → Recettes perçues
'activite-reglements'      → Règlements effectués
'activite-mandats'         → Mandats émis
'activite-cautionnements'  → Nouveaux cautionnements
```

Chaque KPI inclut:
- Titre et valeur
- Données graphique (labels, data, color)
- Headers et données tableau

## 🔄 Fichiers modifiés

### dashboard.component.ts
```typescript
// Router injection
private router = inject(Router);

// Ajouter IDs aux activités
activiteJour = [
    { label: '...', id: 'activite-recettes', ... },
    { label: '...', id: 'activite-reglements', ... },
    { label: '...', id: 'activite-mandats', ... },
    { label: '...', id: 'activite-cautionnements', ... }
];

// Méthodes de navigation
viewKpiDetail(kpiId: string): void
viewActivityDetail(activityId: string): void
```

### dashboard.component.html
**KPI Cards:**
```html
<div class="kpi-card-wrapper" (click)="viewKpiDetail(kpi.id)">
    <app-kpi-card [data]="kpi" class="w-100"></app-kpi-card>
</div>
```

**Activity Cards:**
```html
<div class="activity-card-wrapper" (click)="viewActivityDetail(item.id)">
    <!-- card content -->
</div>
```

### dashboard.component.scss
```scss
.kpi-card-wrapper,
.activity-card-wrapper {
    cursor: pointer;
    transition: transform 0.2s ease;
    
    &:hover {
        transform: translateY(-8px);
        // box-shadow enhancement
    }
}
```

### app.routes.ts
Route enfant ajoutée:
```typescript
{
    path: 'dashboard/kpi/:id',
    loadComponent: () => import('./features/dashboard/kpi-detail/kpi-detail.component')
        .then(m => m.KpiDetailComponent)
}
```

## 🎯 Fonctionnalités

### Page Détail KPI
- **Graphique interactif:**
  - Barre (bar chart) par défaut
  - Courbe (line chart) alternative
  - Toggle via boutons radio
  - Mock SVG avec gradient et points de données

- **Tableau détaillé:**
  - Headers dynamiques selon KPI
  - Données contextuelles par ligne
  - Responsive sur mobile

- **Navigation:**
  - Bouton "Retour" revient au dashboard
  - URL: `/dashboard/kpi/1`, `/dashboard/kpi/activite-recettes`, etc.

## 📊 Données par KPI

### Solde Bancaire Consolidé (Id: 4)
```
Graphique: Évolution 12 mois
Tableau: Institution Bancaire | Solde | Devises | Évolution
Exemples: BCEAO, Trésor Principal, Trésor Région, Correspondants
```

### Position Trésorerie Nette (Id: 1)
```
Graphique: Évolution 12 semaines
Tableau: Composante | Montant | Variante | Tendance
Exemples: Disponibilités, Crédits CT, Engagements Assimilés
```

### Opérations en Attente (Id: 5)
```
Graphique: Évolution 12 mois
Tableau: Type Opération | Nombre | Montant | Depuis (jours)
Exemples: Mandats, Lettres d'Avance, Chèques, Écarts
```

### Total Restes à Payer (Id: 2)
```
Graphique: Évolution 12 mois
Tableau: Service Créancier | Montant RAP | Ancienneté | Priorité
Exemples: Infrastructure, Éducation, Santé, Défense
```

### Taux Exécution Budgétaire (Id: 3)
```
Graphique: Évolution mensuelle (cumul)
Tableau: Ligne Budgétaire | Budget | Exécuté | Taux %
Exemples: Fonctionnement, Investissements, Intérêts, Transferts
```

### Recettes Perçues (activite-recettes)
```
Graphique: Évolution 7 jours
Tableau: Régie Perception | Montant | Nombre Opérations | Tendance
Exemples: RGF, Douanes, Impôts Directs, Patrimoine
```

### Règlements Effectués (activite-reglements)
```
Graphique: Évolution 7 jours
Tableau: Type Règlement | Nombre | Montant | État
Exemples: Virement, Chèque, Prélèvement, Espèces
```

### Mandats Émis (activite-mandats)
```
Graphique: Évolution 7 jours
Tableau: Type Mandat | Nombre | Montant Total | Moyenne/Mandat
Exemples: Mandat Dépense, Trésor Payeur, Personnel, Autres
```

### Nouveaux Cautionnements (activite-cautionnements)
```
Graphique: Évolution 7 jours
Tableau: Type Cautionnement | Nombre | Montant | Durée Moyenne
Exemples: Marché, Douanier, Versement, Autres
```

## 🚀 Utilisation

1. **Compiler le projet:**
   ```bash
   npm run build
   ```

2. **Développement:**
   ```bash
   ng serve
   ng serve --open  # Ouvre automatiquement le navigateur
   ```

## 🖼️ Améliorations ajoutées

- Graphiques supportés pour le détail KPI:
  - `bar` (barres verticales, ici hauteur proportionnelle à la valeur + label valeur au-dessus)
  - `line` (ligne)
  - `area` (aire)
  - `pie` (camembert, légende avec valeurs/%, labels)
  - `donut` (camembert évidé, légende idem)

- Couleurs distinctes par type de graphique:
  - `bar`: palette bleue (1B3A6B → BDE3FF)
  - `line`: palette verte (2E7D32 → C8E6C9)
  - `area`: palette dorée (D4A017 → FFF9E6)
  - `pie`/`donut`: palette mixte (bleu, vert, doré, rouge, orange)

- Tooltip interactif:
  - Hover sur segments pie/donut: affiche label + valeur en FCFA
  - Hover sur points ligne/area: affiche label + valeur
  - Hover sur barres: affiche label + valeur
  - Positionné dynamiquement près du curseur

- Interaction hover sur les cards du dashboard:
  - card sous le curseur: agrandie (`scale(1.04)`)
  - les autres cards: floutées et atténuées (`opacity 0.6`, `blur(1px)`)

- État géré par `activeCardId` dans `dashboard.component.ts`.
- `kpi-detail.component.ts` expose `selectChartType(type)` pour changer les modes.


3. **Accéder au dashboard:**
   - Naviguer vers `/dashboard`
   - Cliquer sur n'importe quelle KPI card ou activité card
   - La page détail s'ouvre avec graphique + tableau

4. **Sur la page détail:**
   - Toggle graphique bar/line via les boutons radio
   - Consulter les données détaillées dans le tableau
   - Cliquer "Retour" pour revenir au dashboard

## ✅ Status de compilation

```
✅ Build Successful
- kpi-detail-component: 15.59 kB (lazy chunk)
- Temps de build: ~10 secondes
- Total bundle: 898.66 kB (warnings sur budget uniquement)
```

## 📝 Notes techniques

- Composant isolé avec responsabilité unique
- Données mockées mais extensibles (remplacer par API réelle)
- Graphiques SVG avec mock charts (Angular Charts peut être intégré)
- Service injectable pour faciliter la réutilisation
- Responsive design mobile-first
- Style Bootstrap 5 + custom SCSS

## 🔗 Routes disponibles

```
/dashboard                    → Dashboard principal
/dashboard/kpi/1             → Détails Position Trésorerie Nette
/dashboard/kpi/2             → Détails Total Restes à Payer
/dashboard/kpi/3             → Détails Taux Exécution Budgétaire
/dashboard/kpi/4             → Détails Solde Bancaire Consolidé
/dashboard/kpi/5             → Détails Opérations en Attente
/dashboard/kpi/activite-recettes        → Détails Recettes
/dashboard/kpi/activite-reglements      → Détails Règlements
/dashboard/kpi/activite-mandats         → Détails Mandats
/dashboard/kpi/activite-cautionnements  → Détails Cautionnements
```
