import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData } from 'chart.js';
import {
  PilotageBenchmarkService,
  YearComparisonAnalysis,
  ComparativeIndicator,
  ServiceDomainFilter
} from '../../../core/services/pilotage-benchmark.service';
import { PilotageRealDataService } from '../../../core/services/pilotage-real-data.service';

@Component({
  selector: 'app-analyse-comparative',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  template: `
<div class="benchmark-container py-3">

  <!-- 1. EN-TÊTE STRATÉGIQUE & SÉLECTEURS DE COMPARAISON -->
  <div class="benchmark-header-card card shadow-sm border-0 mb-3 px-3 px-md-4 py-3">
    <div class="row align-items-center g-3">
      <div class="col-xl-5 col-lg-5 col-12">
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge-dgtcp-pill"><i class="fas fa-balance-scale me-1"></i> ANALYSE COMPARATIVE</span>
        </div>
        <h2 class="m-0 fw-bold title-text mb-1">Analyse Comparative & Performance</h2>
        <p class="text-muted m-0 header-subtitle mt-1">
          Évaluation différentielle multi-exercices couvrant <strong>Comptabilité</strong>, <strong>Trésorerie</strong>,
          <strong>Cautionnement</strong>, <strong>Régies</strong>, <strong>Règlement</strong>, <strong>Statistiques</strong> et <strong>Compte de Gestion</strong>.
        </p>
      </div>

      <div class="col-xl-7 col-lg-7 col-12">
        <div class="benchmark-filters d-flex flex-wrap justify-content-lg-end align-items-end gap-2">
          <div class="d-flex flex-column filter-field-service">
            <label class="form-label text-uppercase mb-1 very-small fw-bold text-muted">
              <i class="fas fa-layer-group text-primary me-1"></i> Service
            </label>
            <select class="form-select form-select-sm fw-semibold"
                    [ngModel]="selectedDomainFilter"
                    (ngModelChange)="onServiceChange($event)">
              @for (f of serviceFilterButtons; track f.id) {
                <option [ngValue]="f.id">{{ f.label }}</option>
              }
            </select>
          </div>

          <div class="d-flex flex-column filter-field-indicator">
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

          <div class="year-compare-pair d-flex align-items-end gap-1">
            <div class="d-flex flex-column filter-field-year">
              <label class="form-label text-uppercase mb-1 very-small fw-bold text-muted text-nowrap">
                <i class="far fa-calendar-alt text-primary me-1"></i> Ex. (Réf.)
              </label>
              <select class="form-select form-select-sm fw-bold text-navy"
                      [ngModel]="selectedAnneeA"
                      (ngModelChange)="onYearAChange($event)">
                @for (a of anneesList; track a) {
                  <option [value]="a">{{ a }}</option>
                }
              </select>
            </div>

            <div class="d-flex align-items-center justify-content-center px-1" style="height: 31px; flex-shrink: 0;">
              <span class="badge bg-dark text-white px-2 py-1 rounded-pill fw-bold">Vs</span>
            </div>

            <div class="d-flex flex-column filter-field-year">
              <label class="form-label text-uppercase mb-1 very-small fw-bold text-muted text-nowrap">
                <i class="far fa-calendar text-warning me-1"></i> Ex. (Comp.)
              </label>
              <select class="form-select form-select-sm fw-bold text-dark"
                      [ngModel]="selectedAnneeB"
                      (ngModelChange)="onYearBChange($event)">
                @for (a of anneesList; track a) {
                  <option [value]="a">{{ a }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-lg-end mt-2">
          <button class="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-2 px-3 shadow-sm btn-export-responsive"
                  style="height: 32px;"
                  (click)="exportBenchmarkPdf()">
            <i class="fas fa-file-pdf text-danger"></i>
            <span class="fw-semibold">Export PDF</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  @if (analysis) {
    <!-- 2. CARTES MACRO-KPIS DIFFÉRENTIELLES (OPTION 3 : COCKPIT SPARKLINE) -->
    @if (selectedDomainFilter !== 'TOUS') {
      <div class="row g-3 mb-3">
        @for (ind of indicatorsForService.slice(0, 4); track ind.code; let idx = $index) {
          <div class="col-xl-3 col-md-6">
            <div class="card kpi-spark-card shadow-sm border-0 h-100"
                 [ngClass]="idx === 0 ? 'kpi-spark-blue' : (idx === 1 ? 'kpi-spark-green' : (idx === 2 ? 'kpi-spark-orange' : 'kpi-spark-sky'))">
              <div class="card-body p-3 d-flex flex-column justify-content-between">
                <div class="d-flex justify-content-between align-items-center mb-2 gap-1">
                  <span class="kpi-spark-title text-truncate"
                        [ngClass]="idx === 0 ? 'text-navy' : (idx === 1 ? 'text-success' : (idx === 2 ? 'text-orange-acct' : 'text-info-emphasis'))"
                        [title]="ind.nom">
                    {{ ind.nom }}
                  </span>
                  <span class="kpi-delta-pill text-nowrap" [class.neg]="ind.statut === 'REGRESSION'">
                    {{ ind.deltaPct >= 0 ? '+' : '' }}{{ ind.deltaPct }}%
                  </span>
                </div>

                <div class="d-flex align-items-center justify-content-between my-1">
                  <div>
                    <div class="kpi-spark-value text-dark">
                      {{ ind.valeurA | number:'1.0-2' }}
                    </div>
                    <span class="kpi-spark-unit text-muted">{{ ind.unite }} ({{ analysis.anneeRef }})</span>
                  </div>
                  <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
                    <polyline fill="none"
                              [attr.stroke]="idx === 0 ? '#2563eb' : (idx === 1 ? '#16a34a' : (idx === 2 ? '#f97316' : '#0284c7'))"
                              stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                              points="4,28 22,22 42,24 62,14 80,8"/>
                    <circle cx="80" cy="8" r="3.2"
                            [attr.fill]="idx === 0 ? '#2563eb' : (idx === 1 ? '#16a34a' : (idx === 2 ? '#f97316' : '#0284c7'))"/>
                  </svg>
                </div>

                <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                  <span class="text-muted very-small" [title]="ind.description" style="cursor: help;">
                    Ex. {{ analysis.anneeComp }} : <strong>{{ ind.valeurB | number:'1.0-2' }}</strong>
                  </span>
                  <span class="text-muted very-small fw-semibold">
                    Δ {{ ind.deltaBrut >= 0 ? '+' : '' }}{{ ind.deltaBrut | number:'1.0-2' }} {{ ind.unite }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    } @else {
    <div class="row g-3 mb-3">
      <!-- KPI 1 : Régies & Recettes -->
      <div class="col-xl-3 col-md-6">
        <div class="card kpi-spark-card kpi-spark-blue shadow-sm border-0 h-100">
          <div class="card-body p-3 d-flex flex-column justify-content-between">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="kpi-spark-title text-navy">
                <i class="fas fa-store me-1 text-primary"></i> Régies & Recettes
              </span>
              <span class="kpi-delta-pill" [class.neg]="analysis.deltaRecettesMds < 0">
                {{ analysis.deltaRecettesMds >= 0 ? '+' : '' }}{{ analysis.deltaRecettesMds }} Mds ({{ analysis.deltaRecettesPct >= 0 ? '+' : '' }}{{ analysis.deltaRecettesPct }}%)
              </span>
            </div>

            <div class="d-flex align-items-center justify-content-between my-1">
              <div>
                <div class="kpi-spark-value text-dark">
                  {{ analysis.metricsA.totalRecettesMilliards | number:'1.1-1' }}
                </div>
                <span class="kpi-spark-unit text-muted">Mds FCFA ({{ analysis.anneeRef }})</span>
              </div>
              <!-- Sparkline SVG Recettes -->
              <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
                <polyline fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                          points="4,30 22,24 42,26 62,14 80,6"/>
                <circle cx="80" cy="6" r="3.2" fill="#2563eb"/>
              </svg>
            </div>

            <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
              <span class="text-muted very-small" [title]="'Montant total des recettes mobilisées au cours de l’exercice ' + analysis.anneeComp" style="cursor: help;">
                Ex. {{ analysis.anneeComp }} : <strong>{{ analysis.metricsB.totalRecettesMilliards | number:'1.1-1' }} Mds</strong>
              </span>
              <span class="text-muted very-small" title="Volume global des garanties et cautionnements constitués auprès du Trésor" style="cursor: help; text-decoration: underline dotted #94a3b8;">
                Cautionnements : <strong>{{ analysis.metricsA.cautionnementsVolumeMilliards }} Mds</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI 2 : Comptabilité & CG -->
      <div class="col-xl-3 col-md-6">
        <div class="card kpi-spark-card kpi-spark-green shadow-sm border-0 h-100">
          <div class="card-body p-3 d-flex flex-column justify-content-between">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="kpi-spark-title text-success">
                <i class="fas fa-book me-1"></i> Comptabilité & CG
              </span>
              <span class="kpi-delta-pill" [class.neg]="analysis.deltaConcordancePts < 0">
                {{ analysis.deltaConcordancePts >= 0 ? '+' : '' }}{{ analysis.deltaConcordancePts }} pt(s)
              </span>
            </div>

            <div class="d-flex align-items-center justify-content-between my-1">
              <div>
                <div class="kpi-spark-value text-success">
                  {{ analysis.metricsA.tauxRapprochementAuto }}%
                </div>
                <span class="kpi-spark-unit text-muted">Rapprochement Auto ({{ analysis.anneeRef }})</span>
              </div>
              <!-- Sparkline SVG Concordance -->
              <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
                <polyline fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                          points="4,24 22,20 42,15 62,18 80,8"/>
                <circle cx="80" cy="8" r="3.2" fill="#16a34a"/>
              </svg>
            </div>

            <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
              <span class="text-muted very-small" [title]="'Taux de rapprochement bancaire automatique constaté lors de l’exercice ' + analysis.anneeComp" style="cursor: help;">
                Ex. {{ analysis.anneeComp }} : <strong>{{ analysis.metricsB.tauxRapprochementAuto }}%</strong>
              </span>
              <span class="text-muted very-small" title="Taux de conformité des comptes de gestion transmis à la Cour des Comptes (Norme ≥ 90%)" style="cursor: help; text-decoration: underline dotted #94a3b8;">
                Cour des Cptes : <strong>{{ analysis.metricsA.tauxConformiteCompteGestion }}%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI 3 : Trésorerie & CUT -->
      <div class="col-xl-3 col-md-6">
        <div class="card kpi-spark-card kpi-spark-orange shadow-sm border-0 h-100">
          <div class="card-body p-3 d-flex flex-column justify-content-between">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="kpi-spark-title text-orange-acct">
                <i class="fas fa-money-bill-wave me-1"></i> Trésorerie & Liquidité
              </span>
              <span class="kpi-delta-pill" [class.neg]="analysis.deltaLiquiditeMds < 0">
                {{ analysis.deltaLiquiditeMds >= 0 ? '+' : '' }}{{ analysis.deltaLiquiditeMds }} Mds ({{ analysis.deltaLiquiditePct >= 0 ? '+' : '' }}{{ analysis.deltaLiquiditePct }}%)
              </span>
            </div>

            <div class="d-flex align-items-center justify-content-between my-1">
              <div>
                <div class="kpi-spark-value text-dark">
                  {{ analysis.metricsA.liquiditeNetteCutMilliards | number:'1.1-1' }}
                </div>
                <span class="kpi-spark-unit text-muted">Mds FCFA Liquidité CUT</span>
              </div>
              <!-- Sparkline SVG Liquidité -->
              <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
                <polyline fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                          points="4,28 22,23 42,18 62,20 80,9"/>
                <circle cx="80" cy="9" r="3.2" fill="#f97316"/>
              </svg>
            </div>

            <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
              <span class="text-muted very-small" [title]="'Liquidité nette disponible sur le CUT lors de l’exercice ' + analysis.anneeComp" style="cursor: help;">
                Ex. {{ analysis.anneeComp }} : <strong>{{ analysis.metricsB.liquiditeNetteCutMilliards | number:'1.1-1' }} Mds</strong>
              </span>
              <span class="text-muted very-small" title="Taux de régularisation des Lettres d’Avance (Norme DGTCP / ACCT ≥ 90%)" style="cursor: help; text-decoration: underline dotted #94a3b8;">
                Régul. LA : <strong>{{ analysis.metricsA.tauxRegularisationLA }}%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI 4 : Règlement & RAP -->
      <div class="col-xl-3 col-md-6">
        <div class="card kpi-spark-card kpi-spark-sky shadow-sm border-0 h-100">
          <div class="card-body p-3 d-flex flex-column justify-content-between">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="kpi-spark-title text-warning-emphasis">
                <i class="fas fa-chart-bar me-1"></i> Règlement & RAP
              </span>
              <span class="kpi-delta-pill" [class.neg]="analysis.deltaRapMds > 0">
                {{ analysis.deltaRapMds >= 0 ? '+' : '' }}{{ analysis.deltaRapMds }} Mds ({{ analysis.deltaRapPct >= 0 ? '+' : '' }}{{ analysis.deltaRapPct }}%)
              </span>
            </div>

            <div class="d-flex align-items-center justify-content-between my-1">
              <div>
                <div class="kpi-spark-value text-dark">
                  {{ analysis.metricsA.encoursRapMilliards | number:'1.1-1' }}
                </div>
                <span class="kpi-spark-unit text-muted">Mds FCFA Encours RAP</span>
              </div>
              <!-- Sparkline SVG RAP -->
              <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
                <polyline fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                          points="4,12 22,17 42,14 62,22 80,18"/>
                <circle cx="80" cy="18" r="3.2" fill="#0284c7"/>
              </svg>
            </div>

            <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
              <span class="text-muted very-small" [title]="'Encours des Restes à Payer lors de l’exercice ' + analysis.anneeComp" style="cursor: help;">
                Ex. {{ analysis.anneeComp }} : <strong>{{ analysis.metricsB.encoursRapMilliards }} Mds</strong>
              </span>
              <span class="text-muted very-small" title="Délai moyen d’exécution et de règlement des dépenses (Objectif légal < 30 jours)" style="cursor: help; text-decoration: underline dotted #94a3b8;">
                Délai : <strong>{{ analysis.metricsA.delaiMoyenReglementJours }}j</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    }

    @if (selectedIndicator; as ind) {
      <div class="card shadow-sm border-0 mb-3 px-4 py-3 bg-white">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle mb-1">
              {{ ind.domaineLabel }} — Focus Indicateur
            </span>
            <h5 class="m-0 fw-bold text-navy">{{ ind.nom }}</h5>
            <small class="text-muted">{{ ind.description }}</small>
          </div>
          <div class="d-flex align-items-center gap-4 flex-wrap">
            <div class="text-end">
              <span class="very-small text-muted d-block text-uppercase fw-bold">Exercice {{ analysis.anneeRef }}</span>
              <strong class="fs-5 text-navy">{{ ind.valeurA | number:'1.0-2' }} <small class="text-muted fs-6">{{ ind.unite }}</small></strong>
            </div>
            <div class="text-end">
              <span class="very-small text-muted d-block text-uppercase fw-bold">Exercice {{ analysis.anneeComp }}</span>
              <strong class="fs-5 text-dark">{{ ind.valeurB | number:'1.0-2' }} <small class="text-muted fs-6">{{ ind.unite }}</small></strong>
            </div>
            <div class="text-end">
              <span class="very-small text-muted d-block text-uppercase fw-bold">Écart (Δ)</span>
              <strong class="fs-6" [ngClass]="ind.statut === 'PROGRESSION' ? 'text-success' : (ind.statut === 'REGRESSION' ? 'text-danger' : 'text-secondary')">
                {{ ind.deltaBrut >= 0 ? '+' : '' }}{{ ind.deltaBrut | number:'1.0-2' }} {{ ind.unite }}
              </strong>
            </div>
            <span class="badge px-3 py-2 fs-6" [ngClass]="{
              'bg-success text-white': ind.statut === 'PROGRESSION',
              'bg-danger text-white': ind.statut === 'REGRESSION',
              'bg-secondary text-white': ind.statut === 'STABLE'
            }">
              {{ ind.deltaPct >= 0 ? '+' : '' }}{{ ind.deltaPct }}%
            </span>
          </div>
        </div>
      </div>
    }

    <!-- 3. DEUX VISUALISATIONS COMPLÉMENTAIRES (SCORES PAR SERVICE & VOLUMES Mds FCFA) -->
    <div class="row g-3 mb-3">
      <div class="col-lg-5">
        <div class="card shadow-sm border-0 p-3 h-100">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <div>
              <h5 class="m-0 fw-bold text-navy">Radar Comparatif</h5>
              <small class="text-muted">Taux de performance & conformité par service (base 100)</small>
            </div>
            <span class="badge bg-light text-dark border">
              {{ analysis.anneeRef }} vs {{ analysis.anneeComp }}
            </span>
          </div>
          <div style="height: 280px; position: relative;">
            @if (isBrowser) {
              <canvas baseChart
                      [data]="radarChartData"
                      [options]="radarChartOptions"
                      [type]="'radar'">
              </canvas>
            }
          </div>
        </div>
      </div>

      <div class="col-lg-7">
        <div class="card shadow-sm border-0 p-3 h-100">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <div>
              @if (selectedIndicator; as ind) {
                <h5 class="m-0 fw-bold text-navy">{{ ind.nom }} ({{ ind.unite }})</h5>
                <small class="text-muted">{{ ind.domaineLabel }} — Comparaison directe {{ analysis.anneeRef }} vs {{ analysis.anneeComp }}</small>
              } @else if (selectedDomainFilter !== 'TOUS') {
                <h5 class="m-0 fw-bold text-navy">Indicateurs Comparés — {{ selectedServiceLabel }}</h5>
                <small class="text-muted">Tous les indicateurs du service {{ selectedServiceLabel }} ({{ analysis.anneeRef }} vs {{ analysis.anneeComp }})</small>
              } @else {
                <h5 class="m-0 fw-bold text-navy">Montants Financiers Comparés par Service (Mds FCFA)</h5>
                <small class="text-muted">Comptabilité, Trésorerie, Cautionnement, Régies, Règlement, Statistiques, Compte de Gestion</small>
              }
            </div>
            <span class="badge bg-light text-muted border">Exercice {{ analysis.anneeRef }} vs {{ analysis.anneeComp }}</span>
          </div>
          <div style="height: 280px; position: relative;">
            @if (isBrowser) {
              <canvas baseChart
                      [data]="structureChartData"
                      [options]="structureChartOptions"
                      [type]="'bar'">
              </canvas>
            }
          </div>
          @if (selectedDomainFilter === 'TOUS' && !selectedIndicator) {
            <div class="border-top pt-2 mt-2 very-small text-muted">
              <strong>Note de lecture :</strong>
              Comptabilité = mouvements comptables (Balance Générale) •
              Trésorerie = solde net CUT •
              Cautionnement = garanties &amp; consignations •
              Régies = avances en cours + recettes en régie •
              Règlement = paiements exécutés •
              Statistiques = subventions + OC + encours RAP •
              Compte de Gestion = montant audité (TGE, PGT, RGF, PGA).
            </div>
          }
        </div>
      </div>
    </div>

    <!-- 4. MATRICE COMPARATIVE DÉTAILLÉE DES 7 SERVICES (21 INDICATEURS) -->
    <div class="card shadow-sm border-0 mb-3">
      <div class="p-3 pb-2 border-bottom">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div>
            <h5 class="m-0 fw-bold text-navy">
              <i class="fas fa-table text-primary me-2"></i>Matrice Différentielle
            </h5>
            <small class="text-muted">Filtrez par service pour inspecter les écarts entre {{ analysis.anneeRef }} et {{ analysis.anneeComp }}</small>
          </div>
        </div>

        <div class="d-flex flex-wrap pt-1" style="gap: 8px;">
          @for (f of serviceFilterButtons; track f.id) {
            <button type="button" class="btn btn-sm rounded-pill fw-bold"
                    [ngClass]="selectedDomainFilter === f.id ? 'btn-navy text-white' : 'btn-light border'"
                    (click)="onServiceChange(f.id)">
              <i [class]="f.icon + ' me-1'"></i>{{ f.label }}
            </button>
          }
        </div>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr class="text-uppercase very-small fw-bold">
                <th class="ps-3" style="width: 30%;">Indicateur Métier</th>
                <th style="width: 16%;">Service</th>
                <th class="text-end" style="width: 14%; color: #1A365D;">Exercice {{ analysis.anneeRef }}</th>
                <th class="text-end" style="width: 14%; color: #F77F00;">Exercice {{ analysis.anneeComp }}</th>
                <th class="text-end" style="width: 13%;">Écart Brut (Δ)</th>
                <th class="text-center pe-3" style="width: 13%;">Variation (%)</th>
              </tr>
            </thead>
            <tbody>
              @for (ind of filteredIndicators; track ind.code) {
                <tr>
                  <td class="ps-3">
                    <span class="fw-bold text-dark d-block">{{ ind.nom }}</span>
                    <small class="text-muted">{{ ind.description }}</small>
                  </td>
                  <td>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
                      {{ ind.domaineLabel }}
                    </span>
                  </td>
                  <td class="text-end fw-bold text-navy text-nowrap">
                    {{ ind.valeurA | number:'1.0-2' }} <small class="text-muted fw-normal">{{ ind.unite }}</small>
                  </td>
                  <td class="text-end fw-semibold text-dark text-nowrap">
                    {{ ind.valeurB | number:'1.0-2' }} <small class="text-muted fw-normal">{{ ind.unite }}</small>
                  </td>
                  <td class="text-end fw-bold text-nowrap"
                      [ngClass]="ind.statut === 'PROGRESSION' ? 'text-success' : (ind.statut === 'REGRESSION' ? 'text-danger' : 'text-secondary')">
                    {{ ind.deltaBrut >= 0 ? '+' : '' }}{{ ind.deltaBrut | number:'1.0-2' }} <small class="fw-normal">{{ ind.unite }}</small>
                  </td>
                  <td class="text-center pe-3 text-nowrap">
                    <span class="badge px-2 py-1" [ngClass]="{
                      'bg-success text-white': ind.statut === 'PROGRESSION',
                      'bg-danger text-white': ind.statut === 'REGRESSION',
                      'bg-secondary text-white': ind.statut === 'STABLE'
                    }">
                      <i class="fas me-1" [ngClass]="{
                        'fa-arrow-up': ind.deltaPct > 0,
                        'fa-arrow-down': ind.deltaPct < 0,
                        'fa-minus': ind.deltaPct === 0
                      }"></i>
                      {{ ind.deltaPct >= 0 ? '+' : '' }}{{ ind.deltaPct }}%
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 5. VENTILATION DES 7 SERVICES & SYNTHÈSE EXÉCUTIVE -->
    <div class="row g-3">
      <div class="col-lg-7">
        <div class="card shadow-sm border-0 p-3 h-100">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h5 class="m-0 fw-bold text-navy">Comparatif Financier par Service Opérationnel</h5>
              <small class="text-muted">Volumes exécutés en Mds FCFA ({{ analysis.anneeRef }} vs {{ analysis.anneeComp }})</small>
            </div>
          </div>
          <div style="height: 260px; position: relative;">
            @if (isBrowser) {
              <canvas baseChart
                      [data]="secteursChartData"
                      [options]="secteursChartOptions"
                      [type]="'bar'">
              </canvas>
            }
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="card shadow-sm border-0 p-3 h-100">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h5 class="fw-bold text-navy m-0">
              <i class="fas fa-lightbulb text-warning me-2"></i>Synthèse Différentielle
            </h5>
            <span class="badge bg-primary-subtle text-primary border">{{ analysis.anneeRef }} vs {{ analysis.anneeComp }}</span>
          </div>

          <div class="mb-3">
            <div class="very-small fw-bold text-uppercase text-success mb-2">
              <i class="fas fa-check-circle me-1"></i> Dynamiques Favorables Constatées
            </div>
            <ul class="list-unstyled mb-0">
              @for (pf of analysis.pointsForts; track pf) {
                <li class="d-flex align-items-start gap-2 mb-2 small">
                  <i class="fas fa-check text-success mt-1"></i>
                  <span>{{ pf }}</span>
                </li>
              }
            </ul>
          </div>

          @if (analysis.pointsVigilance.length > 0) {
            <div class="mb-3">
              <div class="very-small fw-bold text-uppercase text-danger mb-2">
                <i class="fas fa-exclamation-triangle me-1"></i> Points de Vigilance & Arbitrages
              </div>
              <ul class="list-unstyled mb-0">
                @for (pv of analysis.pointsVigilance; track pv) {
                  <li class="d-flex align-items-start gap-2 mb-2 small">
                    <i class="fas fa-arrow-right text-danger mt-1"></i>
                    <span>{{ pv }}</span>
                  </li>
                }
              </ul>
            </div>
          }

          <div class="p-3 rounded-3 bg-light border-top mt-auto">
            <div class="d-flex flex-wrap justify-content-between gap-2 small mb-1">
              <span class="text-muted">Collecte moyenne / poste ou régie :</span>
              <strong>{{ analysis.recetteParPosteA }} Mds FCFA</strong>
            </div>
            <div class="d-flex flex-wrap justify-content-between gap-2 small mb-1">
              <span class="text-muted">Couverture Recettes / Règlements :</span>
              <strong>{{ analysis.ratioCouvertureDepensesA }}%</strong>
            </div>
            <div class="d-flex flex-wrap justify-content-between gap-2 small">
              <span class="text-muted">Conformité Compte de Gestion :</span>
              <strong>{{ analysis.metricsA.tauxConformiteCompteGestion }}%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  }

</div>
  `,
  styles: [`
    .benchmark-container { max-width: 1600px; margin: 0 auto; overflow-x: hidden; }
    .filter-field-service { flex: 1 1 150px; min-width: 145px; max-width: 210px; }
    .filter-field-indicator { flex: 1 1 180px; min-width: 170px; max-width: 240px; }
    .filter-field-year { flex: 0 0 98px; }
    .year-compare-pair { flex-shrink: 0; }

    @media (max-width: 991.98px) {
      .filter-field-service,
      .filter-field-indicator { flex: 1 1 200px; max-width: none; }
      .year-compare-pair { flex: 1 1 220px; }
      .year-compare-pair .filter-field-year { flex: 1 1 0; }
    }

    @media (max-width: 575.98px) {
      .title-text { font-size: 1.15rem !important; }
      .kpi-spark-value { font-size: 1.35rem !important; }
      .filter-field-service,
      .filter-field-indicator,
      .year-compare-pair { flex: 1 1 100%; min-width: 0; max-width: none; width: 100%; }
      .year-compare-pair .filter-field-year { flex: 1 1 0; min-width: 0; }
      .btn-export-responsive { width: 100%; }
      .table-responsive table { min-width: 660px; }
    }
    .text-navy { color: #1A365D !important; }
    .btn-navy { background-color: #1A365D !important; color: #fff !important; }
    .very-small { font-size: 0.74rem; }

    .benchmark-header-card {
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

    /* STYLES MODÈLE 3 : COCKPIT MICRO-SPARKLINE COMPARATIF AVEC DÉGRADÉ LÉGER AU BAS */
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
    .kpi-spark-card.kpi-spark-sky {
      background: linear-gradient(180deg, #ffffff 60%, rgba(2, 132, 199, 0.06) 100%) !important;
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
    .kpi-delta-pill {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      background: #dcfce7;
      color: #15803d;
    }
    .kpi-delta-pill.neg {
      background: #fee2e2;
      color: #b91c1c;
    }
    .text-orange-acct { color: #F77F00 !important; }

    :host-context([data-bs-theme="dark"]) {
      .title-text, .text-navy { color: #ffffff !important; }
      .text-muted, small.text-muted, span.text-muted { color: #f8fafc !important; }
      .kpi-card { background: #202127 !important; border: 1px solid #2e2f38 !important; }
      .kpi-spark-card {
        border: 1px solid #2e2f38 !important;
        background: #202127 !important;

        &.kpi-spark-blue {
          background: linear-gradient(180deg, #202127 45%, rgba(37, 99, 235, 0.22) 100%) !important;
          border-color: rgba(37, 99, 235, 0.35) !important;
        }
        &.kpi-spark-green {
          background: linear-gradient(180deg, #202127 45%, rgba(22, 163, 74, 0.22) 100%) !important;
          border-color: rgba(22, 163, 74, 0.35) !important;
        }
        &.kpi-spark-orange {
          background: linear-gradient(180deg, #202127 45%, rgba(249, 115, 22, 0.22) 100%) !important;
          border-color: rgba(249, 115, 22, 0.35) !important;
        }
        &.kpi-spark-sky {
          background: linear-gradient(180deg, #202127 45%, rgba(2, 132, 199, 0.22) 100%) !important;
          border-color: rgba(2, 132, 199, 0.35) !important;
        }
      }
      .kpi-value strong { color: #ffffff !important; }
      .kpi-foot { border-top-color: #2e2f38 !important; }
      .table-custom { color: #ffffff !important; }
      .benchmark-header-card {
        background: #202127 !important;
        border: 1px solid rgba(148, 163, 184, 0.22) !important;
      }
    }
  `]
})
export class AnalyseComparativeComponent implements OnInit, OnDestroy {
  private benchmarkService = inject(PilotageBenchmarkService);
  private realDataService = inject(PilotageRealDataService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private themeObserver?: MutationObserver;

  isBrowser = isPlatformBrowser(this.platformId);

  selectedAnneeA = 2026;
  selectedAnneeB = 2025;
  selectedPerimetre = this.realDataService.perimetresList[0];
  anneesList = this.benchmarkService.anneesDisponibles;
  perimetresList = this.realDataService.perimetresList;

  analysis: YearComparisonAnalysis | null = null;
  selectedDomainFilter: ServiceDomainFilter = 'TOUS';
  selectedIndicatorCode = 'TOUS';

  readonly serviceFilterButtons: { id: ServiceDomainFilter; label: string; icon: string }[] = [
    { id: 'TOUS', label: 'Tous les Services', icon: 'fas fa-layer-group' },
    { id: 'COMPTABILITE', label: 'Comptabilité', icon: 'fas fa-book' },
    { id: 'TRESORERIE', label: 'Trésorerie', icon: 'fas fa-money-bill-wave' },
    { id: 'CAUTIONNEMENT', label: 'Cautionnement', icon: 'fas fa-shield-alt' },
    { id: 'REGIES', label: 'Régies', icon: 'fas fa-store' },
    { id: 'REGLEMENT', label: 'Règlement', icon: 'fas fa-hand-holding-usd' },
    { id: 'STATISTIQUES', label: 'Statistiques', icon: 'fas fa-chart-bar' },
    { id: 'COMPTE_GESTION', label: 'Compte de Gestion', icon: 'fas fa-clipboard-list' }
  ];

  radarChartData: ChartData<'radar'> = { labels: [], datasets: [] };
  radarChartOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { r: { min: 70, max: 100, ticks: { stepSize: 10 } } },
    plugins: { legend: { position: 'bottom' } }
  };

