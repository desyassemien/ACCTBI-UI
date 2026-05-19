import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal, computed } from '@angular/core';

export interface KPI {
    titre: string;
    valeur: string;
    info: string;
    type: 'success' | 'warning' | 'primary' | 'danger';
}

export interface ExecutionBudgetaire {
    periode: string;
    lfi: number;
    lfr: number;
    engage: number;
    mandate: number;
    paye: number;
    tauxExecution: number;
}

export interface CompteData {
    bailleur: string;
    lfi: number;
    lfr: number;
    engage: number;
    mandate: number;
    paye: number;
    pourcentageExecution: number;
    statut: 'Bon' | 'Alerte' | 'Suivi' | 'Critique';
}

@Injectable({
    providedIn: 'root'
})
export class CompteGestionService {
    private http = inject(HttpClient);

    // Sample KPIs data
    private kpisSignal = signal<KPI[]>([
        { titre: 'Taux Exécution Crédits', valeur: '87.2%', info: 'Seuil 85-98%', type: 'success' },
        { titre: 'Taux Absorption Crédits', valeur: '91.3%', info: 'T-2: > 90%', type: 'success' },
        { titre: 'Taux Mandats Rejetés', valeur: '3.5%', info: 'Seuil < 5%', type: 'primary' },
        { titre: 'Délai Moy. Mandatement', valeur: '7.8 Jours', info: 'Objectif < 10j', type: 'success' }
    ]);

    // Sample execution data
    private executionDataSignal = signal<ExecutionBudgetaire[]>([
        { periode: 'Jan', lfi: 2500000, lfr: 2750000, engage: 2400000, mandate: 2350000, paye: 2280000, tauxExecution: 96 },
        { periode: 'Fev', lfi: 2500000, lfr: 2750000, engage: 2250000, mandate: 2150000, paye: 2050000, tauxExecution: 87 },
        { periode: 'Mar', lfi: 2500000, lfr: 2750000, engage: 2480000, mandate: 2420000, paye: 2350000, tauxExecution: 98 }
    ]);

    // Sample compte data
    private compteDataSignal = signal<CompteData[]>([
        {
            bailleur: 'SODE',
            lfi: 2500000,
            lfr: 2750000,
            engage: 2400000,
            mandate: 2350000,
            paye: 2280000,
            pourcentageExecution: 96,
            statut: 'Bon'
        },
        {
            bailleur: 'EPN',
            lfi: 1800000,
            lfr: 1950000,
            engage: 1620000,
            mandate: 1580000,
            paye: 1520000,
            pourcentageExecution: 82,
            statut: 'Alerte'
        },
        {
            bailleur: 'COLLECTIVIT2',
            lfi: 950000,
            lfr: 1050000,
            engage: 920000,
            mandate: 880000,
            paye: 850000,
            pourcentageExecution: 88,
            statut: 'Bon'
        },
        {
            bailleur: 'AUTRES',
            lfi: 750000,
            lfr: 820000,
            engage: 680000,
            mandate: 650000,
            paye: 600000,
            pourcentageExecution: 85,
            statut: 'Suivi'
        }
    ]);

    // Computed properties
    readonly kpis = computed(() => this.kpisSignal());
    readonly executionData = computed(() => this.executionDataSignal());
    readonly compteData = computed(() => this.compteDataSignal());

    // Calculate total budget execution
    readonly totalExecution = computed(() => {
        const data = this.compteDataSignal();
        if (data.length === 0) return 0;
        const totalExec = data.reduce((sum, item) => sum + item.pourcentageExecution, 0);
        return Math.round(totalExec / data.length);
    });

    // Calculate average mandate rejection rate
    readonly averageMandateRejectionRate = computed(() => {
        const kpi = this.kpisSignal().find(k => k.titre.includes('Mandats Rejetés'));
        return kpi ? parseFloat(kpi.valeur) : 0;
    });

    /**
     * Fetch KPIs from backend API
     */
    getKPIs() {
        // For now, return the signal value. In production, call API
        // return this.http.get<KPI[]>('/api/compte-gestion/kpis');
        return this.kpis;
    }

    /**
     * Fetch execution data from backend API
     */
    getExecutionData() {
        // For now, return the signal value. In production, call API
        // return this.http.get<ExecutionBudgetaire[]>('/api/compte-gestion/execution');
        return this.executionData;
    }

    /**
     * Fetch compte data by bailleur
     */
    getCompteData() {
        // For now, return the signal value. In production, call API
        // return this.http.get<CompteData[]>('/api/compte-gestion/comptes');
        return this.compteData;
    }

    /**
     * Update KPI data (for real-time updates)
     */
    updateKPI(kpi: KPI) {
        const current = this.kpisSignal();
        const index = current.findIndex(k => k.titre === kpi.titre);
        if (index > -1) {
            const updated = [...current];
            updated[index] = kpi;
            this.kpisSignal.set(updated);
        }
    }

    /**
     * Export data to CSV
     */
    exportToCSV(data: CompteData[], filename: string = 'compte-gestion.csv') {
        const csv = this.convertToCSV(data);
        this.downloadCSV(csv, filename);
    }

    /**
     * Export data to PDF (stub for now)
     */
    exportToPDF() {
        console.log('PDF export functionality to be implemented');
    }

    private convertToCSV(data: CompteData[]): string {
        const headers = ['Bailleur', 'LFI', 'LFR', 'Engagé', 'Mandaté', 'Payé', '% Exécution', 'Statut'];
        const rows = data.map(item => [
            item.bailleur,
            item.lfi,
            item.lfr,
            item.engage,
            item.mandate,
            item.paye,
            item.pourcentageExecution,
            item.statut
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csv;
    }

    private downloadCSV(csv: string, filename: string) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}
