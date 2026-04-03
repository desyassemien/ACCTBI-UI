import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { KpiDetailService } from '../services/kpi-detail.service';

interface ChartData {
    labels: string[];
    data: number[];
    color: string;
}

interface TableRow {
    [key: string]: string | number | TableRow[];
}

@Component({
    selector: 'app-kpi-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './kpi-detail.component.html',
    styleUrl: './kpi-detail.component.scss'
})
export class KpiDetailComponent implements OnInit {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private kpiDetailService = inject(KpiDetailService);

    kpiId: string = '';
    kpiTitle: string = '';
    kpiValue: string = '';
    kpiUnit: string = '';
    chartData: ChartData | null = null;
    tableHeaders: string[] = [];
    tableData: TableRow[] = [];
    chartType: 'line' | 'area' | 'pie' | 'donut' = 'line';
    chartTypes: Array<{ id: 'line' | 'area' | 'pie' | 'donut'; icon: string; title: string }> = [
        { id: 'line', icon: 'fas fa-chart-line', title: 'Ligne' },
        { id: 'area', icon: 'fas fa-chart-area', title: 'Aire' },
        { id: 'pie', icon: 'fas fa-chart-pie', title: 'Pie' },
        { id: 'donut', icon: 'fas fa-chart-pie', title: 'Donut' }
    ];

    periodes: string[] = ['Année', 'Trimestre', 'Mois', 'Semaine'];
    selectedPeriod: string = 'Mois';

    // Couleurs professionnelles pour les différents types de graphiques
    chartColors = {
        bar: [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        ],
        line: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
        area: [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        ],
        pie: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
        donut: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']
    };

    // Animations et effets
    animations = {
        bar: 'animate__animated animate__fadeInUp',
        line: 'animate__animated animate__fadeIn',
        area: 'animate__animated animate__fadeIn',
        pie: 'animate__animated animate__zoomIn',
        donut: 'animate__animated animate__zoomIn'
    };

    tooltipData: { show: boolean; x: number; y: number; label: string; value: string; percentage?: string; color?: string } = {
        show: false, x: 0, y: 0, label: '', value: '', percentage: '', color: ''
    };

