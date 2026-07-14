import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { 
  provideKeycloak, 
  includeBearerTokenInterceptor, 
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  KeycloakService 
} from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

const keycloakProviders = environment.useKeycloak ? [
  // 1. Initialisation de Keycloak (Priorité sécurité)
  provideKeycloak({
    config: {
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId
    },
    initOptions: {
      onLoad: 'check-sso',
      checkLoginIframe: false,
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
    }
  }),

  // 2. Compatibilité KeycloakService
  KeycloakService,

  // 5. Configuration de l'intercepteur & HTTP
  {
    provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
    useValue: [
      {
        urlPattern: /^((?!assets).)*$/i,
        httpMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      }
    ]
  }
] : [
  {
    provide: KeycloakService,
    useValue: {
      isLoggedIn: () => true,
      loadUserProfile: async () => ({
        username: 'dev_user',
        firstName: 'Dev',
        lastName: 'User',
        email: 'dev@local.host'
      }),
      logout: () => { window.location.href = '/login'; },
      getToken: async () => 'mock-token'
    }
  },
  {
    provide: Keycloak,
    useValue: {
      authenticated: true,
      realmAccess: { roles: ['ADMIN', 'CHEF_COMPTA', 'CHEF_TRESORERIE', 'CHEF_REGIE'] },
      resourceAccess: {},
      clientId: 'acctBI-front',
      hasRealmRole: () => true,
      hasResourceRole: () => true,
      login: async () => {},
      logout: async () => { window.location.href = '/login'; },
      loadUserProfile: async () => ({
        username: 'dev_user',
        firstName: 'Dev',
        lastName: 'User',
        email: 'dev@local.host'
      })
    }
  }
];

export const appConfig: ApplicationConfig = {
  providers: [
    ...keycloakProviders,

    // 3. Core Angular providers
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),

    // 4. Graphiques & PWA (Nouveautés Diguinan)
    provideCharts(withDefaultRegisterables()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),

    ...(environment.useKeycloak ? [
      provideHttpClient(
        withInterceptors([includeBearerTokenInterceptor])
      )
    ] : [
      provideHttpClient()
    ])
  ]
};
