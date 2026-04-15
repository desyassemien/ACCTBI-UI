# Récapitulatif technique : Intégration Keycloak v21

Ce document résume les problèmes rencontrés lors de l'intégration de Keycloak dans le projet ACCTBI-UI et les solutions apportées.

## 1. Problème : Page blanche au démarrage
### Causes
*   **Erreur de compilation** : Une erreur de type dans `kpi-detail.component.html` (accès incorrect à `tableHeaders.length`) empêchait le serveur Angular de démarrer correctement.
*   **Configuration Incomplète** : L'utilisation du mode `check-sso` (SSO silencieux) sans le fichier de support `silent-check-sso.html`.

### Solutions
*   Correction du template HTML pour stabiliser le build.
*   Vérification et activation du fichier `public/silent-check-sso.html`.
*   Configuration de `silentCheckSsoRedirectUri` dans `app.config.ts`.

---

## 2. Problème : Erreur de Provider (NG0201)
### Cause
*   L'utilisation de `withAutoRefreshToken()` dans l'API standalone de la v21 entraînait une erreur car les services internes de rafraîchissement n'étaient pas correctement chargés par la bibliothèque.

### Solution
*   Désactivation temporaire de `withAutoRefreshToken()` pour permettre le bootstrap de l'application.

---

## 3. Problème : Injection de KeycloakService impossible
### Cause
*   Dans Keycloak-Angular v21 (API `provideKeycloak`), le service historique `KeycloakService` est déprécié et n'est plus "fourni" automatiquement. Tenter de l'injecter manuellement créait une "coquille vide" non initialisée, provoquant des erreurs `undefined` lors d'actions comme le `logout()`.

### Solution (Migration API Native)
*   **Abandon du `KeycloakService`** pour les actions directes.
*   **Injection de l'instance native** : Utilisation de `inject(Keycloak)` provenant directement de la bibliothèque `keycloak-js`.
*   **Mise à jour des composants** : Adaptation du `HeaderComponent` pour utiliser l'instance directe pour le profil (`loadUserProfile`) et la déconnexion (`logout`).

---

## 4. Configuration finale stable
Le projet utilise désormais l'API fonctionnelle la plus moderne (Angular 18+ / Keycloak v21) :
*   **Bootstrap** : `provideKeycloak` dans `app.config.ts`.
*   **Sécurité** : `createAuthGuard` dans `auth.guard.ts`.
*   **Composants** : Injection directe de `Keycloak` de `keycloak-js`.

> [!IMPORTANT]
> Pour toute nouvelle injection de Keycloak dans un service ou un composant, privilégiez `private keycloak = inject(Keycloak)` (importé de `keycloak-js`) plutôt que l'ancien `KeycloakService`.
