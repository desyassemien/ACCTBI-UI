import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

@Component({
    selector: 'app-gestion-compte',
    standalone: true,
    imports: [CommonModule, FormsModule, AnalyseSelectorComponent],
    templateUrl: './gestion-compte.component.html',
    styleUrl: './gestion-compte.component.scss'
})
export class GestionCompteComponent {

    // Placeholder data for the component
    currentFilters = {
        periode: 'Ce Mois-ci',
        indicateurs: 'Taux exécution, Mandats rejetés',
        axes: 'Bailleur'
    };

    // Selected period state to trigger custom date picker
    selectedPeriod: string = 'Ce mois-ci';

    // Chart specific state
    cgChart1Type: string = 'bar';
    cgChart2Type: string = 'line';

    // Drag & Drop specific state aligned with Section 2.4
    isDragDropMode = false;

    availableIndicators = [
        'Taux absorption crédits',
        'Écart LFI/LFR',
        'Délai moyen mandatement',
        'Montant moyen par mandat',
        'Taux imputations provisoires',
        'Taux imputations sans pièce',
        'Délai moyen régularisation',
        'Taux disponibilités bloquées'
    ];
    selectedIndicators = [
        'Taux exécution des crédits',
        'Taux mandats rejetés',
        'Délai moyen paiement'
    ];

    availableAxes = [
        'Ministère',
        'Chapitre',
        'Article',
        'Compte',
        'Région',
        'Type opération',
        'Qualité imputation'
    ];
    selectedAxes = ['Bailleur (SODE, EPN, COLLECTIVIT2)'];

    toggleMode(mode: 'classic' | 'dragdrop') {
        this.isDragDropMode = mode === 'dragdrop';
    }

    kpis = [
        { titre: 'Taux Exécution Crédits', valeur: '87.2%', info: 'Seuil 85-98%', type: 'success' },
        { titre: 'Taux Absorption Crédits', valeur: '91.3%', info: 'T-2: > 90%', type: 'success' },
        { titre: 'Taux Mandats Rejetés', valeur: '3.5%', info: 'Seuil < 5%', type: 'primary' },
        { titre: 'Délai Moy. Mandatement', valeur: '7.8 Jours', info: 'Objectif < 10j', type: 'success' }
    ];

}
