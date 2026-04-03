import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { KpiCard } from '../../../core/models/kpi-card.model';

@Component({
    selector: 'app-kpi-card',
    standalone: true,
    imports: [DecimalPipe],
    templateUrl: './kpi-card.component.html',
    styleUrl: './kpi-card.component.scss'
})
export class KpiCardComponent {
    data = input.required<KpiCard>();
}
