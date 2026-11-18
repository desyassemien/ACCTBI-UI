import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  PilotageRealDataService,
  RealDataPilotageMetrics,
  ServiceSyntheseMetric,
  WhatIfSimulationResult
} from '../../../core/services/pilotage-real-data.service';
import {
  PilotageBenchmarkService,
  ComparativeIndicator,
  ServiceDomainFilter
} from '../../../core/services/pilotage-benchmark.service';

export interface PilotageRiskAlert {
  id: string;
  severite: 'CRITIQUE' | 'VIGILANCE' | 'INFO';
  domaine: string;
  titre: string;
  description: string;
  dateDetection: string;
  statut: 'NON_LUE' | 'LUE' | 'RESOLUE';
  routeCible: string;
}

@Component({
  selector: 'app-synthese-decisionnelle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective],
  template: `
<div class="surveillance-container py-3">

  <!-- 1. EN-TÊTE EXÉCUTIF & SÉLECTEURS DE DONNÉES RÉELLES -->
  <div class="header-card card shadow-sm border-0 mb-3 px-4 py-3">
    <div class="row align-items-center">
      <div class="col-xl-5 col-lg-5">
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge-dgtcp-pill"><i class="fas fa-shield-alt me-1"></i> PILOTAGE & SURVEILLANCE</span>
        </div>
        <h2 class="m-0 fw-bold title-text mb-1">Synthèse Décisionnelle & Prédictive</h2>
        <p class="text-muted m-0 header-subtitle mt-1">
          Consolidation temps réel des <strong>7 Services</strong> (<strong>Comptabilité</strong>, <strong>Trésorerie</strong>,
          <strong>Cautionnement</strong>, <strong>Régies</strong>, <strong>Règlement</strong>, <strong>Statistiques</strong>,
          <strong>Compte de Gestion</strong>) et projections 2027-2031.
        </p>
      </div>

      <div class="col-xl-7 col-lg-7 mt-3 mt-lg-0">
        <div class="header-selectors d-flex flex-wrap flex-xl-nowrap justify-content-lg-end align-items-end gap-2">
          <div class="d-flex flex-column" style="min-width: 170px;">
            <label class="form-label text-uppercase mb-1 very-small fw-bold text-muted">
              <i class="fas fa-layer-group text-primary me-1"></i> Service
            </label>
            <select class="form-select form-select-sm fw-semibold"
                    [ngModel]="selectedServiceFilter"
                    (ngModelChange)="onServiceChange($event)">
              @for (s of serviceFilterOptions; track s.id) {
                <option [ngValue]="s.id">{{ s.label }}</option>
              }
            </select>
          </div>

          <div class="d-flex flex-column" style="min-width: 210px; max-width: 265px;">
            <label class="form-label text-uppercase mb-1 very-small fw-bold text-muted">
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

          <div class="d-flex flex-column" style="width: 100px; flex-shrink: 0;">
            <label class="form-label text-uppercase mb-1 very-small fw-bold text-muted text-nowrap">
              <i class="far fa-calendar-alt text-primary me-1"></i> Exercice
            </label>
            <select class="form-select form-select-sm fw-bold text-navy" [(ngModel)]="selectedExercice" (change)="onExerciceChange()">
              @for (ex of exerciceList; track ex) {
                <option [value]="ex">{{ ex }}</option>
              }
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 2. TIMELINE CHRONOLOGIQUE (2019 -> 2026) + REPLAY -->
  <div class="timeline-card card shadow-sm border-0 mb-4">
    <div class="card-body p-3">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="d-flex align-items-center gap-2">
          <span class="small fw-bold text-uppercase text-muted">
            <i class="fas fa-history text-primary me-1"></i> Chronologie Multi-Exercices :
          </span>
          <button type="button" class="btn btn-sm"
                  [ngClass]="isReplayPlaying ? 'btn-danger' : 'btn-outline-primary'"
                  (click)="toggleTimelineReplay()">
            <i class="fas" [ngClass]="isReplayPlaying ? 'fa-pause me-1' : 'fa-play me-1'"></i>
            {{ isReplayPlaying ? 'Pause' : 'Replay (2019-2026)' }}
          </button>
        </div>

        <div class="d-flex align-items-center justify-content-center gap-1 flex-wrap">
          @for (y of timelineYears; track y; let i = $index) {
            <button type="button" class="btn btn-sm timeline-btn"
                    [ngClass]="selectedExercice === y ? 'timeline-btn-active fw-bold shadow-sm' : 'btn-outline-secondary'"
                    (click)="selectTimelineYear(i)">
              {{ y }}
            </button>
          }
        </div>

        <div class="text-muted very-small d-none d-md-block">
          <i class="fas fa-database text-success me-1"></i> Sync : <strong>{{ realMetrics.lastSyncTime }}</strong>
        </div>
      </div>
    </div>
  </div>

  <!-- 3. BANDEAU DE 4 MACRO-KPIS RÉELS SYGACUT-BI (OPTION 3 : COCKPIT SPARKLINE) -->
  <div class="row g-3 mb-4">
    <!-- KPI 1 : Régies & Recettes -->
    <div class="col-xl-3 col-md-6">
      <div class="card kpi-spark-card kpi-spark-blue shadow-sm border-0 h-100">
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="kpi-spark-title text-navy">
              <i class="fas fa-store me-1 text-primary"></i> Régies & Recettes
            </span>
            <span class="pulse-dot bg-success" title="Collecte conforme"></span>
          </div>

          <div class="d-flex align-items-center justify-content-between my-1">
            <div>
              <div class="kpi-spark-value text-dark">
                {{ realMetrics.totalRecettesMilliards | number:'1.1-1' }}
              </div>
              <span class="kpi-spark-unit text-muted">Mds FCFA Mobilisés</span>
            </div>
            <!-- Sparkline SVG Recettes -->
            <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
              <polyline fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                        points="4,30 22,24 42,26 62,14 80,6"/>
              <circle cx="80" cy="6" r="3.2" fill="#2563eb"/>
            </svg>
          </div>

          <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
            <span class="text-muted very-small" title="Taux d'exécution par rapport aux prévisions de la Loi de Finances" style="cursor: help;">
              Exécution : <strong class="text-success">{{ realMetrics.tauxExecutionLoiFinances }}%</strong>
            </span>
            <span class="text-muted very-small" title="Taux de pièces justificatives conformes des dépenses et recettes des régies (Norme DGTCP ≥ 95%)" style="cursor: help; text-decoration: underline dotted #94a3b8;">
              Pièces : <strong class="text-dark">{{ realMetrics.regiesTauxPiecesConformes }}%</strong>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI 2 : Trésorerie & CUT -->
    <div class="col-xl-3 col-md-6">
      <div class="card kpi-spark-card kpi-spark-green shadow-sm border-0 h-100">
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="kpi-spark-title text-success">
              <i class="fas fa-university me-1"></i> Trésorerie & CUT / BCEAO
            </span>
            <span class="pulse-dot bg-success" title="Liquidité active"></span>
          </div>

          <div class="d-flex align-items-center justify-content-between my-1">
            <div>
              <div class="kpi-spark-value text-dark">
                {{ realMetrics.liquiditeNetteCutMilliards | number:'1.1-1' }}
              </div>
              <span class="kpi-spark-unit text-muted">Mds FCFA Liquidité Nette</span>
            </div>
            <!-- Sparkline SVG Trésorerie CUT -->
            <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
              <polyline fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                        points="4,26 22,22 42,16 62,19 80,7"/>
              <circle cx="80" cy="7" r="3.2" fill="#16a34a"/>
            </svg>
          </div>

          <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
            <span class="text-muted very-small" title="Taux de régularisation des Lettres d'Avance (Norme DGTCP / ACCT ≥ 90%)" style="cursor: help;">
              Régul. LA : <strong class="text-dark">{{ realMetrics.tauxRegularisationLA }}%</strong>
            </span>
            <span class="text-muted very-small" title="Solde cumulé des comptes d'affectation et comptes spéciaux du Trésor" style="cursor: help;">
              Comptes Spéc. : <strong class="text-dark">{{ realMetrics.soldeComptesSpeciauxMilliards }} Mds</strong>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI 3 : Règlement & RAP -->
    <div class="col-xl-3 col-md-6">
      <div class="card kpi-spark-card kpi-spark-orange shadow-sm border-0 h-100">
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="kpi-spark-title text-orange-acct">
              <i class="fas fa-hand-holding-usd me-1"></i> Règlement & RAP
            </span>
            <span class="pulse-dot bg-warning" title="Délai sous surveillance"></span>
          </div>

          <div class="d-flex align-items-center justify-content-between my-1">
            <div>
              <div class="kpi-spark-value text-dark">
                {{ realMetrics.totalReglementsMilliards | number:'1.1-1' }}
              </div>
              <span class="kpi-spark-unit text-muted">Mds FCFA Règlements</span>
            </div>
            <!-- Sparkline SVG Règlements -->
            <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
              <polyline fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                        points="4,12 22,18 42,15 62,23 80,17"/>
              <circle cx="80" cy="17" r="3.2" fill="#f97316"/>
            </svg>
          </div>

          <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
            <span class="text-muted very-small" title="Délai moyen de règlement des mandats et factures (Cible réglementaire < 30 jours)" style="cursor: help;">
              Délai : <strong class="text-dark">{{ realMetrics.delaiMoyenReglementJours }}j</strong>
            </span>
            <span class="text-muted very-small" title="Encours total des Restes à Payer (mandats visés non encore décaissés)" style="cursor: help;">
              RAP : <strong class="text-danger">{{ realMetrics.encoursRapMilliards }} Mds</strong>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI 4 : Comptabilité & Compte de Gestion -->
    <div class="col-xl-3 col-md-6">
      <div class="card kpi-spark-card kpi-spark-amber shadow-sm border-0 h-100">
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="kpi-spark-title text-warning-emphasis">
              <i class="fas fa-book me-1"></i> Comptabilité & CG
            </span>
            <span class="pulse-dot" [ngClass]="isConformeAcct ? 'bg-success' : 'bg-warning'" title="Concordance Bancaire"></span>
          </div>

          <div class="d-flex align-items-center justify-content-between my-1">
            <div>
              <div class="kpi-spark-value text-dark">
                {{ realMetrics.tauxRapprochementAuto }}%
              </div>
              <span class="kpi-spark-unit text-muted">Lettrage Auto BCEAO</span>
            </div>
            <!-- Sparkline SVG Concordance -->
            <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
              <polyline fill="none" stroke="#eab308" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                        points="4,22 22,19 42,14 62,11 80,5"/>
              <circle cx="80" cy="5" r="3.2" fill="#eab308"/>
            </svg>
          </div>

          <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
            <span class="text-muted very-small" title="Taux de conformité des comptes de gestion transmis à la Cour des Comptes (Seuil ≥ 90%)" style="cursor: help;">
              Cour des Cptes : <strong class="text-dark">{{ realMetrics.tauxConformiteCompteGestion }}%</strong>
            </span>
            <span class="text-muted very-small" title="Écart résiduel en sas de concordance entre le relevé BCEAO et la comptabilité ACCT" style="cursor: help;">
              Écart : <strong class="text-dark">{{ realMetrics.ecartConcordanceMilliards }} Mds</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 4. NAVIGATION PAR ONGLETS -->
  <div class="nav-tabs-card card shadow-sm border-0 mb-4">
    <div class="card-body p-3">
      <ul class="nav custom-nav-pills">
        <li class="nav-item">
          <button type="button" class="nav-link" [ngClass]="{'active': activeTab === 'previsions'}"
                  (click)="setTab('previsions')">
            <i class="fas fa-chart-line"></i>
            <span>Synthèse & Projections 2027-2031</span>
          </button>
        </li>
        <li class="nav-item">
          <button type="button" class="nav-link" [ngClass]="{'active': activeTab === 'alertes'}"
                  (click)="setTab('alertes')">
            <i class="fas fa-bell"></i>
            <span>Surveillance des Écarts & Risques</span>
            @if (countAlertesCritique > 0) {
              <span class="badge bg-danger text-white ms-2">{{ countAlertesCritique }}</span>
            }
          </button>
        </li>
      </ul>
    </div>
  </div>

  <!-- ONGLET 1 : SYNTHÈSE DES 7 SERVICES & PROJECTIONS 2027-2031 -->
  @if (activeTab === 'previsions') {
    <div class="tab-pane-content">

      <!-- TABLEAU COCKPIT CONSOLIDÉ DES 7 SERVICES DGTCP -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 class="m-0 fw-bold text-navy">
              <i class="fas fa-layer-group text-primary me-2"></i>
              État Consolidé des Services — Exercice {{ selectedExercice }}
            </h5>
            <span class="text-muted small">Synthèse opérationnelle temps réel par service avec accès direct</span>
          </div>
          <span class="badge bg-primary-subtle text-primary border px-3 py-1">{{ filteredServicesSynthese.length }} / 7 Services Connectés</span>
        </div>
        @if (selectedIndicator; as ind) {
          <div class="mx-3 mt-3 p-3 rounded-3 border bg-light d-flex flex-wrap justify-content-between align-items-center gap-3">
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
                <small class="text-muted">Ex. {{ selectedExercice - 1 }} : {{ ind.valeurB | number:'1.0-2' }} {{ ind.unite }}</small>
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
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr class="text-uppercase very-small fw-bold">
                  <th class="ps-3 py-2">Service</th>
                  <th class="text-end py-2">Volume Consolidé</th>
                  <th class="py-2" style="width: 24%;">Performance / Conformité</th>
                  <th class="py-2">Indicateur Métier Clé</th>
                  <th class="text-center py-2">Statut Prudentiel</th>
                  <th class="text-end pe-3 py-2">Navigation</th>
                </tr>
              </thead>
              <tbody>
                @for (srv of filteredServicesSynthese; track srv.code) {
                  <tr>
                    <td class="ps-3">
                      <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle bg-light d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                          <i [class]="srv.icon + ' text-navy'"></i>
                        </div>
                        <strong class="text-dark">{{ srv.service }}</strong>
                      </div>
                    </td>
                    <td class="text-end fw-bold text-navy">{{ srv.volumeMilliards | number:'1.2-2' }} Mds FCFA</td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="progress progress-thin flex-grow-1">
                          <div class="progress-bar"
                               [ngClass]="srv.tauxPerformance >= 92 ? 'bg-success' : (srv.tauxPerformance >= 88 ? 'bg-primary' : 'bg-warning')"
                               [style.width.%]="srv.tauxPerformance"></div>
                        </div>
                        <strong class="small">{{ srv.tauxPerformance }}%</strong>
                      </div>
                    </td>
                    <td>
                      <span class="very-small text-muted d-block">{{ srv.indicateurCleLabel }}</span>
                      <strong class="small text-dark">{{ srv.indicateurCleValeur }}</strong>
                    </td>
                    <td class="text-center">
                      <span class="badge" [ngClass]="{
                        'bg-success-subtle text-success border border-success-subtle': srv.statut === 'CONFORME',
                        'bg-warning-subtle text-warning-emphasis border border-warning-subtle': srv.statut === 'VIGILANCE',
                        'bg-danger-subtle text-danger border border-danger-subtle': srv.statut === 'ALERTE'
                      }">
                        {{ srv.statut }}
                      </span>
                    </td>
                    <td class="text-end pe-3">
                      <a [routerLink]="srv.route" class="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 very-small fw-bold">
                        Ouvrir <i class="fas fa-arrow-right ms-1"></i>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 3 Cartes de Projections -->
      <div class="row g-3 mb-4 align-items-stretch">
        <div class="col-xl-4 col-md-4 col-12">
          <div class="projection-card card border-0 p-3 h-100 d-flex flex-column">
            <div class="card-header-top mb-1">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="tag-pill tag-blue">TENDANCE PRÉVISIONNELLE</span>
                <span class="badge bg-primary-subtle text-primary"><i class="fas fa-arrow-up me-1"></i>OLS Certifié</span>
              </div>
              <h5 class="fw-bold text-dark m-0" style="font-size: 1.05rem;">Recettes & Régies Projetées 2027</h5>
            </div>
            <div class="prediction-highlight-box my-2">
              <span class="box-label">Estimation Centrale 2027</span>
              <div class="projection-value text-navy">
                {{ realMetrics.prevision2027 }} Mds FCFA
              </div>
              <div class="interval-chip">
                Intervalle à 95% : <strong>{{ realMetrics.prevision2027Min }} – {{ realMetrics.prevision2027Max }} Mds</strong>
              </div>
            </div>
            <p class="text-muted very-small mb-0 mt-auto pt-2">
              Modélisation linéaire calculée sur l'historique certifié des Régies, Impôts, Douanes et OC/LC.
            </p>
          </div>
        </div>

        <div class="col-xl-4 col-md-4 col-12">
          <div class="projection-card card border-0 p-3 h-100 d-flex flex-column">
            <div class="card-header-top mb-1">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="tag-pill tag-green">LIQUIDITÉ COMPTE UNIQUE (CUT)</span>
                <span class="badge bg-success-subtle text-success"><i class="fas fa-shield-alt me-1"></i>Solvabilité</span>
              </div>
              <h5 class="fw-bold text-dark m-0" style="font-size: 1.05rem;">Position Nette CUT Projetée 2027</h5>
            </div>
            <div class="prediction-highlight-box my-2">
              <span class="box-label">Disponibilités Centralisées BCEAO & Banques</span>
              <div class="projection-value text-success">
                {{ realMetrics.projectionsLiquidite[0] }} Mds FCFA
              </div>
              <div class="interval-chip">
                Croissance annuelle moyenne : <strong>+5,8% / an</strong>
              </div>
            </div>
            <p class="text-muted very-small mb-0 mt-auto pt-2">
              Projection intégrant la Trésorerie, le Cautionnement et l'apurement des Lettres d'Avance.
            </p>
          </div>
        </div>

        <div class="col-xl-4 col-md-4 col-12">
          <div class="projection-card card border-0 p-3 h-100 d-flex flex-column">
            <div class="card-header-top mb-1">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="tag-pill tag-orange">HORIZON STRATÉGIQUE 2031</span>
                <span class="badge bg-warning-subtle text-warning-emphasis">Vision 5 Ans</span>
              </div>
              <h5 class="fw-bold text-dark m-0" style="font-size: 1.05rem;">Capacité de Mobilisation 2031</h5>
            </div>
            <div class="prediction-highlight-box my-2">
              <span class="box-label">Projection Long Terme 2031</span>
              <div class="projection-value text-orange-acct">
                {{ realMetrics.projectionsRecettes[4] }} Mds FCFA
              </div>
              <div class="interval-chip">
                Tendance annuelle certifiée : <strong>+{{ realMetrics.tendanceAnnuellePct }}% par an</strong>
              </div>
            </div>
            <p class="text-muted very-small mb-0 mt-auto pt-2">
              Trajectoire pluriannuelle pour le cadrage macro-budgétaire, le Règlement et le Compte de Gestion.
            </p>
          </div>
        </div>
      </div>

      <!-- Graphiques -->
      <div class="row g-3 mb-4">
        <div class="col-xl-8 col-12">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h5 class="m-0 fw-bold text-dark">
                  <i class="fas fa-chart-line text-primary me-2"></i>
                  Trajectoire des Flux Réels & Prédictifs (2019 → 2031)
                </h5>
                <span class="text-muted small">Historique certifié prolongé par régression linéaire OLS (Recettes vs Liquidité CUT)</span>
              </div>
              <div class="d-flex gap-2">
                <span class="badge bg-primary-subtle text-primary border px-3 py-1">Constaté (2019-{{ selectedExercice }})</span>
                <span class="badge bg-warning-subtle text-warning-emphasis border px-3 py-1">Prédit (2027-2031)</span>
              </div>
            </div>
            <div class="card-body p-3">
              <div style="height: 340px; position: relative;">
                @if (isBrowser) {
                  <canvas baseChart
                          [data]="trajectoryChartData"
                          [options]="trajectoryChartOptions"
                          [type]="'line'">
                  </canvas>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-4 col-12">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white border-0 py-3">
              <h5 class="m-0 fw-bold text-dark">
                <i class="fas fa-tachometer-alt text-success me-2"></i>
                Conformité Prudentielle DGTCP
              </h5>
              <span class="text-muted small">Seuil légal de rapprochement BCEAO/ACCT (≥ 90%)</span>
            </div>
            <div class="card-body p-3 d-flex flex-column align-items-center justify-content-between">
              <div class="svg-gauge-wrapper text-center my-1">
                <svg viewBox="0 0 200 120" class="gauge-svg">
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" stroke-width="16" stroke-linecap="round"/>
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none"
                        [attr.stroke]="isConformeAcct ? '#2E7D32' : '#D4A017'"
                        stroke-width="16"
                        stroke-linecap="round"
                        stroke-dasharray="251.2"
                        [attr.stroke-dashoffset]="gaugeDashOffset"/>
                  <text x="100" y="82" text-anchor="middle" class="gauge-val-text">{{ realMetrics.tauxRapprochementAuto }}%</text>
                  <text x="100" y="104" text-anchor="middle" class="gauge-sub-text">
                    {{ isConformeAcct ? 'CONFORME ACCT (+' + ecartAcct + ' pts)' : 'VIGILANCE (' + ecartAcct + ' pts)' }}
                  </text>
                </svg>
              </div>

              <div class="w-100 mt-2">
                <h6 class="very-small text-uppercase fw-bold text-muted mb-2 text-center">Répartition par Service ({{ selectedExercice }})</h6>
                <div style="height: 165px; position: relative;">
                  @if (isBrowser) {
                    <canvas baseChart
                            [data]="breakdownChartData"
                            [options]="breakdownChartOptions"
                            [type]="'doughnut'">
                    </canvas>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tableau Pluriannuel -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <h5 class="m-0 fw-bold text-dark d-flex align-items-center gap-2">
            <i class="fas fa-table text-primary"></i>
            <span>Tableau de Bord Pluriannuel des Flux & Projections ({{ selectedPerimetre }})</span>
          </h5>
          <span class="badge bg-light text-secondary border">Historique & Horizon 2031</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr class="text-uppercase very-small fw-bold">
                  <th class="ps-3 py-2">Exercice</th>
                  <th class="text-end py-2">Recettes & Régies</th>
                  <th class="text-end py-2">Règlements Exécutés</th>
                  <th class="text-end py-2">Liquidité Nette CUT</th>
                  <th class="text-center py-2">Nature de la Donnée</th>
                  <th class="text-center py-2">Méthode / Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (h of realMetrics.historiqueFlux; track h.annee) {
                  <tr>
                    <td class="ps-3"><strong>{{ h.annee }}</strong></td>
                    <td class="text-end fw-bold text-navy">{{ h.recettesMilliards }} Mds FCFA</td>
                    <td class="text-end fw-semibold">{{ h.reglementsMilliards }} Mds FCFA</td>
                    <td class="text-end fw-bold text-success">{{ h.liquiditeMilliards }} Mds FCFA</td>
                    <td class="text-center"><span class="badge bg-success-subtle text-success border border-success-subtle">Réel Certifié</span></td>
                    <td class="text-center text-muted very-small">Arrêté Comptable ACCT ({{ h.tauxConcordance }}%)</td>
                  </tr>
                }
                @for (pYear of realMetrics.anneesProjections; track pYear; let idx = $index) {
                  <tr>
                    <td class="ps-3"><span class="badge bg-warning-subtle text-warning-emphasis fw-bold">{{ pYear }} (Prédit)</span></td>
                    <td class="text-end fw-bold text-orange-acct">{{ realMetrics.projectionsRecettes[idx] }} Mds FCFA</td>
                    <td class="text-end fw-semibold">{{ realMetrics.projectionsReglements[idx] }} Mds FCFA</td>
                    <td class="text-end fw-bold text-primary">{{ realMetrics.projectionsLiquidite[idx] }} Mds FCFA</td>
                    <td class="text-center"><span class="badge bg-info-subtle text-info-emphasis border">Projection IA / OLS</span></td>
                    <td class="text-center text-muted very-small">Modèle Prévisionnel (+5,4%/an)</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ONGLET 2 : SURVEILLANCE DES ÉCARTS & RISQUES (7 SERVICES) -->
  @if (activeTab === 'alertes') {
    <div class="tab-pane-content">
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 class="m-0 fw-bold text-dark">
              <i class="fas fa-bell text-danger me-2"></i>Journal des Risques et Écarts Prudentiels
            </h5>
            <span class="text-muted small">Surveillance proactive couvrant Comptabilité, Trésorerie, Cautionnement, Régies, Règlement, Statistiques et Compte de Gestion</span>
          </div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <select class="form-select form-select-sm fw-semibold" style="width: 210px;"
                    [ngModel]="selectedAlertDomaine"
                    (ngModelChange)="onAlertDomaineChange($event)">
              <option value="TOUS">Tous les Services</option>
              <option value="Comptabilité">Comptabilité</option>
              <option value="Trésorerie">Trésorerie</option>
              <option value="Cautionnement">Cautionnement</option>
              <option value="Régies">Régies</option>
              <option value="Règlement">Règlement</option>
              <option value="Statistiques">Statistiques</option>
              <option value="Compte de Gestion">Compte de Gestion</option>
            </select>

            <select class="form-select form-select-sm fw-bold" style="width: 210px;"
                    [(ngModel)]="selectedAlertSeverite">
              <option value="TOUTES">Toutes les sévérités ({{ alertsForSelectedService.length }})</option>
              <option value="CRITIQUE">Critiques ({{ countAlertesBySeverite('CRITIQUE') }})</option>
              <option value="VIGILANCE">Vigilance ({{ countAlertesBySeverite('VIGILANCE') }})</option>
              <option value="INFO">Informatif ({{ countAlertesBySeverite('INFO') }})</option>
            </select>
          </div>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr class="text-uppercase very-small fw-bold">
                  <th class="ps-3">Sévérité</th>
                  <th>Service</th>
                  <th>Intitulé du Risque / Écart</th>
                  <th>Description Technique</th>
                  <th>Détection</th>
                  <th class="text-end pe-3" style="min-width: 150px;">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (a of untreatedAlerts; track a.id) {
                  <tr>
                    <td class="ps-3">
                      <span class="badge px-2.5 py-1" [ngClass]="{
                        'bg-danger text-white': a.severite === 'CRITIQUE',
                        'bg-warning text-dark': a.severite === 'VIGILANCE',
                        'bg-info text-white': a.severite === 'INFO'
                      }">
                        {{ a.severite }}
                      </span>
                    </td>
                    <td><span class="badge bg-light text-dark border">{{ a.domaine }}</span></td>
                    <td class="fw-bold text-dark">{{ a.titre }}</td>
                    <td class="text-secondary small">{{ a.description }}</td>
                    <td class="text-muted very-small text-nowrap"><i class="far fa-clock me-1"></i>{{ a.dateDetection }}</td>
                    <td class="text-end pe-3 text-nowrap">
                      <button class="btn btn-sm btn-outline-primary me-1" (click)="markAlertAsTreated(a)">
                        <i class="fas fa-check me-1"></i>Marquer traité
                      </button>
                    </td>
                  </tr>
                }

                @if (untreatedAlerts.length === 0 && treatedAlerts.length === 0) {
                  <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                      <i class="fas fa-check-circle text-success fs-3 d-block mb-2"></i>
                      Aucun risque détecté sur les critères sélectionnés.
                    </td>
                  </tr>
                }

                @if (treatedAlerts.length > 0 && !showTreatedAlerts) {
                  <tr>
                    <td colspan="6" class="text-center py-3 bg-light">
                      <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3"
                              (click)="showTreatedAlerts = true">
                        <i class="fas fa-eye me-1"></i>
                        Voir plus ({{ treatedAlerts.length }} alerte{{ treatedAlerts.length > 1 ? 's' : '' }} traitée{{ treatedAlerts.length > 1 ? 's' : '' }})
                      </button>
                    </td>
                  </tr>
                }

                @if (treatedAlerts.length > 0 && showTreatedAlerts) {
                  <tr class="table-light">
                    <td colspan="6" class="py-2 px-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold very-small text-uppercase text-muted">
                          <i class="fas fa-check-circle text-success me-1"></i> Alertes traitées ({{ treatedAlerts.length }})
                        </span>
                        <button type="button" class="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                                (click)="showTreatedAlerts = false">
                          Masquer <i class="fas fa-chevron-up ms-1"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  @for (a of treatedAlerts; track a.id) {
                    <tr class="opacity-75">
                      <td class="ps-3"><span class="badge bg-secondary">{{ a.severite }}</span></td>
                      <td><span class="badge bg-light text-muted border">{{ a.domaine }}</span></td>
                      <td class="text-muted">{{ a.titre }}</td>
                      <td class="text-muted small">{{ a.description }}</td>
                      <td class="text-muted very-small">{{ a.dateDetection }}</td>
                      <td class="text-end pe-3">
                        <button class="btn btn-sm btn-light text-success border" disabled>
                          <i class="fas fa-check me-1"></i>Traité
                        </button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  }

</div>
  `,
  styles: [`
    .surveillance-container { max-width: 1600px; margin: 0 auto; }
    .text-navy { color: #1A365D !important; }
    .bg-navy { background-color: #1A365D !important; }
    .text-orange-acct { color: #F77F00 !important; }
    .bg-orange-acct { background-color: #F77F00 !important; }
    .very-small { font-size: 0.74rem; }

    .header-card {
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
    .filter-item-container label { font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 3px; }
    .timeline-card { border-radius: 12px; }
    .timeline-btn { font-size: 0.84rem; padding: 5px 14px; border-radius: 8px; }
    .timeline-btn-active {
      background: linear-gradient(135deg, #1A365D 0%, #2a4a7f 100%) !important;
      color: #fff !important;
      border-color: #1A365D !important;
    }
    /* STYLES MODÈLE 3 : COCKPIT MICRO-SPARKLINE AVEC DÉGRADÉ LÉGER AU BAS */
    .kpi-spark-card {
      background: #ffffff;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-spark-card.kpi-spark-blue {
      background: linear-gradient(180deg, #ffffff 60%, rgba(37, 99, 235, 0.05) 100%) !important;
    }
    .kpi-spark-card.kpi-spark-green {
      background: linear-gradient(180deg, #ffffff 60%, rgba(22, 163, 74, 0.06) 100%) !important;
    }
    .kpi-spark-card.kpi-spark-orange {
      background: linear-gradient(180deg, #ffffff 60%, rgba(249, 115, 22, 0.06) 100%) !important;
    }
    .kpi-spark-card.kpi-spark-amber {
      background: linear-gradient(180deg, #ffffff 60%, rgba(217, 119, 6, 0.06) 100%) !important;
    }
    .kpi-spark-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06) !important;
    }
    .kpi-spark-title {
      font-size: 0.74rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .kpi-spark-value {
      font-size: 1.65rem;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.5px;
    }
    .kpi-spark-unit {
      font-size: 0.72rem;
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

    .custom-nav-pills { display: flex; flex-wrap: wrap; gap: 10px; }
    .custom-nav-pills .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 10px;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-weight: 600;
      font-size: 0.88rem;
      padding: 9px 18px;
      transition: all 0.2s ease;
    }
    .custom-nav-pills .nav-link.active {
      background: linear-gradient(135deg, #1A365D 0%, #2a4a7f 100%) !important;
      color: #fff !important;
      border-color: #1A365D !important;
      border-bottom: 3px solid #F77F00 !important;
    }

    .projection-card { border-radius: 14px; border: 1px solid #e2e8f0; }
    .tag-pill { font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
    .tag-blue { background: rgba(26, 54, 93, 0.1); color: #1A365D; }
    .tag-green { background: rgba(46, 125, 50, 0.12); color: #2E7D32; }
    .tag-orange { background: rgba(247, 127, 0, 0.12); color: #F77F00; }

    .prediction-highlight-box { padding: 12px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .box-label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
    .projection-value { font-size: 1.5rem; font-weight: 800; margin: 4px 0; }
    .interval-chip { font-size: 0.75rem; color: #475569; }

    .gauge-svg { width: 100%; max-width: 210px; height: auto; }
    .gauge-val-text { font-size: 22px; font-weight: 800; fill: #1A365D; }
    .gauge-sub-text { font-size: 10px; font-weight: 700; fill: #2E7D32; }

    :host-context([data-bs-theme="dark"]) {
      .title-text, .text-navy { color: #38bdf8 !important; }
      .gauge-val-text { fill: #f8fafc; }
      .prediction-highlight-box { background: #0f172a; border-color: #283548; }
      .custom-nav-pills .nav-link:not(.active) { background: #0f172a; border-color: #283548; color: #cbd5e1; }
    }
  `]
})
export class SyntheseDecisionnelleComponent implements OnInit, OnDestroy {
  private realDataService = inject(PilotageRealDataService);
  private benchmarkService = inject(PilotageBenchmarkService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  isBrowser = isPlatformBrowser(this.platformId);
  activeTab: 'previsions' | 'simulateur' | 'alertes' = 'previsions';

  selectedPerimetre = this.realDataService.perimetresList[0];
  selectedExercice = 2026;
  selectedServiceFilter: ServiceDomainFilter = 'TOUS';
  selectedIndicatorCode = 'TOUS';
  perimetresList = this.realDataService.perimetresList;
  timelineYears = this.realDataService.timelineYears;
  exerciceList = this.realDataService.exerciceList;

  readonly serviceFilterOptions: { id: ServiceDomainFilter; label: string; code: string; domaineNom: string }[] = [
    { id: 'TOUS', label: 'Tous les Services', code: 'TOUS', domaineNom: 'TOUS' },
    { id: 'COMPTABILITE', label: 'Comptabilité', code: 'comptabilite', domaineNom: 'Comptabilité' },
    { id: 'TRESORERIE', label: 'Trésorerie', code: 'tresorerie', domaineNom: 'Trésorerie' },
    { id: 'CAUTIONNEMENT', label: 'Cautionnement', code: 'cautionnement', domaineNom: 'Cautionnement' },
    { id: 'REGIES', label: 'Régies', code: 'regies', domaineNom: 'Régies' },
    { id: 'REGLEMENT', label: 'Règlement', code: 'reglement', domaineNom: 'Règlement' },
    { id: 'STATISTIQUES', label: 'Statistiques', code: 'statistiques', domaineNom: 'Statistiques' },
    { id: 'COMPTE_GESTION', label: 'Compte de Gestion', code: 'compte-gestion', domaineNom: 'Compte de Gestion' }
  ];

  allIndicators: ComparativeIndicator[] = [];

  realMetrics: RealDataPilotageMetrics = this.realDataService.getDirectCache(2026, this.selectedPerimetre)!;
  simulationResult: WhatIfSimulationResult = this.realDataService.calculateWhatIf(this.realMetrics, 0, 0, 0);

  timelineCurrentIndex = 7;
  isReplayPlaying = false;
  private replayTimer: any = null;

  simDeltaRecettes = 0;
  simDeltaApurement = 0;
  simDeltaControle = 0;

  readonly seuilAcctConcordance = 90.0;

  trajectoryChartData: ChartData<'line'> = { labels: [], datasets: [] };
  trajectoryChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  breakdownChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  breakdownChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }
  };

  simulationChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  simulationChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } }
  };

  // Alertes couvrant explicitement les 7 Services de ACCTBI-UI
  alertsList: PilotageRiskAlert[] = [
    {
      id: 'RSK-001',
      severite: 'VIGILANCE',
      domaine: 'Comptabilité',
      titre: 'Écart de Concordance sur Virements en Transit (1,20 Mds)',
      description: '18 dossiers d’opérations interbancaires en sas d’imputation sur les comptes 4711 et 5120 (BCEAO / ACCT).',
      dateDetection: 'Aujourd’hui, 08:15',
      statut: 'NON_LUE',
      routeCible: '/comptabilite'
    },
    {
      id: 'RSK-002',
      severite: 'CRITIQUE',
      domaine: 'Trésorerie',
      titre: 'Dépassement Délai Régularisation Lettres d’Avance (45,8 Mds)',
      description: 'Taux de régularisation LA à 88,5% (sous le seuil légal de 90%) avec relances actives sur Défense et Infrastructures.',
      dateDetection: 'Aujourd’hui, 08:40',
      statut: 'NON_LUE',
      routeCible: '/tresorerie'
    },
    {
      id: 'RSK-003',
      severite: 'VIGILANCE',
      domaine: 'Cautionnement',
      titre: 'Cautionnements Échus Non Levés (2,3 Mds FCFA / 320 dossiers)',
      description: 'Garanties comptables et retenues de marchés arrivées à échéance nécessitant mainlevée ou mise en recouvrement.',
      dateDetection: 'Hier, 16:30',
      statut: 'NON_LUE',
      routeCible: '/cautionnement'
    },
    {
      id: 'RSK-004',
      severite: 'VIGILANCE',
      domaine: 'Régies',
      titre: '7 Régies d’Avances en Dépassement de Rotation (> 15 jours)',
      description: 'Audit inopiné requis sur les régies présentant un délai de rotation supérieur à la cible de 15 jours ouvrés.',
      dateDetection: 'Hier, 14:10',
      statut: 'NON_LUE',
      routeCible: '/regies'
    },
    {
      id: 'RSK-005',
      severite: 'VIGILANCE',
      domaine: 'Règlement',
      titre: 'Imputations Provisoires Sans Pièce Justificative (1,85 Mds)',
      description: '14 dossiers de règlement et 8 imputations provisoires en attente de visa d’engagement définitif.',
      dateDetection: 'Il y a 2 jours',
      statut: 'NON_LUE',
      routeCible: '/reglement'
    },
    {
      id: 'RSK-006',
      severite: 'CRITIQUE',
      domaine: 'Statistiques',
      titre: 'Concentration des Restes à Payer > 90 jours (34,9 Mds)',
      description: 'Sur un encours total RAP de 124,5 Mds FCFA, 34,9 Mds dépassent le seuil critique de 90 jours (état statistique N°5).',
      dateDetection: 'Aujourd’hui, 09:15',
      statut: 'NON_LUE',
      routeCible: '/statistiques'
    },
    {
      id: 'RSK-007',
      severite: 'INFO',
      domaine: 'Compte de Gestion',
      titre: 'Reddition Cour des Comptes Validée à 96,4% (Quitus : 95,2%)',
      description: 'Transmission conforme des liasses TGE, PGT, RGF et PGA ; apurement final de 11,26 Mds de restes en instance en cours.',
      dateDetection: 'Il y a 3 jours',
      statut: 'RESOLUE',
      routeCible: '/compte-gestion'
    }
  ];
  selectedAlertSeverite = 'TOUTES';
  selectedAlertDomaine = 'TOUS';
  showTreatedAlerts = false;

  get isConformeAcct(): boolean {
    return this.realMetrics.tauxRapprochementAuto >= this.seuilAcctConcordance;
  }

  get ecartAcct(): string {
    const diff = this.realMetrics.tauxRapprochementAuto - this.seuilAcctConcordance;
    return diff.toFixed(1);
  }

  get gaugeDashOffset(): number {
    return 251.2 - (251.2 * (this.realMetrics.tauxRapprochementAuto / 100));
  }

  get indicatorsForService(): ComparativeIndicator[] {
    if (this.selectedServiceFilter === 'TOUS') return this.allIndicators;
    return this.allIndicators.filter(ind => ind.domaine === this.selectedServiceFilter);
  }

  get selectedIndicator(): ComparativeIndicator | null {
    if (this.selectedIndicatorCode === 'TOUS') return null;
    return this.indicatorsForService.find(ind => ind.code === this.selectedIndicatorCode) ?? null;
  }

  get filteredServicesSynthese(): ServiceSyntheseMetric[] {
    if (this.selectedServiceFilter === 'TOUS') return this.realMetrics.syntheseSeptServices;
    const opt = this.serviceFilterOptions.find(s => s.id === this.selectedServiceFilter);
    if (!opt) return this.realMetrics.syntheseSeptServices;
    return this.realMetrics.syntheseSeptServices.filter(s => s.code === opt.code);
  }

  onServiceChange(service: ServiceDomainFilter): void {
    this.selectedServiceFilter = service;
    this.selectedIndicatorCode = 'TOUS';
    const opt = this.serviceFilterOptions.find(s => s.id === service);
    this.selectedAlertDomaine = opt ? opt.domaineNom : 'TOUS';
    this.cdr.detectChanges();
  }

  onIndicatorChange(code: string): void {
    this.selectedIndicatorCode = code;
    this.cdr.detectChanges();
  }

  onAlertDomaineChange(domaine: string): void {
    this.selectedAlertDomaine = domaine;
    const opt = this.serviceFilterOptions.find(s => s.domaineNom === domaine);
    this.selectedServiceFilter = opt ? opt.id : 'TOUS';
    this.selectedIndicatorCode = 'TOUS';
    this.cdr.detectChanges();
  }

  get alertsForSelectedService(): PilotageRiskAlert[] {
    return this.alertsList.filter(a => this.selectedAlertDomaine === 'TOUS' || a.domaine === this.selectedAlertDomaine);
  }

  get filteredAlerts(): PilotageRiskAlert[] {
    return this.alertsForSelectedService.filter(a => {
      return this.selectedAlertSeverite === 'TOUTES' || a.severite === this.selectedAlertSeverite;
    });
  }

  get untreatedAlerts(): PilotageRiskAlert[] {
    return this.filteredAlerts.filter(a => a.statut === 'NON_LUE');
  }

  get treatedAlerts(): PilotageRiskAlert[] {
    return this.filteredAlerts.filter(a => a.statut !== 'NON_LUE');
  }

  get countAlertesCritique(): number {
    return this.alertsForSelectedService.filter(a => a.severite === 'CRITIQUE' && a.statut === 'NON_LUE').length;
  }

  countAlertesBySeverite(sev: string): number {
    return this.alertsForSelectedService.filter(a => a.severite === sev).length;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['exercice']) {
        const ex = Number(params['exercice']);
        if (!isNaN(ex)) {
          this.selectedExercice = ex;
          const idx = this.timelineYears.indexOf(ex);
          if (idx >= 0) this.timelineCurrentIndex = idx;
        }
      }
      if (params['tab'] === 'simulateur' || params['tab'] === 'alertes') {
        this.activeTab = params['tab'];
      }
      this.loadRealMetrics(this.selectedExercice);
    });
  }

  ngOnDestroy(): void {
    if (this.replayTimer) clearInterval(this.replayTimer);
  }

  setTab(tab: 'previsions' | 'simulateur' | 'alertes'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  loadRealMetrics(year: number): void {
    this.realDataService.getRealMetricsForYear(year, this.selectedPerimetre).subscribe(metrics => {
      this.realMetrics = metrics;
      const compYear = year > 2015 ? year - 1 : year;
      this.benchmarkService.compareYears(year, compYear, this.selectedPerimetre).subscribe(comp => {
        this.allIndicators = comp.indicateurs;
        if (this.selectedIndicatorCode !== 'TOUS' && !this.indicatorsForService.some(i => i.code === this.selectedIndicatorCode)) {
          this.selectedIndicatorCode = 'TOUS';
        }
        this.cdr.detectChanges();
      });
      this.applySimulation();
      this.buildCharts();
      this.cdr.detectChanges();
    });
  }

  onPerimetreChange(): void {
    this.loadRealMetrics(this.selectedExercice);
  }

  onExerciceChange(): void {
    this.selectedExercice = Number(this.selectedExercice);
    this.loadRealMetrics(this.selectedExercice);
  }

  selectTimelineYear(index: number): void {
    this.timelineCurrentIndex = index;
    this.selectedExercice = this.timelineYears[index];
    this.loadRealMetrics(this.selectedExercice);
  }

  toggleTimelineReplay(): void {
    if (this.isReplayPlaying) {
      clearInterval(this.replayTimer);
      this.isReplayPlaying = false;
      return;
    }
    this.isReplayPlaying = true;
    this.timelineCurrentIndex = 0;
    this.selectTimelineYear(0);
    this.replayTimer = setInterval(() => {
      this.timelineCurrentIndex++;
      if (this.timelineCurrentIndex >= this.timelineYears.length) {
        clearInterval(this.replayTimer);
        this.isReplayPlaying = false;
      } else {
        this.selectTimelineYear(this.timelineCurrentIndex);
      }
      this.cdr.detectChanges();
    }, 1100);
  }

  applySimulation(): void {
    this.simulationResult = this.realDataService.calculateWhatIf(
      this.realMetrics,
      this.simDeltaRecettes,
      this.simDeltaApurement,
      this.simDeltaControle
    );
    this.buildSimulationChart();
  }

  setPresetScenario(scenario: 'MOBILISATION_FORTE' | 'NEUTRE' | 'TENSION'): void {
    if (scenario === 'MOBILISATION_FORTE') {
      this.simDeltaRecettes = 8;
      this.simDeltaApurement = 12;
      this.simDeltaControle = 15;
    } else if (scenario === 'NEUTRE') {
      this.simDeltaRecettes = 0;
      this.simDeltaApurement = 0;
      this.simDeltaControle = 0;
    } else {
      this.simDeltaRecettes = -7;
      this.simDeltaApurement = -6;
      this.simDeltaControle = -8;
    }
    this.applySimulation();
  }

  resetSimulation(): void {
    this.setPresetScenario('NEUTRE');
  }

  markAlertAsTreated(alert: PilotageRiskAlert): void {
    alert.statut = 'RESOLUE';
    this.cdr.detectChanges();
  }

  private buildCharts(): void {
    const hist = this.realMetrics.historiqueFlux;
    const histLabels = hist.map(h => `${h.annee}`);
    const projLabels = this.realMetrics.anneesProjections.map(y => `${y} (P)`);
    const allLabels = [...histLabels, ...projLabels];

    const histRec = hist.map(h => h.recettesMilliards);
    const lastHistRec = histRec[histRec.length - 1] || this.realMetrics.totalRecettesMilliards;
    const projRec = this.realMetrics.projectionsRecettes;

    const recRealSeries: (number | null)[] = [...histRec, ...projRec.map(() => null)];
    const recProjSeries: (number | null)[] = [
      ...histRec.slice(0, -1).map(() => null),
      lastHistRec,
      ...projRec
    ];

    const histLiq = hist.map(h => h.liquiditeMilliards);
    const projLiq = this.realMetrics.projectionsLiquidite;
    const liqSeries: (number | null)[] = [...histLiq, ...projLiq];

    this.trajectoryChartData = {
      labels: allLabels,
      datasets: [
        {
          label: 'Recettes Mobilisées Réelles (Mds)',
          data: recRealSeries,
          borderColor: '#1A365D',
          backgroundColor: 'rgba(26, 54, 93, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4
        },
        {
          label: 'Recettes Projetées OLS (2027-2031)',
          data: recProjSeries,
          borderColor: '#F77F00',
          borderDash: [6, 4],
          backgroundColor: 'rgba(247, 127, 0, 0.08)',
          fill: false,
          tension: 0.35,
          pointRadius: 4
        },
        {
          label: 'Liquidité Nette CUT (Mds)',
          data: liqSeries,
          borderColor: '#2E7D32',
          backgroundColor: 'transparent',
          tension: 0.35,
          pointRadius: 3
        }
      ]
    };

    this.breakdownChartData = {
      labels: ['Comptabilité', 'Trésorerie', 'Cautionnement', 'Régies', 'Règlement', 'Statistiques', 'Cpte Gestion'],
      datasets: [
        {
          data: this.realMetrics.syntheseSeptServices.map(s => s.volumeMilliards),
          backgroundColor: ['#1A365D', '#2E7D32', '#F77F00', '#0284c7', '#8b5cf6', '#d97706', '#0d9488']
        }
      ]
    };
  }

  private buildSimulationChart(): void {
    this.simulationChartData = {
      labels: ['Recettes Globales (Mds)', 'Liquidité Nette CUT (Mds)', 'Encours RAP (Mds)'],
      datasets: [
        {
          label: 'Base Certifiée Réelle',
          data: [
            this.realMetrics.totalRecettesMilliards,
            this.realMetrics.liquiditeNetteCutMilliards,
            this.realMetrics.encoursRapMilliards
          ],
          backgroundColor: '#1A365D',
          borderRadius: 6
        },
        {
          label: 'Scénario Simulé (« What-If »)',
          data: [
            this.simulationResult.recettesSimulees,
            this.simulationResult.liquiditeCutSimulee,
            this.simulationResult.rapRestantSimule
          ],
          backgroundColor: '#F77F00',
          borderRadius: 6
        }
      ]
    };
  }
}
