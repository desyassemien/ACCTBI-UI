import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

@Component({
    selector: 'app-regies',
    standalone: true,
    imports: [CommonModule, FormsModule, AnalyseSelectorComponent],
    templateUrl: './regies.component.html',
    styleUrl: './regies.component.scss'
})
export class RegiesComponent {

    // Placeholder data for the component
    currentFilters = {
        periode: 'Ce Mois-ci',
        indicateurs: 'Recettes perçues, Taux Rotation',
        axes: 'Organisationnel'
    };

    // Selected period state to trigger custom date picker
    selectedPeriod: string = 'Ce mois-ci';

    // Chart specific state
    compChart1Type: string = 'bar';
    compChart2Type: string = 'line';

    // Drag & Drop specific state aligned with Section 5.4
    isDragDropMode = false;

    availableIndicators = [
        'Taux de rotation des fonds',
        'Délai moyen de remise',
        'Taux de régies auditées',
        'Montant moyen des dépenses'
    ];
    selectedIndicators = [
        'Recettes perçues (Régies)',
        'Nombre de régies actives',
        'Taux de chèques impayés'
    ];

    availableAxes = [
        'Régisseur',
        'Type de régie',
        'Direction locale',
        'Région géographique',
        'Nature recette',
        'Type dépense'
    ];
    selectedAxes = ['Ministère / Organisation'];

    toggleMode(mode: 'classic' | 'dragdrop') {
        this.isDragDropMode = mode === 'dragdrop';
    }

    kpis = [
        { titre: 'Régies Actives', valeur: '142', info: 'Total national', type: 'primary' },
        { titre: 'Recettes Perçues', valeur: '4.8 Milliards', info: 'FCFA - Trimestre', type: 'success' },
        { titre: 'Taux Chèques Impayés', valeur: '1.2%', info: 'Seuil < 2%', type: 'success' },
        { titre: 'Rotation des Fonds', valeur: '12.5 Jours', info: 'Objectif < 15j', type: 'success' }
    ];

    // Mock Deliverables aligned with Section 5.5
    deliverables = [
        { ref: 'REG-2026-001', regisseur: 'M. Diallo I.', ministere: 'Santé', localite: 'Abidjan', solde: '12 500 000', statut: 'Validé' },
        { ref: 'REG-2026-005', regisseur: 'Mme. Kouassi A.', ministere: 'Éducation', localite: 'Yamoussoukro', solde: '5 200 000', statut: 'En cours' },
        { ref: 'REG-2026-008', regisseur: 'M. Traoré B.', ministere: 'Défense', localite: 'Bouaké', solde: '28 000 000', statut: 'Audit requis' },
        { ref: 'REG-2026-012', regisseur: 'Mme. Sylla F.', ministere: 'Finance', localite: 'San-Pedro', solde: '2 150 000', statut: 'Validé' }
    ];
}
