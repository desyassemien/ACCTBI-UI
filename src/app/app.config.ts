import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { 
  provideKeycloak, 
  includeBearerTokenInterceptor, 
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  KeycloakService 
} from 'keycloak-angular';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Initialisation de Keycloak (Priorité sécurité)
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

    // 2. Compatibilité KeycloakService
    KeycloakService,

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

    // 5. Configuration de l'intercepteur & HTTP
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
