export interface KpiCard {
    id: string;
    titre: string;
    valeur: number | string;
    unite: 'FCFA' | 'PERCENT' | 'NOMBRE' | '';
    tendance?: 'up' | 'down' | 'neutral';
    variation?: number;
    cible?: number;
    couleur: string;
    icone: string;
}
