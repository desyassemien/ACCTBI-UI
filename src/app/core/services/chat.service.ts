import { Injectable, signal, effect, computed, inject } from '@angular/core';
import { PilotageRealDataService, RealDataPilotageMetrics } from './pilotage-real-data.service';
import { PilotageBenchmarkService, ComparativeIndicator } from './pilotage-benchmark.service';

export interface ChatAction {
  label: string;
  icon: string;
  type: 'question' | 'navigate' | 'download';
  payload?: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
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
  private readonly MAX_THREADS = 4;

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
          content: 'Bonjour ! Je suis votre Assistant Décisionnel et Prospectif (DGTCP / ACCT). Posez-moi une question sur vos indicateurs, la Trésorerie, les RAP ou la Comptabilité.', 
          timestamp: new Date() 
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
              <li><strong>• Projection OLS 2027 :</strong> <span class="text-success fw-bold">${prev27} Mds FCFA</span> (<strong>+5,4%/an</strong>)</li>
            </ul>
            <div class="very-small text-muted">Solde net du CUT préservé à <strong>${liq} Mds FCFA</strong>.</div>
          </div>`;
      }
    }

    response = this.formatResponse(response);

    const actions: ChatAction[] = [
      { label: 'Simuler sur le graphe', icon: 'fas fa-chart-line', type: 'navigate', payload: '/decision-ia' },
      { label: 'Plan d’action détaillé', icon: 'fas fa-tasks', type: 'question', payload: `Génère un plan d'action pour ${matchedInd?.nom || userText.slice(0, 40)}` },
      { label: 'Télécharger PDF', icon: 'fas fa-download', type: 'download', payload: response }
    ];

    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      actions
    };

    this.updateActiveThread(aiMessage);
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
