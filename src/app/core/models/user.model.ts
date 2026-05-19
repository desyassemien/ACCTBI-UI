export type Role = 'DIRECTEUR' | 'FONDE_POUVOIR' | 'CHEF_SERVICE' | 'AGENT' | 'ADMIN' | 'CHEF_COMPTA' | 'CHEF_TRESORERIE' | 'CHEF_REGIE';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  role: Role;
  service: string;
}
