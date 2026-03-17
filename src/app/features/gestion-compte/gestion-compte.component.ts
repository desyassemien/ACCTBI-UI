import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

interface BalanceItem {
  classe: string;
  debit: number;
  credit: number;
  solde: number;
}

interface ImputationItem {
  type: string;
  stockInitial: number;
  nouvellesEntrees: number;
  regularisations: number;
  stockFinal: number;
}

interface DepenseItem {
  ministere: string;
  credits: number;
  depenses: number;
  taux: number;
}

interface DisponibiliteItem {
  date: string;
  solde: number;
}

@Component({
  selector: 'app-gestion-compte',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, CdkDrag, CdkDropList],
  templateUrl: './gestion-compte.component.html',
  styleUrl: './gestion-compte.component.scss'
})
export class GestionCompteComponent {
  // Filtres et sélecteurs (mode classique)
  currentFilters = {
    periode: 'Ce Mois-ci',
    indicateurs: 'Balance à 3 chiffres, Imputations provisoires',
    axes: 'Classe comptable, Ministère'
  };

  // Période sélectionnée
  selectedPeriod: string = 'Ce mois-ci';

  // Mode drag & drop
  isDragDropMode = false;

  // Indicateurs disponibles pour drag & drop
  availableIndicators = [
    'Équilibre débit/crédit',
    'Taux d\'apurement imputations',
    'Taux consommation budgétaire',
    'Solde net trésorerie',
    'Évolution disponibilités',
    'Répartition par classe comptable',
    'Ancienneté imputations provisoires',
    'Écart concordance comptes'
  ];

  // Indicateurs sélectionnés
  selectedIndicators = [
    'Balance à 3 chiffres',
    'Situation imputations provisoires',
    'Développement dépenses budgétaires',
    'Situation disponibilités'
  ];

  // Axes d'analyse disponibles
  availableAxes = [
    'Classe comptable',
    'Ministère',
    'Type opération',
    'Région',
    'Poste comptable',
    'Nature recette/dépense',
    'Exercice budgétaire',
    'Source données'
  ];

  // Axes sélectionnés
  selectedAxes = [
    'Classe comptable',
    'Ministère'
  ];
  // Balance à 3 chiffres
  balanceData = signal<BalanceItem[]>([
    { classe: 'Classe 1 - Capitaux', debit: 1000000, credit: 1000000, solde: 0 },
    { classe: 'Classe 2 - Immobilisations', debit: 500000, credit: 300000, solde: 200000 },
    { classe: 'Classe 3 - Stocks', debit: 200000, credit: 150000, solde: 50000 },
    { classe: 'Classe 4 - Tiers', debit: 800000, credit: 800000, solde: 0 },
    { classe: 'Classe 5 - Trésorerie', debit: 1200000, credit: 1000000, solde: 200000 }
  ]);

  // Imputations Provisoires
  imputationsData = signal<ImputationItem[]>([
    { type: 'Recettes', stockInitial: 50000, nouvellesEntrees: 30000, regularisations: 60000, stockFinal: 20000 },
    { type: 'Dépenses', stockInitial: 80000, nouvellesEntrees: 40000, regularisations: 90000, stockFinal: 30000 }
  ]);

  // Développement des dépenses
  depensesData = signal<DepenseItem[]>([
    { ministere: 'Ministère de l\'Économie', credits: 1000000, depenses: 850000, taux: 85 },
    { ministere: 'Ministère de la Santé', credits: 800000, depenses: 720000, taux: 90 },
    { ministere: 'Ministère de l\'Éducation', credits: 1200000, depenses: 960000, taux: 80 },
    { ministere: 'Ministère de la Défense', credits: 1500000, depenses: 1350000, taux: 90 }
  ]);

  // Disponibilités
  disponibilitesData = signal<DisponibiliteItem[]>([
    { date: '2024-01-01', solde: 500000 },
    { date: '2024-01-02', solde: 520000 },
    { date: '2024-01-03', solde: 480000 },
    { date: '2024-01-04', solde: 550000 },
    { date: '2024-01-05', solde: 530000 },
    { date: '2024-01-06', solde: 570000 },
    { date: '2024-01-07', solde: 590000 }
  ]);

  // Chart configurations
  public waterfallChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  public waterfallChartData: ChartData<'bar'> = {
    labels: ['Stock Initial', 'Nouvelles Entrées', 'Régularisations', 'Stock Final'],
    datasets: [
      {
        data: [50000, 30000, -60000, 20000],
        label: 'Recettes',
        backgroundColor: '#2E7D32',
      },
      {
        data: [80000, 40000, -90000, 30000],
        label: 'Dépenses',
        backgroundColor: '#B71C1C',
      },
    ],
  };

  public gaugeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  public gaugeChartData: ChartData<'doughnut'> = {
    labels: ['Consommé', 'Restant'],
    datasets: [
      {
        data: [85, 15],
        backgroundColor: ['#2E7D32', '#E0E0E0'],
      },
    ],
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  public lineChartData: ChartData<'line'> = {
    labels: this.disponibilitesData().map(d => d.date),
    datasets: [
      {
        data: this.disponibilitesData().map(d => d.solde),
        label: 'Solde Trésorerie',
        borderColor: '#1B3A6B',
        backgroundColor: 'rgba(27, 58, 107, 0.1)',
      },
    ],
  };

  // Computed totals
  totalDebit = computed(() => this.balanceData().reduce((sum, item) => sum + item.debit, 0));
  totalCredit = computed(() => this.balanceData().reduce((sum, item) => sum + item.credit, 0));
  totalSolde = computed(() => this.balanceData().reduce((sum, item) => sum + item.solde, 0));

  soldeActuel = computed(() => this.disponibilitesData()[this.disponibilitesData().length - 1]?.solde || 0);
  evolution7j = computed(() => {
    const data = this.disponibilitesData();
    if (data.length < 2) return 0;
    const first = data[0]?.solde || 0;
    const last = data[data.length - 1]?.solde || 0;
    return ((last - first) / first) * 100;
  });
  soldeMoyen = computed(() => {
    const data = this.disponibilitesData();
    return data.reduce((sum, d) => sum + d.solde, 0) / data.length;
  });

  // Methods
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

  onDrillDown(classe: string) {
    // TODO: Implement drill-down to detailed operations
    console.log('Drill down for:', classe);
  }

  exportExcel() {
    // TODO: Implement Excel export
    console.log('Export to Excel');
  }

  generateReport() {
    // TODO: Implement PDF report generation
    console.log('Generate PDF report');
  }

  refreshAnalysis() {
    // TODO: Refresh data based on current filters
    console.log('Refreshing analysis with current filters');
  }
}