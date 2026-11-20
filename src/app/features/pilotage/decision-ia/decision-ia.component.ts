import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData } from 'chart.js';
import {
  PilotageAiService,
  AiSummaryResult,
  PredictiveProjection
} from '../../../core/services/pilotage-ai.service';
import {
  PilotageRealDataService,
  RealDataPilotageMetrics
} from '../../../core/services/pilotage-real-data.service';
import {
  PilotageBenchmarkService,
  ComparativeIndicator,
  ServiceDomainFilter
} from '../../../core/services/pilotage-benchmark.service';
import {
  ChatService,
  ChatAction,
  ChatMessage,
  ChatThread
} from '../../../core/services/chat.service';

@Component({
  selector: 'app-decision-ia',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  template: `
<div class="decision-ia-container py-3">

  <!-- ======================================================== -->
  <!-- 1. EN-TÊTE & FILTRES DÉCISIONNELS                        -->
  <!-- ======================================================== -->
  <div class="decision-header-card card shadow-sm border-0 mb-3 px-4 py-3">
    <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge-dgtcp-pill"><i class="fas fa-brain me-1"></i> INTELLIGENCE DÉCISIONNELLE DGTCP</span>
        </div>
        <h2 class="m-0 fw-bold title-text mb-1">Décision & Prospective IA</h2>
        <p class="text-muted m-0 header-subtitle mt-1">
          Génération de notes stratégiques pour la Direction Générale du Trésor, détection des écarts comptables et projections prédictives.
        </p>
      </div>

      <div class="decision-filters d-flex flex-wrap flex-xl-nowrap justify-content-lg-end align-items-end gap-2">
        <!-- Service -->
        <div class="filter-item-container" style="min-width: 170px;">
          <label class="form-label text-uppercase">
            <i class="fas fa-layer-group text-primary me-1"></i> Service
          </label>
          <select class="form-select form-select-sm fw-semibold"
                  [ngModel]="selectedDomain"
                  (ngModelChange)="onServiceChange($event)">
            @for (d of domainsList; track d.id) {
              <option [value]="d.id">{{ d.label }}</option>
            }
          </select>
        </div>

        <!-- Indicateur (lié au Service) -->
        <div class="filter-item-container" style="min-width: 210px; max-width: 260px;">
          <label class="form-label text-uppercase">
            <i class="fas fa-chart-line text-primary me-1"></i> Indicateur
          </label>
          <select class="form-select form-select-sm fw-semibold"
                  [ngModel]="selectedIndicatorCode"
                  (ngModelChange)="onIndicatorChange($event)">
            <option value="TOUS">Tous les indicateurs</option>
            @for (ind of indicatorsForService; track ind.code) {
              <option [value]="ind.code">{{ ind.nom }}</option>
            }
          </select>
        </div>

        <!-- Exercice -->
        <div class="filter-item-container" style="width: 100px; flex-shrink: 0;">
          <label class="form-label text-uppercase">
            <i class="far fa-calendar-alt text-primary me-1"></i> Exercice
          </label>
          <select class="form-select form-select-sm fw-bold" [(ngModel)]="selectedAnnee" (change)="onFilterChange()">
            @for (ex of exerciceList; track ex) {
              <option [value]="ex">{{ ex }}</option>
            }
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- ======================================================== -->
  <!-- 2. DOUBLE LIGNE DE KPIS (OPTION 3 : COCKPIT SPARKLINE)   -->
  <!-- ======================================================== -->
  @if (currentSummary) {
    <div class="mb-3">
      <!-- Ligne 1 : Indicateurs Clés Métier & Prudentiels (adaptés au Service sélectionné) -->
      <div class="row g-2 mb-2">
        @for (card of serviceKpiCards; track card.title) {
          <div class="col-xl-3 col-md-6">
            <div class="card kpi-spark-card shadow-sm border-0 h-100" [ngClass]="card.cardClass">
              <div class="card-body p-3 d-flex flex-column justify-content-between">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="kpi-spark-title" [ngClass]="card.titleClass">
                    <i [class]="card.icon + ' me-1'"></i> {{ card.title }}
                  </span>
                  <span class="pulse-dot" [ngClass]="card.dotClass" [title]="card.dotTitle"></span>
                </div>
                <div class="d-flex align-items-center justify-content-between my-1">
                  <div>
                    <div class="kpi-spark-value" [ngClass]="card.valueClass">
                      {{ card.value }}@if (card.suffix) {<small class="text-muted fs-6">{{ card.suffix }}</small>}
                    </div>
                    <span class="kpi-spark-unit text-muted">{{ card.unit }}</span>
                  </div>
                  <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
                    <polyline fill="none" [attr.stroke]="card.stroke" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                              [attr.points]="card.points"/>
                    <circle cx="80" [attr.cy]="card.cy" r="3.2" [attr.fill]="card.stroke"/>
                  </svg>
                </div>
                <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                  <span class="text-muted very-small" [title]="card.footLeftTip" style="cursor: help;">
                    {{ card.footLeft }}
                  </span>
                  <span class="text-muted very-small fw-semibold" [title]="card.footRightTip" style="cursor: help; text-decoration: underline dotted #94a3b8;">
                    {{ card.footRight }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Ligne 2 : Projections & Modélisations Prédictives IA -->
      <div class="row g-2">
        @for (insight of currentSummary.predictiveInsights; track insight.label; let idx = $index) {
          <div class="col-xl-3 col-md-6">
            <div class="card kpi-spark-card shadow-sm border-0 h-100"
                 [ngClass]="idx === 0 ? 'kpi-spark-navy' : (idx === 1 ? 'kpi-spark-green' : (idx === 2 ? 'kpi-spark-orange' : 'kpi-spark-sky'))">
              <div class="card-body p-3 d-flex flex-column justify-content-between">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="kpi-spark-title text-truncate text-muted">
                    <i class="fas me-1" [ngClass]="idx === 0 ? 'fa-chart-line text-primary' : (idx === 1 ? 'fa-bullseye text-success' : (idx === 2 ? 'fa-layer-group text-warning' : 'fa-shield-alt text-info'))"></i>
                    {{ insight.label }}
                  </span>
                  <span class="badge" [ngClass]="{
                    'bg-success-subtle text-success border': insight.trend === 'UP',
                    'bg-info-subtle text-info-emphasis border': insight.trend === 'DOWN',
                    'bg-secondary-subtle text-secondary border': insight.trend === 'STABLE'
                  }">
                    <i class="fas me-1" [ngClass]="{
                      'fa-arrow-up': insight.trend === 'UP',
                      'fa-arrow-down': insight.trend === 'DOWN',
                      'fa-minus': insight.trend === 'STABLE'
                    }"></i>{{ insight.confidence }}%
                  </span>
                </div>

                <div class="d-flex align-items-center justify-content-between my-1">
                  <div>
                    <div class="kpi-spark-value" [ngStyle]="{
                      'color': idx === 0 ? '#1A365D' : (idx === 1 ? '#16a34a' : (idx === 2 ? '#ea580c' : '#0284c7'))
                    }">
                      {{ insight.forecast }}
                    </div>
                    <span class="kpi-spark-unit text-muted">{{ insight.subLabel }}</span>
                  </div>
                  <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
                    <polyline fill="none"
                              [attr.stroke]="idx === 0 ? '#1A365D' : (idx === 1 ? '#16a34a' : (idx === 2 ? '#ea580c' : '#0284c7'))"
                              stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                              [attr.points]="idx % 2 === 0 ? '4,28 22,20 42,22 62,12 80,6' : '4,24 22,18 42,16 62,10 80,4'"/>
                    <circle cx="80" [attr.cy]="idx % 2 === 0 ? 6 : 4" r="3.2"
                            [attr.fill]="idx === 0 ? '#1A365D' : (idx === 1 ? '#16a34a' : (idx === 2 ? '#ea580c' : '#0284c7'))"/>
                  </svg>
                </div>

                <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                  <span class="text-muted very-small" title="Projection statistique calculée à partir des tendances des exercices précédents" style="cursor: help;">
                    Tendance prévue
                  </span>
                  <span class="fw-semibold text-dark very-small" title="Écart ou variation attendue selon les algorithmes prédictifs" style="cursor: help; text-decoration: underline dotted #94a3b8;">
                    {{ insight.subValue }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  }

  <!-- ======================================================== -->
  <!-- 3. SYNTHÈSE EXÉCUTIVE (7 COLS) + ASSISTANT IA (5 COLS)   -->
  <!-- ======================================================== -->
  <div class="row g-4 mb-4">
    <!-- Colonne Gauche : Note Stratégique -->
    <div class="col-lg-7">
      <div class="card shadow-sm border-0 summary-card h-100">
        <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center gap-3">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <h5 class="m-0 fw-bold text-navy">Synthèse Exécutive Décisionnelle</h5>
            <span class="badge-priority-pulse">
              <i class="fas fa-bookmark text-warning me-1"></i> Lecture Prioritaire DGTCP
            </span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 px-3 shadow-sm"
                    (click)="copySummary()">
              <i class="fas" [ngClass]="isCopied ? 'fa-check text-success' : 'fa-copy'"></i>
              <span class="fw-semibold">{{ isCopied ? 'Note Copiée !' : 'Copier' }}</span>
            </button>
            <button class="btn btn-sm btn-outline-danger d-flex align-items-center gap-2 px-3 shadow-sm"
                    (click)="exportDecisionPdf()">
              <i class="fas fa-file-pdf"></i>
              <span class="fw-semibold">Export PDF</span>
            </button>
          </div>
        </div>

        @if (currentSummary) {
          <div class="card-body p-4">
            @if (selectedIndicator; as ind) {
              <div class="p-3 rounded-3 mb-4 border bg-light d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle mb-1">
                    {{ ind.domaineLabel }} — Focus Indicateur
                  </span>
                  <h6 class="m-0 fw-bold text-navy">{{ ind.nom }}</h6>
                  <small class="text-muted">{{ ind.description }}</small>
                </div>
                <div class="d-flex align-items-center gap-3">
                  <div class="text-end">
                    <div class="fs-5 fw-bold text-navy">{{ ind.valeurA | number:'1.0-2' }} <small class="text-muted fs-6">{{ ind.unite }}</small></div>
                    <small class="text-muted">Ex. {{ selectedAnnee - 1 }} : {{ ind.valeurB | number:'1.0-2' }} {{ ind.unite }}</small>
                  </div>
                  <span class="badge px-2 py-1" [ngClass]="{
                    'bg-success text-white': ind.statut === 'PROGRESSION',
                    'bg-danger text-white': ind.statut === 'REGRESSION',
                    'bg-secondary text-white': ind.statut === 'STABLE'
                  }">
                    {{ ind.deltaPct >= 0 ? '+' : '' }}{{ ind.deltaPct }}%
                  </span>
                </div>
              </div>
            }

            <div class="executive-lead p-3 rounded-3 mb-4">
              <div class="d-flex align-items-center mb-2 pb-2 border-bottom">
                <span class="very-small fw-bold text-uppercase text-navy">
                  <i class="fas fa-bullhorn text-warning me-1"></i> CONSTAT STRATÉGIQUE MAJEUR ({{ currentSummary.domain }})
                </span>
              </div>
              <div class="lead-text" [innerHTML]="currentSummary.executiveSummary"></div>
            </div>

            <div class="mb-4">
              <h6 class="fw-bold text-success d-flex align-items-center gap-2 mb-2">
                <i class="fas fa-check-circle"></i> Points Forts & Avancées Opérationnelles
              </h6>
              <ul class="list-group list-group-flush">
                @for (h of currentSummary.keyHighlights; track h) {
                  <li class="list-group-item px-0 py-2">
                    <i class="fas fa-chevron-right text-success me-2 small"></i> {{ h }}
                  </li>
                }
              </ul>
            </div>

            <div class="mb-4">
              <h6 class="fw-bold text-warning-emphasis d-flex align-items-center gap-2 mb-2">
                <i class="fas fa-exclamation-triangle text-warning"></i> Vulnérabilités & Écarts Comptables Identifiés
              </h6>
              <ul class="list-group list-group-flush">
                @for (r of currentSummary.risksAndGaps; track r) {
                  <li class="list-group-item px-0 py-2 d-flex justify-content-between align-items-center gap-2">
                    <span><i class="fas fa-chevron-right text-warning me-2 small"></i> {{ r }}</span>
                    <button type="button" class="btn btn-sm btn-action-analyser text-nowrap py-1 px-2.5 very-small fw-semibold"
                            (click)="analyserRisqueAvecIa(r)" title="Demander un diagnostic détaillé">
                      <i class="fas fa-magic me-1"></i> Analyser
                    </button>
                  </li>
                }
              </ul>
            </div>

            <div>
              <h6 class="fw-bold text-primary d-flex align-items-center gap-2 mb-2">
                <i class="fas fa-lightbulb"></i> Recommandations & Arbitrages DGTCP / ACCT
              </h6>
              <ul class="list-group list-group-flush">
                @for (rec of currentSummary.recommendations; track rec) {
                  <li class="list-group-item px-0 py-2 d-flex justify-content-between align-items-center gap-2">
                    <span><i class="fas fa-arrow-circle-right text-primary me-2"></i> {{ rec }}</span>
                    <button type="button" class="btn btn-sm btn-action-plan text-nowrap py-1 px-2.5 very-small fw-semibold"
                            (click)="genererPlanActionIa(rec)" title="Générer un plan d'action avec échéancier">
                      <i class="fas fa-tasks me-1"></i> Plan d'action
                    </button>
                  </li>
                }
              </ul>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Colonne Droite : Assistant d'Analyse Décisionnelle IA -->
    <div class="col-lg-5">
      <div class="card shadow-sm border-0 chat-card h-100 d-flex flex-column">
        <div class="card-header bg-white border-bottom py-2.5 px-3">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <i class="fas fa-robot text-primary fs-5"></i>
              <div>
                <h5 class="m-0 fw-bold text-navy fs-6">Assistant Décisionnel</h5>
                <span class="very-small text-muted">
                  @if (showHistory) {
                    Historique ({{ chatService.threads().length }} conversation(s))
                  } @else {
                    <i class="fas fa-circle text-success me-1" style="font-size: 7px;"></i> Conseil stratégique & simulations
                  }
                </span>
              </div>
            </div>
            <div class="d-flex align-items-center gap-1.5">
              <!-- Bouton Dédié : Nouvelle discussion -->
              <button type="button" class="btn btn-sm btn-outline-primary py-1 px-2.5 very-small fw-bold d-flex align-items-center gap-1.5 rounded-pill shadow-xs"
                      (click)="startNewChat()" title="Démarrer une nouvelle discussion">
                <i class="fas fa-plus"></i>
                <span>Nouvelle discussion</span>
              </button>
              <!-- Bouton Dédié : Historique -->
              <button type="button" class="btn btn-sm py-1 px-2.5 very-small fw-bold d-flex align-items-center gap-1.5 rounded-pill shadow-xs"
                      [ngClass]="showHistory ? 'btn-primary text-white' : 'btn-light border text-navy'"
                      (click)="toggleHistory()" [title]="showHistory ? 'Fermer l’historique' : 'Consulter l’historique des conversations'">
                <i class="fas fa-history"></i>
                <span>Historique</span>
                @if (chatService.threads().length > 0) {
                  <span class="badge rounded-pill" [ngClass]="showHistory ? 'bg-white text-primary' : 'bg-primary-subtle text-primary border border-primary-subtle'" style="font-size: 0.65rem;">
                    {{ chatService.threads().length }}
                  </span>
                }
              </button>
            </div>
          </div>
        </div>

        @if (showHistory) {
          <!-- Vue Historique des conversations -->
          <div class="card-body p-3 chat-body flex-grow-1 overflow-auto" style="max-height: 440px;">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-sm btn-icon btn-light border rounded-circle" (click)="toggleHistory()" title="Retour à la discussion">
                  <i class="fas fa-arrow-left"></i>
                </button>
                <span class="fw-bold fs-7 text-navy">Historique des conversations</span>
              </div>
              <button type="button" class="btn btn-sm btn-primary py-1 px-2.5 very-small rounded-pill fw-bold" (click)="startNewChat()">
                <i class="fas fa-plus me-1"></i> Nouvelle discussion
              </button>
            </div>

            <div class="list-group list-group-flush rounded-3 shadow-sm border mb-3">
              @for (thread of chatService.threads(); track thread.id) {
                <div class="list-group-item list-group-item-action p-2.5 d-flex justify-content-between align-items-center gap-2"
                     [class.active-thread-item]="thread.id === chatService.activeThreadId()"
                     style="cursor: pointer;"
                     (click)="selectThread(thread.id)">
                  <div class="flex-grow-1 overflow-hidden">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="fw-bold fs-8 text-truncate pe-2 text-navy">
                        <i class="fas fa-comment-dots text-primary me-1.5 opacity-75"></i>{{ thread.title }}
                      </span>
                      <span class="very-small text-muted text-nowrap">{{ thread.lastUpdated | date:'dd/MM HH:mm' }}</span>
                    </div>
                    <p class="m-0 very-small text-secondary text-truncate opacity-75">
                      {{ getSnippet(thread.messages[thread.messages.length - 1]?.content || '') }}
                    </p>
                  </div>
                  <button type="button" class="btn btn-sm btn-icon text-muted hover-danger border-0 p-1"
                          (click)="deleteThread($event, thread.id)" title="Supprimer cette discussion">
                    <i class="fas fa-trash-alt fs-8"></i>
                  </button>
                </div>
              }
            </div>

            <div class="d-flex justify-content-between align-items-center px-1">
              <button type="button" class="btn btn-link btn-sm text-muted text-decoration-none very-small p-0" (click)="toggleHistory()">
                <i class="fas fa-chevron-left me-1"></i> Revenir à la discussion active
              </button>
              <button type="button" class="btn btn-link btn-sm text-danger text-decoration-none very-small p-0" (click)="clearAllHistory()">
                <i class="fas fa-trash-alt me-1"></i> Tout effacer
              </button>
            </div>
          </div>
        } @else {
          <!-- Vue Messages actifs -->
          <div class="card-body p-3 chat-body flex-grow-1 overflow-auto" style="max-height: 440px;" #chatBody>
            @for (msg of chatService.activeMessages(); track $index) {
              <div class="chat-message mb-3" [class.user-msg]="msg.role === 'user'" [class.ai-msg]="msg.role === 'assistant'">
                <div class="message-bubble p-3 rounded-3 shadow-sm">
                  <div class="very-small fw-bold mb-1 opacity-75 d-flex justify-content-between gap-3">
                    <span>{{ msg.role === 'assistant' ? 'Observatoire IA DGTCP' : 'Vous' }}</span>
                    <span>{{ msg.timestamp | date:'HH:mm' }}</span>
                  </div>
                  <div class="message-content small" [innerHTML]="msg.content"></div>
                  @if (msg.actions && msg.actions.length > 0) {
                    <div class="d-flex flex-wrap mt-2 pt-2 border-top" style="gap: 8px;">
                      @for (act of msg.actions; track act.label) {
                        <button type="button"
                                class="btn btn-sm btn-outline-primary rounded-pill py-0 px-2 very-small fw-semibold"
                                (click)="executeChatAction(act)">
                          <i [class]="act.icon + ' me-1'"></i>{{ act.label }}
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            @if (chatService.isGenerating()) {
              <div class="text-center my-3 text-muted">
                <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
                <p class="small mt-1 mb-0">Analyse en cours...</p>
              </div>
            }
          </div>

          <!-- Questions Suggérées -->
          <div class="border-top bg-light p-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="very-small fw-bold text-uppercase text-muted">
                <i class="fas fa-bolt text-warning me-1"></i> Questions rapides suggérées
              </span>
            </div>
            <div class="d-flex flex-column gap-1.5">
              @for (q of suggestedQuestions; track q) {
                <button type="button"
                        class="btn btn-sm btn-outline-secondary text-start d-flex align-items-center justify-content-between py-1.5 px-2.5"
                        (click)="askQuestion(q)">
                  <span class="text-truncate">{{ q }}</span>
                  <i class="fas fa-chevron-right ms-2 text-primary small"></i>
                </button>
              }
            </div>
          </div>

          <!-- Formulaire Chat -->
          <div class="card-footer bg-white border-top p-3">
            <form (ngSubmit)="askQuestion()" class="d-flex gap-2">
              <input type="text" class="form-control form-control-sm"
                     placeholder="Posez une question sur la Trésorerie, les RAP, la BCEAO..."
                     [(ngModel)]="userQuestion" name="chatQuestion" [disabled]="chatService.isGenerating()">
              <button type="submit" class="btn btn-sm btn-primary px-3" [disabled]="!userQuestion.trim() || chatService.isGenerating()">
                <i class="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        }
      </div>
    </div>
  </div>

  <!-- ======================================================== -->
  <!-- 4. COURBE DE TRAJECTOIRE PRÉDICTIVE IA                   -->
  <!-- ======================================================== -->
  <div class="card shadow-sm border-0 chart-card" #predictiveChartCard>
    <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div>
        <h5 class="m-0 fw-bold text-navy">
          <i class="fas fa-chart-area text-primary me-2"></i>
          @if (selectedIndicator; as ind) {
            Trajectoire Prédictive : {{ ind.nom }} ({{ ind.unite }})
          } @else {
            Trajectoire Prédictive : Recettes Mobilisées vs Règlements Exécutés — {{ selectedServiceLabel }}
          }
        </h5>
        <p class="text-muted small m-0 mt-1">
          Historique certifié (2019-{{ selectedAnnee }}) et Prévisions (2027-2031) en {{ selectedIndicator ? selectedIndicator.unite : 'Milliards FCFA' }}
        </p>
      </div>
      <div class="d-flex flex-wrap align-items-center" style="gap: 6px;">
        <button type="button" class="btn btn-sm rounded-pill fw-semibold py-1 px-2" style="font-size: 0.78rem;"
                [ngClass]="activeScenario === 'OPTIMISTE' ? 'btn-success text-white' : 'btn-outline-success'"
                (click)="applyScenarioPreset('OPTIMISTE')">
          <i class="fas fa-arrow-up me-1"></i> Si réformes appliquées
        </button>
        <button type="button" class="btn btn-sm rounded-pill fw-semibold py-1 px-2" style="font-size: 0.78rem;"
                [ngClass]="activeScenario === 'BASE' ? 'btn-navy text-white' : 'btn-outline-secondary'"
                (click)="applyScenarioPreset('BASE')">
          <i class="fas fa-minus me-1"></i> Si rythme actuel maintenu
        </button>
        <button type="button" class="btn btn-sm rounded-pill fw-semibold py-1 px-2" style="font-size: 0.78rem;"
                [ngClass]="activeScenario === 'STRESS' ? 'btn-danger text-white' : 'btn-outline-danger'"
                (click)="applyScenarioPreset('STRESS')">
          <i class="fas fa-arrow-down me-1"></i> Si ralentissement (-5%)
        </button>
      </div>
    </div>

    <!-- Explication explicite Cause -> Effet du scénario choisi -->
    <div class="px-4 py-2 bg-light border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2 small">
      <div class="text-dark">
        @if (customSimulationNote) {
          <strong [ngClass]="activeScenario === 'STRESS' ? 'text-danger' : 'text-success'">Recommandation simulée :</strong>
          {{ customSimulationNote }}
        } @else if (activeScenario === 'OPTIMISTE') {
          <strong class="text-success">Effet des réformes :</strong>
          Si l'on apure <strong>35%</strong> des RAP/LA et renforce le contrôle des régies &rarr; gain estimé de <strong>+6%</strong> sur les recettes d'ici 2031.
        } @else if (activeScenario === 'STRESS') {
          <strong class="text-danger">Impact d'un ralentissement :</strong>
          Si la collecte fiscale et douanière recule de <strong>-5%</strong> (sans apurement supplémentaire) &rarr; baisse directe des disponibilités CUT d'ici 2031.
        } @else {
          <strong class="text-navy">Situation de référence :</strong>
          Sans nouvelle réforme ni choc conjoncturel &rarr; poursuite du rythme historique constaté sur 2019-{{ selectedAnnee }}.
        }
      </div>
      <div class="d-flex align-items-center gap-2 text-nowrap">
        <span class="text-muted">Résultat prévu en 2031 :</span>
        <strong class="text-navy">{{ projected2031Value | number:'1.1-1' }} {{ selectedIndicator ? selectedIndicator.unite : 'Mds FCFA' }}</strong>
        @if (activeScenario !== 'BASE') {
          <span class="badge" [ngClass]="projected2031Delta >= 0 ? 'bg-success-subtle text-success border' : 'bg-danger-subtle text-danger border'">
            {{ projected2031Delta >= 0 ? '+' : '' }}{{ projected2031Delta | number:'1.1-1' }} vs rythme actuel
          </span>
        }
      </div>
    </div>

    <div class="card-body p-3">
      <div style="height: 360px; position: relative;">
        @if (isBrowser) {
          <canvas baseChart
                  [data]="predictiveChartData"
                  [options]="predictiveChartOptions"
                  [type]="'line'">
          </canvas>
        }
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
    .decision-ia-container { max-width: 1600px; margin: 0 auto; }
    .text-navy { color: #1A365D !important; }
    .btn-navy { background-color: #1A365D !important; border-color: #1A365D !important; color: #fff !important; }
    .very-small { font-size: 0.72rem; }

    .decision-header-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0 !important;
    }
    .title-text { color: #1A365D; font-size: 1.4rem; }
    .badge-dgtcp-pill {
      background: linear-gradient(135deg, #F77F00 0%, #e67500 100%);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
    }
    .filter-item-container label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 3px;
    }

    /* STYLES MODÈLE 3 : COCKPIT MICRO-SPARKLINE DÉCISIONNEL AVEC DÉGRADÉ LÉGER AU BAS */
    .kpi-spark-card {
      background: #ffffff;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-spark-card.kpi-spark-navy {
      background: linear-gradient(180deg, #ffffff 60%, rgba(26, 54, 93, 0.05) 100%) !important;
    }
    .kpi-spark-card.kpi-spark-green {
      background: linear-gradient(180deg, #ffffff 60%, rgba(22, 163, 74, 0.06) 100%) !important;
    }
    .kpi-spark-card.kpi-spark-sky {
      background: linear-gradient(180deg, #ffffff 60%, rgba(2, 132, 199, 0.06) 100%) !important;
    }
    .kpi-spark-card.kpi-spark-amber {
      background: linear-gradient(180deg, #ffffff 60%, rgba(245, 158, 11, 0.06) 100%) !important;
    }
    .kpi-spark-card.kpi-spark-orange {
      background: linear-gradient(180deg, #ffffff 60%, rgba(234, 88, 12, 0.06) 100%) !important;
    }
    .kpi-spark-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06) !important;
    }
    .kpi-spark-title {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .kpi-spark-value {
      font-size: 1.45rem;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.5px;
    }
    .kpi-spark-unit {
      font-size: 0.7rem;
      font-weight: 600;
      display: block;
      margin-top: 2px;
    }
    .kpi-sparkline {
      width: 82px;
      height: 36px;
      overflow: visible;
    }
    .pulse-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      display: inline-block;
      box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7);
    }
    .pulse-dot.bg-success {
      background-color: #16a34a;
      animation: pulse-green 2s infinite;
    }
    .pulse-dot.bg-warning {
      background-color: #f59e0b;
      animation: pulse-orange 2s infinite;
    }
    .pulse-dot.bg-info {
      background-color: #0284c7;
      animation: pulse-blue 2s infinite;
    }
    @keyframes pulse-green {
      0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.5); }
      70% { box-shadow: 0 0 0 6px rgba(22, 163, 74, 0); }
      100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
    }
    @keyframes pulse-orange {
      0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
      70% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }
    @keyframes pulse-blue {
      0% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.5); }
      70% { box-shadow: 0 0 0 6px rgba(2, 132, 199, 0); }
      100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
    }

    .summary-card, .chart-card {
      border-radius: 12px;
      border-top: 4px solid #1A365D !important;
    }
    .badge-priority-pulse {
      background: rgba(245, 158, 11, 0.15);
      color: #b45309;
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 10px;
    }
    .executive-lead {
      background: linear-gradient(135deg, rgba(26, 54, 93, 0.04) 0%, rgba(247, 127, 0, 0.04) 100%);
      border-left: 4px solid #1A365D;
    }

    .btn-action-analyser {
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.25) !important;
      color: #1d4ed8 !important;
      border-radius: 20px;
      transition: all 0.2s ease;

      i { color: #2563eb; }

      &:hover {
        background: rgba(37, 99, 235, 0.18) !important;
        border-color: #2563eb !important;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
      }
    }

    .btn-action-plan {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.25) !important;
      color: #047857 !important;
      border-radius: 20px;
      transition: all 0.2s ease;

      i { color: #10b981; }

      &:hover {
        background: rgba(16, 185, 129, 0.18) !important;
        border-color: #10b981 !important;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
      }
    }

    .chat-card { border-radius: 12px; }
    .chat-body { background-color: #f8fafc; }
    .active-thread-item {
      background-color: #f1f5f9 !important;
      border-left: 4px solid #F77F00 !important;
      font-weight: 600;
    }
    .hover-danger {
      transition: color 0.15s ease;
      &:hover { color: #dc2626 !important; }
    }
    .chat-message { display: flex; }
    .chat-message.user-msg { justify-content: flex-end; }
    .chat-message.user-msg .message-bubble { background-color: #1A365D; color: #fff; }
    .chat-message.ai-msg { justify-content: flex-start; }
    .chat-message.ai-msg .message-bubble { 
      background-color: #fff; 
      color: #111827; 
      border: 1px solid #e2e8f0; 
      p, div, li, span:not(.text-success):not(.text-danger):not(.badge) { color: #111827; }
      strong, b, .fw-bold { font-weight: 700 !important; color: #000000; }
      .text-success, .text-success.fw-bold { color: #15803d !important; font-weight: 700 !important; }
      .text-danger, .text-danger.fw-bold { color: #dc2626 !important; font-weight: 700 !important; }
      li { margin-bottom: 0.35rem; }
    }
    .message-bubble { max-width: 92%; }

    :host-context([data-bs-theme="dark"]) {
      .decision-header-card {
        background: #202127 !important;
        border: 1px solid rgba(148, 163, 184, 0.22) !important;
      }
      .title-text, .text-navy { color: #ffffff !important; }
      .text-muted, small.text-muted, span.text-muted, p.text-muted { color: #ffffff !important; }
      .filter-item-container label, .form-label { color: #ffffff !important; }
      .kpi-spark-title { color: #ffffff !important; }
      .kpi-card-v2 { background: #202127 !important; border: 1px solid #2e2f38 !important; }
      .kpi-spark-card {
        border: 1px solid #2e2f38 !important;
        background: #202127 !important;

        &.kpi-spark-navy {
          background: linear-gradient(180deg, #202127 45%, rgba(30, 58, 138, 0.28) 100%) !important;
          border-color: rgba(30, 58, 138, 0.35) !important;
        }
        &.kpi-spark-green {
          background: linear-gradient(180deg, #202127 45%, rgba(22, 163, 74, 0.22) 100%) !important;
          border-color: rgba(22, 163, 74, 0.35) !important;
        }
        &.kpi-spark-sky {
          background: linear-gradient(180deg, #202127 45%, rgba(2, 132, 199, 0.22) 100%) !important;
          border-color: rgba(2, 132, 199, 0.35) !important;
        }
        &.kpi-spark-amber {
          background: linear-gradient(180deg, #202127 45%, rgba(217, 119, 6, 0.22) 100%) !important;
          border-color: rgba(217, 119, 6, 0.35) !important;
        }
        &.kpi-spark-orange {
          background: linear-gradient(180deg, #202127 45%, rgba(249, 115, 22, 0.22) 100%) !important;
          border-color: rgba(249, 115, 22, 0.35) !important;
        }
      }
      .chat-card { background: #202127 !important; border: 1px solid #2e2f38 !important; }
      .card-header { background: #202127 !important; border-color: #2e2f38 !important; }
      .card-footer { background: #202127 !important; border-color: #2e2f38 !important; }
      .chat-body { background-color: #16171d !important; }
      .active-thread-item {
        background-color: #282932 !important;
        border-left: 4px solid #F77F00 !important;
        color: #ffffff !important;
      }
      .list-group-item {
        background-color: #202127 !important;
        border-color: #2e2f38 !important;
        color: #ffffff !important;
      }
      .list-group {
        border-color: #2e2f38 !important;
      }

      .form-control,
      input.form-control {
        background-color: #16171d !important;
        border: 1px solid #2e2f38 !important;
        color: #ffffff !important;

        &::placeholder,
        &::-webkit-input-placeholder,
        &::-moz-placeholder,
        &:-ms-input-placeholder {
          color: rgba(255, 255, 255, 0.65) !important;
          opacity: 1 !important;
        }

        &:focus {
          background-color: #202127 !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
          color: #ffffff !important;
        }
      }
      .chat-message.ai-msg .message-bubble { 
        background-color: #282932 !important; 
        color: #ffffff !important; 
        border: 1px solid #2e2f38 !important;
        p, div, li, span:not(.text-success):not(.text-danger):not(.badge) { color: #ffffff !important; }
        strong, b, .fw-bold { font-weight: 700 !important; color: #ffffff !important; }
        .text-dark { color: #ffffff !important; }
        .text-muted { color: #ffffff !important; }
      }
      .chat-message.user-msg .message-bubble { background-color: #ea580c !important; color: #ffffff !important; }
      .executive-lead { background: #18191f !important; border-color: #2e2f38 !important; }

      .btn-action-analyser {
        background: rgba(56, 189, 248, 0.14) !important;
        border: 1px solid rgba(56, 189, 248, 0.35) !important;
        color: #38bdf8 !important;

        i { color: #38bdf8 !important; }

        &:hover {
          background: rgba(56, 189, 248, 0.28) !important;
          border-color: #38bdf8 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 10px rgba(56, 189, 248, 0.3) !important;
        }
      }

      .btn-action-plan {
        background: rgba(74, 222, 128, 0.14) !important;
        border: 1px solid rgba(74, 222, 128, 0.35) !important;
        color: #4ade80 !important;

        i { color: #4ade80 !important; }

        &:hover {
          background: rgba(74, 222, 128, 0.28) !important;
          border-color: #4ade80 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 10px rgba(74, 222, 128, 0.3) !important;
        }
      }
    }
  `]
})
export class DecisionIaComponent implements OnInit, OnDestroy {
  @ViewChild('chatBody') chatBodyRef?: ElementRef<HTMLDivElement>;
  @ViewChild('predictiveChartCard') predictiveChartCardRef?: ElementRef<HTMLDivElement>;

