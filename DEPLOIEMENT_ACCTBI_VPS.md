# 🚀 Déploiement ACCTBI sur VPS 162.215.172.50 — Récapitulatif & Guide Complet

**Date :** 22 Mai 2026  
**Serveur :** VPS CentOS 7 — `162.215.172.50`  
**Technologies :** Angular 20, Keycloak 26.0, PostgreSQL 16, Docker Compose, Nginx  
**Realm Keycloak :** `projetBi`  
**Client Keycloak :** `acctBI-front`

---

## 📋 PARTIE 1 — Récapitulatif de ce qui a été fait

### 1.1. Infrastructure Docker (PostgreSQL + Keycloak)

| Élément | Détail |
|---|---|
| **Dossier projet sur le VPS** | `/opt/acctbi` |
| **Fichier Docker Compose** | `/opt/acctbi/docker-compose.yml` |
| **PostgreSQL** | Image `postgres:16-alpine`, conteneur `postgres_acctbi`, DB : `keycloak`, user : `postgres`, pwd : `2056` |
| **Keycloak** | Image `quay.io/keycloak/keycloak:26.0`, conteneur `keycloak_acctbi`, mode `start-dev` |
| **Réseau Docker** | `acctbi_network` (bridge) |
| **Volume persistant** | `postgres_data` monté sur `/var/lib/postgresql/data` |
| **Port Keycloak** | `8080` (exposé publiquement) |

**Fichier `docker-compose.yml` déployé :**

```yaml
version: '3.8'

services:
  postgres_acctbi:
    image: postgres:16-alpine
    container_name: postgres_acctbi
    restart: always
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: "2056"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - acctbi_network

  keycloak_acctbi:
    image: quay.io/keycloak/keycloak:26.0
    container_name: keycloak_acctbi
    restart: always
    command: start-dev
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres_acctbi:5432/keycloak
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: "2056"
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_HOSTNAME: 162.215.172.50
      KC_PROXY_HEADERS: xforwarded
      KC_HTTP_ENABLED: "true"
    depends_on:
      - postgres_acctbi
    ports:
      - "8080:8080"
    networks:
      - acctbi_network

volumes:
  postgres_data:
    driver: local

networks:
  acctbi_network:
    driver: bridge
```

### 1.2. Configuration Keycloak effectuée

- ✅ Conteneurs `postgres_acctbi` et `keycloak_acctbi` lancés et fonctionnels
- ✅ Console d'administration Keycloak accessible sur `http://162.215.172.50:8080`
- ✅ Realm `projetBi` exporté depuis le Keycloak local (Partial Export avec clients et rôles)
- ⚠️ **Import du Realm `projetBi`** : Des problèmes de compatibilité de version ont été rencontrés lors de l'import du fichier `projetBi-realm.json` (migration Keycloak 24 → 26.0). Le realm doit être ré-importé ou reconfiguré manuellement.
- ✅ Client `acctBI-front` configuré (visible dans la console admin)

### 1.3. Préparation de l'application Angular (côté local)

- ✅ Réinstallation de `keycloak-js` et `keycloak-angular` (avec `--legacy-peer-deps`)
- ✅ Réintégration de Keycloak dans : `app.config.ts`, `auth.service.ts`, `header.component.ts`, `sidebar.component.ts`, `profil.component.ts`
- ✅ Restauration des guards Keycloak (`auth.guard.ts`, `role-redirect.guard.ts`)
- ✅ Restauration complète du Dashboard premium (animations Pop & Stagger, shimmer, KPI par service, Flatpickr, etc.)
- ✅ Compilation de production validée (`npx ng build --configuration production`)
- ✅ Code poussé sur GitHub (branche `branche_daphne`, commit `3c237ee`)

### 1.4. Configuration Nginx prévue

- ✅ Fichier de configuration Nginx créé : `/etc/nginx/conf.d/acctbi.conf`
- ✅ Port choisi pour ACCTBI : **`8081`** (pour éviter le conflit avec le port `4200` déjà utilisé)
- ✅ Dossier de déploiement Angular : `/opt/acctbi/angular-dist`

### 1.5. Ce qui fonctionne actuellement

