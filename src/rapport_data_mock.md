Voici les améliorations apportées à l'Analyse Avancée du service Comptabilité (`app-comptabilite`) :

### 1. ⏳ Forage Temporel Hiérarchique (Année ➔ Trimestre ➔ Mois ➔ Semaine ➔ Jour)
- **Cascade temporelle pure** :
  - **Exercice / Année** (ex: `Exercice 2026`) ➔ Cliquer ouvre les **4 Trimestres** (`T1`, `T2`, `T3`, `T4`).
  - **Trimestre** (ex: `1er Trimestre (T1)`) ➔ Cliquer ouvre les **3 Mois correspondants** (`Janvier`, `Février`, `Mars` pour T1, etc.).
  - **Mois** (ex: `Mars`) ➔ Cliquer ouvre les **4 Semaines** (`Semaine 1 (01-07)`, `Semaine 2 (08-14)`, `Semaine 3 (15-21)`, `Semaine 4 (22-31)`).
  - **Semaine** (ex: `Semaine 1`) ➔ Cliquer ouvre les **Jours ouvrés** (`Lundi`, `Mardi`, `Mercredi`, `Jeudi`, `Vendredi`).
  - **Jour** (ex: `Lundi`) ➔ Cliquer ouvre les **Plages horaires** (`08h00 - 10h00`, `10h00 - 12h00`, etc.).
- **Survol interactif (Tooltip de graphique)** :
  - Au survol de n'importe quelle barre, la bulle d'information indique explicitement l'action de forage adaptée au niveau :
    - Ex sur Année : `🔍 Cliquer pour forer : Passer aux Trimestres`
    - Ex sur Trimestre : `🔍 Cliquer pour forer : Passer aux Mois`
    - Ex sur Mois : `🔍 Cliquer pour forer : Passer aux Semaines`
    - Ex sur Semaine : `🔍 Cliquer pour forer : Passer aux Jours`
- **Interface épurée** :
  - Suppression des répétitions superflues du mot "Forer" sur les boutons et cartes.
  - Fil d'Ariane intelligent : Affiche le niveau temporel actif avec boutons `← Niveau supérieur` et `Réinitialiser`.

---

### 2. 🗂️ Optimisation & Compactage du Drag & Drop
- **Réduction de la hauteur** : L'interface du sélecteur Drag & Drop est structurée en mode compact horizontal (chips/badges).
- **Accès direct aux résultats sans scroll** : Graphiques et tableau sont directement visibles à l'écran dès la génération.

---

### 3. 📊 Moteur de Données Mock Cohérent (Graphiques & Tableau)
- **Tableau et graphiques 100% synchronisés** : Les valeurs numériques sont immédiatement lisibles grâce à des badges contrastés (`.cell-value-badge`) et évoluent en parfaite synchronisation avec les barres et la courbe d'évolution.

---

### 📋 Guide de test de la hiérarchie temporelle :
| Niveau actuel | Clic sur la barre / ligne | Prochain niveau foré | Tooltip au survol |
| :--- | :--- | :--- | :--- |
| **Entité / Année** | `Exercice 2026` / `Poste comptable` | `1er Trimestre (T1)`, `T2`, `T3`, `T4` | `🔍 Cliquer pour forer : Passer aux Trimestres` |
| **Trimestre** | `1er Trimestre (T1)` | `Janvier`, `Février`, `Mars` | `🔍 Cliquer pour forer : Passer aux Mois` |
| **Mois** | `Mars` | `Semaine 1`, `Semaine 2`, `Semaine 3`, `Semaine 4` | `🔍 Cliquer pour forer : Passer aux Semaines` |
| **Semaine** | `Semaine 1 (01-07)` | `Lundi`, `Mardi`, `Mercredi`, `Jeudi`, `Vendredi` | `🔍 Cliquer pour forer : Passer aux Jours` |
| **Jour** | `Lundi` | `08h00 - 10h00`, `10h00 - 12h00`, etc. | `🔍 Cliquer pour forer : Passer aux Plages horaires` |
