import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy, HostListener, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { ChatService, ChatAction, ChatMessage, ChatChartContext, ChatChartScenario } from '../../../core/services/chat.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss'
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  public chatService = inject(ChatService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('modalChartCanvas') private modalChartCanvas?: ElementRef<HTMLCanvasElement>;

  isOpen = signal<boolean>(false);
  showHistory = signal<boolean>(false);
  showSuggestions = signal<boolean>(true);
  userInput = signal<string>('');

  // Modal State Signals
  isModalOpen = signal<boolean>(false);
  currentModalChart = signal<ChatChartContext | null>(null);
  selectedScenario = signal<'BASE' | 'OPTIMISTE' | 'STRESS'>('BASE');

  activeScenarioObj = computed(() => {
    const chart = this.currentModalChart();
    if (!chart) return null;
    const key = this.selectedScenario();
    return chart.scenarios.find(s => s.key === key) || chart.scenarios[0] || null;
  });

  private chartInstance: Chart | null = null;
  private themeObserver: MutationObserver | null = null;

  ngOnInit() {
    if (this.isBrowser) {
      Chart.register(...registerables);
      this.setupThemeObserver();
    }
  }

  ngOnDestroy() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.isModalOpen()) {
      this.closeModal();
    }
  }

  private setupThemeObserver() {
    if (!this.isBrowser || typeof document === 'undefined') return;
    this.themeObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-bs-theme') {
          if (this.isModalOpen() && this.chartInstance) {
            this.renderModalChart();
          }
        }
      }
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bs-theme']
    });
  }

  toggleChat() {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.showHistory.set(false);
    }
  }

  toggleHistory() {
    this.showHistory.update(v => !v);
  }

  startNewChat() {
    this.chatService.createNewThread();
    this.showHistory.set(false);
  }

  selectThread(id: string) {
    this.chatService.setActiveThread(id);
    this.showHistory.set(false);
  }

  deleteThread(event: Event, id: string) {
    event.stopPropagation();
    this.chatService.deleteThread(id);
  }

  getSnippet(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/•/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  sendMessage() {
    const text = this.userInput().trim();
    if (text) {
      this.chatService.sendMessage(text);
      this.userInput.set('');
      this.showSuggestions.set(false);
    }
  }

  askSuggested(question: string) {
    this.chatService.sendMessage(question);
    this.showSuggestions.set(false);
  }

  toggleSuggestions() {
    this.showSuggestions.update(v => !v);
  }

  onModeChange(mode: 'synthese' | 'technique' | 'action') {
    this.chatService.responseMode.set(mode);
  }

  executeAction(act: ChatAction, msg?: ChatMessage) {
    if (act.type === 'chart' || act.label === 'Simuler sur le graphe') {
      const ctx = act.chartContext || msg?.chartContext || this.chatService.getDefaultChartContext();
      this.openChartModal(ctx);
    } else if (act.type === 'question' && act.payload) {
      this.chatService.sendMessage(act.payload);
    } else if (act.type === 'navigate' && act.payload) {
      this.isOpen.set(false);
      this.router.navigate([act.payload]);
    } else if (act.type === 'download' && act.payload) {
      this.exportMessagePdf(act.payload);
    }
  }

  openChartModal(ctx: ChatChartContext) {
    this.currentModalChart.set(ctx);
    this.selectedScenario.set('BASE');
    this.isModalOpen.set(true);
    setTimeout(() => {
      this.renderModalChart();
    }, 60);
  }

  closeModal() {
    this.isModalOpen.set(false);
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  selectScenario(key: 'BASE' | 'OPTIMISTE' | 'STRESS') {
    this.selectedScenario.set(key);
    this.updateChartForScenario(key);
  }

  private renderModalChart() {
    if (!this.isBrowser || !this.modalChartCanvas?.nativeElement) return;
    const ctx = this.currentModalChart();
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const textColor = isDark ? '#f8fafc' : '#1e293b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    // Clone datasets and highlight projection year
    const activeScenario = this.selectedScenario();
    const scenarioObj = ctx.scenarios.find(s => s.key === activeScenario) || ctx.scenarios[0];

    const chartDatasets = ctx.datasets.map((ds, idx) => {
      let data = [...ds.data];
      if (idx === 0 && scenarioObj && scenarioObj.data?.length) {
        data = [...scenarioObj.data];
      }
      return {
        ...ds,
        data,
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: ds.borderColor,
        pointBorderColor: isDark ? '#202127' : '#ffffff',
        pointBorderWidth: 2
      };
    });

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: ctx.labels,
        datasets: chartDatasets as any
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: textColor,
              font: { weight: 600, size: 12 },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#18191f' : '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#f1f5f9',
            borderColor: isDark ? '#2e2f38' : '#334155',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y;
                const unit = ctx.unit || '';
                return ` ${context.dataset.label}: ${val} ${unit}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { weight: 500, size: 11 }
            }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { weight: 500, size: 11 },
              callback: (val) => `${val} ${ctx.unit === 'Mds FCFA' ? 'Mds' : (ctx.unit === '%' ? '%' : '')}`
            }
          }
        }
      }
    };

    const canvas = this.modalChartCanvas.nativeElement;
    this.chartInstance = new Chart(canvas, config);
  }

  private updateChartForScenario(key: 'BASE' | 'OPTIMISTE' | 'STRESS') {
    if (!this.chartInstance || !this.currentModalChart()) return;
    const ctx = this.currentModalChart()!;
    const sc = ctx.scenarios.find(s => s.key === key) || ctx.scenarios[0];
    if (sc && sc.data?.length && this.chartInstance.data.datasets.length > 0) {
      this.chartInstance.data.datasets[0].data = [...sc.data];
      this.chartInstance.update();
    }
  }

  downloadChartImage() {
    if (!this.modalChartCanvas?.nativeElement) return;
    const canvas = this.modalChartCanvas.nativeElement;
    const imageUri = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const id = this.currentModalChart()?.id || 'simulation';
    link.download = `dgtcp-graphe-${id}-${Date.now()}.png`;
    link.href = imageUri;
    link.click();
  }

  goToDecisionIa() {
    this.closeModal();
    this.isOpen.set(false);
    this.router.navigate(['/decision-ia']);
  }

  private async exportMessagePdf(htmlText: string) {
    if (!this.isBrowser) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(26, 54, 93);
    doc.text('DGTCP — Analyse Assistant Décisionnel', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100);
    doc.text('Exercice 2026   |   Synthèse Consolidée DGTCP / ACCT', 14, y);
    y += 3;
    doc.setDrawColor(210, 220, 235);
    doc.line(14, y, pageW - 14, y);
    y += 7;

    const container = document.createElement('div');
    container.innerHTML = htmlText;
    const rawLines = (container.innerText || container.textContent || '')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    rawLines.forEach((line, idx) => {
      if (idx === 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.5);
        doc.setTextColor(26, 54, 93);
        const wrapped = doc.splitTextToSize(line, pageW - 28);
        if (y + wrapped.length * 5 > pageH - 14) { doc.addPage(); y = 16; }
        doc.text(wrapped, 14, y);
        y += wrapped.length * 5 + 4;
        return;
      }

      doc.setFontSize(9.5);
      doc.setTextColor(40);
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < 45) {
        const prefix = line.slice(0, colonIdx + 1) + ' ';
        const rest = line.slice(colonIdx + 1).trim();
        doc.setFont('helvetica', 'bold');
        const prefixW = doc.getTextWidth(prefix);
        const restLines = doc.splitTextToSize(rest, pageW - 28 - prefixW);
        if (y + restLines.length * 4.8 > pageH - 14) { doc.addPage(); y = 16; }
        doc.text(prefix, 14, y);
        doc.setFont('helvetica', 'normal');
        if (restLines.length > 0) {
          doc.text(restLines[0], 14 + prefixW, y);
          for (let li = 1; li < restLines.length; li++) {
            y += 4.8;
            doc.text(restLines[li], 18, y);
          }
        }
        y += 6.2;
      } else {
        doc.setFont('helvetica', 'normal');
        const wrapped = doc.splitTextToSize(line, pageW - 28);
        if (y + wrapped.length * 4.8 > pageH - 14) { doc.addPage(); y = 16; }
        doc.text(wrapped, 14, y);
        y += wrapped.length * 4.8 + 2;
      }
    });

    const maintenant = new Date();
    const dateImp = maintenant.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const heureImp = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const nbPages = doc.getNumberOfPages();
    for (let p = 1; p <= nbPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Imprimé le ${dateImp} à ${heureImp}`, pageW - 14, pageH - 6, { align: 'right' });
    }

    doc.save('Analyse_Assistant_DGTCP_2026.pdf');
  }

  private scrollToBottom(): void {
    if (this.isOpen() && this.scrollContainer) {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }
  }

  clearHistory() {
    if (confirm('Voulez-vous vraiment effacer l\'historique de discussion ?')) {
      this.chatService.clearHistory();
    }
  }
}
