import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-cautionnement',
    standalone: true,
    imports: [CommonModule, CdkDrag, CdkDropList, FormsModule],
    templateUrl: './cautionnement.component.html',
    styleUrl: './cautionnement.component.scss'
})
export class CautionnementComponent {

    // Placeholder data for the component
    currentFilters = {
        periode: 'Ce Mois-ci',
        indicateurs: 'Taux Cautionnement, Délai Émission',
        axes: 'Ministère'
    };

    // Selected period state to trigger custom date picker
    selectedPeriod: string = 'Ce mois-ci';

    // Chart specific state
    compChart1Type: string = 'pie';
    compChart2Type: string = 'bar';

    // Drag & Drop specific state aligned with Section 3.4
    isDragDropMode = false;

    availableIndicators = [
        'Délai moy. remboursement',
        'Taux de précompte appliqué',
        'Ancienneté moy. dépôts',
        'Taux de chèques sans provision'
    ];
    selectedIndicators = [
        'Taux de cautionnement actif',
        'Montant moyen caution',
        'Délai moy. émission attestation'
    ];

    availableAxes = [
        'Direction',
        'Département',
        'Région',
        'Ville',
        'Durée fonction',
        'Échéances'
    ];
    selectedAxes = ['Ministère'];

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
        { titre: 'Taux Cautionnement Actif', valeur: '96.2%', info: 'Seuil > 95%', type: 'success' },
        { titre: 'Montant Moyen Caution', valeur: '2.5 Millions', info: 'FCFA / Fonction', type: 'primary' },
        { titre: 'Délai Moy. Émission', valeur: '3.4 Jours', info: 'Objectif < 5j', type: 'success' },
        { titre: 'Taux de Précompte', valeur: '98.5%', info: 'Seuil > 98%', type: 'success' }
    ];

    // Mock Deliverables aligned with Section 3.5
    deliverables = [
        { ref: 'ATT-2026-004', ministere: 'Ministère de la Santé', date: '12 Mars 2026', montant: '5 000 000', statut: 'Actif' },
        { ref: 'ATT-2026-012', ministere: 'Ministère de l\'Éducation', date: '10 Mars 2026', montant: '12 500 000', statut: 'En attente' },
        { ref: 'ATT-2026-018', ministere: 'Ministère de l\'Équipement', date: '05 Mars 2026', montant: '8 250 000', statut: 'Actif' },
        { ref: 'ATT-2026-025', ministere: 'Ministère de la Défense', date: '01 Mars 2026', montant: '25 000 000', statut: 'Échu' }
    ];
}
