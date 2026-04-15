import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { KpiDetailService } from '../services/kpi-detail.service';
import { PeriodService } from '../../../core/services/period.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
export class KpiDetailComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private kpiDetailService = inject(KpiDetailService);
    private periodService = inject(PeriodService);
    private destroy$ = new Subject<void>();

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

    periodes = ['Aujourd\'hui', 'Cette semaine', 'Ce mois-ci', 'Ce trimestre', 'Cette année', 'Personnalisé...'];
    selectedPeriod = 'Ce mois-ci';

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

    // Nouvelles palettes modernes
    readonly modernPalettes = [
        { name: 'Indigo', color: '#6366f1' },
        { name: 'Emeraude', color: '#10b981' },
        { name: 'Ambre', color: '#f59e0b' },
        { name: 'Rose', color: '#ec4899' },
        { name: 'Ciel', color: '#0ea5e9' },
        { name: 'Violet', color: '#8b5cf6' },
        { name: 'Ardoise', color: '#475569' },
        { name: 'Rouge', color: '#ef4444' }
    ];
    customChartColor: string | null = null;

    // Gestion de la confirmation d'export
    showExportConfirm: boolean = false;
    pendingExportType: 'excel' | 'pdf' | null = null;

    ngOnInit() {
        // Souscrire aux changements de période depuis le service
        this.periodService.selectedPeriod$
            .pipe(takeUntil(this.destroy$))
            .subscribe(period => {
                this.selectedPeriod = period;
                console.log('Période synchronisée:', period);
            });

        this.route.params.subscribe(params => {
            this.kpiId = params['id'];
            this.loadKpiDetails();
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
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
            this.chartType = details.chartType;
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
        const newPeriod = select.value;
        this.periodService.setSelectedPeriod(newPeriod);
        // Le selectedPeriod sera mis à jour automatiquement via la souscription
    }

    prepareExport(type: 'excel' | 'pdf') {
        this.pendingExportType = type;
        this.showExportConfirm = true;
    }

    confirmExport() {
        if (this.pendingExportType === 'excel') {
            this.exportToExcel();
        } else if (this.pendingExportType === 'pdf') {
            this.exportToPDF();
        }
        this.cancelExport();
    }

    cancelExport() {
        this.showExportConfirm = false;
        this.pendingExportType = null;
    }

    exportToExcel() {
        // Préparation des données (on retire la colonne 'details' interne)
        const exportData = this.tableData.map(row => {
            const cleanRow: any = {};
            this.tableHeaders.forEach(header => {
                cleanRow[header] = row[header];
            });
            return cleanRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Détails');

        // Génération du nom du fichier
        const fileName = `${this.kpiTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    }

    exportToPDF() {
        const doc = new jsPDF();
        
        // Titre et métadonnées
        doc.setFontSize(18);
        doc.text(this.kpiTitle, 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Valeur actuelle: ${this.kpiValue} ${this.kpiUnit}`, 14, 30);
        doc.text(`Date export: ${new Date().toLocaleDateString('fr-FR')}`, 14, 35);

        // Données du tableau
        const body = this.tableData.map(row => 
            this.tableHeaders.map(header => String(row[header] || ''))
        );

        autoTable(doc, {
            head: [this.tableHeaders],
            body: body,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [27, 58, 107] }, // #1B3A6B (Bleu Projet)
            styles: { fontSize: 9 }
        });

        const fileName = `${this.kpiTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
    }

    changeChartColor(color: string) {
        this.customChartColor = color;
    }

    getMaxValue(): number {
        if (!this.chartData) return 0;
        return Math.max(...this.chartData.data);
    }

    getLinePath(): string {
        if (!this.chartData) return '';
        const points: Array<{ x: number, y: number }> = [];
        const count = this.chartData.data.length;
        const max = this.getMaxValue() || 1;

        for (let i = 0; i < count; i++) {
            const x = (i / (count - 1 || 1)) * 1200;
            const y = 350 - ((this.chartData.data[i] / max) * 330);
            points.push({ x, y });
        }

        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    }

    getAreaPath(): string {
        if (!this.chartData) return '';
        const line = this.getLinePath();
        if (!line) return '';
        const count = this.chartData.data.length;
        const xEnd = 1200;

        return `${line} L ${xEnd},350 L 0,350 Z`;
    }

    /** Chemin SVG mis à l'échelle pour le repère axes (x: 60-880, y: 270-10) */
    getScaledLinePath(): string {
        if (!this.chartData) return '';
        const count = this.chartData.data.length;
        const max = this.getMaxValue() || 1;
        const xStart = 60, xEnd = 880, yTop = 10, yBottom = 270;
        return this.chartData.data.map((val, i) => {
            const x = xStart + (i / ((count - 1) || 1)) * (xEnd - xStart);
            const y = yBottom - (val / max) * (yBottom - yTop);
            return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
        }).join(' ');
    }

    getScaledAreaPath(): string {
        const line = this.getScaledLinePath();
        if (!line || !this.chartData) return '';
        const count = this.chartData.data.length;
        const xEnd = 60 + ((count - 1) / ((count - 1) || 1)) * 820;
        return `${line} L ${xEnd},270 L 60,270 Z`;
    }

    getPieSegments(): Array<{ d: string; fill: string; inner: string; label: string; value: number; percentage: number; labelX: number; labelY: number; gradientId: string }> {
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

    getDonutInner(): { cx: number; cy: number; r: number; } {
        return { cx: 170, cy: 170, r: 80 };
    }

    getPieLegend(): Array<{ label: string; value: number; percentage: number; color: string }> {
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
        return `linear-gradient(135deg, ${baseColor}, ${this.lightenColor(baseColor, 30)})`;
    }

    getPieGradient(index: number): string {
        const colors = this.chartColors.pie;
        const baseColor = colors[index % colors.length];
        return `radial-gradient(circle at 30% 30%, ${this.lightenColor(baseColor, 40)}, ${baseColor})`;
    }

    private lightenColor(color: string, percent: number): string {
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

    onCircleHover(event: MouseEvent, isHover: boolean, index: number) {
        const circle = event.target as SVGElement;
        if (isHover) {
            circle.setAttribute('r', '7');
            if (this.chartData) {
                this.tooltipData = {
                    show: true,
                    x: event.clientX,
                    y: event.clientY - 40,
                    label: this.chartData.labels[index],
                    value: this.chartData.data[index].toLocaleString(),
                    color: this.getLineColor()
                };
            }
        } else {
            circle.setAttribute('r', '5');
            this.tooltipData.show = false;
        }
    }

    onPieHover(event: MouseEvent, isHover: boolean, segment: any) {
        const path = event.target as SVGElement;
        if (isHover) {
            path.style.transform = 'scale(1.05)';
            this.tooltipData = {
                show: true,
                x: event.clientX,
                y: event.clientY - 40,
                label: segment.label,
                value: segment.value.toLocaleString(),
                percentage: segment.percentage + '%',
                color: segment.fill
            };
        } else {
            path.style.transform = 'scale(1)';
            this.tooltipData.show = false;
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
        if (this.customChartColor) return this.customChartColor;
        if (this.chartData?.color) {
            return this.chartData.color;
        }
        return this.chartColors.line[0];
    }

    getAreaColor(): string {
        if (this.customChartColor) return this.customChartColor;
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

    getColumnValue(row: TableRow, header: string): string | number {
        const value = row[header];
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'number') {
            return value.toLocaleString('fr-FR');
        }
        return value.toString();
    }

    isTrendColumn(header: string): boolean {
        return header.toLowerCase() === 'tendance';
    }

    getTrendClass(value: any): string {
        const val = String(value);
        if (val === '-') return 'text-secondary';

        // Logique Inversée : Pour certains KPIs, une hausse (↑) est une mauvaise nouvelle
        const reverseLogicIds = ['2', '5', 'alertes']; // Restes à Payer, En Attente, Alertes
        const isReverse = reverseLogicIds.includes(this.kpiId);

        if (val === '↑') {
            return isReverse ? 'text-danger' : 'text-success';
        } else if (val === '↓') {
            return isReverse ? 'text-success' : 'text-danger';
        }
        
        return 'text-dark';
    }

    isStatusColumn(header: string): boolean {
        const h = header.toLowerCase();
        return h === 'statut' || h === 'état' || h === 'etat';
    }

    getStatusClass(value: any): string {
        const val = String(value).toLowerCase();
        if (val.includes('normal') || val.includes('valid') || val.includes('approuv')) {
            return 'bg-success-subtle text-success border-success';
        }
        if (val.includes('critique') || val.includes('danger') || val.includes('rejet')) {
            return 'bg-danger-subtle text-danger border-danger';
        }
        if (val.includes('alert') || val.includes('attent') || val.includes('cours') || val.includes('révision')) {
            return 'bg-warning-subtle text-warning border-warning';
        }
        return 'bg-light text-dark border-secondary';
    }

    isArray(value: any): boolean {
        return Array.isArray(value);
    }

    getDetailsArray(): any[] {
        if (this.selectedRow && Array.isArray(this.selectedRow['details'])) {
            return this.selectedRow['details'] as any[];
        }
        return [];
    }

    rowHasDetails(row: TableRow): boolean {
        return !!(row['details'] && Array.isArray(row['details']) && (row['details'] as any[]).length > 0);
    }
}
