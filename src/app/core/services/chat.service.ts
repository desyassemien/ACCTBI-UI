import { Injectable, signal, effect, computed, inject } from '@angular/core';
import { PilotageRealDataService, RealDataPilotageMetrics } from './pilotage-real-data.service';
import { PilotageBenchmarkService, ComparativeIndicator } from './pilotage-benchmark.service';

export interface ChatChartKpi {
  label: string;
  value: string;
  trend?: string;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

export interface ChatChartScenario {
  key: 'BASE' | 'OPTIMISTE' | 'STRESS';
  label: string;
  description: string;
  projValue: string;
  data: number[];
}

export interface ChatChartRecommendation {
  title: string;
  desc: string;
  priority: 'CRITIQUE' | 'HAUTE' | 'MOYENNE';
}

export interface ChatChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  borderDash?: number[];
  fill?: boolean;
  tension?: number;
  type?: 'line' | 'bar';
}

export interface ChatChartContext {
  id: string;
  title: string;
  subtitle: string;
  serviceName: string;
  badgeClass: string;
  unit: string;
  kpis: ChatChartKpi[];
  labels: string[];
  datasets: ChatChartDataset[];
  scenarios: ChatChartScenario[];
  reportSummary: string;
  recommendations: ChatChartRecommendation[];
}

export interface ChatAction {
  label: string;
  icon: string;
  type: 'question' | 'navigate' | 'download' | 'chart';
  payload?: any;
  chartContext?: ChatChartContext;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  chartContext?: ChatChartContext;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly STORAGE_KEY = 'sygacut_chat_threads_v3';
  private readonly MAX_THREADS = 20;

  private realDataService = inject(PilotageRealDataService);
  private benchmarkService = inject(PilotageBenchmarkService);

  private realMetrics: RealDataPilotageMetrics | null = null;
  private allIndicators: ComparativeIndicator[] = [];
  private readonly currentAnnee = 2026;

  // Signal for all chat threads
  threads = signal<ChatThread[]>([]);
  activeThreadId = signal<string | null>(null);
  isGenerating = signal<boolean>(false);
  responseMode = signal<'synthese' | 'technique' | 'action'>('synthese');

  readonly suggestedQuestions = [
    'Fais un bilan synthétique global.',
    'Quelle est la situation de la Trésorerie (LA) et de la Comptabilité (BCEAO) ?',
    'Quel est l’état du Cautionnement, des Régies et du Règlement ?',
    'Analyse les Statistiques (RAP, Subventions, Dette) et le Compte de Gestion.'
  ];

  // Computed signal for the current active messages
  activeMessages = computed(() => {
    const activeId = this.activeThreadId();
    const thread = this.threads().find(t => t.id === activeId);
    return thread ? thread.messages : [];
  });

