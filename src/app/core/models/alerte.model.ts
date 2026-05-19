export interface Alerte {
    id: string;
    type: 'DANGER' | 'WARNING' | 'INFO';
    service: string;
    titre: string;
    description: string;
    dateEcheance?: Date;
    montant?: number;
    routeAction: string;
    lue: boolean;
    dateCreation: Date;
}
