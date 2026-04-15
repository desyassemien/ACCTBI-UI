import { createAuthGuard } from 'keycloak-angular';
import { inject } from '@angular/core';
import { type ActivatedRouteSnapshot, type RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AlertService } from '../services/alert.service';

export const authKeycloakGuard = createAuthGuard(
    async (
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot,
        { keycloak, authenticated }
    ): Promise<boolean | UrlTree> => {
        const alertService = inject(AlertService);

        // Si l'utilisateur n'est pas authentifié, on force le login Keycloak
        if (!authenticated) {
            await keycloak.login({
                redirectUri: window.location.origin + state.url
            });
            return false;
        }

        // Gestion des Rôles (RBAC)
        const requiredRoles = route.data['roles'] as string[];
        if (requiredRoles && requiredRoles.length > 0) {
            const hasRole = requiredRoles.some((role) => keycloak.hasRealmRole(role));
            
            if (!hasRole) {
                console.warn(`[AuthGuard] Accès refusé à ${state.url}. Rôles requis:`, requiredRoles);
                // Déclenchement de l'alerte visuelle et maintien sur la page
                alertService.showAccessDenied();
                return false;
            }
        }

        return true;
    }
);