| Service | URL | Statut |
|---|---|---|
| Keycloak Admin Console | `http://162.215.172.50:8080` | ✅ En ligne |
| PostgreSQL (interne Docker) | Port 5432 (interne) | ✅ Fonctionnel |
| Application Angular (VPS) | `http://162.215.172.50:8081` | ❌ **Pas encore déployée** |

### 1.6. Problèmes rencontrés et résolus

| Problème | Cause | Solution appliquée |
|---|---|---|
| Erreur `EPERM: operation not permitted` au serve | Cache `.angular` verrouillé par un processus | `Remove-Item -Recurse -Force .angular` + relance |
| Imports `xlsx`, `jspdf` manquants (branche `aicha`) | Changement de branche sans réinstaller les deps | `npm install --legacy-peer-deps` |
| Incompatibilité realm export Keycloak 24 → 26 | Format JSON du realm incompatible entre versions | Nécessite recréation manuelle ou ajustement du JSON |
| Rôles/identifiants codés en dur | Projet écrasé par un `git clone` (perte des modifs locales) | Restauration depuis l'historique git (commit `c215d15`) |

---

## 📋 PARTIE 2 — Étapes restantes pour un déploiement propre et sans conflits

> [!IMPORTANT]
> Un autre projet Angular tourne déjà sur le port **4200** du VPS. Toutes les étapes ci-dessous sont conçues pour **zéro conflit** avec cette application existante.

---

### Étape 1 : Vérifier l'état actuel du VPS

```bash
# Se connecter au VPS
ssh root@162.215.172.50

# Vérifier que Docker est bien installé et actif
docker --version
docker compose version

# Vérifier que les conteneurs ACCTBI tournent
cd /opt/acctbi
docker compose ps

# Vérifier les ports occupés (pour détecter les conflits)
ss -tlnp | grep -E '(4200|8080|8081|80|443)'

# Vérifier que Nginx est installé et actif
nginx -v
systemctl status nginx
```

> [!WARNING]
> Si `docker compose ps` ne montre pas `postgres_acctbi` et `keycloak_acctbi` comme **Up**, relancer avec :
> ```bash
> docker compose up -d --force-recreate
> docker compose logs -f keycloak_acctbi
> ```

---

### Étape 2 : Configurer le Realm Keycloak sur le serveur

**Option A — Import du realm (si le fichier JSON est compatible) :**

```bash
# Depuis votre machine locale, copier le fichier realm vers le VPS
scp projetBi-realm.json root@162.215.172.50:/opt/acctbi/

# Sur le VPS, importer via l'API Admin de Keycloak
curl -X POST "http://162.215.172.50:8080/admin/realms" \
  -H "Authorization: Bearer $(curl -s -X POST 'http://162.215.172.50:8080/realms/master/protocol/openid-connect/token' \
    -d 'grant_type=password&client_id=admin-cli&username=admin&password=admin' | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')" \
  -H "Content-Type: application/json" \
  -d @/opt/acctbi/projetBi-realm.json
```