  private readonly serviceNatureMap: Record<string, string> = {
    'Comptabilité': 'Montant des mouvements comptables (Balance Générale)',
    'Trésorerie': 'Solde net de liquidité du Compte Unique du Trésor (CUT)',
    'Cautionnement': 'Montant cumulé des garanties et consignations',
    'Régies': 'Avances en cours + recettes encaissées en régie',
    'Règlement': 'Montant total des paiements exécutés',
    'Statistiques': 'Subventions + obligations cautionnées + encours RAP',
    'Compte de Gestion': 'Montant financier audité (TGE, PGT, RGF, PGA)'
  };

  private wrapTooltipText(text: string, maxLen = 48): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > maxLen) {
        if (current) lines.push(current.trim());
        current = w;
      } else {
        current = current ? `${current} ${w}` : w;
      }
    }
    if (current) lines.push(current.trim());
    return lines;
  }

  structureChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  structureChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            const idx = items[0].dataIndex;
            const ind = this.selectedIndicator ?? (this.selectedDomainFilter !== 'TOUS' ? this.indicatorsForService[idx] : null);
            return ind ? ind.nom : (items[0].label || '');
          },
          label: (ctx) => {
            const ind = this.selectedIndicator ?? (this.selectedDomainFilter !== 'TOUS' ? this.indicatorsForService[ctx.dataIndex] : null);
            const unite = ind ? ind.unite : 'Mds FCFA';
            return ` ${ctx.dataset.label} : ${ctx.raw} ${unite}`;
          },
          afterLabel: (ctx) => {
            let nature = '';
            if (this.selectedIndicator) {
              nature = `Nature : ${this.selectedIndicator.description}`;
            } else if (this.selectedDomainFilter !== 'TOUS') {
              const ind = this.indicatorsForService[ctx.dataIndex];
              nature = ind ? `Nature : ${ind.description}` : '';
            } else {
              const srv = ctx.label || '';
              nature = this.serviceNatureMap[srv] ? `Nature : ${this.serviceNatureMap[srv]}` : '';
            }
            return nature ? this.wrapTooltipText(nature) : [];
          }
        }
      }
    }
  };

  secteursChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  secteursChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } }
  };

  get indicatorsForService(): ComparativeIndicator[] {
    if (!this.analysis) return [];
    if (this.selectedDomainFilter === 'TOUS') return this.analysis.indicateurs;
    return this.analysis.indicateurs.filter(ind => ind.domaine === this.selectedDomainFilter);
  }

  get selectedServiceLabel(): string {
    return this.serviceFilterButtons.find(f => f.id === this.selectedDomainFilter)?.label ?? 'Tous les Services';
  }

  get selectedIndicator(): ComparativeIndicator | null {
    if (this.selectedIndicatorCode === 'TOUS') return null;
    return this.indicatorsForService.find(ind => ind.code === this.selectedIndicatorCode) ?? null;
  }

  get filteredIndicators(): ComparativeIndicator[] {
    const liste = this.indicatorsForService;
    if (this.selectedIndicatorCode === 'TOUS') return liste;
    return liste.filter(ind => ind.code === this.selectedIndicatorCode);
  }

  /** Changement de service : on réinitialise l'indicateur et on met à jour les graphiques. */
  onServiceChange(service: ServiceDomainFilter): void {
    this.selectedDomainFilter = service;
    this.selectedIndicatorCode = 'TOUS';
    this.buildCharts();
    this.cdr.detectChanges();
  }

  /** Changement d'indicateur : on met à jour les graphiques et le bandeau focus. */
  onIndicatorChange(code: string): void {
    this.selectedIndicatorCode = code;
    this.buildCharts();
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.updateChartTheme();
      this.themeObserver = new MutationObserver(() => {
        this.updateChartTheme();
        this.buildCharts();
        this.cdr.detectChanges();
      });
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme']
      });
    }

    const stored = this.benchmarkService.getSelectedYears();
    this.selectedAnneeA = stored.anneeA;
    this.selectedAnneeB = stored.anneeB;
    this.selectedPerimetre = stored.perimetre;

    this.route.queryParams.subscribe(params => {
      if (params['anneeA'] && !isNaN(Number(params['anneeA']))) {
        this.selectedAnneeA = Number(params['anneeA']);
      }
      if (params['anneeB'] && !isNaN(Number(params['anneeB']))) {
        this.selectedAnneeB = Number(params['anneeB']);
      }
      this.benchmarkService.setSelectedYears(this.selectedAnneeA, this.selectedAnneeB, this.selectedPerimetre);
      this.refreshComparison();
    });
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

    this.radarChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 70,
          max: 100,
          ticks: {
            stepSize: 10,
            color: textColor,
            backdropColor: 'transparent',
            font: { weight: 'bold' }
          },
          pointLabels: {
            color: textColor,
            font: { size: 11, weight: 'bold' }
          },
          grid: { color: gridColor },
          angleLines: { color: gridColor }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            font: { weight: 'bold' }
          }
        }
      }
    };

    this.structureChartOptions = {
      ...this.structureChartOptions,
      scales: {
        x: {
          ticks: { color: textColor, font: { weight: 'bold' } },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: textColor, font: { weight: 'bold' } },
          grid: { color: gridColor }
        }
      },
      plugins: {
        ...this.structureChartOptions?.plugins,
        legend: {
          position: 'top',
          labels: {
            color: textColor,
            font: { weight: 'bold' }
          }
        }
      }
    };

    this.secteursChartOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: textColor, font: { weight: 'bold' } },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: textColor, font: { weight: 'bold' } },
          grid: { color: gridColor }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor,
            font: { weight: 'bold' }
          }
        }
      }
    };
  }

  onPerimetreChange(): void {
    this.benchmarkService.setSelectedYears(this.selectedAnneeA, this.selectedAnneeB, this.selectedPerimetre);
    this.refreshComparison();
  }

  onYearAChange(year: any): void {
    this.selectedAnneeA = Number(year);
    if (this.selectedAnneeA === this.selectedAnneeB) {
      this.selectedAnneeB = this.selectedAnneeA > 2015 ? this.selectedAnneeA - 1 : 2026;
    }
    this.benchmarkService.setSelectedYears(this.selectedAnneeA, this.selectedAnneeB, this.selectedPerimetre);
    this.updateQueryParams();
    this.refreshComparison();
  }

  onYearBChange(year: any): void {
    this.selectedAnneeB = Number(year);
    this.benchmarkService.setSelectedYears(this.selectedAnneeA, this.selectedAnneeB, this.selectedPerimetre);
    this.updateQueryParams();
    this.refreshComparison();
  }

  private updateQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { anneeA: this.selectedAnneeA, anneeB: this.selectedAnneeB },
      queryParamsHandling: 'merge'
    });
  }

  refreshComparison(): void {
    this.benchmarkService.compareYears(this.selectedAnneeA, this.selectedAnneeB, this.selectedPerimetre).subscribe(res => {
      this.analysis = res;
      if (this.isBrowser) {
        this.buildCharts();
        this.benchmarkService.saveComparativeNotification(res);
      }
      this.cdr.detectChanges();
    });
  }

  private buildCharts(): void {
    if (!this.analysis) return;
    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const colorA = isDark ? '#60a5fa' : '#1A365D';
    const colorAFill = isDark ? 'rgba(96, 165, 250, 0.25)' : 'rgba(26, 54, 93, 0.2)';
    const colorB = isDark ? '#fb923c' : '#F77F00';
    const colorBFill = isDark ? 'rgba(251, 146, 60, 0.25)' : 'rgba(247, 127, 0, 0.2)';

    const yA = this.analysis.anneeRef;
    const yB = this.analysis.anneeComp;

    this.radarChartData = {
      labels: this.analysis.radarLabels,
      datasets: [
        {
          label: `Exercice ${yA}`,
          data: this.analysis.radarScoresA,
          borderColor: colorA,
          backgroundColor: colorAFill,
          pointBackgroundColor: colorA
        },
        {
          label: `Exercice ${yB}`,
          data: this.analysis.radarScoresB,
          borderColor: colorB,
          backgroundColor: colorBFill,
          pointBackgroundColor: colorB
        }
      ]
    };

    const ind = this.selectedIndicator;
    if (ind) {
      this.structureChartData = {
        labels: [ind.nom],
        datasets: [
          { label: `Exercice ${yA}`, data: [ind.valeurA], backgroundColor: colorA, borderRadius: 6, maxBarThickness: 70 },
          { label: `Exercice ${yB}`, data: [ind.valeurB], backgroundColor: colorB, borderRadius: 6, maxBarThickness: 70 }
        ]
      };
    } else if (this.selectedDomainFilter !== 'TOUS') {
      const inds = this.indicatorsForService;
      this.structureChartData = {
        labels: inds.map(i => i.nom.length > 26 ? i.nom.slice(0, 24) + '…' : i.nom),
        datasets: [
          { label: `Exercice ${yA}`, data: inds.map(i => i.valeurA), backgroundColor: colorA, borderRadius: 5 },
          { label: `Exercice ${yB}`, data: inds.map(i => i.valeurB), backgroundColor: colorB, borderRadius: 5 }
        ]
      };
    } else {
      this.structureChartData = {
        labels: this.analysis.structureBreakdown.map(s => s.composante),
        datasets: [
          {
            label: `Exercice ${yA}`,
            data: this.analysis.structureBreakdown.map(s => s.montantA),
            backgroundColor: colorA,
            borderRadius: 5
          },
          {
            label: `Exercice ${yB}`,
            data: this.analysis.structureBreakdown.map(s => s.montantB),
            backgroundColor: colorB,
            borderRadius: 5
          }
        ]
      };
    }

    this.secteursChartData = {
      labels: this.analysis.secteursComparatif.map(s => s.secteur),
      datasets: [
        {
          label: `Exercice ${yA}`,
          data: this.analysis.secteursComparatif.map(s => s.montantA),
          backgroundColor: colorA,
          borderRadius: 4
        },
        {
          label: `Exercice ${yB}`,
          data: this.analysis.secteursComparatif.map(s => s.montantB),
          backgroundColor: colorB,
          borderRadius: 4
        }
      ]
    };
  }

  /** Génère un graphique Chart.js hors écran (non affiché dans l'appli) et retourne son image PNG pour le PDF. */
  private async renderPdfChart(config: any, width: number, height: number, suffix: string): Promise<string> {
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // Plugin local : fond blanc + valeurs affichées en bout de barre
    const valueLabels = {
      id: 'pdfValueLabels',
      beforeDraw: (chart: any) => {
        const c = chart.ctx;
        c.save();
        c.fillStyle = '#ffffff';
        c.fillRect(0, 0, chart.width, chart.height);
        c.restore();
      },
      afterDatasetsDraw: (chart: any) => {
        const c = chart.ctx;
        const horizontal = chart.options.indexAxis === 'y';
        c.save();
        c.font = 'bold 11px Arial';
        c.fillStyle = '#1f2937';
        chart.data.datasets.forEach((ds: any, di: number) => {
          chart.getDatasetMeta(di).data.forEach((bar: any, i: number) => {
            const txt = `${ds.data[i]}${suffix}`;
            if (horizontal) {
              c.textAlign = 'left'; c.textBaseline = 'middle';
              c.fillText(txt, bar.x + 4, bar.y);
            } else {
              c.textAlign = 'center'; c.textBaseline = 'bottom';
              c.fillText(txt, bar.x, bar.y - 3);
            }
          });
        });
        c.restore();
      }
    };

    const chart = new Chart(canvas, {
      ...config,
      options: { ...config.options, responsive: false, animation: false, devicePixelRatio: 2 },
      plugins: [valueLabels]
    });
    const img = canvas.toDataURL('image/png', 1.0);
    chart.destroy();
    return img;
  }

  async exportBenchmarkPdf(): Promise<void> {
    if (!this.isBrowser || !this.analysis) return;
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const a = this.analysis;
    const filtre = this.selectedDomainFilter;
    const tous = filtre === 'TOUS';
    const serviceLabel = this.serviceFilterButtons.find(f => f.id === filtre)?.label ?? 'Tous les 7 Services';
    const yA = `Exercice ${a.anneeRef}`;
    const yB = `Exercice ${a.anneeComp}`;
    const signe = (v: number) => (v >= 0 ? '+' : '');

    // Mots-clés permettant de rattacher un libellé (graphique, synthèse) au service sélectionné
    const motsCles: Record<string, string[]> = {
      COMPTABILITE: ['comptabilite'],
      TRESORERIE: ['tresorerie'],
      CAUTIONNEMENT: ['cautionnement'],
      REGIES: ['regie'],
      REGLEMENT: ['reglement'],
      STATISTIQUES: ['statistique'],
      COMPTE_GESTION: ['compte de gestion']
    };
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const concerne = (texte: string) => tous || (motsCles[filtre] ?? []).some(k => norm(texte).includes(k));

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageH = doc.internal.pageSize.getHeight();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;
    const assurerEspace = (h: number) => {
      if (y + h > pageH - 12) { doc.addPage(); y = 16; }
    };
    const titreSection = (txt: string) => {
      assurerEspace(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(26, 54, 93);
      doc.text(txt, 14, y);
      doc.setFont('helvetica', 'normal');
      y += 4;
    };

    // ===== 1. En-tête =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(26, 54, 93);
    doc.text(`DGTCP — Analyse Comparative ${tous ? '' : '— ' + serviceLabel} (${a.anneeRef} vs ${a.anneeComp})`, 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    const indicateurLabel = this.selectedIndicatorCode === 'TOUS'
      ? 'Tous les indicateurs'
      : (a.indicateurs.find(i => i.code === this.selectedIndicatorCode)?.nom ?? 'Tous les indicateurs');
    doc.text(`Service : ${serviceLabel}   |   Indicateur : ${indicateurLabel}`, 14, y);
    y += 3;
    doc.setDrawColor(210, 220, 235);
    doc.line(14, y, pageW - 14, y);
    y += 6;

    // ===== 2. Indicateurs clés (cartes de la page) =====
    const kpis = [
      {
        services: ['REGIES', 'CAUTIONNEMENT'], nom: 'Régies & Recettes', vA: `${a.metricsA.totalRecettesMilliards} Mds FCFA`, vB: `${a.metricsB.totalRecettesMilliards} Mds FCFA`,
        ecart: `${signe(a.deltaRecettesMds)}${a.deltaRecettesMds} Mds (${signe(a.deltaRecettesPct)}${a.deltaRecettesPct}%)`, info: `Cautionnements : ${a.metricsA.cautionnementsVolumeMilliards} Mds`
      },
      {
        services: ['COMPTABILITE', 'COMPTE_GESTION'], nom: 'Comptabilité & Compte de Gestion', vA: `${a.metricsA.tauxRapprochementAuto} % rapproché`, vB: `${a.metricsB.tauxRapprochementAuto} % rapproché`,
        ecart: `${signe(a.deltaConcordancePts)}${a.deltaConcordancePts} pt(s)`, info: `Cour des Comptes : ${a.metricsA.tauxConformiteCompteGestion} %`
      },
      {
        services: ['TRESORERIE'], nom: 'Trésorerie & Liquidité', vA: `${a.metricsA.liquiditeNetteCutMilliards} Mds FCFA`, vB: `${a.metricsB.liquiditeNetteCutMilliards} Mds FCFA`,
        ecart: `${signe(a.deltaLiquiditeMds)}${a.deltaLiquiditeMds} Mds (${signe(a.deltaLiquiditePct)}${a.deltaLiquiditePct}%)`, info: `Régul. LA : ${a.metricsA.tauxRegularisationLA} %`
      },
      {
        services: ['REGLEMENT', 'STATISTIQUES'], nom: 'Règlement & Restes à Payer', vA: `${a.metricsA.encoursRapMilliards} Mds FCFA`, vB: `${a.metricsB.encoursRapMilliards} Mds FCFA`,
        ecart: `${signe(a.deltaRapMds)}${a.deltaRapMds} Mds (${signe(a.deltaRapPct)}${a.deltaRapPct}%)`, info: `Délai moyen : ${a.metricsA.delaiMoyenReglementJours} j`
      }
    ].filter(k => tous || k.services.includes(filtre));

    if (kpis.length) {
      titreSection('Indicateurs clés');
      autoTable(doc, {
        startY: y,
        head: [['Indicateur', yA, yB, 'Écart', 'Complément']],
        body: kpis.map(k => [k.nom, k.vA, k.vB, k.ecart, k.info]),
        headStyles: { fillColor: [26, 54, 93] },
        styles: { fontSize: 8.5, cellPadding: 2 }
      });
      y = (doc as any).lastAutoTable.finalY + 9;
    }

    // ===== 3. Matrice différentielle (selon le filtre cliqué) =====
    const indicateurs = this.filteredIndicators;
    titreSection(`Matrice différentielle — ${serviceLabel}`);
    autoTable(doc, {
      startY: y,
      head: [['Indicateur Métier', 'Service', yA, yB, 'Écart Brut', 'Variation (%)']],
      body: indicateurs.map(i => [
        i.nom,
        i.domaineLabel,
        `${i.valeurA} ${i.unite}`,
        `${i.valeurB} ${i.unite}`,
        `${signe(i.deltaBrut)}${i.deltaBrut} ${i.unite}`,
        `${signe(i.deltaPct)}${i.deltaPct}%`
      ]),
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 8.5, cellPadding: 2 }
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // ===== 4. Graphique des volumes (après le tableau, filtré selon le service) =====
    try {
      const volumes = a.structureBreakdown.filter(s => concerne(s.composante));
      if (volumes.length) {
        const imgW = tous ? 269 : 160;
        const imgH = tous ? 105 : 80;
        const volumeImg = await this.renderPdfChart({
          type: 'bar',
          data: {
            labels: volumes.map(s => s.composante),
            datasets: [
              { label: yA, data: volumes.map(s => s.montantA), backgroundColor: '#1A365D', borderRadius: 3, maxBarThickness: 70 },
              { label: yB, data: volumes.map(s => s.montantB), backgroundColor: '#F77F00', borderRadius: 3, maxBarThickness: 70 }
            ]
          },
          options: { plugins: { legend: { position: 'bottom' } } }
        }, Math.round(imgW * 5.2), Math.round(imgH * 5.2), '');

        assurerEspace(imgH + 16);
        titreSection(`Montants financiers comparés ${tous ? 'par service' : '— ' + serviceLabel} (Mds FCFA)`);
        doc.addImage(volumeImg, 'PNG', 14, y, imgW, imgH);
        y += imgH + 4;
        if (tous) {
          doc.setFontSize(8);
          doc.setTextColor(100);
          const note = 'Note de lecture : Comptabilité = mouvements Balance Générale • Trésorerie = solde net CUT • Cautionnement = garanties & consignations • Régies = avances + recettes en régie • Règlement = paiements exécutés • Statistiques = subventions + OC + encours RAP • Compte de Gestion = montant audité (TGE, PGT, RGF, PGA).';
          const noteLignes = doc.splitTextToSize(note, pageW - 28);
          doc.text(noteLignes, 14, y);
          y += noteLignes.length * 4 + 4;
        } else {
          y += 6;
        }
      }
    } catch (err) {
      console.warn('Génération du graphique PDF ignorée :', err);
    }

    // ===== 5. Synthèse différentielle (complète, identique à la page) =====
    const forts = a.pointsForts;
    const vigilance = a.pointsVigilance;
    titreSection(`Synthèse différentielle des 7 services (${a.anneeRef} vs ${a.anneeComp})`);
    y += 3;
    const ecrireListe = (titre: string, items: string[], couleur: [number, number, number], puce: string) => {
      assurerEspace(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...couleur);
      doc.text(titre, 14, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(40);
      const liste = items.length ? items : ['Aucun élément signalé.'];
      liste.forEach(txt => {
        const line = `${puce} ${txt}`;
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && colonIdx < 50) {
          const prefix = line.slice(0, colonIdx + 1) + ' ';
          const rest = line.slice(colonIdx + 1).trim();
          doc.setFont('helvetica', 'bold');
          const prefixW = doc.getTextWidth(prefix);
          const restLines = doc.splitTextToSize(rest, pageW - 32 - prefixW);
          assurerEspace(restLines.length * 4.5);
          doc.text(prefix, 18, y);
          doc.setFont('helvetica', 'normal');
          if (restLines.length > 0) {
            doc.text(restLines[0], 18 + prefixW, y);
            for (let li = 1; li < restLines.length; li++) {
              y += 4.5;
              doc.text(restLines[li], 22, y);
            }
          }
          y += 5.5;
        } else {
          doc.setFont('helvetica', 'normal');
          const lignes = doc.splitTextToSize(line, pageW - 32);
          assurerEspace(lignes.length * 4.5);
          doc.text(lignes, 18, y);
          y += lignes.length * 4.5 + 1;
        }
      });
      y += 3;
    };
    ecrireListe('Dynamiques favorables constatées', forts, [25, 135, 84], '•');
    ecrireListe('Points de vigilance & arbitrages', vigilance, [220, 53, 69], '•');

    {
      assurerEspace(30);
      autoTable(doc, {
        startY: y,
        head: [['Ratio de synthèse', 'Valeur']],
        body: [
          ['Collecte moyenne / poste ou régie', `${a.recetteParPosteA} Mds FCFA`],
          ['Couverture Recettes / Règlements', `${a.ratioCouvertureDepensesA} %`],
          ['Conformité Compte de Gestion', `${a.metricsA.tauxConformiteCompteGestion} %`]
        ],
        headStyles: { fillColor: [26, 54, 93] },
        styles: { fontSize: 8.5, cellPadding: 2 },
        tableWidth: 140
      });
    }

    // ===== Pied de page : date et heure d'impression (en bas à droite de chaque page) =====
    const maintenant = new Date();
    const dateImpression = maintenant.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const heureImpression = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const nbPages = doc.getNumberOfPages();
    for (let p = 1; p <= nbPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Imprimé le ${dateImpression} à ${heureImpression}`, pageW - 14, pageH - 6, { align: 'right' });
    }

    const suffixe = tous ? '7_Services' : serviceLabel.replace(/^\d+\.\s*/, '').replace(/\s+/g, '_');
    doc.save(`Analyse_Comparative_${suffixe}_DGTCP_${a.anneeRef}_vs_${a.anneeComp}.pdf`);
  }
}
