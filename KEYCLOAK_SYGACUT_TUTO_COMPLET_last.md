# 🎓 Master Guide : Keycloak x Angular 20 (Sygacut-BI)

Ce document est le guide complet pour sécuriser l'application **Sygacut-BI**. Il couvre la configuration du serveur Keycloak ainsi que l'implémentation frontend utilisant les standards modernes d'Angular 20 (approche fonctionnelle, v19+).

## Sommaire
1. [🏗️ Étape 1 : Configuration du Client Keycloak (Console)](#🏗️-étape-1--configuration-du-client-keycloak-console)
   - [1.1. Création du Client](#11-création-du-client)
   - [1.2. Capability Config (Capacités)](#12-capability-config-capacités)
   - [1.3. Login Settings (Paramètres de Connexion)](#13-login-settings-paramètres-de-connexion)
   - [1.4. Création et Attribution des Rôles (RBAC)](#14-création-et-attribution-des-rôles-rbac)
2. [📦 Étape 2 : Installation des Dépendances](#📦-étape-2--installation-des-dépendances)
3. [⚙️ Étape 3 : Configuration Globale (app.config.ts)](#⚙️-étape-3--configuration-globale-appconfigts)
4. [🚦 Étape 4 : Protection des Routes (auth.guard.ts)](#🚦-étape-4--protection-des-routes-authguardts)
5. [🚪 Étape 5 : Actions de Session (Logout)](#🚪-étape-5--actions-de-session-logout)
6. [🎖️ Étape 8 : Gestion des Rôles dans l'Interface (HTML)](#🎖️-étape-8--gestion-des-rôles-dans-linterface-html)
7. [🔃 Étape 9 : Silent Check SSO (Optimisation)](#🔃-étape-9--silent-check-sso-optimisation)
8. [🏁 Cas Pratique : Organisation Sygacut-BI](#🏁-cas-pratique--organisation-sygacut-bi)
   - [1. Configuration côté Keycloak](#1-configuration-côté-keycloak)
   - [2. Configuration dans app.routes.ts](#2-configuration-dans-approutests)
   - [3. Gestion dans l'interface (Sidebar)](#3-gestion-dans-linterface-sidebar)
9. [🏁 Résumé des Avantages](#🏁-résumé-des-avantages)

---

## 🏗️ Étape 1 : Configuration du Client Keycloak (Console)

Avant de toucher au code, vous devez déclarer votre application dans la console Keycloak.

### 1.1. Création du Client
1. Connectez-vous à votre console Keycloak (ex: `http://localhost:8080`).
2. Sélectionnez votre **Realm** (ex: `Sygacut`).
3. Allez dans l'onglet **Clients** et cliquez sur **Create client**.
4. **Client ID** : `sygacut-frontend` (C'est l'identifiant que nous utiliserons dans le code).
5. Cliquez sur **Next**.

### 1.2. Capability Config (Capacités)
1. **Client Authentication** : `Off` (Crucial : définit un client **Public**. Le code Angular étant visible dans le navigateur, il ne peut pas sécuriser de "Client Secret").
2. **Authorization** : `Off`.
3. **Authentication flow** : Cochez **Standard Flow** (pour le login par redirection).
4. Cliquez sur **Next**.

### 1.3. Login Settings (Paramètres de Connexion)
1. **Root URL** : `http://localhost:4200`
2. **Valid Redirect URIs** : `http://localhost:4200/*` (L'URL où Keycloak renvoie l'utilisateur après login).
3. **Valid Post Logout Redirect URIs** : `http://localhost:4200/*` (URL après déconnexion).
4. **Web Origins** : `http://localhost:4200` (Autorise les requêtes CORS d'Angular vers Keycloak).
5. Cliquez sur **Save**.

### 1.4. Création et Attribution des Rôles (RBAC)
Pour que l'accès par rôle fonctionne, vous devez les définir côté serveur :

1. **Créer les Rôles** :
   - Allez dans **Realm Roles** (menu de gauche).
   - Cliquez sur **Create role**.
   - Nommez vos rôles (ex: `ADMIN`, `MANAGER`, `USER`).
2. **Assigner les Rôles aux Utilisateurs** :
   - Allez dans **Users**.
   - Recherchez ou créez un utilisateur.
   - Allez dans l'onglet **Role mapping**.
   - Cliquez sur **Assign role** et sélectionnez le rôle souhaité (ex: `ADMIN`).
3. **Vérification** :
   - Désormais, lorsqu'un utilisateur se connecte, son jeton JWT contiendra une section `realm_access` listant ses rôles. C'est ce que la librairie Angular lira pour autoriser ou non l'accès.

---

## 📦 Étape 2 : Installation des Dépendances

Dans le dossier de votre projet Angular (`sygacut-bi`), lancez la commande suivante :

```bash
npm install keycloak-angular keycloak-js
```

---

## ⚙️ Étape 3 : Configuration Globale (`app.config.ts`)

L'initialisation se fait désormais via le provider `provideKeycloak`. On n'utilise plus de service déprécié ou d'initialiseur manuel complexe.

**Fichier :** `src/app/app.config.ts`

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideKeycloak, includeBearerTokenInterceptor } from 'keycloak-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      // L'intercepteur ajoute automatiquement le token JWT aux requêtes API
      withInterceptors([includeBearerTokenInterceptor])
    ),
    provideKeycloak({
      config: {
        url: 'http://localhost:8080', // URL de votre Keycloak local
        realm: 'Sygacut',             // Votre Realm
        clientId: 'sygacut-frontend'   // Votre Client ID Public
      },
      initOptions: {
        onLoad: 'check-sso',           // Vérifie la session sans forcer le login immédiat
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
      },
      features: {
        bearerTokenInterceptor: {
          enabled: true,
          excludedUrls: ['/assets']    // URLs à ignorer (ex: images statiques)
        }
      }
    })
  ]
};
```

---

## 🚦 Étape 4 : Protection des Routes (`auth.guard.ts`)

Nous créons un "Guard" fonctionnel pour bloquer l'accès aux pages sensibles.

**Fichier :** `src/app/core/guards/auth.guard.ts`

```typescript
import { createAuthGuard } from 'keycloak-angular';

export const authKeycloakGuard = createAuthGuard({
  redirectTo: (route, state) => {
    // Redirection si non authentifié (optionnel si onLoad: 'login-required' est utilisé)
    return ''; 
  },
  canActivate: async (keycloak, route, state) => {
    const authenticated = keycloak.authenticated;
    
    // Si non connecté, on force le login Keycloak
    if (!authenticated) {
      await keycloak.login({
        redirectUri: window.location.origin + state.url
      });
      return false;
    }

    // Gestion des Rôles (RBAC)
    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.every(role => keycloak.hasRealmRole(role));
      if (!hasRole) {
        // Redirigez ici vers une page "unauthorized" si nécessaire
        return false;
      }
    }

    return true;
  }
});
```

**Usage dans `app.routes.ts` :**
Vous pouvez restreindre l'accès à une page entière ou à un groupe de pages (en utilisant des routes enfants).

```typescript
export const routes: Routes = [
  {
    path: 'admin-panel',
    component: AdminComponent,
    canActivate: [authKeycloakGuard],
    data: { roles: ['ADMIN'] } // Seuls les utilisateurs avec le rôle 'ADMIN' peuvent entrer
  },
  {
    path: 'bi-reports',
    component: ReportsComponent,
    canActivate: [authKeycloakGuard],
    data: { roles: ['ADMIN', 'MANAGER'] } // Accessible aux Admis ET aux Managers
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authKeycloakGuard] // Accessible à tout utilisateur connecté (sans rôle spécifique)
  }
];
```

> [!NOTE]
> Si l'utilisateur tente d'accéder à `/admin-panel` sans le rôle `ADMIN`, le Guard retournera `false` et l'utilisateur restera sur sa page actuelle ou sera bloqué.

---

## 🚪 Étape 5 : Actions de Session (Logout)

Pour effectuer des actions (logout, voir le profil), on injecte l'instance Keycloak.

**Fichier :** `src/app/layout/header/header.component.ts`

```typescript
import { Component, inject } from '@angular/core';
import { KEYCLOAK_INSTANCE } from 'keycloak-angular';

@Component({ ... })
export class HeaderComponent {
  private keycloak = inject(KEYCLOAK_INSTANCE);

  async logout() {
    // Déconnexion et redirection vers l'accueil
    await this.keycloak.logout(window.location.origin);
  }
}
```

---

## 🎖️ Étape 8 : Gestion des Rôles dans l'Interface (HTML)

La version v19+ propose une directive très pratique pour masquer des éléments selon les rôles.

```html
<!-- Visible uniquement si l'utilisateur a le rôle ADMIN -->
<div *kaHasRoles="['ADMIN']">
  <button class="btn-delete">Supprimer tout</button>
</div>

<!-- Visible pour ADMIN ou MANAGER -->
<div *kaHasRoles="['ADMIN', 'MANAGER']">
  <a routerLink="/stats">Voir les rapports BI</a>
</div>
```

*Note : N'oubliez pas d'importer `KeycloakElementDirective` dans votre composant.*

---

## 🔃 Étape 9 : Silent Check SSO (Optimisation)

Pour vérifier la session de façon invisible (sans rechargement de page), créez ce fichier :

**Fichier :** `public/silent-check-sso.html`

```html
<html>
<body>
    <script>
        parent.postMessage(location.href, location.origin);
    </script>
</body>
</html>
```

---

## 🏁 Cas Pratique : Organisation Sygacut-BI

Voici comment configurer les accès pour les deux profils que vous avez cités :

### 1. Configuration côté Keycloak
- Créez les rôles suivants dans **Realm Roles** :
  - `DG` (Accès total)
  - `CHEF_COMPTA` (Accès comptabilité)
  - `TRESORIER` (Accès trésorerie)
- **Astuce (Composition de Rôles)** : Vous pouvez faire en sorte que le rôle `DG` "contienne" tous les autres. Dans les paramètres du rôle `DG`, allez dans **Associated Roles**, cliquez sur **Add associated roles** et sélectionnez tous les autres rôles. Ainsi, un DG aura automatiquement tous les droits.

### 2. Configuration dans `app.routes.ts`
Appliquez les rôles de manière granulaire. Si le DG doit tout voir, il doit être présent dans la liste `roles` de chaque route.

```typescript
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authKeycloakGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component'),
        data: { roles: ['DG', 'MANAGER'] } // Le DG et les managers voient le dashboard
      },
      {
        path: 'comptabilite',
        loadComponent: () => import('./features/comptabilite/comptabilite.component'),
        data: { roles: ['DG', 'CHEF_COMPTA'] } // Le DG ET le Chef Compta y ont accès
      },
      {
        path: 'tresorerie',
        loadComponent: () => import('./features/tresorerie/tresorerie.component'),
        data: { roles: ['DG', 'TRESORIER'] } // Le DG ET le Trésorier y ont accès
      },
      {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin.component'),
        data: { roles: ['DG'] } // Seul le DG peut accéder à la partie Admin
      }
    ]
  }
];
```

### 3. Gestion dans l'interface (Sidebar)
Si vous avez une Sidebar (menu latéral), utilisez la directive `*kaHasRoles` pour masquer les liens auxquels l'utilisateur n'a pas droit.

```html
<!-- Menu Comptabilité -->
<li *kaHasRoles="['DG', 'CHEF_COMPTA']">
  <a routerLink="/comptabilite">Comptabilité</a>
</li>

<!-- Menu Trésorerie -->
<li *kaHasRoles="['DG', 'TRESORIER']">
  <a routerLink="/tresorerie">Trésorerie</a>
</li>
```

---

## 🏁 Résumé des Avantages
1. **Zéro dépréciation** : Utilise les dernières APIs Angular et Keycloak-Angular.
2. **Léger** : Approche fonctionnelle sans classes de services lourdes.
3. **Sécurisé** : Gestion automatique des tokens via l'intercepteur intégré.
