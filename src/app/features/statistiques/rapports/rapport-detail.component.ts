import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RapportService } from '../services/rapport.service';

@Component({
    selector: 'app-rapport-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './rapport-detail.component.html',
    styleUrl: './rapport-detail.component.scss'
})
export class RapportDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private rapportService = inject(RapportService);

    rapportId: string = '';
    rapport: any = null;
    chartType: string = 'bar';
    selectedFilter = '';
    selectedPeriod: string = 'ytd';
    
    periodOptions = [
        { value: 'mtd', label: 'Mois courant (MTD)' },
        { value: 'qtd', label: 'Trimestre courant (QTD)' },
        { value: 'ytd', label: `D'année à ce jour (YTD)` },
        { value: 'all', label: 'Tous les mois' }
    ];

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.rapportId = params['id'];
            this.loadRapport();
        });
    }

    loadRapport() {
        this.rapport = this.rapportService.getRapportById(this.rapportId);
        if (this.rapport && this.rapport.filtres && this.rapport.filtres.length > 0) {
            this.selectedFilter = this.rapport.filtres[0];
        }
    }

    exportData(format: 'excel' | 'pdf') {
        if (format === 'excel') {
            console.log('Export Excel:', this.rapportId);
        } else {
            console.log('Export PDF:', this.rapportId);
        }
    }

    downloadChartImage() {
        console.log('Téléchargement graphique PNG:', this.rapportId);
    }

    getColumnValue(row: any, col: string): any {
        return row[col.toLowerCase().replaceAll(' ', '_')];
    }
}
