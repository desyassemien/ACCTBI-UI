import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideKeycloak,
  includeBearerTokenInterceptor,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  KeycloakService
} from 'keycloak-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Initialisation de Keycloak
    provideKeycloak({
      config: {
        url: 'http://localhost:8080',
        realm: 'projetBi',
        clientId: 'acctBI-front'
      },
      initOptions: {
        onLoad: 'check-sso',
        checkLoginIframe: false,
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
      }
    }),

    // 2. Ajout explicite du service (pour compatibilité avec les composants injectants KeycloakService)
    KeycloakService,

    // 3. Core Angular providers
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),

    // 4. Configuration de l'intercepteur
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [
        {
          urlPattern: /^((?!assets).)*$/i,
          httpMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        }
      ]
    },

    provideHttpClient(
      withInterceptors([includeBearerTokenInterceptor])
    )
  ]
};