    selectedRow: TableRow | null = null;
    detailModalOpen: boolean = false;

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.kpiId = params['id'];
            this.loadKpiDetails();
        });
    }

    loadKpiDetails() {
        const details = this.kpiDetailService.getKpiDetails(this.kpiId);
        if (details) {
            this.kpiTitle = details.title;
            this.kpiValue = details.value;
            this.kpiUnit = details.unit;
            this.chartData = details.chartData;
            this.tableHeaders = details.tableHeaders;
            this.tableData = details.tableData;
            this.chartType = details.chartType === 'bar' ? 'line' : details.chartType;
        }
    }

    goBack() {
        this.router.navigateByUrl('/dashboard');
    }

    selectChartType(type: 'line' | 'area' | 'pie' | 'donut') {
        this.chartType = type;
    }

    onPeriodChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.selectedPeriod = select.value;
        // TODO: rafraîchir / filtrer chartData sur la période sélectionnée
        console.log('Période sélectionnée :', this.selectedPeriod);
    }

    getMaxValue(): number {
        if (!this.chartData) return 0;
        return Math.max(...this.chartData.data);
    }

    getLinePath(): string {
        if (!this.chartData) return '';
        const points: Array<{x:number,y:number}> = [];
        const count = this.chartData.data.length;
        const max = this.getMaxValue() || 1;

        for (let i = 0; i < count; i++) {
            const x = (i / (count - 1 || 1)) * 1200;
            const y = 350 - ((this.chartData.data[i] / max) * 330);
            points.push({x,y});
        }

        return points.map((p, i) => `${i===0?'M':'L'} ${p.x},${p.y}`).join(' ');
    }

    getAreaPath(): string {
        if (!this.chartData) return '';
        const line = this.getLinePath();
        if (!line) return '';
        const count = this.chartData.data.length;
        const xEnd = 1200;

        return `${line} L ${xEnd},350 L 0,350 Z`;
    }

    getPieSegments(): Array<{d:string; fill:string; inner:string; label:string; value:number; percentage:number; labelX:number; labelY:number; gradientId:string}> {
        if (!this.chartData) return [];
        const chartData = this.chartData;
        const total = chartData.data.reduce((sum, v) => sum + v, 0) || 1;
        const radius = 140;
        const centerX = 170;
        const centerY = 170;
        const colors = this.chartColors[this.chartType] || this.chartColors.pie;

        let startAngle = -Math.PI / 2;
        return chartData.data.map((value, idx) => {
            const portion = value / total;
            const endAngle = startAngle + portion * Math.PI * 2;
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            const largeArc = portion > 0.5 ? 1 : 0;
            const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const fill = colors[idx % colors.length];
            const inner = this.lightenColor(fill, 30);
            const midAngle = startAngle + (endAngle - startAngle) / 2;
            const labelRadius = radius * 0.65;
            const labelX = centerX + labelRadius * Math.cos(midAngle);
            const labelY = centerY + labelRadius * Math.sin(midAngle);
            const label = chartData.labels[idx] || '';
            const percentage = Math.round(portion * 100 * 10) / 10;
            const gradientId = `pieGradient-${idx}`;
            startAngle = endAngle;
            return { d, fill, inner, label, value, percentage, labelX, labelY, gradientId };
        });
    }

    getDonutInner(): {cx:number; cy:number; r:number;} {
        return {cx:170, cy:170, r:80};
    }

    getPieLegend(): Array<{label:string; value:number; percentage:number; color:string}> {
        const segments = this.getPieSegments();
        return segments.map(s => ({
            label: s.label,
            value: s.value,
            percentage: s.percentage,
            color: s.fill
        }));
    }

    getBarColors(): string[] {
        return this.chartColors.bar;
    }

    getBarGradient(index: number): string {
        const colors = this.chartColors.bar;
        const baseColor = colors[index % colors.length];
        // Create a gradient from the base color to a lighter version
        return `linear-gradient(135deg, ${baseColor}, ${this.lightenColor(baseColor, 30)})`;
    }

    getPieGradient(index: number): string {
        const colors = this.chartColors.pie;
        const baseColor = colors[index % colors.length];
        // Create a radial gradient for 3D effect
        return `radial-gradient(circle at 30% 30%, ${this.lightenColor(baseColor, 40)}, ${baseColor})`;
    }

    private lightenColor(color: string, percent: number): string {
        // Simple color lightening function
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    animateBar(event: MouseEvent) {
        const bar = event.target as HTMLElement;
        bar.style.transform = 'scaleY(1.1)';
        bar.style.transition = 'transform 0.2s ease';
        setTimeout(() => {
            bar.style.transform = 'scaleY(1)';
        }, 200);
    }

    onCircleHover(event: MouseEvent, isHover: boolean) {
        const circle = event.target as SVGElement;
        if (isHover) {
            circle.setAttribute('r', '7');
        } else {
            circle.setAttribute('r', '5');
        }
    }

    onPieHover(event: MouseEvent, isHover: boolean) {
        const path = event.target as SVGElement;
        if (isHover) {
            path.style.transform = 'scale(1.05)';
        } else {
            path.style.transform = 'scale(1)';
        }
    }

    openRowDetail(row: TableRow) {
        this.selectedRow = row;
        this.detailModalOpen = true;
    }

    closeDetailModal() {
        this.detailModalOpen = false;
        this.selectedRow = null;
    }

    getDetailHeaders(): string[] {
        if (!this.selectedRow || !Array.isArray(this.selectedRow['details']) || (this.selectedRow['details'] as TableRow[]).length === 0) {
            return [];
        }
        return Object.keys((this.selectedRow['details'] as TableRow[])[0]);
    }

    getLineColor(): string {
        if (this.chartData?.color) {
            return this.chartData.color;
        }
        return this.chartColors.line[0];
    }

    getAreaColor(): string {
        if (this.chartData?.color) {
            return this.chartData.color;
        }
        return this.chartColors.area[0];
    }

    getAnimationClass(): string {
        return this.animations[this.chartType] || '';
    }

    getYAxisLabels(): string[] {
        if (!this.chartData) return [];
        const max = this.getMaxValue();
        const labels = [];
        for (let i = 0; i <= 5; i++) {
            labels.push(Math.round((max / 5) * i).toLocaleString('fr-FR'));
        }
        return labels;
    }

    getXAxisLabels(): string[] {
        return this.chartData?.labels || [];
    }

    showTooltip(event: MouseEvent, label: string, value: number, percentage?: number, color?: string) {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        this.tooltipData = {
            show: true,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            label: label,
            value: value.toLocaleString('fr-FR') + ' FCFA',
            percentage: percentage ? `${percentage.toFixed(1)}%` : undefined,
            color: color
        };
    }

    hideTooltip() {
        this.tooltipData.show = false;
    }

    getColumnValue(row: TableRow, column: string): string | number {
        const value = row[column];
        if (value === undefined || value === null) {
            return '-';
        }
        if (Array.isArray(value)) {
            return value.length;
        }
        return value;
    }

    isArray(value: any): value is any[] {
  return Array.isArray(value);
}
}
