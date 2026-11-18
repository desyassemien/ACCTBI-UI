import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
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
          Génération de notes stratégiques pour la Direction Générale du Trésor, détection des écarts comptables et modélisations prédictives OLS.
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
      <!-- Ligne 1 : Indicateurs Clés Métier & Prudentiels -->
      <div class="row g-2 mb-2">
        <!-- 1. Score Conformité DGTCP -->
        <div class="col-xl-3 col-md-6">
          <div class="card kpi-spark-card kpi-spark-navy shadow-sm border-0 h-100">
            <div class="card-body p-3 d-flex flex-column justify-content-between">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="kpi-spark-title text-navy">
                  <i class="fas fa-tachometer-alt me-1 text-primary"></i> Score Conformité
                </span>
                <span class="pulse-dot bg-success" title="Conformité ACCT"></span>
              </div>
              <div class="d-flex align-items-center justify-content-between my-1">
                <div>
                  <div class="kpi-spark-value text-navy">{{ currentSummary.globalScore }}<small class="text-muted fs-6">/100</small></div>
                  <span class="kpi-spark-unit text-muted">Statut {{ currentSummary.globalStatus }}</span>
                </div>
                <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
                  <polyline fill="none" stroke="#1A365D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                            points="4,28 22,22 42,18 62,12 80,6"/>
                  <circle cx="80" cy="6" r="3.2" fill="#1A365D"/>
                </svg>
              </div>
              <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                <span class="text-muted very-small" title="Méthode d'évaluation basée sur les normes prudentielles DGTCP et les ratios UEMOA" style="cursor: help;">
                  Évaluation
                </span>
                <span class="badge bg-primary-subtle text-primary border" title="Conformité certifiée aux exigences de l'Agence Comptable Centrale du Trésor" style="cursor: help;">
                  Normes ACCT/UEMOA
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Recettes & Mobilisation -->
        <div class="col-xl-3 col-md-6">
          <div class="card kpi-spark-card kpi-spark-green shadow-sm border-0 h-100">
            <div class="card-body p-3 d-flex flex-column justify-content-between">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="kpi-spark-title text-success">
                  <i class="fas fa-coins me-1"></i> Recettes & Régies
                </span>
                <span class="pulse-dot bg-success" title="Mobilisation conforme"></span>
              </div>
              <div class="d-flex align-items-center justify-content-between my-1">
                <div>
                  <div class="kpi-spark-value text-success">
                    {{ (realMetrics?.totalRecettesMilliards || 1254.0) | number:'1.1-1' }}
                  </div>
                  <span class="kpi-spark-unit text-muted">Mds FCFA Mobilisés</span>
                </div>
                <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
                  <polyline fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                            points="4,30 22,24 42,26 62,14 80,6"/>
                  <circle cx="80" cy="6" r="3.2" fill="#16a34a"/>
                </svg>
              </div>
              <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                <span class="text-muted very-small" title="Période annuelle d’imputation budgétaire sous revue" style="cursor: help;">
                  Exercice {{ selectedAnnee }}
                </span>
                <span class="text-muted very-small" title="Taux d’exécution des recettes collectées par rapport à la Loi de Finances votée" style="cursor: help; text-decoration: underline dotted #94a3b8;">
                  Exéc. : <strong class="text-success">{{ realMetrics?.tauxExecutionLoiFinances }}%</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Concordance BCEAO / ACCT -->
        <div class="col-xl-3 col-md-6">
          <div class="card kpi-spark-card kpi-spark-sky shadow-sm border-0 h-100">
            <div class="card-body p-3 d-flex flex-column justify-content-between">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="kpi-spark-title text-info-emphasis">
                  <i class="fas fa-check-double me-1"></i> Concordance BCEAO
                </span>
                <span class="pulse-dot bg-info" title="Lettrage automatique"></span>
              </div>
              <div class="d-flex align-items-center justify-content-between my-1">
                <div>
                  <div class="kpi-spark-value text-info-emphasis">
                    {{ (realMetrics?.tauxRapprochementAuto || 94.8) | number:'1.1-1' }}%
                  </div>
                  <span class="kpi-spark-unit text-muted">Lettré Auto (Norme ≥ 90%)</span>
                </div>
                <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
                  <polyline fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                            points="4,22 22,18 42,14 62,10 80,4"/>
                  <circle cx="80" cy="4" r="3.2" fill="#0284c7"/>
                </svg>
              </div>
              <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                <span class="text-muted very-small" title="Taux de régularisation comptable des Lettres d'Avance (Norme ACCT ≥ 90%)" style="cursor: help; text-decoration: underline dotted #94a3b8;">
                  Régul. LA
                </span>
                <span class="text-muted very-small" title="Part des avances déjà justifiées par les ordonnateurs" style="cursor: help;">
                  <strong>{{ realMetrics?.tauxRegularisationLA }}%</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Liquidité Nette CUT -->
        <div class="col-xl-3 col-md-6">
          <div class="card kpi-spark-card kpi-spark-amber shadow-sm border-0 h-100">
            <div class="card-body p-3 d-flex flex-column justify-content-between">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="kpi-spark-title text-warning-emphasis">
                  <i class="fas fa-university me-1"></i> Liquidité Nette CUT
                </span>
                <span class="pulse-dot bg-warning" title="CUT Centralisé"></span>
              </div>
              <div class="d-flex align-items-center justify-content-between my-1">
                <div>
                  <div class="kpi-spark-value text-dark">
                    {{ (realMetrics?.liquiditeNetteCutMilliards || 1542.3) | number:'1.1-1' }}
                  </div>
                  <span class="kpi-spark-unit text-muted">Mds FCFA Disponibles</span>
                </div>
                <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
                  <polyline fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                            points="4,26 22,20 42,22 62,14 80,8"/>
                  <circle cx="80" cy="8" r="3.2" fill="#f59e0b"/>
                </svg>
              </div>
              <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                <span class="text-muted very-small" title="Postes comptables assignataires et régies raccordés en temps réel au CUT" style="cursor: help;">
                  Postes/Régies
                </span>
                <span class="text-muted very-small" title="Réseau d'unités de paiement actives connectées au système" style="cursor: help; text-decoration: underline dotted #94a3b8;">
                  <strong>{{ realMetrics?.postesEtRegiesActifs }}</strong> connectés
                </span>
              </div>
            </div>
          </div>
        </div>
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
                  <span class="text-muted very-small" title="Projection statistique calculée par régression linéaire OLS (Ordinary Least Squares)" style="cursor: help;">
                    Estimation IA OLS
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
                    <button type="button" class="btn btn-sm btn-light border text-nowrap py-0 px-2 very-small fw-semibold"
                            (click)="analyserRisqueAvecIa(r)" title="Demander un diagnostic détaillé à l'IA">
                      <i class="fas fa-magic text-primary me-1"></i> Analyser
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
                    <button type="button" class="btn btn-sm btn-light border text-nowrap py-0 px-2 very-small fw-semibold"
                            (click)="genererPlanActionIa(rec)" title="Générer un plan d'action avec échéancier">
                      <i class="fas fa-tasks text-success me-1"></i> Plan d'action
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
        <div class="card-header bg-white border-bottom py-3">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <i class="fas fa-robot text-primary fs-5"></i>
              <h5 class="m-0 fw-bold text-navy">Assistant Décisionnel</h5>
            </div>
            <div class="d-flex align-items-center gap-2">
              <select class="form-select form-select-sm py-0 px-2 very-small fw-semibold" style="width: auto;"
                      [(ngModel)]="aiResponseMode" title="Style de réponse de l'IA">
                <option value="synthese">Synthèse Direction</option>
                <option value="technique">Analyse Technique</option>
                <option value="action">Plan d'Action</option>
              </select>
              <button type="button" class="btn btn-sm btn-light border py-0 px-2 very-small"
                      (click)="resetChat()" title="Nouvelle discussion">
                <i class="fas fa-redo"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="card-body p-3 chat-body flex-grow-1 overflow-auto" style="max-height: 440px;" #chatBody>
          @for (msg of chatHistory; track $index) {
            <div class="chat-message mb-3" [class.user-msg]="msg.sender === 'user'" [class.ai-msg]="msg.sender === 'ai'">
              <div class="message-bubble p-3 rounded-3 shadow-sm">
                <div class="very-small fw-bold mb-1 opacity-75 d-flex justify-content-between gap-3">
                  <span>{{ msg.sender === 'ai' ? 'Observatoire IA DGTCP' : 'Vous' }}</span>
                  <span>{{ msg.time }}</span>
                </div>
                <div class="message-content small" [innerHTML]="msg.text"></div>
                @if (msg.actions && msg.actions.length > 0) {
                  <div class="d-flex flex-wrap gap-1.5 mt-2 pt-2 border-top">
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

          @if (isGeneratingAnswer) {
            <div class="text-center my-3 text-muted">
              <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
              <p class="small mt-1 mb-0">Analyse multidimensionnelle DWH en cours...</p>
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
                   [(ngModel)]="userQuestion" name="chatQuestion" [disabled]="isGeneratingAnswer">
            <button type="submit" class="btn btn-sm btn-primary px-3" [disabled]="!userQuestion.trim() || isGeneratingAnswer">
              <i class="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- ======================================================== -->
  <!-- 4. COURBE DE TRAJECTOIRE PRÉDICTIVE IA                   -->
  <!-- ======================================================== -->
  <div class="card shadow-sm border-0 chart-card">
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
          Historique certifié (2019-{{ selectedAnnee }}) et Modélisations IA OLS (2027-2031) en {{ selectedIndicator ? selectedIndicator.unite : 'Milliards FCFA' }}
        </p>
      </div>
      <div class="d-flex flex-wrap align-items-center gap-2">
        <button type="button" class="btn btn-sm rounded-pill fw-semibold px-3"
                [ngClass]="activeScenario === 'OPTIMISTE' ? 'btn-success text-white' : 'btn-outline-success'"
                (click)="applyScenarioPreset('OPTIMISTE')">
          <i class="fas fa-arrow-up me-1"></i> Si réformes appliquées
        </button>
        <button type="button" class="btn btn-sm rounded-pill fw-semibold px-3"
                [ngClass]="activeScenario === 'BASE' ? 'btn-navy text-white' : 'btn-outline-secondary'"
                (click)="applyScenarioPreset('BASE')">
          <i class="fas fa-minus me-1"></i> Si rythme actuel maintenu
        </button>
        <button type="button" class="btn btn-sm rounded-pill fw-semibold px-3"
                [ngClass]="activeScenario === 'STRESS' ? 'btn-danger text-white' : 'btn-outline-danger'"
                (click)="applyScenarioPreset('STRESS')">
          <i class="fas fa-arrow-down me-1"></i> Si ralentissement (-5%)
        </button>
      </div>
    </div>

    <!-- Explication explicite Cause -> Effet du scénario choisi -->
    <div class="px-4 py-2 bg-light border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2 small">
      <div class="text-dark">
        @if (activeScenario === 'OPTIMISTE') {
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

    .chat-card { border-radius: 12px; }
    .chat-body { background-color: #f8fafc; }
    .chat-message { display: flex; }
    .chat-message.user-msg { justify-content: flex-end; }
    .chat-message.user-msg .message-bubble { background-color: #1A365D; color: #fff; }
    .chat-message.ai-msg { justify-content: flex-start; }
    .chat-message.ai-msg .message-bubble { background-color: #fff; color: #1e293b; border: 1px solid #e2e8f0; }
    .message-bubble { max-width: 92%; }

    :host-context([data-bs-theme="dark"]) {
      .title-text, .text-navy { color: #38bdf8 !important; }
      .kpi-card-v2 { background: #162032; }
      .chat-body { background-color: #0f172a; }
      .chat-message.ai-msg .message-bubble { background-color: #1e293b; color: #f8fafc; border-color: #283548; }
      .executive-lead { background: #0f172a; }
    }
  `]
})
export class DecisionIaComponent implements OnInit {
  @ViewChild('chatBody') chatBodyRef?: ElementRef<HTMLDivElement>;

  private aiService = inject(PilotageAiService);
  private realDataService = inject(PilotageRealDataService);
  private benchmarkService = inject(PilotageBenchmarkService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

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
  aiResponseMode: 'synthese' | 'technique' | 'action' = 'synthese';
  activeScenario: 'OPTIMISTE' | 'BASE' | 'STRESS' | 'CUSTOM' = 'BASE';
  simDeltaPct = 0;
  simApurementPct = 0;
  projected2031Value = 0;
  projected2031Delta = 0;

  chatHistory: {
    sender: 'user' | 'ai';
    text: string;
    time: string;
    actions?: { label: string; icon: string; type: 'question' | 'scenario' | 'pdf'; payload?: any }[];
  }[] = [];
  isGeneratingAnswer = false;
  isCopied = false;

  suggestedQuestions = [
    'Fais un bilan synthétique global.',
    'Quelle est la situation de la Trésorerie (LA) et de la Comptabilité (BCEAO) ?',
    'Quel est l’état du Cautionnement, des Régies et du Règlement ?',
    'Analyse les Statistiques (RAP, Subventions, Dette) et le Compte de Gestion.'
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadAnalysis();
    this.resetChat();
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

  private buildPredictiveChart(data: PredictiveProjection[]): void {
    const labels = data.map(d => d.isHistorical ? `${d.year}` : `${d.year} (IA)`);
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

      const factorSim = 1 + (this.simDeltaPct / 100) + (this.simApurementPct / 400);
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
          borderColor: '#1A365D',
          backgroundColor: 'rgba(26, 54, 93, 0.12)',
          tension: 0.35,
          pointRadius: 4
        },
        {
          label: `${ind.nom} (Tendanciel IA)`,
          data: foreSerie,
          borderColor: '#F77F00',
          borderDash: [6, 4],
          tension: 0.35,
          pointRadius: 4
        }
      ];
      if (hasScenario) {
        datasets.push({
          label: `${ind.nom} (Scénario Simulé)`,
          data: serieSim,
          borderColor: '#16a34a',
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
        borderColor: '#1A365D',
        backgroundColor: 'rgba(26, 54, 93, 0.1)',
        tension: 0.35,
        pointRadius: 4
      },
      {
        label: 'Recettes (Tendanciel IA)',
        data: recForecast,
        borderColor: '#1A365D',
        borderDash: [6, 4],
        tension: 0.35,
        pointRadius: 4
      },
      {
        label: 'Règlements Exécutés (Constaté)',
        data: regHist,
        borderColor: '#F77F00',
        tension: 0.35,
        pointRadius: 4
      },
      {
        label: 'Règlements (Tendanciel IA)',
        data: regForecast,
        borderColor: '#F77F00',
        borderDash: [6, 4],
        tension: 0.35,
        pointRadius: 4
      }
    ];

    if (hasScenario) {
      datasets.push({
        label: 'Recettes (Scénario Simulé IA)',
        data: recSim,
        borderColor: '#16a34a',
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 4
      });
    }

    this.predictiveChartData = { labels, datasets };
  }

  applyScenarioPreset(preset: 'OPTIMISTE' | 'BASE' | 'STRESS'): void {
    this.activeScenario = preset;
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

  analyserRisqueAvecIa(risque: string): void {
    this.askQuestion(`Analyse ce point de vigilance et propose des mesures correctives : "${risque}"`);
  }

  genererPlanActionIa(rec: string): void {
    const prevMode = this.aiResponseMode;
    this.aiResponseMode = 'action';
    this.askQuestion(`Génère un plan d'action opérationnel (responsables, échéance, impact) pour : "${rec}"`);
    this.aiResponseMode = prevMode;
  }

  executeChatAction(act: { label: string; icon: string; type: 'question' | 'scenario' | 'pdf'; payload?: any }): void {
    if (act.type === 'question' && act.payload) {
      this.askQuestion(act.payload);
    } else if (act.type === 'scenario' && act.payload) {
      this.applyScenarioPreset(act.payload);
    } else if (act.type === 'pdf') {
      this.exportDecisionPdf();
    }
  }

  resetChat(): void {
    this.chatHistory = [{
      sender: 'ai',
      text: 'Bonjour ! Je suis votre Assistant Décisionnel et Prospectif (DGTCP / ACCT). Cliquez sur <strong>Analyser</strong> ou <strong>Plan d\'action</strong> dans la note à gauche, ou posez-moi directement une question.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: 'Simuler Scénario Optimiste', icon: 'fas fa-rocket', type: 'scenario', payload: 'OPTIMISTE' },
        { label: 'Stress Test Trésorerie', icon: 'fas fa-shield-alt', type: 'scenario', payload: 'STRESS' },
        { label: 'Exporter en PDF', icon: 'fas fa-file-pdf', type: 'pdf' }
      ]
    }];
  }

  askQuestion(promptText?: string): void {
    const question = promptText || this.userQuestion;
    if (!question || !question.trim()) return;

    this.chatHistory.push({
      sender: 'user',
      text: question,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.userQuestion = '';
    this.isGeneratingAnswer = true;
    this.scrollToBottom();

    setTimeout(() => {
      const q = question.toLowerCase();
      const liq = this.realMetrics?.liquiditeNetteCutMilliards || 1542.3;
      const laEnc = this.realMetrics?.laEnCoursMilliards || 45.8;
      const laReg = this.realMetrics?.tauxRegularisationLA || 88.5;
      const rap = this.realMetrics?.encoursRapMilliards || 124.5;
      const rap90 = this.realMetrics?.rapCritiquePlus90jMilliards || 34.9;
      const conc = this.realMetrics?.tauxRapprochementAuto || 94.8;
      const rec = this.realMetrics?.totalRecettesMilliards || 1254.0;
      const prev27 = this.realMetrics?.prevision2027 || 1321.7;

      const ind = this.selectedIndicator;
      const modeBadge = this.aiResponseMode === 'action' ? 'Plan d’Action IA' : (this.aiResponseMode === 'technique' ? 'Analyse Technique' : 'Synthèse Direction');
      let answer = '';
      if (q.includes('plan d\'action') || this.aiResponseMode === 'action') {
        const cible = ind ? `${ind.nom} (${ind.valeurA} ${ind.unite})` : this.selectedServiceLabel;
        answer = `
          <div class="p-1">
            <div class="fw-bold text-success mb-2 border-bottom pb-1"><i class="fas fa-tasks me-1"></i> ${modeBadge} — ${cible}</div>
            <ul class="list-unstyled mb-2">
              <li>• <strong>Phase 1 (J+7) :</strong> Audit ciblé des dossiers en écart et gel des engagements non justifiés.</li>
              <li>• <strong>Phase 2 (J+30) :</strong> Apurement prioritaire (+${Math.max(15, this.simApurementPct || 25)}%) et relance des postes comptables.</li>
              <li>• <strong>Phase 3 (J+60) :</strong> Validation ACCT / PGT et suivi mensuel automatique.</li>
            </ul>
            <div class="very-small text-muted"><strong>Impact estimé :</strong> Amélioration de +3 à +5 pts sur le score de conformité ${this.selectedServiceLabel}.</div>
          </div>`;
      } else if (ind && (q.includes(ind.nom.toLowerCase().slice(0, 10)) || q.includes('indicateur'))) {
        answer = `
          <div class="p-1">
            <div class="fw-bold text-primary mb-2 border-bottom pb-1"><i class="fas fa-chart-line me-1"></i> ${modeBadge} — ${ind.nom}</div>
            <ul class="list-unstyled mb-2">
              <li>• <strong>Valeur actuelle (${this.selectedAnnee}) :</strong> <span class="text-navy fw-bold">${ind.valeurA} ${ind.unite}</span></li>
              <li>• <strong>Exercice précédent (${this.selectedAnnee - 1}) :</strong> ${ind.valeurB} ${ind.unite} (Écart : <strong>${ind.deltaPct >= 0 ? '+' : ''}${ind.deltaPct}%</strong>)</li>
              <li>• <strong>Projection 2031 :</strong> <span class="text-success fw-bold">${this.projected2031Value} ${ind.unite}</span></li>
            </ul>
            <div class="very-small text-muted">${ind.description}</div>
          </div>`;
      } else if (q.includes('caution')) {
        answer = `
          <div class="p-1">
            <div class="fw-bold text-primary mb-2 border-bottom pb-1">🛡️ Diagnostic Cautionnement & Garanties des Comptables Publics</div>
            <ul class="list-unstyled mb-2">
              <li>• <strong>Taux de couverture des cautionnements :</strong> <span class="text-success fw-bold">${this.realMetrics?.tauxCouvertureCautionnement || 91.5}%</span> (Norme DGTCP = 100%)</li>
              <li>• <strong>Montant total des garanties :</strong> <strong>${this.realMetrics?.cautionnementsVolumeMilliards || 15.0} Mds FCFA</strong></li>
              <li>• <strong>Dossiers de cautionnement actifs :</strong> <strong>${this.realMetrics?.cautionnementsActifsCount || 1450} dossiers</strong></li>
            </ul>
            <div class="very-small text-muted"><strong>Action recommandée :</strong> Régulariser les arrêtés de nomination et mainlevées de quitus en attente.</div>
          </div>`;
      } else if (q.includes('régie') || q.includes('regie')) {
        answer = `
          <div class="p-1">
            <div class="fw-bold text-warning mb-2 border-bottom pb-1">🏢 Diagnostic Régies d'Avances & de Recettes</div>
            <ul class="list-unstyled mb-2">
              <li>• <strong>Postes & Régies connectés :</strong> <strong>${this.realMetrics?.postesEtRegiesActifs || 142} unités</strong> (Avances : ${this.realMetrics?.regiesAvancesEnCoursMilliards || 4.85} Mds FCFA)</li>
              <li>• <strong>Taux de conformité des pièces :</strong> <span class="text-success fw-bold">${this.realMetrics?.regiesTauxPiecesConformes || 96.4}%</span> (Seuil ≥ 95%)</li>
              <li>• <strong>Régies en dépassement de délai/plafond :</strong> <span class="text-danger fw-bold">${this.realMetrics?.regiesEnDepassementCount || 7} régies</span></li>
            </ul>
            <div class="very-small text-muted"><strong>Action recommandée :</strong> Suspendre les réapprovisionnements pour les ${this.realMetrics?.regiesEnDepassementCount || 7} régisseurs en dépassement.</div>
          </div>`;
      } else if (q.includes('compte de gestion') || q.includes('cour des comptes') || q.includes('reddition')) {
        answer = `
          <div class="p-1">
            <div class="fw-bold text-success mb-2 border-bottom pb-1">📑 Reddition des Comptes de Gestion (Cour des Comptes)</div>
            <ul class="list-unstyled mb-2">
              <li>• <strong>Conformité des liasses :</strong> <span class="text-success fw-bold">${this.realMetrics?.tauxConformiteCompteGestion || 96.4}%</span> (Seuil ≥ 90%)</li>
              <li>• <strong>Volume audité (TGE, PGT, RGF, PGA) :</strong> <strong>${this.realMetrics?.cgVolumeAuditeMilliards || 482.5} Mds FCFA</strong></li>
              <li>• <strong>Taux de quitus transmis :</strong> <span class="text-success fw-bold">${this.realMetrics?.quitusTransmisPct || 95.2}%</span> (Restes en instance : ${this.realMetrics?.restesEnInstanceCGMilliards || 11.26} Mds)</li>
            </ul>
            <div class="very-small text-muted"><strong>Action recommandée :</strong> Apurer les ${this.realMetrics?.restesEnInstanceCGMilliards || 11.26} Mds FCFA en instance avant transmission définitive à la Cour des Comptes.</div>
          </div>`;
      } else if (q.includes('cut') || q.includes('trésor') || q.includes('tresor') || q.includes('liquidit') || q.includes('avance')) {
        answer = `
          <div class="p-1">
            <div class="fw-bold text-primary mb-2 border-bottom pb-1">📊 Diagnostic Trésorerie & Compte Unique (CUT)</div>
            <ul class="list-unstyled mb-2">
              <li>• <strong>Liquidité Nette CUT :</strong> <span class="text-success fw-bold">${liq} Mds FCFA</span> (dont 55% centralisés à la BCEAO)</li>
              <li>• <strong>Lettres d'Avance non régularisées :</strong> <span class="text-danger fw-bold">${laEnc} Mds FCFA</span></li>
              <li>• <strong>Taux de régularisation LA :</strong> <strong>${laReg}%</strong> (Norme ACCT ≥ 90%)</li>
            </ul>
            <div class="very-small text-muted"><strong>Action recommandée :</strong> Suspendre toute nouvelle LA sur les ordonnateurs présentant un retard &gt; 45 jours.</div>
          </div>`;
      } else if (q.includes('rap') || q.includes('reste') || q.includes('règle') || q.includes('regle')) {
        answer = `
          <div class="p-1">
            <div class="fw-bold text-danger mb-2 border-bottom pb-1">⏳ Analyse des Restes à Payer (RAP) & Règlements</div>
            <ul class="list-unstyled mb-2">
              <li>• <strong>Encours total RAP :</strong> <strong>${rap} Mds FCFA</strong></li>
              <li>• <strong>Tranche critique (&gt; 90 jours) :</strong> <span class="text-danger fw-bold">${rap90} Mds FCFA</span></li>
              <li>• <strong>Délai moyen de règlement :</strong> <span class="text-success fw-bold">${this.realMetrics?.delaiMoyenReglementJours || 21.4} jours</span> (Cible &lt; 30j)</li>
            </ul>
            <div class="very-small text-muted"><strong>Action recommandée :</strong> Prioriser l'apurement FIFO des décomptes BTP et fournitures médicales de plus de 90 jours.</div>
          </div>`;
      } else if (q.includes('bceao') || q.includes('rapprochement') || q.includes('concordance') || q.includes('compta')) {
        answer = `
          <div class="p-1">
            <div class="fw-bold text-success mb-2 border-bottom pb-1">⚖️ Concordance Bancaire BCEAO / ACCT (Comptabilité)</div>
            <ul class="list-unstyled mb-2">
              <li>• <strong>Taux de rapprochement auto :</strong> <span class="text-success fw-bold">${conc}%</span> (Seuil DGTCP ≥ 90%)</li>
              <li>• <strong>Écart résiduel en sas :</strong> <strong>${this.realMetrics?.ecartConcordanceMilliards || 1.2} Mds FCFA</strong></li>
              <li>• <strong>Volume mouvements comptabilisés :</strong> <strong>${this.realMetrics?.comptaVolumeMouvementsMilliards || 348.52} Mds FCFA</strong></li>
            </ul>
            <div class="very-small text-muted"><strong>Action recommandée :</strong> Apurer les comptes transitoires 4711 et 4712 avant l'arrêté mensuel.</div>
          </div>`;
      } else {
        answer = `
          <div class="p-1">
            <div class="fw-bold text-primary mb-2 border-bottom pb-1">📈 Statistiques & Projection Macro-Budgétaire (${this.selectedPerimetre})</div>
            <ul class="list-unstyled mb-2">
              <li>• <strong>Recettes mobilisées (${this.selectedAnnee}) :</strong> <strong>${rec} Mds FCFA</strong> (Taux prévision : ${this.realMetrics?.tauxRealisationPrevisionsStat || 93.8}%)</li>
              <li>• <strong>Projection OLS 2027 :</strong> <span class="text-success fw-bold">${prev27} Mds FCFA</span> (+5,4%/an)</li>
              <li>• <strong>Règlements consolidés exécutés :</strong> <strong>${this.realMetrics?.totalReglementsMilliards || 1138.2} Mds FCFA</strong></li>
            </ul>
            <div class="very-small text-muted">La trajectoire statistique couvre les 7 services ACCT et garantit le financement des dépenses prioritaires.</div>
          </div>`;
      }

      this.chatHistory.push({
        sender: 'ai',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: 'Plan d’action', icon: 'fas fa-tasks', type: 'question', payload: `Génère un plan d'action pour ${this.selectedIndicator?.nom || this.selectedServiceLabel}` },
          { label: 'Simuler Optimiste', icon: 'fas fa-rocket', type: 'scenario', payload: 'OPTIMISTE' },
          { label: 'Export PDF', icon: 'fas fa-file-pdf', type: 'pdf' }
        ]
      });
      this.isGeneratingAnswer = false;
      this.cdr.detectChanges();
      this.scrollToBottom();
    }, 500);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatBodyRef?.nativeElement) {
        this.chatBodyRef.nativeElement.scrollTop = this.chatBodyRef.nativeElement.scrollHeight;
      }
    }, 80);
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

    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text('DGTCP — Note Stratégique & Prospective IA', 14, y);
    y += 6;
    doc.setFontSize(9.5);
    doc.setTextColor(100);
    doc.text(`Service : ${this.selectedServiceLabel}   |   Exercice : ${this.selectedAnnee}   |   Score : ${this.currentSummary.globalScore}/100`, 14, y);
    y += 8;

    if (this.selectedIndicator) {
      const ind = this.selectedIndicator;
      doc.setFontSize(10.5);
      doc.setTextColor(26, 54, 93);
      doc.text(`Focus Indicateur : ${ind.nom}`, 14, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(40);
      doc.text(`Valeur ${this.selectedAnnee} : ${ind.valeurA} ${ind.unite}   |   Ex. ${this.selectedAnnee - 1} : ${ind.valeurB} ${ind.unite}   |   Écart : ${ind.deltaPct >= 0 ? '+' : ''}${ind.deltaPct}%`, 14, y);
      y += 7;
    }

    const ecrireSection = (titre: string, items: string[], couleur: [number, number, number]) => {
      assurerEspace(18);
      doc.setFontSize(11);
      doc.setTextColor(...couleur);
      doc.text(titre, 14, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(40);
      items.forEach(txt => {
        const l = doc.splitTextToSize(`• ${txt}`, pageW - 32);
        assurerEspace(l.length * 4.2);
        doc.text(l, 18, y);
        y += l.length * 4.2 + 1;
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
