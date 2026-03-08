import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-comptabilite',
    standalone: true,
    imports: [CommonModule, CdkDrag, CdkDropList, FormsModule],
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

    // Drag & Drop specific state
    isDragDropMode = false;

    availableIndicators = ['Solde Livre', 'Imputations prov.', 'Volume de transactions'];
    selectedIndicators = ['Solde BCEAO', 'Écart CCB', 'Taux Concordance'];

    availableAxes = ['Poste comptable', 'Date de valeur', 'Banque', 'Sens'];
    selectedAxes = ['Nature opération'];

    toggleMode(mode: 'classic' | 'dragdrop') {
        this.isDragDropMode = mode === 'dragdrop';
    }

    drop(event: CdkDragDrop<string[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex,
            );
        }
    }

    kpis = [
        { titre: 'Solde BCEAO', valeur: '12.4 Milliards', info: 'FCFA', type: 'primary' },
        { titre: 'Solde Livre Comptable', valeur: '12.1 Milliards', info: 'FCFA', type: 'primary' },
        { titre: 'Écart CCB', valeur: '300 Millions', info: 'FCFA - À rapprocher', type: 'warning' },
        { titre: 'Taux Concordance', valeur: '97.6%', info: 'Stable', type: 'success' }
    ];

}
