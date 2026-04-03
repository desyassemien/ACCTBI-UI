import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

@Component({
    selector: 'app-comptabilite',
    standalone: true,
    imports: [CommonModule, FormsModule, AnalyseSelectorComponent],
    templateUrl: './comptabilite.component.html',
    styleUrl: './comptabilite.component.scss'
})
export class ComptabiliteComponent {

    // Placeholder data for the component
    currentFilters = {
        periode: 'Ce Mois-ci',
        indicateurs: 'Solde BCEAO, Écart CCB',
        axes: 'Nature opération'
    };

    // Selected period state to trigger custom date picker
    selectedPeriod: string = 'Ce mois-ci';

    // Chart specific state
    compChart1Type: string = 'pie';
    compChart2Type: string = 'bar';

    // Drag & Drop specific state aligned with Section 2.4
    isDragDropMode = false;

    availableIndicators = [
        'Vol. imputations provisoires',
        'Ancienneté moy. imputations',
        'Répartition recettes par nature',
        'Taux de collecte TVA'
    ];
    selectedIndicators = [
        'Taux rapprochement auto',
        'Délai moyen rapprochement',
        'Écart concordance BCEAO/ACCT'
    ];

    availableAxes = [
        'Poste comptable',
        'Agence',
        'Type opération',
        'Nature impôt',
        'Contribuable',
        'Région',
        'Taux erreur'
    ];
    selectedAxes = ['Date (Jour/Mois/Exercice)'];

    toggleMode(mode: 'classic' | 'dragdrop') {
        this.isDragDropMode = mode === 'dragdrop';
    }

    kpis = [
        { titre: 'Taux Rapprochement Auto', valeur: '92.4%', info: 'Seuil > 85%', type: 'success' },
        { titre: 'Délai Moy. Rapprochement', valeur: '1.2 Jours', info: 'Objectif < 3j', type: 'success' },
        { titre: 'Écart BCEAO/ACCT', valeur: '0.04%', info: 'Seuil < 0.1%', type: 'primary' },
        { titre: 'Taux de Régularisation', valeur: '88.5%', info: 'Seuil > 90%', type: 'warning' }
    ];

}
