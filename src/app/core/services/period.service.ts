import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PeriodService {
    private periodes: string[] = ['Année', 'Trimestre', 'Mois', 'Semaine'];
    private selectedPeriodSubject = new BehaviorSubject<string>('Mois');

    // Observable pour souscrire aux changements de période
    selectedPeriod$: Observable<string> = this.selectedPeriodSubject.asObservable();

    constructor() { }

    /**
     * Obtient la période actuellement sélectionnée
     */
    getSelectedPeriod(): string {
        return this.selectedPeriodSubject.value;
    }

    /**
     * Change la période sélectionnée
     */
    setSelectedPeriod(period: string): void {
        if (this.periodes.includes(period)) {
            this.selectedPeriodSubject.next(period);
            console.log('Période changée à:', period);
        } else {
            console.warn(`Période invalide: ${period}. Périodes valides: ${this.periodes.join(', ')}`);
        }
    }

    /**
     * Obtient la liste des périodes disponibles
     */
    getAvailablePeriods(): string[] {
        return [...this.periodes];
    }
}
