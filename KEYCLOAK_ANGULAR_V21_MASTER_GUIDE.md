# 🚀 Master Guide : Keycloak x Angular v21 (Version PRO / Sygacut-BI)

Ce guide récapitule la configuration **parfaite** et sans erreurs pour intégrer Keycloak dans une application Angular moderne. Il corrige les limitations classiques des anciennes versions et documente les solutions aux erreurs de routage rencontrées.

## 📌 Sommaire
1. [🏗️ Architecture & Injection (v21)](#1-architecture--injection-v21)
2. [🚦 Guard d'Accès : La Logique "OU"](#2-guard-daccès--la-logique-ou)
3. [⚡ Redirection Intelligente Post-Login](#3-redirection-intelligente-post-login)
4. [🛠️ Résolution du bug NG04014 (Route Racine)](#4-résolution-du-bug-ng04014-route-racine)
5. [🖥️ Gestion UI : Le Modal d'Accès Refusé](#5-gestion-ui--le-modal-daccès-refusé)

---

## 1. Architecture & Injection (v21)

Dans la version 21, on abandonne `KeycloakService` au profit de l'instance native `Keycloak` de `keycloak-js`.

### Configuration (`app.config.ts`)
```typescript
provideKeycloak({
  config: {
    url: 'http://localhost:8080',
    realm: 'VOTRE_REALM',
    clientId: 'VOTRE_CLIENT_ID'
  },
  initOptions: {
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
  }
})
```

---

## 2. Guard d'Accès : La Logique "OU"

**Le Piège :** Utiliser `.every()` oblige l'utilisateur à avoir TOUS les rôles. 
**La Solution :** Utiliser `.some()` pour permettre l'accès si l'utilisateur possède au moins UN des rôles listés.

```typescript
// src/app/core/guards/auth.guard.ts
export const authKeycloakGuard = createAuthGuard(
    async (route, state, { keycloak, authenticated }) => {
        if (!authenticated) {
            await keycloak.login({ redirectUri: window.location.origin + state.url });
            return false;
        }

        const requiredRoles = route.data['roles'] as string[];
        if (requiredRoles?.length > 0) {
            // ✅ Utiliser 'some' pour la logique OR (flexible)
            const hasRole = requiredRoles.some((role) => keycloak.hasRealmRole(role));
            if (!hasRole) {
                inject(AlertService).showAccessDenied(); // Popup au lieu de redirect
                return false;
            }
        }
        return true;
    }
);
```

---

## 3. Redirection Intelligente Post-Login

Pour rediriger l'utilisateur vers son service métier (Compta, Trésorerie, etc.) dès la connexion :

```typescript
// src/app/core/guards/role-redirect.guard.ts
export const roleRedirectGuard: CanActivateFn = async () => {
  const keycloak = inject(Keycloak); // Instance native v21
  const allRoles = [...(keycloak.realmAccess?.roles || []), ...(keycloak.resourceAccess?.[keycloak.clientId || '']?.roles || [])];

  if (allRoles.includes('ADMIN')) return inject(Router).parseUrl('/dashboard');
  if (allRoles.includes('CHEF_COMPTA')) return inject(Router).parseUrl('/comptabilite');
  // ...
  return inject(Router).parseUrl('/dashboard');
};
```

---

## 4. Résolution du bug NG04014 (Route Racine)

**Le Problème :** Angular refuse une route qui n'a qu'un Guard sans composant ni redirection statique.
**L'Erreur :** `RuntimeError: NG04014: Invalid configuration of route ''`.

**La Solution :** Toujours assigner un `loadComponent` par défaut. Le Guard s'occupera de la redirection réelle avant que le composant ne soit rendu.

```typescript
// app.routes.ts
{
    path: '', 
    component: MainLayoutComponent,
    canActivateChild: [authKeycloakGuard],
    children: [
        {
            path: '', 
            // ✅ Obligatoire pour éviter NG04014
            loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
            canActivate: [roleRedirectGuard], 
            pathMatch: 'full'
        }
    ]
}
```

---

## 5. Gestion UI : Le Modal d'Accès Refusé

Pour éviter de perdre le contexte de travail de l'utilisateur lors d'un refus d'accès.

1. **Service d'Alerte** : Un simple `signal` pour gérer la visibilité.
2. **Layout Global** : Un modal avec `backdrop-filter: blur(8px)` placé dans `main-layout.component.html`.
3. **Guard** : Appelle `alertService.showAccessDenied()` et retourne `false`.

---

## 🏁 Golden Rules pour le futur
1. **Toujours injecter `Keycloak`** (provenant de `keycloak-js`) dans les Guards fonctionnels.
2. **Vérifier les rôles Client** (`resourceAccess`) en plus des rôles Realm.
3. **Restaurez toujours la route `**`** à la fin de votre fichier de routage.
4. **Utilisez `canActivateChild`** sur les layouts pour propager la sécurité sans répétition.