  public chatService = inject(ChatService);
  private aiService = inject(PilotageAiService);
  private realDataService = inject(PilotageRealDataService);
  private benchmarkService = inject(PilotageBenchmarkService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private themeObserver?: MutationObserver;

  isBrowser = isPlatformBrowser(this.platformId);
  selectedPerimetre = this.realDataService.perimetresList[0];
  selectedDomain = 'tous';
  selectedIndicatorCode = 'TOUS';
  selectedAnnee = 2026;

  perimetresList = this.realDataService.perimetresList;
  exerciceList = this.realDataService.exerciceList;

  domainsList = [
    { id: 'tous', label: 'Tous les Services', benchmarkId: 'TOUS' as ServiceDomainFilter },
    { id: 'comptabilite', label: 'Comptabilité', benchmarkId: 'COMPTABILITE' as ServiceDomainFilter },
    { id: 'tresorerie', label: 'Trésorerie', benchmarkId: 'TRESORERIE' as ServiceDomainFilter },
    { id: 'cautionnement', label: 'Cautionnement', benchmarkId: 'CAUTIONNEMENT' as ServiceDomainFilter },
    { id: 'regies', label: 'Régies', benchmarkId: 'REGIES' as ServiceDomainFilter },
    { id: 'reglement', label: 'Règlement', benchmarkId: 'REGLEMENT' as ServiceDomainFilter },
    { id: 'statistiques', label: 'Statistiques', benchmarkId: 'STATISTIQUES' as ServiceDomainFilter },
    { id: 'compte_gestion', label: 'Compte de Gestion', benchmarkId: 'COMPTE_GESTION' as ServiceDomainFilter }
  ];

  realMetrics: RealDataPilotageMetrics | null = null;
  allIndicators: ComparativeIndicator[] = [];
  currentSummary: AiSummaryResult | null = null;
  predictiveData: PredictiveProjection[] = [];

  predictiveChartData: ChartData<'line'> = { labels: [], datasets: [] };
  predictiveChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  userQuestion = '';
  showHistory = false;
  aiResponseMode: 'synthese' | 'technique' | 'action' = 'synthese';
  activeScenario: 'OPTIMISTE' | 'BASE' | 'STRESS' | 'CUSTOM' = 'BASE';
  customSimulationNote = '';
  simDeltaPct = 0;
  simApurementPct = 0;
  projected2031Value = 0;
  projected2031Delta = 0;
  isCopied = false;

  get isGeneratingAnswer(): boolean {
    return this.chatService.isGenerating();
  }

  suggestedQuestions = [
    'Fais un bilan synthétique global.',
    'Quelle est la situation de la Trésorerie (LA) et de la Comptabilité (BCEAO) ?',
    'Quel est l’état du Cautionnement, des Régies et du Règlement ?',
    'Analyse les Statistiques (RAP, Subventions, Dette) et le Compte de Gestion.'
  ];

  constructor() { }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.updateChartTheme();
      this.themeObserver = new MutationObserver(() => {
        this.updateChartTheme();
        this.buildPredictiveChart();
        this.cdr.detectChanges();
      });
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme']
      });
    }
    this.loadAnalysis();
  }

  ngOnDestroy(): void {
    if (this.themeObserver) this.themeObserver.disconnect();
  }

  updateChartTheme(): void {
    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const textColor = isDark ? '#ffffff' : '#334155';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)';

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;

    this.predictiveChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            font: { size: 11, weight: 'bold' }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor, font: { weight: 'bold' } },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: textColor, font: { weight: 'bold' } },
          grid: { color: gridColor }
        }
      }
    };
  }

  get selectedServiceLabel(): string {
    return this.domainsList.find(d => d.id === this.selectedDomain)?.label ?? 'Tous les Services';
  }

  get indicatorsForService(): ComparativeIndicator[] {
    const bmId = this.domainsList.find(d => d.id === this.selectedDomain)?.benchmarkId ?? 'TOUS';
    if (bmId === 'TOUS') return this.allIndicators;
    return this.allIndicators.filter(ind => ind.domaine === bmId);
  }

  get selectedIndicator(): ComparativeIndicator | null {
    if (this.selectedIndicatorCode === 'TOUS') return null;
    return this.indicatorsForService.find(ind => ind.code === this.selectedIndicatorCode) ?? null;
  }

  get serviceKpiCards(): {
    title: string; icon: string; cardClass: string; titleClass: string; valueClass: string;
    dotClass: string; dotTitle: string; value: string; suffix?: string; unit: string;
    stroke: string; points: string; cy: number;
    footLeft: string; footLeftTip: string; footRight: string; footRightTip: string;
  }[] {
    const m = this.realMetrics;
    const score = this.currentSummary?.globalScore ?? 92;
    const status = this.currentSummary?.globalStatus ?? 'CONFORME';
    const scoreCard = {
      title: this.selectedDomain === 'tous' ? 'Score Conformité' : `Score ${this.selectedServiceLabel}`,
      icon: 'fas fa-tachometer-alt text-primary', cardClass: 'kpi-spark-navy', titleClass: 'text-navy', valueClass: 'text-navy',
      dotClass: 'bg-success', dotTitle: 'Conformité ACCT',
      value: `${score}`, suffix: '/100', unit: `Statut ${status}`,
      stroke: '#1A365D', points: '4,28 22,22 42,18 62,12 80,6', cy: 6,
      footLeft: 'Évaluation', footLeftTip: 'Méthode basée sur les normes prudentielles DGTCP / UEMOA',
      footRight: 'Normes ACCT/UEMOA', footRightTip: 'Conformité certifiée ACCT'
    };

    switch (this.selectedDomain) {
      case 'comptabilite':
        return [
          scoreCard,
          {
            title: 'Balance Générale', icon: 'fas fa-book', cardClass: 'kpi-spark-green', titleClass: 'text-success', valueClass: 'text-success',
            dotClass: 'bg-success', dotTitle: 'Journaux équilibrés',
            value: (m?.comptaVolumeMouvementsMilliards ?? 348.5).toFixed(1), unit: 'Mds FCFA Mouvements',
            stroke: '#16a34a', points: '4,28 22,24 42,20 62,12 80,6', cy: 6,
            footLeft: `Exercice ${this.selectedAnnee}`, footLeftTip: 'Période comptable sous revue',
            footRight: `Délai : ${m?.delaiMoyenApurementComptaJours ?? 1.1} j`, footRightTip: 'Délai moyen d’apurement comptable'
          },
          {
            title: 'Concordance BCEAO', icon: 'fas fa-check-double', cardClass: 'kpi-spark-sky', titleClass: 'text-info-emphasis', valueClass: 'text-info-emphasis',
            dotClass: 'bg-info', dotTitle: 'Lettrage automatique',
            value: `${(m?.tauxRapprochementAuto ?? 94.8).toFixed(1)}%`, unit: 'Rapprochement Auto (Norme ≥ 90%)',
            stroke: '#0284c7', points: '4,22 22,18 42,14 62,10 80,4', cy: 4,
            footLeft: 'Écart sas', footLeftTip: 'Divergence résiduelle relevé BCEAO / Grand Livre',
            footRight: `${m?.ecartConcordanceMilliards ?? 1.2} Mds`, footRightTip: 'Montant en attente de rapprochement'
          },
          {
            title: 'Opérations en Attente', icon: 'fas fa-exclamation-circle', cardClass: 'kpi-spark-amber', titleClass: 'text-warning-emphasis', valueClass: 'text-dark',
            dotClass: 'bg-warning', dotTitle: 'Compte 47 à apurer',
            value: (m?.suspensComptablesMilliards ?? 45.8).toFixed(1), unit: 'Mds FCFA en Attente',
            stroke: '#f59e0b', points: '4,10 22,14 42,18 62,22 80,26', cy: 26,
            footLeft: 'Dossiers actifs', footLeftTip: 'Dossiers comptables en attente de régularisation',
            footRight: `${m?.suspensionsActivesDossiers ?? 18} dossiers`, footRightTip: 'Nombre de dossiers en attente'
          }
        ];
      case 'tresorerie':
        return [
          scoreCard,
          {
            title: 'Liquidité Nette CUT', icon: 'fas fa-university', cardClass: 'kpi-spark-green', titleClass: 'text-success', valueClass: 'text-success',
            dotClass: 'bg-success', dotTitle: 'CUT Centralisé',
            value: (m?.liquiditeNetteCutMilliards ?? 1542.3).toFixed(1), unit: 'Mds FCFA Disponibles',
            stroke: '#16a34a', points: '4,26 22,20 42,22 62,14 80,8', cy: 8,
            footLeft: 'BCEAO', footLeftTip: 'Disponibilités centralisées à la BCEAO',
            footRight: `${(m?.soldeBceaoMilliards ?? 848).toFixed(1)} Mds`, footRightTip: 'Solde BCEAO'
          },
          {
            title: 'Régularisation LA', icon: 'fas fa-file-invoice-dollar', cardClass: 'kpi-spark-sky', titleClass: 'text-info-emphasis', valueClass: 'text-info-emphasis',
            dotClass: 'bg-info', dotTitle: 'Norme ≥ 90%',
            value: `${(m?.tauxRegularisationLA ?? 88.5).toFixed(1)}%`, unit: 'LA Apurées (Norme ≥ 90%)',
            stroke: '#0284c7', points: '4,24 22,20 42,16 62,12 80,8', cy: 8,
            footLeft: 'LA en cours', footLeftTip: 'Encours des Lettres d’Avance non régularisées',
            footRight: `${m?.laEnCoursMilliards ?? 45.8} Mds`, footRightTip: 'Montant à justifier par les ordonnateurs'
          },
          {
            title: 'Comptes Spéciaux', icon: 'fas fa-piggy-bank', cardClass: 'kpi-spark-amber', titleClass: 'text-warning-emphasis', valueClass: 'text-dark',
            dotClass: 'bg-warning', dotTitle: 'CST & Bons de Caisse',
            value: (m?.soldeComptesSpeciauxMilliards ?? 42.85).toFixed(1), unit: 'Mds FCFA Disponibles',
            stroke: '#f59e0b', points: '4,24 22,22 42,18 62,14 80,10', cy: 10,
            footLeft: `${m?.comptesSpeciauxActifs ?? 84} CST actifs`, footLeftTip: 'Nombre de Comptes Spéciaux du Trésor',
            footRight: `${m?.bonsCaisseCirculationCount ?? 458} Bons`, footRightTip: 'Bons de Caisse en circulation'
          }
        ];
      case 'cautionnement':
        return [
          scoreCard,
          {
            title: 'Volume des Garanties', icon: 'fas fa-shield-alt', cardClass: 'kpi-spark-green', titleClass: 'text-success', valueClass: 'text-success',
            dotClass: 'bg-success', dotTitle: 'Garanties validées',
            value: (m?.cautionnementsVolumeMilliards ?? 15.0).toFixed(1), unit: 'Mds FCFA Garantis',
            stroke: '#16a34a', points: '4,26 22,22 42,18 62,14 80,8', cy: 8,
            footLeft: 'Dossiers actifs', footLeftTip: 'Attestations et marchés publics actifs',
            footRight: `${m?.cautionnementsActifsCount ?? 1450} dossiers`, footRightTip: 'Portefeuille cautionné'
          },
          {
            title: 'Taux de Couverture', icon: 'fas fa-check-circle', cardClass: 'kpi-spark-sky', titleClass: 'text-info-emphasis', valueClass: 'text-info-emphasis',
            dotClass: 'bg-info', dotTitle: 'Norme DGTCP',
            value: `${(m?.tauxCouvertureCautionnement ?? 96.8).toFixed(1)}%`, unit: 'Postes & Marchés Couverts',
            stroke: '#0284c7', points: '4,22 22,18 42,14 62,10 80,6', cy: 6,
            footLeft: `Exercice ${this.selectedAnnee}`, footLeftTip: 'Année de suivi',
            footRight: 'Objectif 100%', footRightTip: 'Cible réglementaire DGTCP'
          },
          {
            title: 'Cautionnements Échus', icon: 'fas fa-hourglass-end', cardClass: 'kpi-spark-amber', titleClass: 'text-warning-emphasis', valueClass: 'text-dark',
            dotClass: 'bg-warning', dotTitle: 'Mainlevées en attente',
            value: (m?.cautionnementsEchusMilliards ?? 2.3).toFixed(1), unit: 'Mds FCFA Non Levés',
            stroke: '#f59e0b', points: '4,12 22,16 42,20 62,22 80,24', cy: 24,
            footLeft: 'Contentieux', footLeftTip: 'Dossiers en litige / recouvrement',
            footRight: `${m?.cautionnementsContentieuxCount ?? 45} dossiers`, footRightTip: 'Nombre de dossiers en contentieux'
          }
        ];
      case 'regies':
        return [
          scoreCard,
          {
            title: 'Recettes & Régies', icon: 'fas fa-coins', cardClass: 'kpi-spark-green', titleClass: 'text-success', valueClass: 'text-success',
            dotClass: 'bg-success', dotTitle: 'Collecte conforme',
            value: (m?.totalRecettesMilliards ?? 1254.0).toFixed(1), unit: 'Mds FCFA Mobilisés',
            stroke: '#16a34a', points: '4,30 22,24 42,20 62,12 80,6', cy: 6,
            footLeft: 'En régie', footLeftTip: 'Recettes perçues directement en régie',
            footRight: `${m?.regiesRecettesPercuesMilliards ?? 14.3} Mds`, footRightTip: 'Encaissements des régies'
          },
          {
            title: 'Pièces Conformes', icon: 'fas fa-file-check', cardClass: 'kpi-spark-sky', titleClass: 'text-info-emphasis', valueClass: 'text-info-emphasis',
            dotClass: 'bg-info', dotTitle: 'Audit documentaire',
            value: `${(m?.regiesTauxPiecesConformes ?? 96.4).toFixed(1)}%`, unit: 'Justificatifs Validés',
            stroke: '#0284c7', points: '4,22 22,18 42,14 62,10 80,6', cy: 6,
            footLeft: 'Avances en cours', footLeftTip: 'Fonds mis à disposition des régies d’avances',
            footRight: `${m?.regiesAvancesEnCoursMilliards ?? 4.85} Mds`, footRightTip: 'Encours des avances'
          },
          {
            title: 'Rotation des Fonds', icon: 'fas fa-sync-alt', cardClass: 'kpi-spark-amber', titleClass: 'text-warning-emphasis', valueClass: 'text-dark',
            dotClass: 'bg-warning', dotTitle: 'Cible < 15 jours',
            value: `${m?.regiesDelaiMoyenRotationJours ?? 12.5} j`, unit: 'Délai Moyen (Cible < 15j)',
            stroke: '#f59e0b', points: '4,14 22,16 42,18 62,20 80,22', cy: 22,
            footLeft: 'Dépassements', footLeftTip: 'Régies au-delà du plafond ou délai',
            footRight: `${m?.regiesEnDepassementCount ?? 7} régies`, footRightTip: 'Régies à contrôler en priorité'
          }
        ];
      case 'reglement':
        return [
          scoreCard,
          {
            title: 'Règlements Exécutés', icon: 'fas fa-hand-holding-usd', cardClass: 'kpi-spark-green', titleClass: 'text-success', valueClass: 'text-success',
            dotClass: 'bg-success', dotTitle: 'Paiements liquidés',
            value: (m?.totalReglementsMilliards ?? 1138.2).toFixed(1), unit: 'Mds FCFA Payés',
            stroke: '#16a34a', points: '4,28 22,22 42,18 62,12 80,8', cy: 8,
            footLeft: 'En cours', footLeftTip: 'Règlements fournisseurs en cours de décaissement',
            footRight: `${m?.reglementsEnCoursMilliards ?? 18.25} Mds`, footRightTip: 'Mandats en instance de virement'
          },
          {
            title: 'Délai de Règlement', icon: 'fas fa-clock', cardClass: 'kpi-spark-sky', titleClass: 'text-info-emphasis', valueClass: 'text-info-emphasis',
            dotClass: 'bg-info', dotTitle: 'Norme < 30 jours',
            value: `${m?.delaiMoyenReglementJours ?? 21.4} j`, unit: 'Délai Moyen (Cible < 30j)',
            stroke: '#0284c7', points: '4,12 22,16 42,18 62,22 80,24', cy: 24,
            footLeft: 'Virements RTGS', footLeftTip: 'Part des règlements dématérialisés via RTGS/SICA',
            footRight: `${m?.partVirementsRtgsPct ?? 68}%`, footRightTip: 'Taux de dématérialisation'
          },
          {
            title: 'Imputations Provisoires', icon: 'fas fa-exclamation-triangle', cardClass: 'kpi-spark-amber', titleClass: 'text-warning-emphasis', valueClass: 'text-dark',
            dotClass: 'bg-warning', dotTitle: 'À régulariser',
            value: (m?.imputationsProvisoiresMilliards ?? 1.85).toFixed(2), unit: 'Mds FCFA en IP',
            stroke: '#f59e0b', points: '4,14 22,18 42,20 62,24 80,26', cy: 26,
            footLeft: 'Anomalies', footLeftTip: 'Dossiers bloqués pour erreur de RIB/pièce',
            footRight: `${m?.anomaliesReglementDossiers ?? 14} dossiers`, footRightTip: 'Rejets à corriger'
          }
        ];
      case 'statistiques':
        return [
          scoreCard,
          {
            title: 'Encours Restes à Payer', icon: 'fas fa-chart-bar', cardClass: 'kpi-spark-green', titleClass: 'text-success', valueClass: 'text-success',
            dotClass: 'bg-warning', dotTitle: 'Suivi RAP',
            value: (m?.encoursRapMilliards ?? 124.5).toFixed(1), unit: 'Mds FCFA RAP Total',
            stroke: '#16a34a', points: '4,16 22,18 42,20 62,18 80,14', cy: 14,
            footLeft: 'RAP > 90 jours', footLeftTip: 'Tranche critique des Restes à Payer > 90 jours',
            footRight: `${m?.rapCritiquePlus90jMilliards ?? 34.9} Mds`, footRightTip: 'Montant critique à apurer'
          },
          {
            title: 'Subventions & OC', icon: 'fas fa-landmark', cardClass: 'kpi-spark-sky', titleClass: 'text-info-emphasis', valueClass: 'text-info-emphasis',
            dotClass: 'bg-info', dotTitle: 'Dotations & LC',
            value: (m?.statSubventionsMilliards ?? 66.82).toFixed(1), unit: 'Mds FCFA Subventions',
            stroke: '#0284c7', points: '4,24 22,20 42,16 62,14 80,10', cy: 10,
            footLeft: 'Obligations (OC)', footLeftTip: 'Volume des obligations cautionnées suivies',
            footRight: `${m?.statObligationsCautionneesMilliards ?? 48.7} Mds`, footRightTip: 'Montant OC/LC'
          },
          {
            title: 'Service de la Dette', icon: 'fas fa-balance-scale', cardClass: 'kpi-spark-amber', titleClass: 'text-warning-emphasis', valueClass: 'text-dark',
            dotClass: 'bg-warning', dotTitle: 'Échéances réglées',
            value: (m?.serviceDetteMilliards ?? 75.4).toFixed(1), unit: 'Mds FCFA Annuels',
            stroke: '#f59e0b', points: '4,22 22,20 42,18 62,14 80,12', cy: 12,
            footLeft: 'Réalisation prév.', footLeftTip: 'Adéquation réalisations / prévisions statistiques',
            footRight: `${m?.tauxRealisationPrevisionsStat ?? 93.8}%`, footRightTip: 'Taux de réalisation'
          }
        ];
      case 'compte_gestion':
        return [
          scoreCard,
          {
            title: 'Conformité Reddition', icon: 'fas fa-gavel', cardClass: 'kpi-spark-green', titleClass: 'text-success', valueClass: 'text-success',
            dotClass: 'bg-success', dotTitle: 'Norme Cour des Comptes',
            value: `${(m?.tauxConformiteCompteGestion ?? 96.4).toFixed(1)}%`, unit: 'Liasses Conformes',
            stroke: '#16a34a', points: '4,26 22,20 42,16 62,10 80,6', cy: 6,
            footLeft: 'Exécution crédits', footLeftTip: 'Taux d’exécution des crédits assignés',
            footRight: `${m?.tauxExecutionCreditsCG ?? 91.6}%`, footRightTip: 'Absorption budgétaire'
          },
          {
            title: 'Volume Audité', icon: 'fas fa-clipboard-check', cardClass: 'kpi-spark-sky', titleClass: 'text-info-emphasis', valueClass: 'text-info-emphasis',
            dotClass: 'bg-info', dotTitle: 'TGE, PGT, RGF, PGA',
            value: (m?.cgVolumeAuditeMilliards ?? 482.5).toFixed(1), unit: 'Mds FCFA Audités',
            stroke: '#0284c7', points: '4,24 22,20 42,16 62,12 80,8', cy: 8,
            footLeft: 'Quitus transmis', footLeftTip: 'Part des comptables ayant transmis leur quitus',
            footRight: `${m?.quitusTransmisPct ?? 95.2}%`, footRightTip: 'Taux de quitus'
          },
          {
            title: 'Restes en Instance', icon: 'fas fa-folder-open', cardClass: 'kpi-spark-amber', titleClass: 'text-warning-emphasis', valueClass: 'text-dark',
            dotClass: 'bg-warning', dotTitle: 'Apurement en cours',
            value: (m?.restesEnInstanceCGMilliards ?? 11.26).toFixed(2), unit: 'Mds FCFA à Apurer',
            stroke: '#f59e0b', points: '4,12 22,16 42,20 62,22 80,26', cy: 26,
            footLeft: `Exercice ${this.selectedAnnee}`, footLeftTip: 'Exercice de reddition',
            footRight: 'Cour des Comptes', footRightTip: 'Destinataire légal de la liasse'
          }
        ];
      default:
        return [
          scoreCard,
          {
            title: 'Recettes & Régies', icon: 'fas fa-coins', cardClass: 'kpi-spark-green', titleClass: 'text-success', valueClass: 'text-success',
            dotClass: 'bg-success', dotTitle: 'Mobilisation conforme',
            value: (m?.totalRecettesMilliards ?? 1254.0).toFixed(1), unit: 'Mds FCFA Mobilisés',
            stroke: '#16a34a', points: '4,30 22,24 42,26 62,14 80,6', cy: 6,
            footLeft: `Exercice ${this.selectedAnnee}`, footLeftTip: 'Période annuelle sous revue',
            footRight: `Exéc. : ${m?.tauxExecutionLoiFinances ?? 94.8}%`, footRightTip: 'Taux d’exécution Loi de Finances'
          },
          {
            title: 'Concordance BCEAO', icon: 'fas fa-check-double', cardClass: 'kpi-spark-sky', titleClass: 'text-info-emphasis', valueClass: 'text-info-emphasis',
            dotClass: 'bg-info', dotTitle: 'Lettrage automatique',
            value: `${(m?.tauxRapprochementAuto ?? 94.8).toFixed(1)}%`, unit: 'Rapprochement Auto (Norme ≥ 90%)',
            stroke: '#0284c7', points: '4,22 22,18 42,14 62,10 80,4', cy: 4,
            footLeft: 'Régul. LA', footLeftTip: 'Taux de régularisation des Lettres d’Avance',
            footRight: `${m?.tauxRegularisationLA ?? 88.5}%`, footRightTip: 'Part déjà justifiée'
          },
          {
            title: 'Liquidité Nette CUT', icon: 'fas fa-university', cardClass: 'kpi-spark-amber', titleClass: 'text-warning-emphasis', valueClass: 'text-dark',
            dotClass: 'bg-warning', dotTitle: 'CUT Centralisé',
            value: (m?.liquiditeNetteCutMilliards ?? 1542.3).toFixed(1), unit: 'Mds FCFA Disponibles',
            stroke: '#f59e0b', points: '4,26 22,20 42,22 62,14 80,8', cy: 8,
            footLeft: 'Postes/Régies', footLeftTip: 'Unités connectées au CUT',
            footRight: `${m?.postesEtRegiesActifs ?? 142} connectés`, footRightTip: 'Réseau actif'
          }
        ];
    }
  }

  onServiceChange(domain: string): void {
    this.selectedDomain = domain;
    this.selectedIndicatorCode = 'TOUS';
    this.updateSuggestedQuestions();
    this.loadAnalysis();
  }

  onIndicatorChange(code: string): void {
    this.selectedIndicatorCode = code;
    this.updateSuggestedQuestions();
    if (this.predictiveData.length > 0) {
      this.buildPredictiveChart(this.predictiveData);
    }
    this.cdr.detectChanges();
  }

  onFilterChange(): void {
    this.selectedAnnee = Number(this.selectedAnnee);
    this.loadAnalysis();
  }

  private updateSuggestedQuestions(): void {
    const ind = this.selectedIndicator;
    const srv = this.selectedServiceLabel;
    if (ind) {
      this.suggestedQuestions = [
        `Analyse l'indicateur "${ind.nom}" (${ind.valeurA} ${ind.unite}) pour ${srv}.`,
        `Quelles actions recommandes-tu pour améliorer ${ind.nom} ?`,
        `Quelle est la projection IA sur ${srv} à horizon 2031 ?`,
        `Fais un bilan synthétique du service ${srv}.`
      ];
    } else if (this.selectedDomain !== 'tous') {
      this.suggestedQuestions = [
        `Fais un bilan complet du service ${srv}.`,
        `Quels sont les points de vigilance et risques sur ${srv} ?`,
        `Quelles actions prioritaires recommandes-tu pour ${srv} ?`,
        `Fais un bilan synthétique des 7 Services.`
      ];
    } else {
      this.suggestedQuestions = [
        'Fais un bilan synthétique des 7 Services.',
        'Quelle est la situation de la Trésorerie (LA) et de la Comptabilité (BCEAO) ?',
        'Quel est l’état du Cautionnement, des Régies et du Règlement ?',
        'Analyse les Statistiques (RAP, Subventions, Dette) et le Compte de Gestion.'
      ];
    }
  }

  loadAnalysis(): void {
    this.realDataService.getRealMetricsForYear(this.selectedAnnee, this.selectedPerimetre).subscribe(metrics => {
      this.realMetrics = metrics;

      const compYear = this.selectedAnnee > 2015 ? this.selectedAnnee - 1 : this.selectedAnnee;
      this.benchmarkService.compareYears(this.selectedAnnee, compYear, this.selectedPerimetre).subscribe(comp => {
        this.allIndicators = comp.indicateurs;
        if (this.selectedIndicatorCode !== 'TOUS' && !this.indicatorsForService.some(i => i.code === this.selectedIndicatorCode)) {
          this.selectedIndicatorCode = 'TOUS';
        }
        this.updateSuggestedQuestions();
        if (this.predictiveData.length > 0) {
          this.buildPredictiveChart(this.predictiveData);
        }
        this.cdr.detectChanges();
      });

      this.aiService.generateExecutiveAnalysis(this.selectedDomain, this.selectedPerimetre, this.selectedAnnee, metrics).subscribe(res => {
        this.currentSummary = res;
        this.cdr.detectChanges();
      });

      this.aiService.getPredictiveSeries(this.selectedAnnee, metrics).subscribe(projections => {
        this.predictiveData = projections;
        this.buildPredictiveChart(projections);
        this.cdr.detectChanges();
      });
    });
  }

  private buildPredictiveChart(data: PredictiveProjection[] = this.predictiveData): void {
    if (!data || data.length === 0) return;
    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const blueLine = isDark ? '#60a5fa' : '#1A365D';
    const blueFill = isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(26, 54, 93, 0.12)';
    const orangeLine = isDark ? '#fb923c' : '#F77F00';
    const greenLine = isDark ? '#4ade80' : '#16a34a';

    const labels = data.map(d => `${d.year}`);
    const lastHistIndex = data.map(d => d.isHistorical).lastIndexOf(true);
    const ind = this.selectedIndicator;

    const lastVal = data[data.length - 1];
    const hasScenario = this.simDeltaPct !== 0 || this.simApurementPct !== 0;

    if (ind) {
      // Trajectoire dédiée à l'indicateur sélectionné, avec courbe simulée si un scénario est actif
      const valActuelle = ind.valeurA || 0;
      const valPrecedente = ind.valeurB || valActuelle;
      const pasAnnuel = valActuelle - valPrecedente;
      const capPourcent = ind.unite === '%' ? 100 : null;

      const serieBase = data.map((d, idx) => {
        const diffAnnees = idx - lastHistIndex;
        let v = Number((valActuelle + diffAnnees * pasAnnuel * 0.65).toFixed(2));
        if (capPourcent !== null) v = Math.min(100, Math.max(0, v));
        else v = Math.max(0, v);
        return v;
      });

      const sens = ind.sensFavorable === 'BAISSE' ? -1 : 1;
      const factorSim = 1 + sens * ((this.simDeltaPct / 100) + (this.simApurementPct / 400));
      const serieSim = serieBase.map((v, idx) => {
        if (idx < lastHistIndex) return null;
        if (idx === lastHistIndex) return v;
        let simV = Number((v * factorSim).toFixed(2));
        if (capPourcent !== null) simV = Math.min(100, Math.max(0, simV));
        return simV;
      });

      const base2031 = serieBase[serieBase.length - 1] ?? 0;
      const sim2031 = (hasScenario ? serieSim[serieSim.length - 1] : base2031) ?? base2031;
      this.projected2031Value = sim2031;
      this.projected2031Delta = Number((sim2031 - base2031).toFixed(2));

      const histSerie = serieBase.map((v, i) => (i <= lastHistIndex ? v : null));
      const foreSerie = serieBase.map((v, i) => (i >= lastHistIndex ? v : null));

      const datasets: any[] = [
        {
          label: `${ind.nom} (Constaté)`,
          data: histSerie,
          borderColor: blueLine,
          backgroundColor: blueFill,
          tension: 0.35,
          pointRadius: 4
        },
        {
          label: `${ind.nom} (Tendanciel)`,
          data: foreSerie,
          borderColor: orangeLine,
          borderDash: [6, 4],
          tension: 0.35,
          pointRadius: 4
        }
      ];
      if (hasScenario) {
        datasets.push({
          label: `${ind.nom} (Scénario Simulé)`,
          data: serieSim,
          borderColor: greenLine,
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 4
        });
      }

      this.predictiveChartData = { labels, datasets };
      return;
    }

    const recHist = data.map((d, i) => (i <= lastHistIndex ? d.recettes : null));
    const recForecast = data.map((d, i) => (i >= lastHistIndex ? d.recettes : null));
    const recSim = data.map((d, i) => {
      if (i < lastHistIndex) return null;
      if (i === lastHistIndex) return d.recettes;
      const progress = (i - lastHistIndex) / Math.max(1, data.length - 1 - lastHistIndex);
      const gainPct = (this.simDeltaPct + this.simApurementPct * 0.12) * progress;
      return Number((d.recettes * (1 + gainPct / 100)).toFixed(1));
    });

    const base2031 = lastVal?.recettes ?? 0;
    const sim2031 = (hasScenario ? recSim[recSim.length - 1] : base2031) ?? base2031;
    this.projected2031Value = sim2031;
    this.projected2031Delta = Number((sim2031 - base2031).toFixed(1));

    const regHist = data.map((d, i) => (i <= lastHistIndex ? d.reglements : null));
    const regForecast = data.map((d, i) => (i >= lastHistIndex ? d.reglements : null));

    const datasets: any[] = [
      {
        label: 'Recettes Mobilisées (Constaté)',
        data: recHist,
        borderColor: blueLine,
        backgroundColor: blueFill,
        tension: 0.35,
        pointRadius: 4
      },
      {
        label: 'Recettes (Tendanciel)',
        data: recForecast,
        borderColor: blueLine,
        borderDash: [6, 4],
        tension: 0.35,
        pointRadius: 4
      },
      {
        label: 'Règlements Exécutés (Constaté)',
        data: regHist,
        borderColor: orangeLine,
        tension: 0.35,
        pointRadius: 4
      },
      {
        label: 'Règlements (Tendanciel)',
        data: regForecast,
        borderColor: orangeLine,
        borderDash: [6, 4],
        tension: 0.35,
        pointRadius: 4
      }
    ];

    if (hasScenario) {
      datasets.push({
        label: 'Recettes (Scénario Simulé)',
        data: recSim,
        borderColor: greenLine,
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 4
      });
    }

    this.predictiveChartData = { labels, datasets };
  }

  applyScenarioPreset(preset: 'OPTIMISTE' | 'BASE' | 'STRESS', keepCustomNote = false): void {
    this.activeScenario = preset;
    if (!keepCustomNote) this.customSimulationNote = '';
    if (preset === 'OPTIMISTE') {
      this.simDeltaPct = 6;
      this.simApurementPct = 35;
    } else if (preset === 'STRESS') {
      this.simDeltaPct = -5;
      this.simApurementPct = 0;
    } else {
      this.simDeltaPct = 0;
      this.simApurementPct = 0;
    }
    if (this.predictiveData.length > 0) {
      this.buildPredictiveChart(this.predictiveData);
    }
  }

  onScenarioSliderChange(): void {
    this.activeScenario = 'CUSTOM';
    if (this.predictiveData.length > 0) {
      this.buildPredictiveChart(this.predictiveData);
    }
  }

  startNewChat(): void {
    this.chatService.createNewThread();
    this.showHistory = false;
    this.scrollToBottom();
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  selectThread(id: string): void {
    this.chatService.setActiveThread(id);
    this.showHistory = false;
    this.scrollToBottom();
  }

  deleteThread(event: Event, id: string): void {
    event.stopPropagation();
    this.chatService.deleteThread(id);
  }

  clearAllHistory(): void {
    if (confirm('Voulez-vous vraiment effacer tout l\'historique des conversations ?')) {
      this.chatService.clearHistory();
      this.showHistory = false;
    }
  }

  getSnippet(raw: string): string {
    return this.chatService.getSnippet(raw);
  }

  analyserRisqueAvecIa(risque: string): void {
    this.showHistory = false;
    this.askQuestion(`Analyse ce point de vigilance et propose des mesures correctives : "${risque}"`);
  }

  genererPlanActionIa(rec: string): void {
    this.showHistory = false;
    this.chatService.responseMode.set('action');
    this.askQuestion(`Génère un plan d'action opérationnel (responsables, échéance, impact) pour : "${rec}"`);
  }

  executeChatAction(act: any): void {
    if (act.type === 'question' && act.payload) {
      this.askQuestion(act.payload);
    } else if (act.type === 'scenario' && act.payload) {
      if (typeof act.payload === 'string') {
        this.applyScenarioPreset(act.payload as 'OPTIMISTE' | 'BASE' | 'STRESS');
      } else {
        if (act.payload.domain && act.payload.domain !== this.selectedDomain) {
          this.selectedDomain = act.payload.domain;
          this.loadAnalysis();
        }
        if (act.payload.indicatorCode) {
          this.selectedIndicatorCode = act.payload.indicatorCode;
        }
        this.customSimulationNote = act.payload.note || '';
        this.applyScenarioPreset(act.payload.preset, true);
      }
      setTimeout(() => {
        this.predictiveChartCardRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    } else if (act.type === 'chart' || act.label === 'Simuler sur le graphe') {
      this.applyScenarioPreset('OPTIMISTE');
      setTimeout(() => {
        this.predictiveChartCardRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    } else if (act.type === 'pdf') {
      this.exportDecisionPdf();
    } else if (act.type === 'download' && act.payload) {
      this.exportChatMessagePdf(act.payload);
    }
  }

  resetChat(): void {
    this.startNewChat();
  }

  askQuestion(promptText?: string): void {
    this.showHistory = false;
    const question = promptText || this.userQuestion;
    if (!question || !question.trim()) return;

    this.chatService.sendMessage(question);
    this.userQuestion = '';
    this.scrollToBottom();
  }

  /** Recherche dans l'ensemble des données de l'application (45 indicateurs, ministères, historique 2019-2031). */
  private searchApplicationData(question: string): { html: string; matchedIndicator?: ComparativeIndicator } | null {
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const qNorm = norm(question);
    const m = this.realMetrics;

    // 1. Recherche sur une année précise (2019 - 2031)
    const yearMatch = qNorm.match(/\b(2019|202[0-9]|203[01])\b/);
    if (yearMatch) {
      const targetYear = Number(yearMatch[1]);
      const proj = this.predictiveData.find(p => p.year === targetYear);
      const hist = m?.historiqueFlux.find(h => h.annee === targetYear);
      if (proj || hist) {
        const recVal = hist ? hist.recettesMilliards : proj!.recettes;
        const regVal = hist ? hist.reglementsMilliards : proj!.reglements;
        const solde = proj ? proj.soldeCut : Number((recVal - regVal).toFixed(1));
        const nature = hist ? 'Données historiques certifiées' : 'Projection statistique';
        return {
          html: `
            <div class="p-1 text-dark">
              <div class="fw-bold text-dark mb-2 border-bottom pb-1">Données Exercice ${targetYear} (${nature})</div>
              <ul class="list-unstyled mb-2">
                <li><strong>• Recettes mobilisées :</strong> <strong>${recVal} Mds FCFA</strong></li>
                <li><strong>• Règlements exécutés :</strong> <strong>${regVal} Mds FCFA</strong></li>
                <li><strong>• Solde / Excédent :</strong> <span class="fw-bold ${solde >= 0 ? 'text-success' : 'text-danger'}">${solde >= 0 ? '+' : ''}${solde} Mds FCFA</span></li>
                ${hist ? `<li><strong>• Liquidité CUT :</strong> <strong>${hist.liquiditeMilliards} Mds FCFA</strong> (Concordance : <strong>${hist.tauxConcordance}%</strong>)</li>` : ''}
              </ul>
              <div class="very-small text-muted">Données extraites de la série chronologique consolidée 2019–2031.</div>
            </div>`
        };
      }
    }

    // 2. Recherche sur les ministères / dépenses sectorielles
    if ((qNorm.includes('ministere') || qNorm.includes('secteur') || qNorm.includes('repartition') || qNorm.includes('depense')) && m?.repartitionMinisteresDepenses?.length) {
      const items = m.repartitionMinisteresDepenses
        .map(d => `<li><strong>• ${d.name} :</strong> <strong>${d.value} Mds FCFA</strong></li>`)
        .join('');
      return {
        html: `
          <div class="p-1 text-dark">
            <div class="fw-bold text-dark mb-2 border-bottom pb-1">Répartition des Dépenses par Ministère (${this.selectedAnnee})</div>
            <ul class="list-unstyled mb-2">${items}</ul>
            <div class="very-small text-muted">Total des règlements consolidés : <strong>${m.totalReglementsMilliards} Mds FCFA</strong>.</div>
          </div>`
      };
    }

    // 3. Recherche multi-mots-clés dans les 45 indicateurs des 7 services
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
      .slice(0, 5);

    if (scored.length === 0) return null;

    const rows = scored.map(({ ind }) => {
      const cls = ind.statut === 'PROGRESSION' ? 'text-success' : (ind.statut === 'REGRESSION' ? 'text-danger' : 'text-secondary');
      return `<li><strong>• [${ind.domaineLabel}] ${ind.nom} :</strong> <strong>${ind.valeurA} ${ind.unite}</strong> <span class="${cls} fw-bold">(${ind.deltaPct >= 0 ? '+' : ''}${ind.deltaPct}% vs ${this.selectedAnnee - 1})</span></li>`;
    }).join('');

    const best = scored[0].ind;
    return {
      matchedIndicator: best,
      html: `
        <div class="p-1 text-dark">
          <div class="fw-bold text-dark mb-2 border-bottom pb-1">Données extraites de l'application (${scored.length} indicateur(s))</div>
          <ul class="list-unstyled mb-2">${rows}</ul>
          <div class="very-small text-muted">${best.description}</div>
        </div>`
    };
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatBodyRef?.nativeElement) {
        this.chatBodyRef.nativeElement.scrollTop = this.chatBodyRef.nativeElement.scrollHeight;
      }
    }, 80);
  }

  async exportChatMessagePdf(htmlText: string): Promise<void> {
    if (!this.isBrowser) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(26, 54, 93);
    doc.text('DGTCP — Analyse Assistant Décisionnel IA', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100);
    doc.text(`Service : ${this.selectedServiceLabel}   |   Exercice : ${this.selectedAnnee}`, 14, y);
    y += 3;
    doc.setDrawColor(210, 220, 235);
    doc.line(14, y, pageW - 14, y);
    y += 7;

    // Extraction structurée du contenu HTML de la bulle
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
      // Mettre le titre/libellé du point en gras avant ":"
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

    doc.save(`Analyse_IA_DGTCP_${this.selectedAnnee}.pdf`);
  }

  async exportDecisionPdf(): Promise<void> {
    if (!this.isBrowser || !this.currentSummary) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 16;

    const assurerEspace = (h: number) => {
      if (y + h > pageH - 14) { doc.addPage(); y = 16; }
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(26, 54, 93);
    doc.text('DGTCP — Note Stratégique & Prospective IA', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100);
    doc.text(`Service : ${this.selectedServiceLabel}   |   Exercice : ${this.selectedAnnee}   |   Score : ${this.currentSummary.globalScore}/100`, 14, y);
    y += 3;
    doc.setDrawColor(210, 220, 235);
    doc.line(14, y, pageW - 14, y);
    y += 7;

    if (this.selectedIndicator) {
      const ind = this.selectedIndicator;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(26, 54, 93);
      doc.text(`Focus Indicateur : ${ind.nom}`, 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40);
      doc.text(`Valeur ${this.selectedAnnee} : ${ind.valeurA} ${ind.unite}   |   Ex. ${this.selectedAnnee - 1} : ${ind.valeurB} ${ind.unite}   |   Écart : ${ind.deltaPct >= 0 ? '+' : ''}${ind.deltaPct}%`, 14, y);
      y += 7;
    }

    const ecrireSection = (titre: string, items: string[], couleur: [number, number, number]) => {
      assurerEspace(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...couleur);
      doc.text(titre, 14, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(40);
      items.forEach(txt => {
        const line = `• ${txt}`;
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && colonIdx < 45) {
          const prefix = line.slice(0, colonIdx + 1) + ' ';
          const rest = line.slice(colonIdx + 1).trim();
          doc.setFont('helvetica', 'bold');
          const prefixW = doc.getTextWidth(prefix);
          const restLines = doc.splitTextToSize(rest, pageW - 32 - prefixW);
          assurerEspace(restLines.length * 4.4);
          doc.text(prefix, 18, y);
          doc.setFont('helvetica', 'normal');
          if (restLines.length > 0) {
            doc.text(restLines[0], 18 + prefixW, y);
            for (let li = 1; li < restLines.length; li++) {
              y += 4.4;
              doc.text(restLines[li], 22, y);
            }
          }
          y += 5.4;
        } else {
          doc.setFont('helvetica', 'normal');
          const l = doc.splitTextToSize(line, pageW - 32);
          assurerEspace(l.length * 4.4);
          doc.text(l, 18, y);
          y += l.length * 4.4 + 1;
        }
      });
      y += 4;
    };

    const cleanLead = this.currentSummary.executiveSummary.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    ecrireSection('1. Constat Stratégique Majeur', [cleanLead], [26, 54, 93]);
    ecrireSection('2. Points Forts & Avancées Opérationnelles', this.currentSummary.keyHighlights, [25, 135, 84]);
    ecrireSection('3. Vulnérabilités & Écarts Identifiés', this.currentSummary.risksAndGaps, [180, 83, 9]);
    ecrireSection('4. Recommandations & Arbitrages DGTCP', this.currentSummary.recommendations, [26, 54, 93]);
    ecrireSection('5. Simulation Prospective 2031', [
      `Scénario actif : ${this.activeScenario} (Variation : ${this.simDeltaPct >= 0 ? '+' : ''}${this.simDeltaPct}%, Apurement : +${this.simApurementPct}%)`,
      `Projection 2031 simulée : ${this.projected2031Value} ${this.selectedIndicator ? this.selectedIndicator.unite : 'Mds FCFA'} (Écart vs Base : ${this.projected2031Delta >= 0 ? '+' : ''}${this.projected2031Delta})`
    ], [26, 54, 93]);

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

    doc.save(`Decision_Prospective_IA_DGTCP_${this.selectedAnnee}.pdf`);
  }

  copySummary(): void {
    if (!this.currentSummary) return;
    const cleanLead = this.currentSummary.executiveSummary.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const text = `NOTE STRATÉGIQUE (DGTCP) — ${this.currentSummary.title}\nPérimètre : ${this.selectedPerimetre} | Exercice : ${this.selectedAnnee}\nScore Conformité : ${this.currentSummary.globalScore}/100 (${this.currentSummary.globalStatus})\n\nCONSTAT MAJEUR :\n${cleanLead}\n\nPOINTS FORTS :\n- ${this.currentSummary.keyHighlights.join('\n- ')}\n\nVULNÉRABILITÉS & ÉCARTS :\n- ${this.currentSummary.risksAndGaps.join('\n- ')}\n\nRECOMMANDATIONS DGTCP :\n- ${this.currentSummary.recommendations.join('\n- ')}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.isCopied = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.isCopied = false;
          this.cdr.detectChanges();
        }, 2500);
      });
    }
  }
}
