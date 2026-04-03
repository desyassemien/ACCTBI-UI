import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyseSelectorComponent } from '../../shared/components/analyse-selector/analyse-selector.component';

@Component({
  selector: 'app-reglement',
  standalone: true,
  imports: [CommonModule, FormsModule, AnalyseSelectorComponent],
  templateUrl: './reglement.component.html',
  styleUrl: './reglement.component.scss'
})
export class ReglementComponent {
  // Navigation state
  selectedPeriod: string = 'Ce mois-ci';
  isDragDropMode = false;

  // KPIs for the dashboard
  kpis = [
    { titre: 'Taux Rapprochement Auto', valeur: '94.2%', info: 'Seuil > 85%', type: 'success' },
    { titre: 'Délai Moyen Règlement', valeur: '24 Jours', info: 'Objectif < 30j', type: 'success' },
    { titre: 'Taux Imputations Provisoires', valeur: '8.5%', info: 'Seuil < 10%', type: 'success' },
    { titre: 'Écart de Concordance', valeur: '0.02%', info: 'Seuil < 0.05%', type: 'primary' }
  ];

  // Additional KPIs for Règlement
  advancedKpis = [
    { titre: 'Taux Répartition Impôts', valeur: '99.1%', info: 'Seuil > 98%', type: 'success' },
    { titre: 'Rapprochement ACCT-ACCD', valeur: '96.5%', info: 'Seuil > 95%', type: 'success' },
    { titre: 'Paiements dans les délais', valeur: '91.2%', info: 'Objectif > 90%', type: 'success' },
    { titre: 'IP sans pièces', valeur: '2.1%', info: 'Seuil < 3%', type: 'warning' }
  ];

  // Drag & Drop / Selector data
  availableIndicators = [
    'Taux de rapprochement auto',
    'Délai moyen de rapprochement',
    'Volume règlements jour',
    'Taux de paiements dans les délais',
    'Délai moyen de régularisation IP',
    'Écart de concordance ACCT-ACCD'
  ];
  selectedIndicators = [
    'Taux de règlement à échéance',
    'Anomalies de paiement détectées'
  ];

  availableAxes = [
    'Canal de paiement',
    'Agence bancaire',
    'Type opération (Débit/Crédit)',
    'Échéance (Court/Moyen terme)',
    'Fournisseur / Bénéficiaire'
  ];
  selectedAxes = ['Banque', 'Date valeur'];

  toggleMode(mode: 'classic' | 'dragdrop') {
    this.isDragDropMode = mode === 'dragdrop';
  }

  // Simulation d'une action de rafraîchissement
  onAnalysisTriggered(event: any) {
    console.log('Analyse Règlement déclenchée:', event);
    // Ici on simulerait un appel API
  }
}
