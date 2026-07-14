import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';

export const roleRedirectGuard: CanActivateFn = async () => {
  const router = inject(Router);

  if (!environment.useKeycloak) {
    return router.parseUrl('/dashboard');
  }

  const keycloak = inject(Keycloak);

  console.log('[RoleRedirectGuard] Initialisation du guard...');

  // Si non authentifié, on ne fait rien (le guard parent gère le login)
  if (!keycloak.authenticated) {
    console.log('[RoleRedirectGuard] Utilisateur non authentifié, arrêt.');
    return true;
  }

  // Récupération globale des rôles (Realm + Resource)
  const realmRoles = keycloak.realmAccess?.roles || [];
  const clientRoles = keycloak.resourceAccess?.[keycloak.clientId || '']?.roles || [];
  const allRoles = [...realmRoles, ...clientRoles];

  console.log('[RoleRedirectGuard] Rôles détectés :', allRoles);

  // Logique de priorité des redirections
  if (allRoles.includes('ADMIN')) {
    console.log('[RoleRedirectGuard] Redirection vers /dashboard (ADMIN)');
    return router.parseUrl('/dashboard');
  } 
  
  if (allRoles.includes('CHEF_COMPTA')) {
    console.log('[RoleRedirectGuard] Redirection vers /comptabilite (CHEF_COMPTA)');
    return router.parseUrl('/comptabilite');
  } 
  
  if (allRoles.includes('CHEF_TRESORERIE')) {
    console.log('[RoleRedirectGuard] Redirection vers /tresorerie (CHEF_TRESORERIE)');
    return router.parseUrl('/tresorerie');
  } 
  
  if (allRoles.includes('CHEF_REGIE')) {
    console.log('[RoleRedirectGuard] Redirection vers /regies (CHEF_REGIE)');
    return router.parseUrl('/regies');
  }

  // Destination par défaut pour les autres rôles authentifiés
  console.log('[RoleRedirectGuard] Redirection par défaut vers /dashboard');
  return router.parseUrl('/dashboard');
};