  constructor() {
    this.loadApplicationData();
    this.loadHistory();

    // Auto-save on change
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.threads()));
      if (this.activeThreadId()) {
        localStorage.setItem(this.STORAGE_KEY + '_active', this.activeThreadId()!);
      }
    });
  }

  private loadApplicationData() {
    this.realDataService.getRealMetricsForYear(this.currentAnnee).subscribe(m => {
      this.realMetrics = m;
    });
    this.benchmarkService.compareYears(this.currentAnnee, this.currentAnnee - 1).subscribe(comp => {
      this.allIndicators = comp.indicateurs;
    });
  }

  private loadHistory() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const savedActiveId = localStorage.getItem(this.STORAGE_KEY + '_active');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const history: ChatThread[] = parsed.map((t: any) => ({
          ...t,
          lastUpdated: new Date(t.lastUpdated),
          messages: t.messages.map((m: any) => ({
            ...m,
            content: m.role === 'assistant' ? this.formatResponse(m.content) : m.content,
            timestamp: new Date(m.timestamp)
          }))
        }));
        this.threads.set(history);

        if (savedActiveId && history.some(t => t.id === savedActiveId)) {
          this.activeThreadId.set(savedActiveId);
        } else if (history.length > 0) {
          this.activeThreadId.set(history[0].id);
        }
      } catch (e) {
        console.error('Erreur chargement historique chat:', e);
        this.createNewThread();
      }
    } else {
      this.createNewThread();
    }
  }

  createNewThread() {
    const newId = Date.now().toString();
    const newThread: ChatThread = {
      id: newId,
      title: 'Nouvelle conversation',
      messages: [
        {
          role: 'assistant',
          content: 'Bonjour ! Je suis votre Assistant Décisionnel et Prospectif (DGTCP / ACCT). Cliquez sur <strong>Analyser</strong> ou <strong>Plan d\'action</strong> dans la note à gauche, ou posez-moi directement une question sur vos indicateurs, la Trésorerie, les RAP ou la Comptabilité.',
          timestamp: new Date(),
          actions: [
            { label: 'Simuler sur le graphe', icon: 'fas fa-chart-line', type: 'chart' }
          ]
        }
      ],
      lastUpdated: new Date()
    };

    this.threads.update(prev => {
      const updated = [newThread, ...prev];
      // Keep only fixed number of threads
      return updated.slice(0, this.MAX_THREADS);
    });

    this.activeThreadId.set(newId);
  }

  setActiveThread(id: string) {
    if (this.threads().some(t => t.id === id)) {
      this.activeThreadId.set(id);
    }
  }

  deleteThread(id: string) {
    this.threads.update(prev => prev.filter(t => t.id !== id));
    if (this.activeThreadId() === id) {
      const remaining = this.threads();
      if (remaining.length > 0) {
        this.activeThreadId.set(remaining[0].id);
      } else {
        this.createNewThread();
      }
    }
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

  sendMessage(content: string) {
    const activeId = this.activeThreadId();
    if (!activeId) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date()
    };

    this.updateActiveThread(userMessage);

    // Update title if it's the first user message
    const thread = this.threads().find(t => t.id === activeId);
    if (thread && thread.messages.filter(m => m.role === 'user').length === 1) {
      this.updateThreadTitle(activeId, content.substring(0, 30) + (content.length > 30 ? '...' : ''));
    }

    // Simulate AI thinking and response
    this.isGenerating.set(true);
    setTimeout(() => {
      this.generateAIResponse(content);
      this.isGenerating.set(false);
    }, 450);
  }

  private updateActiveThread(message: ChatMessage) {
    const activeId = this.activeThreadId();
    this.threads.update(prev => prev.map(t => {
      if (t.id === activeId) {
        return {
          ...t,
          messages: [...t.messages, message],
          lastUpdated: new Date()
        };
      }
      return t;
    }));
  }

  private updateThreadTitle(id: string, title: string) {
    this.threads.update(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, title };
      }
      return t;
    }));
  }

  private generateAIResponse(userText: string) {
    const q = userText.toLowerCase();
    const m = this.realMetrics;
    const liq = m?.liquiditeNetteCutMilliards || 1542.3;
    const laEnc = m?.laEnCoursMilliards || 45.8;
    const laReg = m?.tauxRegularisationLA || 88.5;
    const rap = m?.encoursRapMilliards || 124.5;
    const rap90 = m?.rapCritiquePlus90jMilliards || 34.9;
    const conc = m?.tauxRapprochementAuto || 94.8;
    const rec = m?.totalRecettesMilliards || 1254.0;
    const prev27 = m?.prevision2027 || 1321.7;
    const mode = this.responseMode();
    const modeBadge = mode === 'action' ? 'Plan d’Action' : (mode === 'technique' ? 'Analyse Technique' : 'Synthèse Direction');

    let response = '';
    let matchedInd: ComparativeIndicator | null = null;

    if (q.includes('plan d\'action') || mode === 'action') {
      response = `
        <div class="p-1 text-dark">
          <div class="fw-bold text-dark mb-2 border-bottom pb-1">${modeBadge} — Feuille de Route DGTCP</div>
          <ul class="list-unstyled mb-2">
            <li><strong>• Phase 1 (J+7) :</strong> Audit ciblé des dossiers en écart et gel des engagements non justifiés.</li>
            <li><strong>• Phase 2 (J+30) :</strong> Apurement prioritaire (<strong>+25%</strong>) et relance des postes comptables.</li>
            <li><strong>• Phase 3 (J+60) :</strong> Validation ACCT / PGT et suivi mensuel automatique.</li>
          </ul>
          <div class="very-small text-muted"><strong>Impact estimé :</strong> Amélioration de <strong>+3</strong> à <strong>+5 pts</strong> sur le score de conformité.</div>
        </div>`;
    } else if (q.includes('caution')) {
      response = `
        <div class="p-1 text-dark">
          <div class="fw-bold text-dark mb-2 border-bottom pb-1">Diagnostic Cautionnement & Garanties</div>
          <ul class="list-unstyled mb-2">
            <li><strong>• Taux de couverture :</strong> <span class="text-success fw-bold">${m?.tauxCouvertureCautionnement || 96.8}%</span> (Norme DGTCP = <strong>100%</strong>)</li>
            <li><strong>• Volume des garanties :</strong> <strong>${m?.cautionnementsVolumeMilliards || 15.0} Mds FCFA</strong> (<strong>${m?.cautionnementsActifsCount || 1450}</strong> dossiers actifs)</li>
            <li><strong>• Cautionnements échus :</strong> <strong>${m?.cautionnementsEchusMilliards || 2.3} Mds FCFA</strong></li>
          </ul>
          <div class="very-small text-muted"><strong>Action recommandée :</strong> Régulariser les arrêtés de nomination et mainlevées de quitus en attente.</div>
        </div>`;
    } else if (q.includes('régie') || q.includes('regie')) {
      response = `
        <div class="p-1 text-dark">
          <div class="fw-bold text-dark mb-2 border-bottom pb-1">Diagnostic Régies d'Avances & Recettes</div>
          <ul class="list-unstyled mb-2">
            <li><strong>• Postes & Régies connectés :</strong> <strong>${m?.postesEtRegiesActifs || 142} unités</strong> (Avances : <strong>${m?.regiesAvancesEnCoursMilliards || 4.85} Mds FCFA</strong>)</li>
            <li><strong>• Conformité des pièces :</strong> <span class="text-success fw-bold">${m?.regiesTauxPiecesConformes || 96.4}%</span> (Seuil ≥ <strong>95%</strong>)</li>
            <li><strong>• Régies en dépassement :</strong> <span class="text-danger fw-bold">${m?.regiesEnDepassementCount || 7} régies</span></li>
          </ul>
          <div class="very-small text-muted"><strong>Action recommandée :</strong> Suspendre les réapprovisionnements pour les <strong>${m?.regiesEnDepassementCount || 7}</strong> régisseurs en dépassement.</div>
        </div>`;
    } else if (q.includes('compte de gestion') || q.includes('cour des comptes') || q.includes('reddition')) {
      response = `
        <div class="p-1 text-dark">
          <div class="fw-bold text-dark mb-2 border-bottom pb-1">Reddition des Comptes de Gestion</div>
          <ul class="list-unstyled mb-2">
            <li><strong>• Conformité des liasses :</strong> <span class="text-success fw-bold">${m?.tauxConformiteCompteGestion || 96.4}%</span> (Seuil ≥ <strong>90%</strong>)</li>
            <li><strong>• Volume audité (TGE, PGT, RGF, PGA) :</strong> <strong>${m?.cgVolumeAuditeMilliards || 482.5} Mds FCFA</strong></li>
            <li><strong>• Quitus transmis :</strong> <span class="text-success fw-bold">${m?.quitusTransmisPct || 95.2}%</span> (En instance : <strong>${m?.restesEnInstanceCGMilliards || 11.26} Mds</strong>)</li>
          </ul>
          <div class="very-small text-muted"><strong>Action recommandée :</strong> Apurer les <strong>${m?.restesEnInstanceCGMilliards || 11.26} Mds FCFA</strong> en instance avant transmission à la Cour des Comptes.</div>
        </div>`;
    } else if (q.includes('cut') || q.includes('trésor') || q.includes('tresor') || q.includes('liquidit') || q.includes('avance')) {
      response = `
        <div class="p-1 text-dark">
          <div class="fw-bold text-dark mb-2 border-bottom pb-1">Diagnostic Trésorerie & CUT</div>
          <ul class="list-unstyled mb-2">
            <li><strong>• Liquidité Nette CUT :</strong> <span class="text-success fw-bold">${liq} Mds FCFA</span> (dont <strong>55%</strong> à la BCEAO)</li>
            <li><strong>• Lettres d'Avance non régularisées :</strong> <span class="text-danger fw-bold">${laEnc} Mds FCFA</span></li>
            <li><strong>• Taux de régularisation LA :</strong> <strong>${laReg}%</strong> (Norme ACCT ≥ <strong>90%</strong>)</li>
          </ul>
          <div class="very-small text-muted"><strong>Action recommandée :</strong> Suspendre toute nouvelle LA sur les ordonnateurs présentant un retard &gt; <strong>45 jours</strong>.</div>
        </div>`;
    } else if (q.includes('rap') || q.includes('reste') || q.includes('règle') || q.includes('regle')) {
      response = `
        <div class="p-1 text-dark">
          <div class="fw-bold text-dark mb-2 border-bottom pb-1">Analyse Restes à Payer (RAP) & Règlements</div>
          <ul class="list-unstyled mb-2">
            <li><strong>• Encours total RAP :</strong> <strong>${rap} Mds FCFA</strong></li>
            <li><strong>• Tranche critique (&gt; 90 jours) :</strong> <span class="text-danger fw-bold">${rap90} Mds FCFA</span></li>
            <li><strong>• Délai moyen de règlement :</strong> <span class="text-success fw-bold">${m?.delaiMoyenReglementJours || 21.4} jours</span> (Cible &lt; <strong>30j</strong>)</li>
          </ul>
          <div class="very-small text-muted"><strong>Action recommandée :</strong> Prioriser l'apurement FIFO des décomptes de plus de <strong>90 jours</strong>.</div>
        </div>`;
    } else if (q.includes('bceao') || q.includes('rapprochement') || q.includes('concordance') || q.includes('compta')) {
      response = `
        <div class="p-1 text-dark">
          <div class="fw-bold text-dark mb-2 border-bottom pb-1">Concordance Bancaire BCEAO / ACCT</div>
          <ul class="list-unstyled mb-2">
            <li><strong>• Rapprochement automatique :</strong> <span class="text-success fw-bold">${conc}%</span> (Seuil DGTCP ≥ <strong>90%</strong>)</li>
            <li><strong>• Écart résiduel en sas :</strong> <strong>${m?.ecartConcordanceMilliards || 1.2} Mds FCFA</strong></li>
            <li><strong>• Opérations en attente :</strong> <strong>${m?.suspensComptablesMilliards || 45.8} Mds FCFA</strong> (<strong>${m?.suspensionsActivesDossiers || 18}</strong> dossiers)</li>
          </ul>
          <div class="very-small text-muted"><strong>Action recommandée :</strong> Apurer les comptes transitoires <strong>4711</strong> et <strong>4712</strong> avant l'arrêté mensuel.</div>
        </div>`;
    } else if (q.includes('bilan') || q.includes('synthétique') || q.includes('global')) {
      response = `
        <div class="p-1 text-dark">
          <div class="fw-bold text-dark mb-2 border-bottom pb-1">Bilan Synthétique Consolidé — Exercice ${this.currentAnnee}</div>
          <ul class="list-unstyled mb-2">
            <li><strong>• Comptabilité :</strong> Rapprochement auto BCEAO à <span class="text-success fw-bold">${conc}%</span>, opérations en attente à <strong>${m?.suspensComptablesMilliards || 45.8} Mds FCFA</strong>.</li>
            <li><strong>• Trésorerie :</strong> Liquidité nette CUT à <span class="text-success fw-bold">${liq} Mds FCFA</span> ; régularisation LA à <strong>${laReg}%</strong>.</li>
            <li><strong>• Cautionnement :</strong> <strong>${m?.cautionnementsActifsCount || 1450} dossiers actifs</strong> (<strong>${m?.cautionnementsVolumeMilliards || 15.0} Mds FCFA</strong>).</li>
            <li><strong>• Régies & Règlement :</strong> <strong>${rec} Mds FCFA</strong> mobilisés face à <strong>${m?.totalReglementsMilliards || 1138.2} Mds FCFA</strong> payés (<strong>${m?.delaiMoyenReglementJours || 21.4} j</strong>).</li>
            <li><strong>• Statistiques & Compte de Gestion :</strong> RAP à <strong>${rap} Mds</strong> (<strong>${rap90} Mds &gt; 90j</strong>) ; conformité Cour des Comptes à <span class="text-success fw-bold">${m?.tauxConformiteCompteGestion || 96.4}%</span>.</li>
          </ul>
          <div class="very-small text-muted"><strong>Priorité DGTCP :</strong> Apurer les RAP &gt; <strong>90 jours</strong> et porter la régularisation des LA au-dessus de <strong>90%</strong>.</div>
        </div>`;
    } else {
      const dataHit = this.searchApplicationData(userText);
      if (dataHit) {
        response = dataHit.html;
        matchedInd = dataHit.matchedIndicator ?? null;
      } else {
        response = `
          <div class="p-1 text-dark">
            <div class="fw-bold text-dark mb-2 border-bottom pb-1">Statistiques & Projection — Exercice ${this.currentAnnee}</div>
            <ul class="list-unstyled mb-2">
              <li><strong>• Recettes mobilisées :</strong> <strong>${rec} Mds FCFA</strong> (Exécution LF : <strong>${m?.tauxExecutionLoiFinances || 94.8}%</strong>)</li>
              <li><strong>• Règlements exécutés :</strong> <strong>${m?.totalReglementsMilliards || 1138.2} Mds FCFA</strong></li>
              <li><strong>• Projection 2027 :</strong> <span class="text-success fw-bold">${prev27} Mds FCFA</span> (<strong>+5,4%/an</strong>)</li>
            </ul>
            <div class="very-small text-muted">Solde net du CUT préservé à <strong>${liq} Mds FCFA</strong>.</div>
          </div>`;
      }
    }

    response = this.formatResponse(response);

    const chartContext = this.buildChartContext(userText, response, matchedInd);

    const actions: ChatAction[] = [
      { label: 'Simuler sur le graphe', icon: 'fas fa-chart-line', type: 'chart', payload: chartContext, chartContext },
      { label: 'Plan d’action détaillé', icon: 'fas fa-tasks', type: 'question', payload: `Génère un plan d'action pour ${matchedInd?.nom || chartContext.serviceName}` },
      { label: 'Télécharger PDF', icon: 'fas fa-download', type: 'download', payload: response }
    ];

    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      actions,
      chartContext
    };

    this.updateActiveThread(aiMessage);
  }

  public buildChartContext(query: string, responseHtml: string, matchedInd?: ComparativeIndicator | null): ChatChartContext {
    const q = (query || '').toLowerCase();
    const m = this.realMetrics;
    const liq = m?.liquiditeNetteCutMilliards || 1542.3;
    const laEnc = m?.laEnCoursMilliards || 45.8;
    const laReg = m?.tauxRegularisationLA || 88.5;
    const rap = m?.encoursRapMilliards || 124.5;
    const rap90 = m?.rapCritiquePlus90jMilliards || 34.9;
    const conc = m?.tauxRapprochementAuto || 94.8;
    const rec = m?.totalRecettesMilliards || 1254.0;
    const reg = m?.totalReglementsMilliards || 1138.2;
    const prev27 = m?.prevision2027 || 1321.7;

    // 1. INDICATEUR SPÉCIFIQUE DÉTECTÉ
    if (matchedInd) {
      const vA = matchedInd.valeurA;
      const vB = matchedInd.valeurB;
      const delta = matchedInd.deltaPct;
      const p27 = Number((vA * (1 + delta / 100)).toFixed(2));
      const p27Opt = Number((p27 * 1.08).toFixed(2));
      const p27Str = Number((p27 * 0.90).toFixed(2));
      const labels = ['2022', '2023', '2024', '2025', '2026 (Constaté)', '2027 (Prévision)'];
      const v22 = Number((vB * 0.92).toFixed(2));
      const v23 = Number((vB * 0.96).toFixed(2));
      const v24 = Number((vB * 0.98).toFixed(2));
      const baseData = [v22, v23, v24, vB, vA, p27];

      return {
        id: 'ind_' + matchedInd.code,
        title: `Simulation & Prévision — ${matchedInd.nom}`,
        subtitle: `Analyse prévisionnelle du domaine ${matchedInd.domaineLabel}`,
        serviceName: matchedInd.domaineLabel,
        badgeClass: 'bg-primary-subtle text-primary border',
        unit: matchedInd.unite,
        kpis: [
          { label: 'Valeur Actuelle (2026)', value: `${vA} ${matchedInd.unite}`, trend: `${delta >= 0 ? '+' : ''}${delta}%`, status: matchedInd.statut === 'PROGRESSION' ? 'success' : (matchedInd.statut === 'REGRESSION' ? 'danger' : 'info') },
          { label: 'Exercice Précédent (2025)', value: `${vB} ${matchedInd.unite}` },
          { label: 'Prévision 2027 (Base)', value: `${p27} ${matchedInd.unite}`, trend: 'Prévision', status: 'info' },
          { label: 'Statut Métier', value: matchedInd.statut, status: matchedInd.statut === 'PROGRESSION' ? 'success' : 'warning' }
        ],
        labels,
        datasets: [
          {
            label: `${matchedInd.nom} (${matchedInd.unite})`,
            data: baseData,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            fill: true,
            tension: 0.35
          }
        ],
        scenarios: [
          { key: 'BASE', label: 'Prévision de référence', description: 'Projection linéaire selon dynamique historique observée.', projValue: `${p27} ${matchedInd.unite}`, data: baseData },
          { key: 'OPTIMISTE', label: 'Scénario Favorable (+8%)', description: 'Accélération de la mobilisation et réformes structurelles.', projValue: `${p27Opt} ${matchedInd.unite}`, data: [v22, v23, v24, vB, vA, p27Opt] },
          { key: 'STRESS', label: 'Scénario Prudentiel (-10%)', description: 'Tension conjoncturelle et retard de régularisation.', projValue: `${p27Str} ${matchedInd.unite}`, data: [v22, v23, v24, vB, vA, p27Str] }
        ],
        reportSummary: matchedInd.description || `Indicateur clé de conformité pour le périmètre ${matchedInd.domaineLabel}.`,
        recommendations: [
          { title: `Suivi rapproché de ${matchedInd.nom}`, desc: `Consolider les transmissions mensuelles pour maintenir la dynamique actuelle.`, priority: 'HAUTE' },
          { title: 'Contrôle de conformité prévisionnel', desc: `Sécuriser l'atteinte de la cible 2027 estimée à ${p27} ${matchedInd.unite}.`, priority: 'MOYENNE' }
        ]
      };
    }

    // 2. TRÉSORERIE & CUT / LIQUIDITÉ
    if (q.includes('cut') || q.includes('tresor') || q.includes('liquidit') || q.includes('avance')) {
      const labels = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026 (Actuel)', '2027 (Projeté)'];
      const cutData = [1120.4, 1195.0, 1260.8, 1345.2, 1420.5, 1488.0, 1515.2, liq, 1631.8];
      const laData = [62.0, 58.4, 55.1, 52.0, 49.5, 47.2, 46.5, laEnc, 32.0];

      return {
        id: 'tresorerie_cut',
        title: 'Simulation & Trajectoire de la Liquidité Nette CUT',
        subtitle: 'Disponibilités BCEAO, comptes spéciaux et apurement des Lettres d\'Avance',
        serviceName: 'Service Trésorerie',
        badgeClass: 'bg-success-subtle text-success border',
        unit: 'Mds FCFA',
        kpis: [
          { label: 'Liquidité CUT Actuelle', value: `${liq} Mds FCFA`, trend: '+5.8%/an', status: 'success' },
          { label: 'Part BCEAO', value: '55% (Sécurisé)', status: 'success' },
          { label: 'Lettres d\'Avance en cours', value: `${laEnc} Mds FCFA`, trend: 'Alerte', status: 'danger' },
          { label: 'Taux Régularisation LA', value: `${laReg}% (Seuil 90%)`, trend: `${laReg >= 90 ? 'Conforme' : 'Vigilance'}`, status: laReg >= 90 ? 'success' : 'warning' }
        ],
        labels,
        datasets: [
          {
            label: 'Liquidité Nette CUT (Mds FCFA)',
            data: cutData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            tension: 0.35
          },
          {
            label: 'Encours Lettres d\'Avance (Mds FCFA)',
            data: laData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderDash: [5, 5],
            fill: false,
            tension: 0.3
          }
        ],
        scenarios: [
          { key: 'BASE', label: 'Tendance Base (+5,8%)', description: 'Évolution continue avec liquidité projetée à 1631.8 Mds.', projValue: '1 631.8 Mds FCFA', data: cutData },
          { key: 'OPTIMISTE', label: 'Scénario Favorable (+8,5%)', description: 'Apurement total des LA et centralisation optimale.', projValue: '1 673.4 Mds FCFA', data: [1120.4, 1195.0, 1260.8, 1345.2, 1420.5, 1488.0, 1515.2, liq, 1673.4] },
          { key: 'STRESS', label: 'Scénario Prudentiel (-10%)', description: 'Ralentissement des recettes et hausse des décaissements.', projValue: '1 388.0 Mds FCFA', data: [1120.4, 1195.0, 1260.8, 1345.2, 1420.5, 1488.0, 1515.2, liq, 1388.0] }
        ],
        reportSummary: `Position nette du CUT solide à ${liq} Mds FCFA. Les disponibilités à la BCEAO assurent la solvabilité régalienne, mais les ${laEnc} Mds de Lettres d'Avance imposent une stricte discipline d'apurement.`,
        recommendations: [
          { title: 'Suspension des LA en retard > 45 jours', desc: 'Bloquer l\'ouverture de nouvelles Lettres d\'Avance aux ordonnateurs n\'ayant pas fourni les pièces justificatives.', priority: 'CRITIQUE' },
          { title: 'Maintien de la couverture BCEAO au-dessus de 50%', desc: 'Conserver la part prépondérante des disponibilités logées à la banque centrale pour faire face aux échéances souveraines.', priority: 'HAUTE' },
          { title: 'Audit trimestriel des 84 Comptes Spéciaux', desc: 'Superviser les soldes dormants sur les comptes spéciaux pour optimiser l\'unité de caisse.', priority: 'MOYENNE' }
        ]
      };
    }

    // 3. RECETTES & RÉGIES
    if (q.includes('recette') || q.includes('regie') || q.includes('douane') || q.includes('impot')) {
      const labels = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026 (Actuel)', '2027 (Projeté)'];
      const recData = [890.5, 945.2, 1010.4, 1085.6, 1140.0, 1198.5, 1225.0, rec, prev27];
      const targetData = [910.0, 960.0, 1030.0, 1100.0, 1160.0, 1220.0, 1280.0, 1322.0, 1380.0];

      return {
        id: 'recettes_regies',
        title: 'Simulation des Recettes & Performance des Régies',
        subtitle: 'Collecte budgétaire, prévisions Loi de Finances et gestion des avances',
        serviceName: 'Service Régies & Recettes',
        badgeClass: 'bg-primary-subtle text-primary border',
        unit: 'Mds FCFA',
        kpis: [
          { label: 'Recettes Mobilisées', value: `${rec} Mds FCFA`, trend: '+5.4%', status: 'success' },
          { label: 'Exécution Loi de Finances', value: `${m?.tauxExecutionLoiFinances || 94.8}%`, status: 'success' },
          { label: 'Avances Régies en cours', value: `${m?.regiesAvancesEnCoursMilliards || 4.85} Mds`, status: 'info' },
          { label: 'Régies en Dépassement', value: `${m?.regiesEnDepassementCount || 7} régies`, trend: 'Alerte', status: 'danger' }
        ],
        labels,
        datasets: [
          {
            label: 'Recettes Collectées (Mds FCFA)',
            data: recData,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            fill: true,
            tension: 0.35
          },
          {
            label: 'Cible Loi de Finances (Mds FCFA)',
            data: targetData,
            borderColor: '#F77F00',
            backgroundColor: 'transparent',
            borderDash: [6, 4],
            fill: false,
            tension: 0.2
          }
        ],
        scenarios: [
          { key: 'BASE', label: 'Tendance Base (+5,4%)', description: 'Projection centrale 2027 à 1321.7 Mds FCFA.', projValue: `${prev27} Mds FCFA`, data: recData },
          { key: 'OPTIMISTE', label: 'Scénario Favorable (+9,0%)', description: 'Rendement accru de la TVA indirecte et des régies douanières.', projValue: '1 366.8 Mds FCFA', data: [890.5, 945.2, 1010.4, 1085.6, 1140.0, 1198.5, 1225.0, rec, 1366.8] },
          { key: 'STRESS', label: 'Scénario Prudentiel (-6,0%)', description: 'Baisse de collecte sur les droits de porte et régies déconcentrées.', projValue: '1 242.0 Mds FCFA', data: [890.5, 945.2, 1010.4, 1085.6, 1140.0, 1198.5, 1225.0, rec, 1242.0] }
        ],
        reportSummary: `Exécution dynamique des recettes atteignant 94.8% de la cible annuelle. Néanmoins, 7 régisseurs en dépassement d'avances de fonds doivent être régularisés immédiatement.`,
        recommendations: [
          { title: 'Gel des réapprovisionnements pour les 7 régies', desc: 'Conditionner les nouveaux décaissements à la justification exhaustive des avances en cours.', priority: 'CRITIQUE' },
          { title: 'Contrôle croisé automatisé avec la DGD & DGI', desc: 'Synchroniser les quittances informatisées pour réduire les décalages de comptabilisation.', priority: 'HAUTE' }
        ]
      };
    }

    // 4. RÈGLEMENT & RESTES À PAYER (RAP)
    if (q.includes('rap') || q.includes('reste') || q.includes('regle') || q.includes('delai') || q.includes('paiement')) {
      const labels = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026 (Actuel)', '2027 (Projeté)'];
      const rapData = [165.0, 158.0, 150.2, 144.0, 138.5, 131.0, 127.8, rap, 98.0];
      const rap90Data = [58.0, 52.4, 48.0, 44.5, 41.0, 38.2, 36.5, rap90, 18.0];

      return {
        id: 'reglement_rap',
        title: 'Simulation d\'Apurement des Restes à Payer (RAP)',
        subtitle: 'Délai moyen de mandatement, purge de la dette fournisseurs et trésorerie',
        serviceName: 'Service Règlement & Dépenses',
        badgeClass: 'bg-warning-subtle text-warning-emphasis border',
        unit: 'Mds FCFA',
        kpis: [
          { label: 'Règlements Annuels', value: `${reg} Mds FCFA`, trend: 'Normal', status: 'success' },
          { label: 'Délai Moyen de Règlement', value: `${m?.delaiMoyenReglementJours || 21.4} jours`, trend: 'Cible < 30j', status: 'success' },
          { label: 'Encours Total RAP', value: `${rap} Mds FCFA`, trend: 'En baisse', status: 'warning' },
          { label: 'RAP Critique (> 90 jours)', value: `${rap90} Mds FCFA`, trend: 'Alerte', status: 'danger' }
        ],
        labels,
        datasets: [
          {
            label: 'Encours Total RAP (Mds FCFA)',
            data: rapData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            fill: true,
            tension: 0.35
          },
          {
            label: 'RAP Critique > 90j (Mds FCFA)',
            data: rap90Data,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            fill: true,
            tension: 0.35
          }
        ],
        scenarios: [
          { key: 'BASE', label: 'Apurement Standard', description: 'Baisse graduelle du stock de RAP à 98.0 Mds en 2027.', projValue: '98.0 Mds FCFA', data: rapData },
          { key: 'OPTIMISTE', label: 'Plan de Choc Apurement (-30%)', description: 'Purge prioritaire ramenant le stock à 72 Mds FCFA.', projValue: '72.0 Mds FCFA', data: [165.0, 158.0, 150.2, 144.0, 138.5, 131.0, 127.8, rap, 72.0] },
          { key: 'STRESS', label: 'Scénario Sans Apurement Cible', description: 'Tension de trésorerie avec reconstitution du stock à 135 Mds.', projValue: '135.0 Mds FCFA', data: [165.0, 158.0, 150.2, 144.0, 138.5, 131.0, 127.8, rap, 135.0] }
        ],
        reportSummary: `Le délai moyen de règlement (21.4 jours) reste excellent et conforme aux standards UEMOA. La priorité absolue concerne les ${rap90} Mds FCFA de créances en souffrance depuis plus de 90 jours.`,
        recommendations: [
          { title: 'Ordonnancement FIFO des dettes > 90 jours', desc: 'Apurer d\'office les dossiers complets pour désengorger la trésorerie des prestataires.', priority: 'CRITIQUE' },
          { title: 'Régularisation des imputations provisoires (1.85 Mds)', desc: 'Transférer les paiements urgents vers les comptes définitifs de la dépense.', priority: 'HAUTE' }
        ]
      };
    }

    // 5. COMPTABILITÉ & BCEAO
    if (q.includes('compta') || q.includes('bceao') || q.includes('rapprochement') || q.includes('concordance')) {
      const labels = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026 (Actuel)', '2027 (Projeté)'];
      const concData = [78.5, 82.0, 85.4, 88.2, 90.5, 92.4, 93.8, conc, 97.5];
      const suspData = [82.0, 75.0, 68.4, 61.0, 54.5, 49.0, 47.2, m?.suspensComptablesMilliards || 45.8, 25.0];

      return {
        id: 'compta_bceao',
        title: 'Simulation Rapprochement Bancaire & Concordance BCEAO',
        subtitle: 'Taux de réconciliation automatique et apurement des suspens comptables',
        serviceName: 'Service Comptabilité',
        badgeClass: 'bg-primary-subtle text-primary border',
        unit: '%',
        kpis: [
          { label: 'Rapprochement Auto BCEAO', value: `${conc}%`, trend: 'Seuil ≥ 90%', status: 'success' },
          { label: 'Écart de Sas Résiduel', value: `${m?.ecartConcordanceMilliards || 1.2} Mds FCFA`, status: 'info' },
          { label: 'Suspens Comptables', value: `${m?.suspensComptablesMilliards || 45.8} Mds`, trend: 'En cours', status: 'warning' },
          { label: 'Dossiers Suspendus', value: `${m?.suspensionsActivesDossiers || 18} dossiers`, status: 'info' }
        ],
        labels,
        datasets: [
          {
            label: 'Taux Rapprochement Auto (%)',
            data: concData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: true,
            tension: 0.35
          },
          {
            label: 'Suspens Comptables (Mds FCFA)',
            data: suspData,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderDash: [5, 5],
            fill: false,
            tension: 0.3
          }
        ],
        scenarios: [
          { key: 'BASE', label: 'Tendance Base', description: 'Progression continue du lettrage automatique vers 97.5%.', projValue: '97.5%', data: concData },
          { key: 'OPTIMISTE', label: 'Rapprochement Temps Réel', description: 'Intégration API BCEAO / RTGS direct à 99.2%.', projValue: '99.2%', data: [78.5, 82.0, 85.4, 88.2, 90.5, 92.4, 93.8, conc, 99.2] },
          { key: 'STRESS', label: 'Scénario Incident Technique', description: 'Ralentissement des intégrations bancaires avec taux à 89.0%.', projValue: '89.0%', data: [78.5, 82.0, 85.4, 88.2, 90.5, 92.4, 93.8, conc, 89.0] }
        ],
        reportSummary: `Excellente performance du rapprochement automatique (94.8%). L'écart résiduel en sas de 1.2 Mds est minime, mais l'apurement des 45.8 Mds de suspens historiques doit être finalisé.`,
        recommendations: [
          { title: 'Lettrage automatique des comptes 4711 et 4712', desc: 'Supprimer les écarts d\'imputation avant la clôture mensuelle des écritures.', priority: 'CRITIQUE' },
          { title: 'Traitement des 18 dossiers en suspension active', desc: 'Diligenter un audit express sur les postes comptables décentralisés.', priority: 'HAUTE' }
        ]
      };
    }

    // 6. CAUTIONNEMENT & GARANTIES
    if (q.includes('caution') || q.includes('garantie')) {
      const labels = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026 (Actuel)', '2027 (Projeté)'];
      const cVol = [8.5, 9.4, 10.2, 11.0, 11.8, 12.0, 12.1, 12.2, 13.5];
      const cEch = [4.2, 3.8, 3.5, 3.1, 2.8, 2.6, 2.4, m?.cautionnementsEchusMilliards || 2.3, 1.2];

      return {
        id: 'cautionnement_garanties',
        title: 'Simulation & Veille du Cautionnement Public',
        subtitle: 'Sécurisation des comptables, consignations et garanties de marchés',
        serviceName: 'Service Cautionnement',
        badgeClass: 'bg-info-subtle text-info border',
        unit: 'Mds FCFA',
        kpis: [
          { label: 'Taux de Couverture', value: `${m?.tauxCouvertureCautionnement || 96.8}%`, trend: 'Norme 100%', status: 'success' },
          { label: 'Volume Total Garanti', value: `${m?.cautionnementsVolumeMilliards || 15.0} Mds FCFA`, status: 'info' },
          { label: 'Dossiers Actifs', value: `${m?.cautionnementsActifsCount || 1450} dossiers`, status: 'info' },
          { label: 'Cautionnements Échus', value: `${m?.cautionnementsEchusMilliards || 2.3} Mds`, trend: '320 dossiers', status: 'warning' }
        ],
        labels,
        datasets: [
          {
            label: 'Cautionnements Actifs (Mds FCFA)',
            data: cVol,
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.15)',
            fill: true,
            tension: 0.35
          },
          {
            label: 'Cautionnements Échus (Mds FCFA)',
            data: cEch,
            borderColor: '#e11d48',
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            borderDash: [5, 5],
            fill: false,
            tension: 0.3
          }
        ],
        scenarios: [
          { key: 'BASE', label: 'Tendance Base', description: 'Purge régulière des cautionnements échus ramenée à 1.2 Mds.', projValue: '13.5 Mds FCFA', data: cVol },
          { key: 'OPTIMISTE', label: 'Couverture 100% Intégrale', description: 'Régularisation complète des garanties et mainlevées.', projValue: '14.8 Mds FCFA', data: [8.5, 9.4, 10.2, 11.0, 11.8, 12.0, 12.1, 12.2, 14.8] },
          { key: 'STRESS', label: 'Scénario Contentieux', description: 'Hausse des défauts de comptables avec échus à 3.5 Mds.', projValue: '11.0 Mds FCFA', data: [8.5, 9.4, 10.2, 11.0, 11.8, 12.0, 12.1, 12.2, 11.0] }
        ],
        reportSummary: `Excellente couverture des comptables et adjudicataires à 96.8%. Les 320 dossiers échus (2.3 Mds FCFA) nécessitent une purge juridique rapide.`,
        recommendations: [
          { title: 'Mainlevée ou renouvellement des 320 dossiers échus', desc: 'Notifier immédiatement les banques garantes et les titulaires de marchés.', priority: 'CRITIQUE' },
          { title: 'Centralisation des consignations judiciaires au CUT', desc: 'Veiller au rapatriement systématique des dépôts de cautionnement.', priority: 'HAUTE' }
        ]
      };
    }

    // 7. COMPTE DE GESTION & COUR DES COMPTES
    if (q.includes('compte de gestion') || q.includes('cour des comptes') || q.includes('reddition')) {
      const labels = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026 (Actuel)', '2027 (Projeté)'];
      const confData = [82.0, 85.5, 88.0, 91.2, 93.0, 94.8, 95.5, m?.tauxConformiteCompteGestion || 96.4, 98.5];
      const quitData = [79.0, 83.0, 86.2, 89.0, 91.5, 93.2, 94.0, m?.quitusTransmisPct || 95.2, 98.0];

      return {
        id: 'compte_gestion_reddition',
        title: 'Simulation Conformité & Reddition des Comptes de Gestion',
        subtitle: 'Audit des comptables principaux (TGE, PGT, RGF, PGA) et visa Cour des Comptes',
        serviceName: 'Service Compte de Gestion',
        badgeClass: 'bg-success-subtle text-success border',
        unit: '%',
        kpis: [
          { label: 'Conformité des Liasses', value: `${m?.tauxConformiteCompteGestion || 96.4}%`, trend: 'Seuil ≥ 90%', status: 'success' },
          { label: 'Volume Audité', value: `${m?.cgVolumeAuditeMilliards || 482.5} Mds FCFA`, status: 'info' },
          { label: 'Quitus Transmis', value: `${m?.quitusTransmisPct || 95.2}%`, status: 'success' },
          { label: 'Restes en Instance', value: `${m?.restesEnInstanceCGMilliards || 11.26} Mds`, trend: 'À apurer', status: 'warning' }
        ],
        labels,
        datasets: [
          {
            label: 'Conformité des Comptes (%)',
            data: confData,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.15)',
            fill: true,
            tension: 0.35
          },
          {
            label: 'Quitus Transmis à la Cour (%)',
            data: quitData,
            borderColor: '#0284c7',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            fill: false,
            tension: 0.3
          }
        ],
        scenarios: [
          { key: 'BASE', label: 'Tendance Base', description: 'Progression vers 98.5% de conformité et zéro rejet.', projValue: '98.5%', data: confData },
          { key: 'OPTIMISTE', label: 'Reddition Exemplaire (100%)', description: 'Transmission anticipée de tous les comptes certifiés.', projValue: '100%', data: [82.0, 85.5, 88.0, 91.2, 93.0, 94.8, 95.5, 96.4, 100] },
          { key: 'STRESS', label: 'Scénario Retard de Clôture', description: 'Suspension de quitus pour dossiers incomplets à 91.0%.', projValue: '91.0%', data: [82.0, 85.5, 88.0, 91.2, 93.0, 94.8, 95.5, 96.4, 91.0] }
        ],
        reportSummary: `Excellente conformité globale à 96.4% sur les 482.5 Mds FCFA audités. La priorité consiste à apurer les 11.26 Mds FCFA en instance avant transmission définitive des liasses.`,
        recommendations: [
          { title: 'Apurement des 11.26 Mds en instance', desc: 'Compléter les pièces justificatives des comptables défaillants.', priority: 'CRITIQUE' },
          { title: 'Transmission des quitus à la Cour des Comptes', desc: 'Respecter le calendrier légal de dépôt des comptes certifiés.', priority: 'HAUTE' }
        ]
      };
    }

    // 8. COCKPIT CONSOLIDÉ / BILAN SYNTHÉTIQUE / DÉFAUT
    return this.getDefaultChartContext();
  }

  public getDefaultChartContext(): ChatChartContext {
    const m = this.realMetrics;
    const rec = m?.totalRecettesMilliards || 1254.0;
    const reg = m?.totalReglementsMilliards || 1138.2;
    const liq = m?.liquiditeNetteCutMilliards || 1542.3;
    const prev27 = m?.prevision2027 || 1321.7;

    const labels = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026 (Actuel)', '2027 (Projeté)'];
    const recData = [890.5, 945.2, 1010.4, 1085.6, 1140.0, 1198.5, 1225.0, rec, prev27];
    const regData = [810.0, 865.0, 930.5, 995.0, 1040.2, 1088.0, 1110.5, reg, 1195.0];
    const cutData = [1120.4, 1195.0, 1260.8, 1345.2, 1420.5, 1488.0, 1515.2, liq, 1631.8];

    return {
      id: 'cockpit_global_dgtcp',
      title: 'Cockpit Consolidé & Trajectoire Multi-Services DGTCP',
      subtitle: 'Dynamique comparative des Recettes, Règlements et Liquidité CUT 2019-2027',
      serviceName: 'Synthèse Décisionnelle',
      badgeClass: 'bg-primary text-white',
      unit: 'Mds FCFA',
      kpis: [
        { label: 'Recettes Mobilisées', value: `${rec} Mds FCFA`, trend: '+5.4%', status: 'success' },
        { label: 'Règlements Exécutés', value: `${reg} Mds FCFA`, trend: 'Maîtrisé', status: 'info' },
        { label: 'Liquidité Nette CUT', value: `${liq} Mds FCFA`, trend: '+5.8%', status: 'success' },
        { label: 'Score Global Conformité', value: '94.8% (Élevé)', status: 'success' }
      ],
      labels,
      datasets: [
        {
          label: 'Recettes Mobilisées (Mds FCFA)',
          data: recData,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: false,
          tension: 0.35
        },
        {
          label: 'Règlements Exécutés (Mds FCFA)',
          data: regData,
          borderColor: '#F77F00',
          backgroundColor: 'rgba(247, 127, 0, 0.1)',
          fill: false,
          tension: 0.35
        },
        {
          label: 'Liquidité Nette CUT (Mds FCFA)',
          data: cutData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.35
        }
      ],
      scenarios: [
        { key: 'BASE', label: 'Prévision de référence', description: 'Tendance linéaire selon dynamique historique observée.', projValue: '1 631.8 Mds (CUT) / 1 321.7 Mds (Recettes)', data: cutData },
        { key: 'OPTIMISTE', label: 'Scénario Favorable (+8%)', description: 'Accélération de la mobilisation et apurement accéléré des créances.', projValue: '1 673.4 Mds (CUT) / 1 366.8 Mds (Recettes)', data: [1120.4, 1195.0, 1260.8, 1345.2, 1420.5, 1488.0, 1515.2, liq, 1673.4] },
        { key: 'STRESS', label: 'Scénario Prudentiel (-10%)', description: 'Tension de trésorerie avec contraction de la marge CUT.', projValue: '1 388.0 Mds (CUT) / 1 242.0 Mds (Recettes)', data: [1120.4, 1195.0, 1260.8, 1345.2, 1420.5, 1488.0, 1515.2, liq, 1388.0] }
      ],
      reportSummary: 'Situation financière et prudentielle globale robuste pour l\'ensemble des 7 services DGTCP. L\'excédent structurel du Compte Unique du Trésor assure la solvabilité régalienne.',
      recommendations: [
        { title: 'Priorité 1 : Apurement des Restes à Payer > 90 jours (34.9 Mds)', desc: 'Purger les créances les plus anciennes pour préserver la confiance des partenaires économiques.', priority: 'CRITIQUE' },
        { title: 'Priorité 2 : Porter la régularisation des Lettres d\'Avance au-dessus de 90%', desc: 'Renforcer le contrôle sur les ordonnateurs délégués en retard de justificatifs.', priority: 'HAUTE' },
        { title: 'Priorité 3 : Poursuivre la dématérialisation intégrale des régies', desc: 'Rapprocher en temps réel les régies déconcentrées et sécuriser les encaissements.', priority: 'MOYENNE' }
      ]
    };
  }

  private searchApplicationData(question: string): { html: string; matchedIndicator?: ComparativeIndicator } | null {
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const qNorm = norm(question);
    const m = this.realMetrics;

    const yearMatch = qNorm.match(/\b(2019|202[0-9]|203[01])\b/);
    if (yearMatch) {
      const targetYear = Number(yearMatch[1]);
      const hist = m?.historiqueFlux.find(h => h.annee === targetYear);
      if (hist) {
        const solde = Number((hist.recettesMilliards - hist.reglementsMilliards).toFixed(1));
        return {
          html: `
            <div class="p-1 text-dark">
              <div class="fw-bold text-dark mb-2 border-bottom pb-1">Données Exercice ${targetYear}</div>
              <ul class="list-unstyled mb-2">
                <li><strong>• Recettes mobilisées :</strong> <strong>${hist.recettesMilliards} Mds FCFA</strong></li>
                <li><strong>• Règlements exécutés :</strong> <strong>${hist.reglementsMilliards} Mds FCFA</strong></li>
                <li><strong>• Solde :</strong> <span class="fw-bold ${solde >= 0 ? 'text-success' : 'text-danger'}">${solde >= 0 ? '+' : ''}${solde} Mds FCFA</span></li>
                <li><strong>• Liquidité CUT :</strong> <strong>${hist.liquiditeMilliards} Mds FCFA</strong></li>
              </ul>
            </div>`
        };
      }
    }

    if ((qNorm.includes('ministere') || qNorm.includes('secteur') || qNorm.includes('repartition') || qNorm.includes('depense')) && m?.repartitionMinisteresDepenses?.length) {
      const items = m.repartitionMinisteresDepenses.map(d => `<li><strong>• ${d.name} :</strong> <strong>${d.value} Mds FCFA</strong></li>`).join('');
      return {
        html: `
          <div class="p-1 text-dark">
            <div class="fw-bold text-dark mb-2 border-bottom pb-1">Dépenses par Ministère (${this.currentAnnee})</div>
            <ul class="list-unstyled mb-2">${items}</ul>
          </div>`
      };
    }

    const stopWords = new Set(['quel', 'quelle', 'quels', 'quelles', 'est', 'sont', 'les', 'des', 'une', 'sur', 'pour', 'dans', 'avec', 'par', 'que', 'qui', 'comment', 'combien', 'etat', 'situation', 'donne', 'moi', 'analyse', 'voir', 'plus', 'tout', 'tous']);
    const tokens = qNorm.split(/[^a-z0-9]+/).filter(t => t.length >= 3 && !stopWords.has(t));
    if (tokens.length === 0 || this.allIndicators.length === 0) return null;

    const scored = this.allIndicators
      .map(ind => {
        const hay = norm(`${ind.nom} ${ind.domaineLabel} ${ind.description}`);
        let score = 0;
        for (const tok of tokens) {
          if (hay.includes(tok)) score += norm(ind.nom).includes(tok) ? 3 : 1;
        }
        return { ind, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    if (scored.length === 0) return null;

    const rows = scored.map(({ ind }) => {
      const cls = ind.statut === 'PROGRESSION' ? 'text-success' : (ind.statut === 'REGRESSION' ? 'text-danger' : 'text-secondary');
      return `<li><strong>• [${ind.domaineLabel}] ${ind.nom} :</strong> <strong>${ind.valeurA} ${ind.unite}</strong> <span class="${cls} fw-bold">(${ind.deltaPct >= 0 ? '+' : ''}${ind.deltaPct}%)</span></li>`;
    }).join('');

    return {
      matchedIndicator: scored[0].ind,
      html: `
        <div class="p-1 text-dark">
          <div class="fw-bold text-dark mb-2 border-bottom pb-1">Données extraites (${scored.length} indicateur(s))</div>
          <ul class="list-unstyled mb-2">${rows}</ul>
          <div class="very-small text-muted">${scored[0].ind.description}</div>
        </div>`
    };
  }

  private formatResponse(html: string): string {
    if (!html) return html;
    return html.replace(/(<li>\s*)•\s*(?!<strong>•<\/strong>)/g, '$1<strong>•</strong> ');
  }

  clearHistory() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY + '_active');
    this.threads.set([]);
    this.createNewThread();
  }
}
