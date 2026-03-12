import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-tresorerie',
    standalone: true,
    imports: [CommonModule, CdkDrag, CdkDropList, FormsModule],
    templateUrl: './tresorerie.component.html',
    styleUrl: './tresorerie.component.scss'
})
export class TresorerieComponent {

    // Sub-domain state
    activeSubDomain: 'la' | 'bc' = 'la';

    // Drag & Drop mode state
    isDragDropMode = false;

    // Selected period state
    selectedPeriod: string = 'Ce mois-ci';

    // --- Lettres d'Avance (LA) Data ---
    availableIndicatorsLA = [
        'Taux de LA en retard (> 60j)',
        'Taux d\'exécution des paiements',
        'Montant moyen reste à exécuter',
        'Taux de réponse aux relances'
    ];
    selectedIndicatorsLA = [
        'Montant total LA en cours',
        'Délai moyen de traitement',
        'Taux de régularisation LA'
    ];

    availableAxesLA = [
        'Processus (Réception/Paiement/Régul)',
        'Direction / Département',
        'Bénéficiaire spécifique',
        'Nombre de relances',
        'Type de dépense'
    ];
    selectedAxesLA = ['Ministère / Organisation', 'Temporel (Échéance)'];

    kpisLA = [
        { titre: 'Montant LA en cours', valeur: '1.2 Milliards', info: 'FCFA - Plafond respecté', type: 'primary' },
        { titre: 'Délai Moyen Traitement', valeur: '4.2 Jours', info: 'Objectif < 5j', type: 'success' },
        { titre: 'Taux Régularisation', valeur: '88.5%', info: 'Seuil > 90%', type: 'warning' },
        { titre: 'Relances Actives', valeur: '24', info: 'Moyenne: 1.5 / LA', type: 'primary' }
    ];

    deliverablesLA = [
        { ref: 'LA-2026-045', bene: 'M. Touré S.', ministere: 'Santé', montant: '15 000 000', statut: 'Payé', regul: 'En attente' },
        { ref: 'LA-2026-052', bene: 'Mme. Kane D.', ministere: 'Éducation', montant: '8 500 000', statut: 'Exécuté', regul: '60%' },
        { ref: 'LA-2026-061', bene: 'M. Koffi K.', ministere: 'Défense', montant: '25 000 000', statut: 'Reçu', regul: '0%' },
        { ref: 'LA-2026-033', bene: 'Mme. Yao B.', ministere: 'Justice', montant: '12 000 000', statut: 'En retard', regul: 'Relancé x2' }
    ];

    // --- Bons de Caisse (BC) Data ---
    availableIndicatorsBC = [
        'Taux d\'approvisionnements urgents',
        'Délai moyen de régularisation BC',
        'Taux de BC vérifiés',
        'Montant des écarts détectés'
    ];
    selectedIndicatorsBC = [
        'Nombre de BC en circulation',
        'Montant moyen par BC',
        'Taux de couverture appro'
    ];

    availableAxesBC = [
        'Heure / Jour (Pointes)',
        'Géographique (Région)',
        'Type de bénéficiaire',
        'Instrument (Espèce/Chèque)',
        'Qualité (Anomalies)'
    ];
    selectedAxesBC = ['Poste Comptable', 'Statut (En cours/Régul)'];

    kpisBC = [
        { titre: 'BC en Circulation', valeur: '458', info: 'Dans les limites', type: 'primary' },
        { titre: 'Montant Moyen BC', valeur: '125 000', info: 'FCFA', type: 'primary' },
        { titre: 'Couverture Appro', valeur: '98.2%', info: 'Seuil > 90%', type: 'success' },
        { titre: 'Écarts Détectés', valeur: '0.02%', info: 'Seuil < 1%', type: 'success' }
    ];

    deliverablesBC = [
        { ref: 'BC-8842', poste: 'Trésorerie Abidjan Nord', montant: '250 000', date: '12/03/2026', statut: 'En circulation' },
        { ref: 'BC-8850', poste: 'Poste Comptable Yam.', montant: '450 000', date: '11/03/2026', statut: 'Pris en charge' },
        { ref: 'BC-8861', poste: 'Trésorerie San-Pedro', montant: '120 000', date: '10/03/2026', statut: 'Régularisé' },
        { ref: 'BC-8872', poste: 'Poste Comptable Bouaké', montant: '300 000', date: '05/03/2026', statut: 'En retard' }
    ];

    // --- Common Logic ---
    switchSubDomain(domain: 'la' | 'bc') {
        this.activeSubDomain = domain;
    }

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
}