**Option B — Recréation manuelle (recommandée si l'import échoue) :**

1. Aller sur `http://162.215.172.50:8080/admin`
2. Se connecter avec `admin` / `admin`
3. Créer le Realm `projetBi`
4. Créer le Client `acctBI-front` :
   - **Client type** : OpenID Connect
   - **Client ID** : `acctBI-front`
   - **Root URL** : `http://162.215.172.50:8081`
   - **Valid Redirect URIs** : `http://162.215.172.50:8081/*`
   - **Web Origins** : `http://162.215.172.50:8081`
   - **Client authentication** : Off (public client)
   - **Standard flow** : Enabled
   - **Direct access grants** : Enabled
5. Créer les rôles dans le realm : `ADMIN`, `USER`, etc.
6. Créer un utilisateur test et lui assigner les rôles

---

### Étape 3 : Préparer le fichier `environment.prod.ts`

> [!IMPORTANT]
> Le fichier `app.config.ts` actuel pointe vers `localhost:8080`. Il faut créer/modifier le fichier d'environnement de production pour pointer vers l'IP du VPS.

**Sur votre machine locale**, créer ou modifier `src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  keycloak: {
    url: 'http://162.215.172.50:8080',
    realm: 'projetBi',
    clientId: 'acctBI-front'
  }
};
```

**Puis modifier `app.config.ts`** pour utiliser cet environnement dynamiquement :

```typescript
import { environment } from '../environments/environment';

// Dans provideKeycloak :
provideKeycloak({
  config: {
    url: environment.keycloak.url,     // 'http://162.215.172.50:8080' en prod
    realm: environment.keycloak.realm,  // 'projetBi'
    clientId: environment.keycloak.clientId  // 'acctBI-front'
  },
  initOptions: {
    onLoad: 'check-sso',
    checkLoginIframe: false,
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
  }
}),
```

> [!TIP]
> Si vous n'utilisez pas encore le pattern `environment.ts` / `environment.prod.ts`, vous pouvez aussi simplement remplacer `localhost:8080` par `162.215.172.50:8080` dans `app.config.ts` avant le build de production.

---

### Étape 4 : Compiler l'application Angular pour la production

```bash
# Sur votre machine locale, dans le dossier du projet
cd c:\projet_acctbi\ACCTBI-UI

# S'assurer d'être sur la bonne branche
git branch
# Doit afficher : * branche_daphne

# Compiler pour la production
npx ng build --configuration production
```

Le build sera généré dans `dist/sygacut-bi/browser/` (ou un dossier similaire selon votre configuration Angular).

---

### Étape 5 : Transférer les fichiers compilés vers le VPS

```bash
# Créer le dossier de destination sur le VPS (si pas déjà fait)
ssh root@162.215.172.50 "mkdir -p /opt/acctbi/angular-dist"

# Nettoyer l'ancien contenu (si existant)
ssh root@162.215.172.50 "rm -rf /opt/acctbi/angular-dist/*"

# Transférer les fichiers compilés
scp -r ./dist/sygacut-bi/browser/* root@162.215.172.50:/opt/acctbi/angular-dist/
```

> [!NOTE]
> Adaptez le chemin `dist/sygacut-bi/browser/` en fonction du nom exact du dossier généré par votre build Angular. Vérifiez avec `ls dist/` après la compilation.

---

### Étape 6 : Configurer Nginx (port 8081 — ZÉRO conflit)

> [!CAUTION]
> **NE PAS toucher** aux fichiers Nginx existants qui servent l'autre projet sur le port 4200 ou le port 80. Créez UNIQUEMENT un nouveau fichier de configuration dédié.

Sur le VPS :

```bash
sudo nano /etc/nginx/conf.d/acctbi.conf
```

Contenu du fichier :

```nginx
server {
    listen 8081;
    server_name 162.215.172.50;

    root /opt/acctbi/angular-dist;
    index index.html;

    # Support du routing Angular (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache des assets statiques (6 mois)
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg|webp)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public";
    }

    # Logs dédiés à ACCTBI
    access_log /var/log/nginx/acctbi_access.log;
    error_log /var/log/nginx/acctbi_error.log;
}
```

Valider et appliquer :

```bash
# Tester la syntaxe Nginx
sudo nginx -t

# Si le test est OK, recharger Nginx SANS couper les autres sites
sudo systemctl reload nginx
```

---

### Étape 7 : Ouvrir le port 8081 dans le pare-feu

```bash
# Vérifier si le port est déjà ouvert
sudo firewall-cmd --list-ports

# Si 8081 n'apparaît pas, l'ouvrir
sudo firewall-cmd --permanent --add-port=8081/tcp
sudo firewall-cmd --reload

# Vérifier
sudo firewall-cmd --list-ports
```

---

### Étape 8 : Vérification finale

```bash
# 1. Vérifier que les conteneurs Docker tournent
cd /opt/acctbi
docker compose ps

# 2. Vérifier que Nginx sert bien l'application
curl -I http://162.215.172.50:8081

# 3. Vérifier que Keycloak est accessible
curl -I http://162.215.172.50:8080

# 4. Tester dans un navigateur
# → http://162.215.172.50:8081   (Application ACCTBI)
# → http://162.215.172.50:8080   (Console Keycloak)
```

---

### Étape 9 : Créer le fichier `silent-check-sso.html`

Ce fichier est requis par Keycloak pour le mode `check-sso` (vérification silencieuse de la session). Il doit exister dans le dossier racine de l'application Angular déployée.

```bash
# Sur le VPS, créer le fichier
cat > /opt/acctbi/angular-dist/silent-check-sso.html << 'EOF'
<html>
<body>
<script>
  parent.postMessage(location.href, location.origin);
</script>
</body>
</html>
EOF
```

---

## 📋 PARTIE 3 — Résumé des ports et services

| Service | Port | Usage | Conflit ? |
|---|---|---|---|
| **Autre projet Angular (existant)** | `4200` | Application tierce déjà en production | ⛔ Ne pas toucher |
| **Nginx (HTTP)** | `80` | Potentiellement utilisé par l'autre projet | ⛔ Ne pas toucher |
| **ACCTBI Angular** | **`8081`** | Notre application frontend | ✅ Port libre et dédié |
| **Keycloak** | `8080` | Authentification & gestion des identités | ✅ Déjà configuré |
| **PostgreSQL** | `5432` (interne Docker) | Base de données Keycloak | ✅ Non exposé |

---

## 📋 PARTIE 4 — Commandes d'administration quotidienne

| Objectif | Commande |
|---|---|
| Démarrer l'infra Docker | `cd /opt/acctbi && docker compose up -d` |
| Arrêter l'infra Docker | `cd /opt/acctbi && docker compose down` |
| Consulter les logs Keycloak | `docker compose logs -f keycloak_acctbi` |
| Sauvegarder la BDD | `docker exec -t postgres_acctbi pg_dump -U postgres keycloak > backup_$(date +%F).sql` |
| Recharger Nginx | `sudo systemctl reload nginx` |
| Statut des conteneurs | `docker compose ps` |
| Redéployer l'Angular (après un nouveau build) | `scp -r ./dist/sygacut-bi/browser/* root@162.215.172.50:/opt/acctbi/angular-dist/` |
| Voir les logs Nginx ACCTBI | `tail -f /var/log/nginx/acctbi_error.log` |

---

## 📋 PARTIE 5 — Checklist de déploiement

- [ ] **VPS** : Vérifier que Docker et Nginx sont actifs
- [ ] **Docker** : Vérifier que `postgres_acctbi` et `keycloak_acctbi` sont **Up**
- [ ] **Keycloak** : Importer/configurer le realm `projetBi` avec le client `acctBI-front`
- [ ] **Keycloak** : Configurer les **Valid Redirect URIs** → `http://162.215.172.50:8081/*`
- [ ] **Keycloak** : Configurer les **Web Origins** → `http://162.215.172.50:8081`
- [ ] **Local** : Modifier `app.config.ts` (ou `environment.prod.ts`) pour pointer vers `162.215.172.50:8080`
- [ ] **Local** : Compiler avec `npx ng build --configuration production`
- [ ] **Local** : Transférer le build vers `/opt/acctbi/angular-dist/` via `scp`
- [ ] **VPS** : Créer `silent-check-sso.html` dans `/opt/acctbi/angular-dist/`
- [ ] **VPS** : Configurer `/etc/nginx/conf.d/acctbi.conf` sur le port `8081`
- [ ] **VPS** : Tester Nginx (`nginx -t`) puis recharger (`systemctl reload nginx`)
- [ ] **VPS** : Ouvrir le port `8081` dans `firewalld`
- [ ] **Navigateur** : Tester `http://162.215.172.50:8081` — connexion Keycloak + affichage dashboard
- [ ] **Git** : S'assurer d'être sur la branche `branche_daphne` avant tout déploiement

---

> [!TIP]
> **Workflow de redéploiement rapide après modifications :**
> ```bash
> # 1. Sur la machine locale
> cd c:\projet_acctbi\ACCTBI-UI
> git checkout branche_daphne
> npx ng build --configuration production
> scp -r ./dist/sygacut-bi/browser/* root@162.215.172.50:/opt/acctbi/angular-dist/
>
> # 2. Sur le VPS (optionnel, Nginx ne nécessite pas de reload pour les fichiers statiques)
> # Rien à faire ! Les fichiers sont servis directement.
> ```
