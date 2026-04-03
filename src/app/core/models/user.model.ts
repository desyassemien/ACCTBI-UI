export type Role = 'DIRECTEUR' | 'FONDE_POUVOIR' | 'CHEF_SERVICE' | 'AGENT';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  role: Role;
  service: string;
}
