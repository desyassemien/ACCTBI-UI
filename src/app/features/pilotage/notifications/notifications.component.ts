import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  PilotageRealDataService,
  RealDataPilotageMetrics
} from '../../../core/services/pilotage-real-data.service';
import { PilotageBenchmarkService } from '../../../core/services/pilotage-benchmark.service';
import { NotificationService } from '../../../core/services/notification.service';

export type NotifServiceDomaine =
  | 'Comptabilité'
  | 'Trésorerie'
  | 'Cautionnement'
  | 'Régies'
  | 'Règlement'
  | 'Statistiques'
  | 'Compte de Gestion'
  | 'Analyse Comparative';

export interface SmartNotification {
  id: string;
  source: 'REEL' | 'COMPARATIF' | 'NORME_ACCT' | 'REGIES';
  domaine: NotifServiceDomaine | string;
  severite: 'CRITIQUE' | 'VIGILANCE' | 'INFO' | 'SUCCES';
  titre: string;
  description: string;
  chiffreCle?: string;
  badgeLabel: string;
  dateStr: string;
  isRead: boolean;
  actionType?: 'SIMULATION' | 'COMPARATIF' | 'SURVEILLANCE';
  actionLabel?: string;
  anneeRef?: number;
  anneeComp?: number;
  timestamp?: number;
}

export interface GeneratedMiniReport {
  id: string;
  dateEdition: string;
  titre: string;
  severite: string;
  badgeLabel: string;
  domaine: string;
  periode: string;
  perimetre: string;
  chiffreCle?: string;
  description: string;
  diagnostic: string;
  impacts: string[];
  recommandations: string[];
  notifications?: SmartNotification[];
}

export interface AlertRule {
  id: string;
  nom: string;
  indicateurId: string;
  indicateurNom: string;
  domaine: NotifServiceDomaine;
  operateur: '<' | '<=' | '>' | '>=' | 'VARIATION_ABSOLUE_>';
  valeurSeuil: number;
  unite: string;
  severite: 'CRITIQUE' | 'VIGILANCE' | 'INFO' | 'SUCCES';
  actif: boolean;
  isSystem?: boolean;
  anneeRef?: number;
  anneeComp?: number;
}

export interface IndicatorDefinition {
  id: string;
  nom: string;
  domaine: NotifServiceDomaine;
  unite: string;
  defaultOperateur: '<' | '<=' | '>' | '>=' | 'VARIATION_ABSOLUE_>';
  defaultSeuil: number;
  defaultSeverite: 'CRITIQUE' | 'VIGILANCE' | 'INFO' | 'SUCCES';
  step: number;
  description: string;
}

@Component({
  selector: 'app-notifications-pilotage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="notifications-page-container py-3">

  <!-- 1. EN-TÊTE DU CENTRE DE NOTIFICATIONS -->
  <div class="header-card card shadow-sm border-0 mb-3 px-4 py-3">
    <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge-dgtcp-pill"><i class="fas fa-bell me-1"></i> VEILLE PRUDENTIELLE DGTCP</span>
        </div>
        <h2 class="m-0 fw-bold title-text mb-1">Centre de Notifications & Règles d'Alertes</h2>
        <p class="text-muted m-0 header-subtitle mt-1">
          Surveillance automatisée des <strong>Services DGTCP</strong> (Comptabilité, Trésorerie, Cautionnement, Régies, Règlement, Statistiques, Compte de Gestion) et alertes comparatives.
        </p>
      </div>

      <div class="d-flex flex-wrap flex-xl-nowrap justify-content-lg-end align-items-end gap-2">
        <div class="filter-item-container" style="min-width: 175px;">
          <label class="form-label text-uppercase">
            <i class="fas fa-layer-group text-primary me-1"></i> Service
          </label>
          <select class="form-select form-select-sm fw-semibold"
                  [ngModel]="selectedServiceFilter"
                  (ngModelChange)="onServiceFilterChange($event)">
            <option value="TOUS">Tous les Services</option>
            <option value="Comptabilité">Comptabilité</option>
            <option value="Trésorerie">Trésorerie</option>
            <option value="Cautionnement">Cautionnement</option>
            <option value="Régies">Régies</option>
            <option value="Règlement">Règlement</option>
            <option value="Statistiques">Statistiques</option>
            <option value="Compte de Gestion">Compte de Gestion</option>
            <option value="Analyse Comparative">Analyse Comparative</option>
          </select>
        </div>

        <div class="filter-item-container" style="min-width: 215px; max-width: 265px;">
          <label class="form-label text-uppercase">
            <i class="fas fa-chart-line text-primary me-1"></i> Indicateur
          </label>
          <select class="form-select form-select-sm fw-semibold"
                  [(ngModel)]="selectedIndicatorFilter">
            <option value="TOUS">Tous les indicateurs</option>
            @for (ind of indicatorsForSelectedService; track ind.id) {
              <option [value]="ind.id">{{ ind.nom }}</option>
            }
          </select>
        </div>

        <div class="filter-item-container" style="width: 100px; flex-shrink: 0;">
          <label class="form-label text-uppercase">
            <i class="far fa-calendar-alt text-primary me-1"></i> Exercice
          </label>
          <select class="form-select form-select-sm fw-bold" [(ngModel)]="selectedExercice" (change)="onPerimetreOrYearChange()">
            @for (ex of exerciceList; track ex) {
              <option [value]="ex">{{ ex }}</option>
            }
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- 2. 4 CARTES KPI DE SYNTHÈSE (OPTION 3 : COCKPIT SPARKLINE) -->
  <div class="row g-3 mb-3">
    <!-- Card 1 : Total Notifications -->
    <div class="col-xl-3 col-sm-6">
      <div class="card kpi-spark-card kpi-spark-blue shadow-sm border-0 h-100">
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="kpi-spark-title text-navy">
              <i class="fas fa-bell me-1 text-primary"></i> Total Notifications
            </span>
            <span class="pulse-dot bg-primary" title="Veille active"></span>
          </div>

          <div class="d-flex align-items-center justify-content-between my-1">
            <div>
              <div class="kpi-spark-value text-dark">{{ scopedNotifications.length }}</div>
              <span class="kpi-spark-unit text-muted">Alertes Émises</span>
            </div>
            <!-- Sparkline SVG Total -->
            <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
              <polyline fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                        points="4,24 22,18 42,22 62,14 80,8"/>
              <circle cx="80" cy="8" r="3.2" fill="#2563eb"/>
            </svg>
          </div>

          <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
            <span class="text-muted very-small">
              <strong>{{ unreadCount }}</strong> non lue(s)
            </span>
            <span class="text-muted very-small">
              7 Services surveillés
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2 : Alertes Critiques -->
    <div class="col-xl-3 col-sm-6">
      <div class="card kpi-spark-card kpi-spark-red shadow-sm border-0 h-100">
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="kpi-spark-title text-danger">
              <i class="fas fa-exclamation-triangle me-1"></i> Alertes Critiques
            </span>
            <span class="pulse-dot bg-danger" title="Seuils réglementaires dépassés"></span>
          </div>

          <div class="d-flex align-items-center justify-content-between my-1">
            <div>
              <div class="kpi-spark-value text-danger">{{ criticalCount }}</div>
              <span class="kpi-spark-unit text-muted">Dossiers Prioritaires</span>
            </div>
            <!-- Sparkline SVG Critiques -->
            <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
              <polyline fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                        points="4,30 22,25 42,28 62,18 80,10"/>
              <circle cx="80" cy="10" r="3.2" fill="#dc2626"/>
            </svg>
          </div>

          <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
            <span class="text-muted very-small" title="Arbitrages urgents ordonnateurs / comptables">
              Action DGTCP requise
            </span>
            <span class="badge bg-danger-subtle text-danger border">Priorité 1</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 3 : Alertes Comparatives -->
    <div class="col-xl-3 col-sm-6">
      <div class="card kpi-spark-card kpi-spark-sky shadow-sm border-0 h-100">
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="kpi-spark-title text-info-emphasis">
              <i class="fas fa-balance-scale me-1"></i> Alertes Comparatives
            </span>
            <span class="pulse-dot bg-info" title="Différentiel interannuel"></span>
          </div>

          <div class="d-flex align-items-center justify-content-between my-1">
            <div>
              <div class="kpi-spark-value text-info-emphasis">{{ comparativeCount }}</div>
              <span class="kpi-spark-unit text-muted">Écarts Multi-Exercices</span>
            </div>
            <!-- Sparkline SVG Comparatif -->
            <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
              <polyline fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                        points="4,16 22,22 42,14 62,20 80,12"/>
              <circle cx="80" cy="12" r="3.2" fill="#0284c7"/>
            </svg>
          </div>

          <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
            <span class="text-muted very-small text-truncate" [title]="latestComparativeLabel">
              {{ latestComparativeLabel }}
            </span>
            <span class="badge bg-info-subtle text-info border">Comparatif</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 4 : Règles d'Alerte Actives -->
    <div class="col-xl-3 col-sm-6">
      <div class="card kpi-spark-card kpi-spark-green shadow-sm border-0 h-100">
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="kpi-spark-title text-success">
              <i class="fas fa-sliders-h me-1"></i> Règles de Surveillance
            </span>
            <span class="pulse-dot bg-success" title="Moteur de règles actif"></span>
          </div>

          <div class="d-flex align-items-center justify-content-between my-1">
            <div>
              <div class="kpi-spark-value text-success">
                {{ activeRulesCount }}<span class="fs-6 text-muted fw-normal">/{{ filteredAlertRules.length }}</span>
              </div>
              <span class="kpi-spark-unit text-muted">Règles Actives</span>
            </div>
            <!-- Sparkline SVG Règles -->
            <svg class="kpi-sparkline" viewBox="0 0 85 36" aria-hidden="true">
              <polyline fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                        points="4,20 22,16 42,12 62,8 80,4"/>
              <circle cx="80" cy="4" r="3.2" fill="#16a34a"/>
            </svg>
          </div>

          <div class="kpi-spark-footer d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
            <span class="text-muted very-small">
              1 règle / service + comparatif
            </span>
            <span class="badge bg-success-subtle text-success border">Temps Réel</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 3. CONTENU PRINCIPAL : FLUX (8 COLS) + RÈGLES (4 COLS) -->
  <div class="row g-4">
    <div class="col-xl-8 col-lg-8 col-12">
      <div class="card shadow-sm border-0 mb-4">
        <div class="border-bottom p-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 class="m-0 fw-bold text-dark d-flex align-items-center gap-2">
              <span>Flux des Notifications Actives</span>
              <span class="badge bg-navy text-white rounded-pill px-2.5 py-1 small">{{ filteredNotifications.length }}</span>
            </h5>
            <span class="text-muted small">Détections automatiques sur Comptabilité, Trésorerie, Cautionnement, Régies, Règlement, Statistiques et Compte de Gestion</span>
          </div>

          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5 fw-semibold px-3 rounded-pill shadow-sm"
                    (click)="genererRapportGlobal()">
              <i class="fas fa-file-alt"></i>
              <span>Rapport de synthèse</span>
            </button>
            <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 fw-semibold px-3 rounded-pill"
                    (click)="markAllAsRead()" [disabled]="unreadCount === 0">
              <i class="fas fa-check-double"></i>
              <span>Tout marquer comme lu</span>
            </button>
          </div>
        </div>

        <div class="card-body p-3 bg-light border-bottom">
          <div class="d-flex flex-wrap gap-2 align-items-center justify-content-between">
            <div class="d-flex flex-wrap align-items-center" style="gap: 8px;" role="group">
              <button type="button" class="btn btn-sm rounded-pill fw-bold px-3"
                      [ngClass]="filterCategory === 'TOUTES' ? 'btn-navy text-white' : 'btn-light border'"
                      (click)="setFilter('TOUTES')">
                <i class="far fa-bell me-1"></i> Toutes ({{ scopedNotifications.length }})
              </button>
              <button type="button" class="btn btn-sm rounded-pill fw-bold px-3"
                      [ngClass]="filterCategory === 'NON_LUES' ? 'btn-navy text-white' : 'btn-light border'"
                      (click)="setFilter('NON_LUES')">
                <i class="far fa-envelope me-1"></i> Non lues ({{ unreadCount }})
              </button>
              <button type="button" class="btn btn-sm rounded-pill fw-bold px-3"
                      [ngClass]="filterCategory === 'CRITIQUES' ? 'btn-navy text-white' : 'btn-light border'"
                      (click)="setFilter('CRITIQUES')">
                <i class="fas fa-exclamation-circle text-danger me-1"></i> Critiques ({{ criticalCount }})
              </button>
              <button type="button" class="btn btn-sm rounded-pill fw-bold px-3"
                      [ngClass]="filterCategory === 'COMPARATIVES' ? 'btn-navy text-white' : 'btn-light border'"
                      (click)="setFilter('COMPARATIVES')">
                <i class="fas fa-balance-scale text-info me-1"></i> Comparatives ({{ comparativeCount }})
              </button>
            </div>
          </div>
        </div>

        <div class="card-body p-3">
          @if (filteredNotifications.length === 0) {
            <div class="text-center py-5">
              <i class="far fa-bell-slash fa-3x text-muted opacity-50 mb-3"></i>
              <h5 class="fw-bold text-dark">Aucune notification dans cette vue</h5>
              <p class="text-muted mb-0 small">Tous vos indicateurs respectent les seuils paramétrés.</p>
            </div>
          } @else {
            @for (notif of unreadNotifications; track notif.id) {
              <div class="smart-notif-card card mb-3"
                   [ngClass]="{
                     'notif-border-critique': notif.severite === 'CRITIQUE',
                     'notif-border-vigilance': notif.severite === 'VIGILANCE',
                     'notif-border-succes': notif.severite === 'SUCCES',
                     'notif-border-info': notif.severite === 'INFO'
                   }">
                <div class="d-flex justify-content-between align-items-start gap-2 mb-2 flex-wrap">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="badge" [ngClass]="{
                      'bg-danger text-white': notif.severite === 'CRITIQUE',
                      'bg-warning text-dark': notif.severite === 'VIGILANCE',
                      'bg-success text-white': notif.severite === 'SUCCES',
                      'bg-info text-white': notif.severite === 'INFO'
                    }">
                      {{ notif.badgeLabel }}
                    </span>
                    <h6 class="fw-bold text-dark m-0">{{ notif.titre }}</h6>
                  </div>

                  <div class="d-flex align-items-center gap-2 ms-auto">
                    <button class="btn btn-sm btn-outline-primary py-0 px-2" (click)="markAsRead(notif)">
                      <i class="fas fa-check me-1"></i>Lu
                    </button>
                    <button class="btn btn-sm btn-outline-secondary py-0 px-2" (click)="dismissNotification(notif.id)" title="Supprimer">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>

                <p class="text-secondary small mb-2">{{ notif.description }}</p>

                <div class="d-flex justify-content-between align-items-center pt-2 border-top flex-wrap gap-2">
                  <div class="d-flex align-items-center gap-2 flex-wrap very-small">
                    <span class="badge bg-light text-dark border"><i class="fas fa-tag me-1"></i>{{ notif.domaine }}</span>
                    <span class="text-muted"><i class="far fa-calendar me-1"></i>{{ notif.dateStr }}</span>
                    @if (notif.chiffreCle) {
                      <span class="badge bg-white border text-dark fw-bold">
                        <i class="fas fa-chart-line text-primary me-1"></i>{{ notif.chiffreCle }}
                      </span>
                    }
                  </div>

                  <div class="d-flex align-items-center gap-2 ms-auto">
                    <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3"
                            (click)="genererRapport(notif)">
                      <i class="far fa-file-alt text-primary me-1"></i>Générer un rapport
                    </button>
                    @if (notif.actionType) {
                      <button type="button" class="btn btn-navy btn-sm rounded-pill px-3 fw-bold"
                              (click)="executeAction(notif)">
                        {{ notif.actionLabel }} <i class="fas fa-arrow-right ms-1"></i>
                      </button>
                    }
                  </div>
                </div>
              </div>
            }

            @if (readNotifications.length > 0 && !showReadNotifications && filterCategory !== 'NON_LUES') {
              <div class="text-center py-3 border-top">
                <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3"
                        (click)="showReadNotifications = true">
                  <i class="fas fa-history text-primary me-1"></i>
                  Voir plus ({{ readNotifications.length }} notification{{ readNotifications.length > 1 ? 's' : '' }} lue{{ readNotifications.length > 1 ? 's' : '' }})
                </button>
              </div>
            }

            @if (readNotifications.length > 0 && showReadNotifications && filterCategory !== 'NON_LUES') {
              <div class="mt-3 pt-3 border-top">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="text-muted fw-bold very-small text-uppercase">
                    <i class="fas fa-check-circle text-success me-1"></i> Notifications lues ({{ readNotifications.length }})
                  </span>
                  <button type="button" class="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                          (click)="showReadNotifications = false">
                    Masquer <i class="fas fa-chevron-up ms-1"></i>
                  </button>
                </div>

                @for (notif of readNotifications; track notif.id) {
                  <div class="smart-notif-card card mb-2 opacity-75">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-secondary">{{ notif.badgeLabel }}</span>
                        <h6 class="fw-bold text-muted m-0">{{ notif.titre }}</h6>
                      </div>
                      <button class="btn btn-sm btn-light border py-0 px-2 very-small" (click)="toggleRead(notif.id)">
                        <i class="fas fa-check-circle text-success me-1"></i>Lu
                      </button>
                    </div>
                    <p class="text-muted small mb-1">{{ notif.description }}</p>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>

    <!-- Colonne Droite : Gestionnaire de Règles d'Alertes (7 Services) -->
    <div class="col-xl-4 col-lg-4 col-12">
      <div class="card shadow-sm border-0 mb-4">
        <div class="border-bottom p-3 px-3.5">
          <h5 class="m-0 fw-bold text-dark d-flex align-items-center gap-2">
            <i class="fas fa-sliders-h text-primary"></i>
            <span>Règles d'Alertes</span>
          </h5>
        </div>

        <div class="card-body p-3">
          @if (showSavedFeedback) {
            <div class="alert alert-success py-2 px-3 mb-3 small text-center fw-semibold">
              <i class="fas fa-check-circle me-1"></i> Règles mises à jour et appliquées en direct !
            </div>
          }

          <div class="d-flex flex-column gap-2.5 mb-3">
            @for (rule of filteredAlertRules; track rule.id) {
              <div class="p-3 rounded-3 border" [class.opacity-50]="!rule.actif">
                <div class="d-flex justify-content-between align-items-center gap-2 mb-1.5">
                  <div class="d-flex align-items-center gap-1.5 flex-wrap">
                    <span class="badge bg-light text-dark border very-small">{{ rule.domaine }}</span>
                    <span class="badge very-small" [ngClass]="{
                      'bg-danger text-white': rule.severite === 'CRITIQUE',
                      'bg-warning text-dark': rule.severite === 'VIGILANCE',
                      'bg-success text-white': rule.severite === 'SUCCES',
                      'bg-info text-white': rule.severite === 'INFO'
                    }">{{ rule.severite }}</span>
                  </div>

                  <div class="d-flex align-items-center gap-1.5">
                    <button class="btn btn-sm btn-light border py-0 px-1.5" (click)="editRule(rule)" title="Modifier">
                      <i class="fas fa-pencil-alt small"></i>
                    </button>
                    <button class="btn btn-sm btn-light border text-danger py-0 px-1.5" (click)="deleteRule(rule.id)" title="Supprimer">
                      <i class="fas fa-trash small"></i>
                    </button>
                    <div class="form-check form-switch m-0 ms-1">
                      <input class="form-check-input" type="checkbox" [checked]="rule.actif" (change)="toggleRule(rule)">
                    </div>
                  </div>
                </div>

                <h6 class="fw-bold text-dark m-0 mb-1 small">{{ rule.nom }}</h6>
                <div class="very-small text-primary fw-bold">
                  <i class="fas fa-crosshairs me-1"></i>{{ getConditionLabel(rule) }}
                </div>
              </div>
            }
          </div>

          <div class="d-flex gap-2 pt-2 border-top">
            <button class="btn btn-sm btn-outline-secondary w-50 fw-semibold" (click)="resetToDefaultRules()">
              <i class="fas fa-undo me-1"></i> Rétablir par défaut
            </button>
            <button class="btn btn-sm btn-navy w-50 fw-bold" (click)="openNewRuleModal()">
              <i class="fas fa-plus me-1"></i> Nouvelle règle
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL 1 : CRÉATION / ÉDITION DE RÈGLE D'ALERTE -->
  @if (showRuleModal) {
    <div class="modal-backdrop-custom d-flex justify-content-center align-items-center">
      <div class="card shadow-lg border-0 modal-dialog-custom">
        <div class="border-bottom p-3 px-4 d-flex justify-content-between align-items-center">
          <h5 class="m-0 fw-bold text-navy">
            <i class="fas fa-bell text-warning me-2"></i>
            {{ editingRuleId ? 'Modifier la Règle d’Alerte' : 'Créer une Règle d’Alerte' }}
          </h5>
          <button type="button" class="btn-close" (click)="closeRuleModal()"></button>
        </div>

        <div class="card-body p-4">
          <div class="mb-3">
            <label class="form-label fw-bold small">1. Choisir le Service & Indicateur Surveillé</label>
            <select class="form-select fw-semibold" [(ngModel)]="newRule.indicateurId" (change)="onIndicatorSelectionChanged()">
              @for (ind of availableIndicators; track ind.id) {
                <option [value]="ind.id">[{{ ind.domaine }}] {{ ind.nom }} ({{ ind.unite }})</option>
              }
            </select>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-sm-6">
              <label class="form-label fw-bold small">2. Opérateur</label>
              <select class="form-select fw-bold" [(ngModel)]="newRule.operateur">
                <option value="<">&lt; Inférieur à</option>
                <option value="<=">&le; Inférieur ou égal à</option>
                <option value=">">&gt; Supérieur à</option>
                <option value=">=">&ge; Supérieur ou égal à</option>
                <option value="VARIATION_ABSOLUE_>">Variation absolue &gt; ±</option>
              </select>
            </div>
            <div class="col-sm-6">
              <label class="form-label fw-bold small">Valeur Seuil ({{ getSelectedIndicatorUnit() }})</label>
              <input type="number" class="form-control fw-bold" [(ngModel)]="newRule.valeurSeuil">
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold small">3. Sévérité & Libellé</label>
            <div class="btn-group w-100 mb-2">
              <button type="button" class="btn btn-sm" [ngClass]="newRule.severite === 'CRITIQUE' ? 'btn-danger' : 'btn-outline-danger'" (click)="newRule.severite = 'CRITIQUE'">Critique</button>
              <button type="button" class="btn btn-sm" [ngClass]="newRule.severite === 'VIGILANCE' ? 'btn-warning' : 'btn-outline-warning'" (click)="newRule.severite = 'VIGILANCE'">Vigilance</button>
              <button type="button" class="btn btn-sm" [ngClass]="newRule.severite === 'INFO' ? 'btn-info' : 'btn-outline-info'" (click)="newRule.severite = 'INFO'">Info</button>
              <button type="button" class="btn btn-sm" [ngClass]="newRule.severite === 'SUCCES' ? 'btn-success' : 'btn-outline-success'" (click)="newRule.severite = 'SUCCES'">Succès</button>
            </div>
            <input type="text" class="form-control fw-semibold" [(ngModel)]="newRule.nom" placeholder="Nom de la règle">
          </div>
        </div>

        <div class="border-top p-3 px-4 d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary" (click)="closeRuleModal()">Annuler</button>
          <button type="button" class="btn btn-navy fw-bold" (click)="saveRule()">
            <i class="fas fa-check me-1"></i> Enregistrer
          </button>
        </div>
      </div>
    </div>
  }

  <!-- MODAL 2 : RAPPORT D'ALERTE EXÉCUTIF DGTCP -->
  @if (showReportModal && activeReport) {
    <div class="modal-backdrop-custom d-flex justify-content-center align-items-center">
      <div class="card shadow-lg border-0 modal-dialog-report">
        <div class="report-modal-header p-3 px-4 d-flex justify-content-between align-items-center">
          <div>
            <div class="d-flex align-items-center gap-2">
              <h5 class="m-0 fw-bold text-white">Note d'Alerte & Rapport Décisionnel DGTCP</h5>
              <span class="badge bg-warning text-dark fw-bold">{{ activeReport.badgeLabel }}</span>
            </div>
            <span class="text-white-50 very-small">Réf : {{ activeReport.id }} • Édité le {{ activeReport.dateEdition }}</span>
          </div>
          <button type="button" class="btn-close btn-close-white" (click)="showReportModal = false"></button>
        </div>

        <div class="card-body p-4" style="max-height: 70vh; overflow-y: auto;">
          <div class="row g-3 p-3 border rounded-3 bg-light mb-3">
            <div class="col-md-5">
              <span class="very-small text-uppercase text-muted fw-bold d-block">Périmètre sous revue</span>
              <strong class="text-navy">{{ activeReport.perimetre }}</strong>
            </div>
            <div class="col-md-3">
              <span class="very-small text-uppercase text-muted fw-bold d-block">Exercice</span>
              <strong>{{ activeReport.periode }}</strong>
            </div>
            <div class="col-md-4">
              <span class="very-small text-uppercase text-muted fw-bold d-block">Service concerné</span>
              <span class="badge bg-navy text-white">{{ activeReport.domaine }}</span>
            </div>
          </div>

          <h6 class="fw-bold text-navy text-uppercase small mb-2">1. Objet du Constat d'Alerte</h6>
          <div class="p-3 border rounded-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong class="text-dark">{{ activeReport.titre }}</strong>
              @if (activeReport.chiffreCle) {
                <span class="badge bg-danger-subtle text-danger border">{{ activeReport.chiffreCle }}</span>
              }
            </div>
            <p class="m-0 small text-secondary">{{ activeReport.description }}</p>
          </div>

          <h6 class="fw-bold text-navy text-uppercase small mb-2">2. Diagnostic & Analyse d'Impact</h6>
          <div class="p-3 border rounded-3 mb-3">
            <p class="small text-dark mb-2">{{ activeReport.diagnostic }}</p>
            <ul class="small text-secondary mb-0">
              @for (imp of activeReport.impacts; track imp) {
                <li>{{ imp }}</li>
              }
            </ul>
          </div>

          @if (activeReport.notifications && activeReport.notifications.length > 0) {
            <h6 class="fw-bold text-navy text-uppercase small mb-2">
              3. Détail des Notifications Incluses ({{ activeReport.notifications.length }})
            </h6>
            <div class="table-responsive border rounded-3 mb-3">
              <table class="table table-sm table-hover align-middle mb-0 small">
                <thead class="table-light">
                  <tr>
                    <th>Service</th>
                    <th>Sévérité</th>
                    <th>Notification</th>
                    <th>Indicateur</th>
                  </tr>
                </thead>
                <tbody>
                  @for (n of activeReport.notifications; track n.id) {
                    <tr>
                      <td><span class="badge bg-light text-dark border">{{ n.domaine }}</span></td>
                      <td>
                        <span class="badge" [ngClass]="{
                          'bg-danger text-white': n.severite === 'CRITIQUE',
                          'bg-warning text-dark': n.severite === 'VIGILANCE',
                          'bg-success text-white': n.severite === 'SUCCES',
                          'bg-info text-white': n.severite === 'INFO'
                        }">{{ n.severite }}</span>
                      </td>
                      <td>
                        <strong class="d-block text-dark">{{ n.titre }}</strong>
                        <span class="text-muted very-small">{{ n.description }}</span>
                      </td>
                      <td class="text-nowrap fw-semibold">{{ n.chiffreCle || '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <h6 class="fw-bold text-success text-uppercase small mb-2">
            {{ activeReport.notifications?.length ? '4.' : '3.' }} Recommandations Opérationnelles Immédiates
          </h6>
          <div class="p-3 border rounded-3">
            <ol class="small fw-semibold text-dark mb-0">
              @for (rec of activeReport.recommandations; track rec) {
                <li class="mb-1">{{ rec }}</li>
              }
            </ol>
          </div>
        </div>

        <div class="border-top p-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold" (click)="copierRapport()">
            <i class="fas" [ngClass]="copiedFeedback ? 'fa-check text-success' : 'fa-copy'"></i>
            {{ copiedFeedback ? 'Copié !' : 'Copier la note' }}
          </button>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-navy rounded-pill px-3 fw-bold" (click)="imprimerRapport()">
              <i class="fas fa-print me-1"></i> Imprimer / PDF
            </button>
            <button type="button" class="btn btn-sm btn-secondary rounded-pill px-3" (click)="showReportModal = false">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  }

</div>
  `,
  styles: [`
    .notifications-page-container { max-width: 1600px; margin: 0 auto; }
    .text-navy { color: #1A365D !important; }
    .bg-navy { background-color: #1A365D !important; }
    .btn-navy { background-color: #1A365D !important; color: #fff !important; }
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
    .kpi-spark-card.kpi-spark-red {
      background: linear-gradient(180deg, #ffffff 60%, rgba(220, 38, 38, 0.05) 100%) !important;
    }
    .kpi-spark-card.kpi-spark-sky {
      background: linear-gradient(180deg, #ffffff 60%, rgba(2, 132, 199, 0.06) 100%) !important;
    }
    .kpi-spark-card.kpi-spark-green {
      background: linear-gradient(180deg, #ffffff 60%, rgba(22, 163, 74, 0.06) 100%) !important;
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
    .pulse-dot.bg-danger {
      background-color: #dc2626;
      animation: pulse-red 2s infinite;
    }
    .pulse-dot.bg-primary {
      background-color: #2563eb;
      animation: pulse-blue 2s infinite;
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
    @keyframes pulse-red {
      0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
      70% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
      100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
    }
    @keyframes pulse-blue {
      0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.5); }
      70% { box-shadow: 0 0 0 6px rgba(37, 99, 235, 0); }
      100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
    }

    .smart-notif-card {
      border-radius: 12px;
      padding: 1rem 1.2rem;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #cbd5e1 !important;
    }
    .notif-border-critique { border-left-color: #dc2626 !important; background-color: #fef2f2; }
    .notif-border-vigilance { border-left-color: #f59e0b !important; background-color: #fffdf5; }
    .notif-border-succes { border-left-color: #2E7D32 !important; background-color: #f8fdf9; }
    .notif-border-info { border-left-color: #1A365D !important; background-color: #f7fbff; }

    .modal-backdrop-custom {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1060;
      padding: 1rem;
    }
    .modal-dialog-custom { width: 100%; max-width: 560px; border-radius: 14px; }
    .modal-dialog-report { width: 100%; max-width: 760px; border-radius: 14px; overflow: hidden; }
    .report-modal-header { background: linear-gradient(135deg, #1A365D 0%, #2a4a7f 100%); }

    :host-context([data-bs-theme="dark"]) {
      .title-text, .text-navy { color: #38bdf8 !important; }
      .smart-notif-card { background-color: #162032 !important; }
    }
  `]
})
export class NotificationsPilotageComponent implements OnInit {
  private realDataService = inject(PilotageRealDataService);
  private benchmarkService = inject(PilotageBenchmarkService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  isBrowser = isPlatformBrowser(this.platformId);
  selectedPerimetre = this.realDataService.perimetresList[0];
  selectedExercice = 2026;
  perimetresList = this.realDataService.perimetresList;
  exerciceList = this.realDataService.exerciceList;

  comparativeYearA = 2026;
  comparativeYearB = 2025;

  realMetrics: RealDataPilotageMetrics | null = null;
  notificationsList: SmartNotification[] = [];
  filterCategory: 'TOUTES' | 'NON_LUES' | 'CRITIQUES' | 'COMPARATIVES' = 'TOUTES';
  selectedServiceFilter = 'TOUS';
  selectedIndicatorFilter = 'TOUS';
  showReadNotifications = false;
  showSavedFeedback = false;

  private readNotifIds = new Set<string>();
  private dismissedNotifIds = new Set<string>();

  alertRules: AlertRule[] = [];
  // Indicateurs complets pour chacun des 7 Services + Analyse Comparative
  readonly availableIndicators: IndicatorDefinition[] = [
    // Comptabilité
    {
      id: 'CONCORDANCE_BCEAO',
      nom: 'Taux Rapprochement Auto BCEAO / ACCT',
      domaine: 'Comptabilité',
      unite: '%',
      defaultOperateur: '<',
      defaultSeuil: 95,
      defaultSeverite: 'VIGILANCE',
      step: 0.5,
      description: 'Service Comptabilité : Seuil de lettrage automatique des écritures du CUT.'
    },
    {
      id: 'CPT_VOL',
      nom: 'Volume Mouvements Balance Générale',
      domaine: 'Comptabilité',
      unite: 'Mds FCFA',
      defaultOperateur: '<',
      defaultSeuil: 200,
      defaultSeverite: 'INFO',
      step: 5,
      description: 'Service Comptabilité : Volume total des écritures Débit/Crédit validées.'
    },
    {
      id: 'CPT_ECART',
      nom: 'Écart de Concordance Bancaire',
      domaine: 'Comptabilité',
      unite: 'Mds FCFA',
      defaultOperateur: '>',
      defaultSeuil: 0.5,
      defaultSeverite: 'CRITIQUE',
      step: 0.1,
      description: 'Service Comptabilité : Divergence résiduelle entre relevé BCEAO et Grand Livre.'
    },
    {
      id: 'CPT_SUSP',
      nom: 'Encours des Suspens Comptables',
      domaine: 'Comptabilité',
      unite: 'Mds FCFA',
      defaultOperateur: '>',
      defaultSeuil: 20,
      defaultSeverite: 'VIGILANCE',
      step: 1,
      description: 'Service Comptabilité : Montant des écritures en attente de régularisation (compte 47).'
    },
    {
      id: 'CPT_DELAI',
      nom: 'Délai Moyen Apurement Comptable',
      domaine: 'Comptabilité',
      unite: 'Jours',
      defaultOperateur: '>',
      defaultSeuil: 2,
      defaultSeverite: 'VIGILANCE',
      step: 0.2,
      description: 'Service Comptabilité : Durée moyenne de lettrage et apurement.'
    },

    // Trésorerie
    {
      id: 'TAUX_REGUL_LA',
      nom: 'Taux de Régularisation des Lettres d’Avance',
      domaine: 'Trésorerie',
      unite: '%',
      defaultOperateur: '<',
      defaultSeuil: 90,
      defaultSeverite: 'CRITIQUE',
      step: 0.5,
      description: 'Service Trésorerie : Norme légale ACCT fixée à 90% de régularisation des LA.'
    },
    {
      id: 'TRS_LIQ',
      nom: 'Position Nette de Liquidité CUT',
      domaine: 'Trésorerie',
      unite: 'Mds FCFA',
      defaultOperateur: '<',
      defaultSeuil: 500,
      defaultSeverite: 'CRITIQUE',
      step: 10,
      description: 'Service Trésorerie : Disponibilités globales BCEAO et banques partenaires.'
    },
    {
      id: 'TRS_LA_ENC',
      nom: 'Encours Lettres d’Avance Non Régularisées',
      domaine: 'Trésorerie',
      unite: 'Mds FCFA',
      defaultOperateur: '>',
      defaultSeuil: 30,
      defaultSeverite: 'VIGILANCE',
      step: 1,
      description: 'Service Trésorerie : Montant des Lettres d’Avance en attente d’apurement.'
    },
    {
      id: 'TRS_CS',
      nom: 'Disponibilités Comptes Spéciaux (CS)',
      domaine: 'Trésorerie',
      unite: 'Mds FCFA',
      defaultOperateur: '<',
      defaultSeuil: 10,
      defaultSeverite: 'INFO',
      step: 1,
      description: 'Service Trésorerie : Solde disponible sur les Comptes Spéciaux du Trésor.'
    },
    {
      id: 'TRS_BC',
      nom: 'Bons de Caisse en Circulation',
      domaine: 'Trésorerie',
      unite: 'Bons',
      defaultOperateur: '>',
      defaultSeuil: 400,
      defaultSeverite: 'INFO',
      step: 10,
      description: 'Service Trésorerie : Nombre de Bons de Caisse actifs sur le réseau.'
    },

    // Cautionnement
    {
      id: 'CAUTIONS_ECHUES',
      nom: 'Volume des Cautionnements Échus Non Levés',
      domaine: 'Cautionnement',
      unite: 'Mds FCFA',
      defaultOperateur: '>',
      defaultSeuil: 2.0,
      defaultSeverite: 'VIGILANCE',
      step: 0.2,
      description: 'Service Cautionnement : Garanties arrivées à échéance en attente de mainlevée ou recouvrement.'
    },
    {
      id: 'CAU_VOL',
      nom: 'Volume Financier des Garanties',
      domaine: 'Cautionnement',
      unite: 'Mds FCFA',
      defaultOperateur: '<',
      defaultSeuil: 5,
      defaultSeverite: 'INFO',
      step: 0.5,
      description: 'Service Cautionnement : Montant cumulé des cautionnements et consignations.'
    },
    {
      id: 'CAU_CONT',
      nom: 'Dossiers en Contentieux',
      domaine: 'Cautionnement',
      unite: 'Dossiers',
      defaultOperateur: '>',
      defaultSeuil: 20,
      defaultSeverite: 'CRITIQUE',
      step: 1,
      description: 'Service Cautionnement : Cautionnements faisant l’objet de litige ou recouvrement.'
    },
    {
      id: 'CAU_COUV',
      nom: 'Taux de Couverture Cautionnement',
      domaine: 'Cautionnement',
      unite: '%',
      defaultOperateur: '<',
      defaultSeuil: 95,
      defaultSeverite: 'VIGILANCE',
      step: 0.5,
      description: 'Service Cautionnement : Part des postes et marchés couverts par une garantie valide.'
    },

    // Régies
    {
      id: 'EXECUTION_LF',
      nom: 'Taux de Pièces Justificatives Conformes Régies',
      domaine: 'Régies',
      unite: '%',
      defaultOperateur: '>=',
      defaultSeuil: 95,
      defaultSeverite: 'SUCCES',
      step: 0.5,
      description: 'Service Régies : Conformité documentaire des régies d’avances et de recettes.'
    },
    {
      id: 'REG_TOT',
      nom: 'Recettes & Régies Mobilisées',
      domaine: 'Régies',
      unite: 'Mds FCFA',
      defaultOperateur: '<',
      defaultSeuil: 250,
      defaultSeverite: 'VIGILANCE',
      step: 10,
      description: 'Service Régies : Collecte globale DGI, Douanes, Trésor et Régies de recettes.'
    },
    {
      id: 'REG_ROT',
      nom: 'Délai Moyen Rotation des Fonds',
      domaine: 'Régies',
      unite: 'Jours',
      defaultOperateur: '>',
      defaultSeuil: 15,
      defaultSeverite: 'VIGILANCE',
      step: 0.5,
      description: 'Service Régies : Vélocité d’apurement des caisses des régisseurs.'
    },
    {
      id: 'REG_DEP',
      nom: 'Régies en Dépassement',
      domaine: 'Régies',
      unite: 'Régies',
      defaultOperateur: '>',
      defaultSeuil: 3,
      defaultSeverite: 'CRITIQUE',
      step: 1,
      description: 'Service Régies : Nombre de régies présentant un dépassement de plafond ou délai.'
    },

    // Règlement
    {
      id: 'DELAI_REGLEMENT',
      nom: 'Délai Moyen de Règlement Fournisseurs',
      domaine: 'Règlement',
      unite: 'Jours',
      defaultOperateur: '>',
      defaultSeuil: 20,
      defaultSeverite: 'VIGILANCE',
      step: 1,
      description: 'Service Règlement : Surveillance du délai d’exécution des virements RTGS/SICA.'
    },
    {
      id: 'RGL_TOT',
      nom: 'Volume Total des Règlements Exécutés',
      domaine: 'Règlement',
      unite: 'Mds FCFA',
      defaultOperateur: '<',
      defaultSeuil: 200,
      defaultSeverite: 'INFO',
      step: 10,
      description: 'Service Règlement : Paiements fournisseurs, virements RTGS/SICA et chèques.'
    },
    {
      id: 'RGL_IP',
      nom: 'Encours Imputations Provisoires (IP)',
      domaine: 'Règlement',
      unite: 'Mds FCFA',
      defaultOperateur: '>',
      defaultSeuil: 1.5,
      defaultSeverite: 'VIGILANCE',
      step: 0.1,
      description: 'Service Règlement : Paiements urgents en attente d’engagement définitif.'
    },
    {
      id: 'RGL_ANO',
      nom: 'Anomalies de Règlement',
      domaine: 'Règlement',
      unite: 'Dossiers',
      defaultOperateur: '>',
      defaultSeuil: 5,
      defaultSeverite: 'CRITIQUE',
      step: 1,
      description: 'Service Règlement : Dossiers rejetés ou bloqués pour erreur de RIB/pièce.'
    },

    // Statistiques
    {
      id: 'RAP_CRITIQUE_90J',
      nom: 'Encours Restes à Payer > 90 jours',
      domaine: 'Statistiques',
      unite: 'Mds FCFA',
      defaultOperateur: '>',
      defaultSeuil: 25,
      defaultSeverite: 'CRITIQUE',
      step: 1,
      description: 'Service Statistiques : Plafond d’alerte sur les RAP critiques (> 90 jours).'
    },
    {
      id: 'STA_RAP',
      nom: 'Encours Restes à Payer (RAP)',
      domaine: 'Statistiques',
      unite: 'Mds FCFA',
      defaultOperateur: '>',
      defaultSeuil: 100,
      defaultSeverite: 'VIGILANCE',
      step: 5,
      description: 'Service Statistiques : Engagements ordonnancés en attente de décaissement.'
    },
    {
      id: 'STA_SUB',
      nom: 'Subventions & Approvisionnements',
      domaine: 'Statistiques',
      unite: 'Mds FCFA',
      defaultOperateur: '<',
      defaultSeuil: 15,
      defaultSeverite: 'INFO',
      step: 1,
      description: 'Service Statistiques : Dotations EPN, collectivités, FER et approvisionnements ACCDP.'
    },
    {
      id: 'STA_PREV',
      nom: 'Taux Réalisation Prévisions Statistiques',
      domaine: 'Statistiques',
      unite: '%',
      defaultOperateur: '<',
      defaultSeuil: 90,
      defaultSeverite: 'VIGILANCE',
      step: 0.5,
      description: 'Service Statistiques : Adéquation entre réalisations et prévisions macroéconomiques.'
    },

    // Compte de Gestion
    {
      id: 'CONFORMITE_CG',
      nom: 'Taux de Conformité Compte de Gestion (Cour des Comptes)',
      domaine: 'Compte de Gestion',
      unite: '%',
      defaultOperateur: '>=',
      defaultSeuil: 95,
      defaultSeverite: 'SUCCES',
      step: 0.5,
      description: 'Service Compte de Gestion : Qualité de la reddition annuelle transmise à la Cour des Comptes.'
    },
    {
      id: 'CG_EXEC',
      nom: 'Taux Exécution des Crédits Assignés',
      domaine: 'Compte de Gestion',
      unite: '%',
      defaultOperateur: '<',
      defaultSeuil: 85,
      defaultSeverite: 'VIGILANCE',
      step: 0.5,
      description: 'Service Compte de Gestion : Absorption budgétaire sur les développements de titres.'
    },
    {
      id: 'CG_INST',
      nom: 'Restes en Instance d’Apurement',
      domaine: 'Compte de Gestion',
      unite: 'Mds FCFA',
      defaultOperateur: '>',
      defaultSeuil: 8,
      defaultSeverite: 'VIGILANCE',
      step: 0.5,
      description: 'Service Compte de Gestion : Imputations provisoires et débiteurs divers à régulariser.'
    },
    {
      id: 'CG_QUIT',
      nom: 'Taux de Quitus Transmis',
      domaine: 'Compte de Gestion',
      unite: '%',
      defaultOperateur: '<',
      defaultSeuil: 90,
      defaultSeverite: 'VIGILANCE',
      step: 0.5,
      description: 'Service Compte de Gestion : Part des comptables ayant obtenu/transmis leur quitus.'
    },

    // Analyse Comparative
    {
      id: 'ECART_COMPARATIF',
      nom: 'Écart Interannuel N vs N-k',
      domaine: 'Analyse Comparative',
      unite: '%',
      defaultOperateur: 'VARIATION_ABSOLUE_>',
      defaultSeuil: 4,
      defaultSeverite: 'CRITIQUE',
      step: 0.5,
      description: 'Détection de variation interannuelle significative entre deux exercices.'
    }
  ];

  showRuleModal = false;
  editingRuleId: string | null = null;
  newRule: {
    nom: string;
    indicateurId: string;
    operateur: '<' | '<=' | '>' | '>=' | 'VARIATION_ABSOLUE_>';
    valeurSeuil: number;
    severite: 'CRITIQUE' | 'VIGILANCE' | 'INFO' | 'SUCCES';
  } = {
    nom: '',
    indicateurId: 'TAUX_REGUL_LA',
    operateur: '<',
    valeurSeuil: 90,
    severite: 'CRITIQUE'
  };

  activeReport: GeneratedMiniReport | null = null;
  showReportModal = false;
  copiedFeedback = false;

  constructor() {}

  ngOnInit(): void {
    const bench = this.benchmarkService.getSelectedYears();
    this.comparativeYearA = bench.anneeA;
    this.comparativeYearB = bench.anneeB;
    this.initReadState();
    this.initAlertRules();
    this.loadRealMetrics(this.selectedExercice);
  }

  getDefaultRules(): AlertRule[] {
    return [
      {
        id: 'rule-compta-bceao',
        nom: 'Concordance Automatique BCEAO / ACCT',
        indicateurId: 'CONCORDANCE_BCEAO',
        indicateurNom: 'Taux Rapprochement Auto BCEAO / ACCT',
        domaine: 'Comptabilité',
        operateur: '<',
        valeurSeuil: 95,
        unite: '%',
        severite: 'VIGILANCE',
        actif: true,
        isSystem: true
      },
      {
        id: 'rule-la-regul',
        nom: 'Seuil Légal Régularisation Lettres d’Avance',
        indicateurId: 'TAUX_REGUL_LA',
        indicateurNom: 'Taux de Régularisation des Lettres d’Avance',
        domaine: 'Trésorerie',
        operateur: '<',
        valeurSeuil: 90,
        unite: '%',
        severite: 'CRITIQUE',
        actif: true,
        isSystem: true
      },
      {
        id: 'rule-caution-echu',
        nom: 'Surveillance des Cautionnements Échus Non Levés',
        indicateurId: 'CAUTIONS_ECHUES',
        indicateurNom: 'Volume des Cautionnements Échus Non Levés',
        domaine: 'Cautionnement',
        operateur: '>',
        valeurSeuil: 2.0,
        unite: 'Mds FCFA',
        severite: 'VIGILANCE',
        actif: true,
        isSystem: true
      },
      {
        id: 'rule-regies-lf',
        nom: 'Conformité Pièces Justificatives des Régies',
        indicateurId: 'EXECUTION_LF',
        indicateurNom: 'Taux de Pièces Justificatives Conformes Régies',
        domaine: 'Régies',
        operateur: '>=',
        valeurSeuil: 95,
        unite: '%',
        severite: 'SUCCES',
        actif: true,
        isSystem: true
      },
      {
        id: 'rule-reglement-delai',
        nom: 'Cible de Délai Moyen de Règlement Fournisseurs',
        indicateurId: 'DELAI_REGLEMENT',
        indicateurNom: 'Délai Moyen de Règlement Fournisseurs',
        domaine: 'Règlement',
        operateur: '>',
        valeurSeuil: 20,
        unite: 'Jours',
        severite: 'VIGILANCE',
        actif: true,
        isSystem: true
      },
      {
        id: 'rule-rap-90j',
        nom: 'Plafond Critique Restes à Payer (> 90 jours)',
        indicateurId: 'RAP_CRITIQUE_90J',
        indicateurNom: 'Encours Restes à Payer > 90 jours',
        domaine: 'Statistiques',
        operateur: '>',
        valeurSeuil: 25,
        unite: 'Mds FCFA',
        severite: 'CRITIQUE',
        actif: true,
        isSystem: true
      },
      {
        id: 'rule-cg-conformite',
        nom: 'Validation Reddition Cour des Comptes',
        indicateurId: 'CONFORMITE_CG',
        indicateurNom: 'Taux de Conformité Compte de Gestion',
        domaine: 'Compte de Gestion',
        operateur: '>=',
        valeurSeuil: 95,
        unite: '%',
        severite: 'SUCCES',
        actif: true,
        isSystem: true
      }
    ];
  }

  initAlertRules(): void {
    if (!this.isBrowser || typeof localStorage === 'undefined') {
      this.alertRules = this.getDefaultRules();
      return;
    }
    try {
      const stored = localStorage.getItem('sygacut_notif_alert_rules_v2');
      this.alertRules = stored ? JSON.parse(stored) : this.getDefaultRules();
    } catch {
      this.alertRules = this.getDefaultRules();
    }
  }

  saveAlertRules(): void {
    if (!this.isBrowser || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('sygacut_notif_alert_rules_v2', JSON.stringify(this.alertRules));
    } catch {}
  }

  initReadState(): void {
    if (!this.isBrowser || typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem('sygacut_notif_read_ids');
      if (stored) {
        this.readNotifIds = new Set(JSON.parse(stored));
      }
    } catch {}
  }

  saveReadNotifIds(): void {
    if (!this.isBrowser || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('sygacut_notif_read_ids', JSON.stringify(Array.from(this.readNotifIds)));
    } catch {}
  }

  onPerimetreOrYearChange(): void {
    this.selectedExercice = Number(this.selectedExercice);
    this.loadRealMetrics(this.selectedExercice);
  }

  loadRealMetrics(year: number): void {
    this.realDataService.getRealMetricsForYear(year, this.selectedPerimetre).subscribe(metrics => {
      this.realMetrics = metrics;
      this.generateSmartNotifications();
      this.cdr.detectChanges();
    });
  }

  generateSmartNotifications(): void {
    if (!this.realMetrics) return;
    const m = this.realMetrics;
    const list: SmartNotification[] = [];

    for (const rule of this.alertRules) {
      if (!rule.actif) continue;

      let val = 0;
      let description = '';
      let chiffreCle = '';
      let actionType: 'SIMULATION' | 'SURVEILLANCE' = 'SURVEILLANCE';

      switch (rule.indicateurId) {
        case 'CONCORDANCE_BCEAO':
          val = m.tauxRapprochementAuto;
          chiffreCle = `${val}% (Écart: ${m.ecartConcordanceMilliards} Mds)`;
          description = `[Service Comptabilité] Taux de rapprochement auto à ${val}% sur un volume de ${m.comptaVolumeMouvementsMilliards} Mds FCFA (${m.suspensionsActivesDossiers} suspens actifs).`;
          break;
        case 'TAUX_REGUL_LA':
          val = m.tauxRegularisationLA;
          chiffreCle = `${val}% (${m.laEnCoursMilliards} Mds LA)`;
          description = `[Service Trésorerie] Taux de régularisation des Lettres d'Avance à ${val}% (seuil : ${rule.operateur} ${rule.valeurSeuil}%), encours non apuré : ${m.laEnCoursMilliards} Mds FCFA.`;
          actionType = 'SIMULATION';
          break;
        case 'CAUTIONS_ECHUES':
          val = m.cautionnementsEchusMilliards;
          chiffreCle = `${val} Mds échus`;
          description = `[Service Cautionnement] ${val} Mds FCFA de cautionnements échus non levés sur un portefeuille de ${m.cautionnementsActifsCount} dossiers actifs.`;
          break;
        case 'EXECUTION_LF':
          val = m.regiesTauxPiecesConformes;
          chiffreCle = `${val}% (${m.totalRecettesMilliards} Mds)`;
          description = `[Service Régies] ${val}% de pièces justificatives conformes et ${m.totalRecettesMilliards} Mds FCFA mobilisés sur ${m.postesEtRegiesActifs} postes.`;
          break;
        case 'DELAI_REGLEMENT':
          val = m.delaiMoyenReglementJours;
          chiffreCle = `${val} jours (${m.partVirementsRtgsPct}% RTGS)`;
          description = `[Service Règlement] Délai moyen de règlement fournisseur de ${val} jours ouvrés et ${m.imputationsProvisoiresMilliards} Mds FCFA d'Imputations Provisoires.`;
          break;
        case 'RAP_CRITIQUE_90J':
          val = m.rapCritiquePlus90jMilliards;
          chiffreCle = `${val} Mds (> 90j)`;
          description = `[Service Statistiques] Encours des Restes à Payer > 90 jours à ${val} Mds FCFA sur un total RAP de ${m.encoursRapMilliards} Mds FCFA.`;
          actionType = 'SIMULATION';
          break;
        case 'CONFORMITE_CG':
          val = m.tauxConformiteCompteGestion;
          chiffreCle = `${val}% (${m.cgVolumeAuditeMilliards} Mds)`;
          description = `[Service Compte de Gestion] Conformité Cour des Comptes à ${val}% sur ${m.cgVolumeAuditeMilliards} Mds FCFA audités (${m.quitusTransmisPct}% quitus).`;
          break;
        case 'CPT_VOL':
          val = m.comptaVolumeMouvementsMilliards;
          chiffreCle = `${val} Mds FCFA`;
          description = `[Service Comptabilité] Volume des mouvements Balance Générale à ${val} Mds FCFA.`;
          break;
        case 'CPT_ECART':
          val = m.ecartConcordanceMilliards;
          chiffreCle = `${val} Mds FCFA`;
          description = `[Service Comptabilité] Écart de concordance bancaire à ${val} Mds FCFA.`;
          break;
        case 'CPT_SUSP':
          val = m.suspensComptablesMilliards;
          chiffreCle = `${val} Mds (${m.suspensionsActivesDossiers} dossiers)`;
          description = `[Service Comptabilité] Suspens comptables à ${val} Mds FCFA (${m.suspensionsActivesDossiers} dossiers actifs).`;
          break;
        case 'CPT_DELAI':
          val = m.delaiMoyenApurementComptaJours;
          chiffreCle = `${val} jours`;
          description = `[Service Comptabilité] Délai moyen d’apurement comptable de ${val} jours.`;
          break;
        case 'TRS_LIQ':
          val = m.liquiditeNetteCutMilliards;
          chiffreCle = `${val} Mds FCFA`;
          description = `[Service Trésorerie] Position nette de liquidité CUT à ${val} Mds FCFA.`;
          break;
        case 'TRS_LA_ENC':
          val = m.laEnCoursMilliards;
          chiffreCle = `${val} Mds FCFA`;
          description = `[Service Trésorerie] Encours des Lettres d’Avance non régularisées à ${val} Mds FCFA.`;
          break;
        case 'TRS_CS':
          val = m.soldeComptesSpeciauxMilliards;
          chiffreCle = `${val} Mds (${m.comptesSpeciauxActifs} CS)`;
          description = `[Service Trésorerie] Disponibilités des Comptes Spéciaux à ${val} Mds FCFA.`;
          break;
        case 'TRS_BC':
          val = m.bonsCaisseCirculationCount;
          chiffreCle = `${val} bons`;
          description = `[Service Trésorerie] ${val} Bons de Caisse en circulation.`;
          break;
        case 'CAU_VOL':
          val = m.cautionnementsVolumeMilliards;
          chiffreCle = `${val} Mds FCFA`;
          description = `[Service Cautionnement] Volume financier des garanties à ${val} Mds FCFA.`;
          break;
        case 'CAU_CONT':
          val = m.cautionnementsContentieuxCount;
          chiffreCle = `${val} dossiers`;
          description = `[Service Cautionnement] ${val} dossiers de cautionnement en contentieux.`;
          break;
        case 'CAU_COUV':
          val = m.tauxCouvertureCautionnement;
          chiffreCle = `${val}%`;
          description = `[Service Cautionnement] Taux de couverture des cautionnements à ${val}%.`;
          break;
        case 'REG_TOT':
          val = m.totalRecettesMilliards;
          chiffreCle = `${val} Mds FCFA`;
          description = `[Service Régies] Recettes et régies mobilisées à ${val} Mds FCFA.`;
          break;
        case 'REG_ROT':
          val = m.regiesDelaiMoyenRotationJours;
          chiffreCle = `${val} jours`;
          description = `[Service Régies] Délai moyen de rotation des fonds des régies : ${val} jours.`;
          break;
        case 'REG_DEP':
          val = m.regiesEnDepassementCount;
          chiffreCle = `${val} régies`;
          description = `[Service Régies] ${val} régies en dépassement de plafond ou délai.`;
          break;
        case 'RGL_TOT':
          val = m.totalReglementsMilliards;
          chiffreCle = `${val} Mds FCFA`;
          description = `[Service Règlement] Volume total des règlements exécutés : ${val} Mds FCFA.`;
          break;
        case 'RGL_IP':
          val = m.imputationsProvisoiresMilliards;
          chiffreCle = `${val} Mds FCFA`;
          description = `[Service Règlement] Encours des Imputations Provisoires à ${val} Mds FCFA.`;
          break;
        case 'RGL_ANO':
          val = m.anomaliesReglementDossiers;
          chiffreCle = `${val} dossiers`;
          description = `[Service Règlement] ${val} dossiers présentant une anomalie de règlement.`;
          break;
        case 'STA_RAP':
          val = m.encoursRapMilliards;
          chiffreCle = `${val} Mds FCFA`;
          description = `[Service Statistiques] Encours global des Restes à Payer à ${val} Mds FCFA.`;
          break;
        case 'STA_SUB':
          val = m.statSubventionsMilliards;
          chiffreCle = `${val} Mds FCFA`;
          description = `[Service Statistiques] Subventions et approvisionnements à ${val} Mds FCFA.`;
          break;
        case 'STA_PREV':
          val = m.tauxRealisationPrevisionsStat;
          chiffreCle = `${val}%`;
          description = `[Service Statistiques] Taux de réalisation des prévisions à ${val}%.`;
          break;
        case 'CG_EXEC':
          val = m.tauxExecutionCreditsCG;
          chiffreCle = `${val}%`;
          description = `[Service Compte de Gestion] Taux d’exécution des crédits assignés à ${val}%.`;
          break;
        case 'CG_INST':
          val = m.restesEnInstanceCGMilliards;
          chiffreCle = `${val} Mds FCFA`;
          description = `[Service Compte de Gestion] Restes en instance d’apurement : ${val} Mds FCFA.`;
          break;
        case 'CG_QUIT':
          val = m.quitusTransmisPct;
          chiffreCle = `${val}%`;
          description = `[Service Compte de Gestion] Taux de quitus transmis à ${val}%.`;
          break;
      }

      if (this.evalCondition(val, rule.operateur, rule.valeurSeuil)) {
        const id = `notif-${rule.id}-${m.annee}`;
        if (!this.dismissedNotifIds.has(id)) {
          list.push({
            id,
            source: 'NORME_ACCT',
            domaine: rule.domaine,
            severite: rule.severite,
            titre: `${rule.nom} (${chiffreCle})`,
            description,
            chiffreCle,
            badgeLabel: rule.severite === 'CRITIQUE' ? 'Alerte Critique' : (rule.severite === 'SUCCES' ? 'Conforme' : 'Vigilance'),
            dateStr: `Exercice ${m.annee}`,
            isRead: this.readNotifIds.has(id),
            actionType,
            actionLabel: actionType === 'SIMULATION' ? 'Simuler l’Apurement' : 'Voir Synthèse 7 Services',
            anneeRef: m.annee,
            timestamp: Date.now()
          });
        }
      }
    }

    const storedComp = this.benchmarkService.getStoredComparativeNotifications();
    for (const c of storedComp) {
      if (!this.dismissedNotifIds.has(c.id)) {
        list.push({
          ...c,
          isRead: this.readNotifIds.has(c.id)
        });
      }
    }

    this.notificationsList = list;
    this.notificationService.setAllReadStateFromIds(this.readNotifIds, this.notificationsList);
  }

  private evalCondition(val: number, op: string, seuil: number): boolean {
    if (op === '<') return val < seuil;
    if (op === '<=') return val <= seuil;
    if (op === '>') return val > seuil;
    if (op === '>=') return val >= seuil;
    if (op === 'VARIATION_ABSOLUE_>') return Math.abs(val) > seuil;
    return false;
  }

  get indicatorsForSelectedService(): IndicatorDefinition[] {
    if (this.selectedServiceFilter === 'TOUS') return this.availableIndicators;
    return this.availableIndicators.filter(ind => ind.domaine === this.selectedServiceFilter);
  }

  onServiceFilterChange(service: string): void {
    this.selectedServiceFilter = service;
    this.selectedIndicatorFilter = 'TOUS';
  }

  get scopedNotifications(): SmartNotification[] {
    const ind = this.selectedIndicatorFilter === 'TOUS'
      ? null
      : this.availableIndicators.find(i => i.id === this.selectedIndicatorFilter) ?? null;

    return this.notificationsList.filter(n => {
      const matchSrv = this.selectedServiceFilter === 'TOUS' || n.domaine === this.selectedServiceFilter;
      const matchInd = !ind || n.domaine === ind.domaine;
      return matchSrv && matchInd;
    });
  }

  get filteredNotifications(): SmartNotification[] {
    return this.scopedNotifications.filter(n => {
      return (
        this.filterCategory === 'TOUTES' ||
        (this.filterCategory === 'NON_LUES' && !n.isRead) ||
        (this.filterCategory === 'CRITIQUES' && n.severite === 'CRITIQUE') ||
        (this.filterCategory === 'COMPARATIVES' && n.source === 'COMPARATIF')
      );
    });
  }

  get unreadNotifications(): SmartNotification[] {
    return this.filteredNotifications.filter(n => !n.isRead);
  }

  get readNotifications(): SmartNotification[] {
    return this.filteredNotifications.filter(n => n.isRead);
  }

  get unreadCount(): number {
    return this.scopedNotifications.filter(n => !n.isRead).length;
  }

  get criticalCount(): number {
    return this.scopedNotifications.filter(n => n.severite === 'CRITIQUE').length;
  }

  get comparativeCount(): number {
    return this.scopedNotifications.filter(n => n.source === 'COMPARATIF').length;
  }

  get filteredAlertRules(): AlertRule[] {
    return this.alertRules.filter(r => {
      const matchSrv = this.selectedServiceFilter === 'TOUS' || r.domaine === this.selectedServiceFilter;
      const matchInd = this.selectedIndicatorFilter === 'TOUS' || r.indicateurId === this.selectedIndicatorFilter;
      return matchSrv && matchInd;
    });
  }

  get activeRulesCount(): number {
    return this.filteredAlertRules.filter(r => r.actif).length;
  }

  get latestComparativeLabel(): string {
    const comps = this.notificationsList.filter(n => n.source === 'COMPARATIF');
    return comps.length > 0 ? `${comps[0].dateStr} • Dernière analyse` : `${this.comparativeYearA} vs ${this.comparativeYearB}`;
  }

  setFilter(cat: 'TOUTES' | 'NON_LUES' | 'CRITIQUES' | 'COMPARATIVES'): void {
    this.filterCategory = cat;
  }

  markAsRead(notif: SmartNotification): void {
    notif.isRead = true;
    this.readNotifIds.add(notif.id);
    this.saveReadNotifIds();
    this.notificationService.markAsRead(notif.id);
    this.cdr.detectChanges();
  }

  toggleRead(id: string): void {
    const notif = this.notificationsList.find(n => n.id === id);
    if (!notif) return;
    notif.isRead = !notif.isRead;
    if (notif.isRead) this.readNotifIds.add(id);
    else this.readNotifIds.delete(id);
    this.saveReadNotifIds();
    this.notificationService.setAllReadStateFromIds(this.readNotifIds, this.notificationsList);
  }

  markAllAsRead(): void {
    this.notificationsList.forEach(n => {
      n.isRead = true;
      this.readNotifIds.add(n.id);
    });
    this.saveReadNotifIds();
    this.notificationService.markAllAsRead();
    this.cdr.detectChanges();
  }

  dismissNotification(id: string): void {
    this.dismissedNotifIds.add(id);
    this.notificationsList = this.notificationsList.filter(n => n.id !== id);
    if (id.startsWith('notif-comp-')) {
      this.benchmarkService.removeStoredComparativeNotification(id);
    }
    this.notificationService.dismissAlerte(id);
  }

  executeAction(notif: SmartNotification): void {
    this.markAsRead(notif);
    if (notif.actionType === 'SIMULATION') {
      this.router.navigate(['/synthese-decisionnelle'], {
        queryParams: { exercice: notif.anneeRef || this.selectedExercice, tab: 'simulateur' }
      });
    } else if (notif.actionType === 'SURVEILLANCE') {
      this.router.navigate(['/synthese-decisionnelle'], {
        queryParams: { exercice: notif.anneeRef || this.selectedExercice }
      });
    } else if (notif.actionType === 'COMPARATIF') {
      this.router.navigate(['/analyse-comparative'], {
        queryParams: { anneeA: notif.anneeRef || 2026, anneeB: notif.anneeComp || 2025 }
      });
    }
  }

  openNewRuleModal(): void {
    this.editingRuleId = null;
    const ind = this.availableIndicators[0];
    this.newRule = {
      nom: `Alerte sur ${ind.nom}`,
      indicateurId: ind.id,
      operateur: ind.defaultOperateur,
      valeurSeuil: ind.defaultSeuil,
      severite: ind.defaultSeverite
    };
    this.showRuleModal = true;
  }

  editRule(rule: AlertRule): void {
    this.editingRuleId = rule.id;
    this.newRule = {
      nom: rule.nom,
      indicateurId: rule.indicateurId,
      operateur: rule.operateur,
      valeurSeuil: rule.valeurSeuil,
      severite: rule.severite
    };
    this.showRuleModal = true;
  }

  closeRuleModal(): void {
    this.showRuleModal = false;
    this.editingRuleId = null;
  }

  onIndicatorSelectionChanged(): void {
    const ind = this.availableIndicators.find(i => i.id === this.newRule.indicateurId);
    if (ind) {
      this.newRule.operateur = ind.defaultOperateur;
      this.newRule.valeurSeuil = ind.defaultSeuil;
      this.newRule.severite = ind.defaultSeverite;
      this.newRule.nom = `Alerte sur ${ind.nom}`;
    }
  }

  getSelectedIndicatorUnit(): string {
    return this.availableIndicators.find(i => i.id === this.newRule.indicateurId)?.unite || '';
  }

  getConditionLabel(rule: AlertRule): string {
    if (rule.operateur === 'VARIATION_ABSOLUE_>') {
      return `Variation > ±${rule.valeurSeuil} ${rule.unite}`;
    }
    return `${rule.operateur} ${rule.valeurSeuil} ${rule.unite}`;
  }

  saveRule(): void {
    const ind = this.availableIndicators.find(i => i.id === this.newRule.indicateurId);
    if (!ind) return;

    if (this.editingRuleId) {
      const ex = this.alertRules.find(r => r.id === this.editingRuleId);
      if (ex) {
        ex.nom = this.newRule.nom;
        ex.indicateurId = ind.id;
        ex.indicateurNom = ind.nom;
        ex.domaine = ind.domaine;
        ex.operateur = this.newRule.operateur;
        ex.valeurSeuil = Number(this.newRule.valeurSeuil);
        ex.unite = ind.unite;
        ex.severite = this.newRule.severite;
      }
    } else {
      this.alertRules.push({
        id: `rule-custom-${Date.now()}`,
        nom: this.newRule.nom || `Alerte ${ind.nom}`,
        indicateurId: ind.id,
        indicateurNom: ind.nom,
        domaine: ind.domaine,
        operateur: this.newRule.operateur,
        valeurSeuil: Number(this.newRule.valeurSeuil),
        unite: ind.unite,
        severite: this.newRule.severite,
        actif: true
      });
    }

    this.saveAlertRules();
    this.generateSmartNotifications();
    this.closeRuleModal();
    this.showSavedFeedback = true;
    setTimeout(() => {
      this.showSavedFeedback = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  toggleRule(rule: AlertRule): void {
    rule.actif = !rule.actif;
    this.saveAlertRules();
    this.generateSmartNotifications();
  }

  deleteRule(id: string): void {
    this.alertRules = this.alertRules.filter(r => r.id !== id);
    this.saveAlertRules();
    this.generateSmartNotifications();
  }

  resetToDefaultRules(): void {
    this.alertRules = this.getDefaultRules();
    this.saveAlertRules();
    this.generateSmartNotifications();
  }

  genererRapport(notif: SmartNotification): void {
    const now = new Date();
    this.activeReport = {
      id: `RAP-DGTCP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      dateEdition: `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      titre: notif.titre,
      severite: notif.severite,
      badgeLabel: notif.badgeLabel,
      domaine: String(notif.domaine),
      periode: notif.dateStr,
      perimetre: this.selectedPerimetre,
      chiffreCle: notif.chiffreCle,
      description: notif.description,
      diagnostic: `L'analyse automatisée DGTCP met en évidence un point d'attention sur le service ${notif.domaine} (${notif.chiffreCle || 'écart détecté'}).`,
      impacts: [
        'Impact direct sur la position nette du Compte Unique du Trésor (CUT) et les ratios de conformité des 7 Services.',
        'Nécessité de justification documentaire avant l’arrêté périodique de la Balance Générale et du Compte de Gestion.'
      ],
      recommandations: [
        'Diligenter une relance immédiate auprès des postes comptables et ordonnateurs du service concerné.',
        'Exécuter une simulation d’apurement dans la Synthèse Décisionnelle DGTCP.',
        'Valider l’écriture de régularisation avec la Paierie Générale du Trésor (PGT).'
      ]
    };
    this.showReportModal = true;
  }

  genererRapportGlobal(): void {
    const now = new Date();
    const notifsIncluses = [...this.filteredNotifications];
    const critCount = notifsIncluses.filter(n => n.severite === 'CRITIQUE').length;
    const scopeLabel = this.selectedServiceFilter === 'TOUS' ? '7 Services Consolidés' : this.selectedServiceFilter;

    this.activeReport = {
      id: `SYN-7SRV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      dateEdition: `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      titre: `Rapport Consolidé — ${scopeLabel} (${notifsIncluses.length} notification(s))`,
      severite: critCount > 0 ? 'CRITIQUE' : 'INFO',
      badgeLabel: critCount > 0 ? `${critCount} Alerte(s) Critique(s)` : 'Services Conformes',
      domaine: scopeLabel,
      periode: `Exercice ${this.selectedExercice}`,
      perimetre: this.selectedPerimetre,
      chiffreCle: `${this.realMetrics?.liquiditeNetteCutMilliards || 1542.3} Mds CUT`,
      description: `Synthèse exécutive consolidant ${notifsIncluses.length} notification(s) active(s) sur les 7 Services : Comptabilité, Trésorerie, Cautionnement, Régies, Règlement, Statistiques et Compte de Gestion.`,
      diagnostic: `Le dispositif de surveillance DGTCP recense ${critCount} alerte(s) critique(s) sur l'exercice ${this.selectedExercice} (${scopeLabel}).`,
      impacts: [
        `Comptabilité & Compte de Gestion : Concordance BCEAO à ${this.realMetrics?.tauxRapprochementAuto}% et Conformité Cour des Comptes à ${this.realMetrics?.tauxConformiteCompteGestion}%.`,
        `Trésorerie & Cautionnement : Liquidité CUT à ${this.realMetrics?.liquiditeNetteCutMilliards} Mds FCFA, Régul. LA à ${this.realMetrics?.tauxRegularisationLA}%, Cautionnements à ${this.realMetrics?.cautionnementsVolumeMilliards} Mds.`,
        `Régies, Règlement & Statistiques : Recettes à ${this.realMetrics?.totalRecettesMilliards} Mds, Délai règlement ${this.realMetrics?.delaiMoyenReglementJours}j, RAP > 90j à ${this.realMetrics?.rapCritiquePlus90jMilliards} Mds.`
      ],
      recommandations: [
        'Prioriser l’apurement des RAP > 90 jours (Statistiques/Règlement) et des Lettres d’Avance échues (Trésorerie).',
        'Régulariser les cautionnements échus (Cautionnement) et contrôler les régies en dépassement (Régies).',
        'Archiver ce rapport consolidé des 7 Services pour le comité de direction DGTCP.'
      ],
      notifications: notifsIncluses
    };
    this.showReportModal = true;
  }

  copierRapport(): void {
    if (!this.activeReport || typeof navigator === 'undefined' || !navigator.clipboard) return;
    const r = this.activeReport;
    const notifsTxt = r.notifications?.length
      ? `\n\nNotifications (${r.notifications.length}) :\n` + r.notifications.map(n => `- [${n.severite}] [${n.domaine}] ${n.titre} : ${n.description}`).join('\n')
      : '';
    const txt = `${r.titre} (${r.id})\nPérimètre : ${r.perimetre} | ${r.periode}\n\nConstat : ${r.description}\nDiagnostic : ${r.diagnostic}\n\nRecommandations :\n- ${r.recommandations.join('\n- ')}${notifsTxt}`;
    navigator.clipboard.writeText(txt).then(() => {
      this.copiedFeedback = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.copiedFeedback = false;
        this.cdr.detectChanges();
      }, 2000);
    });
  }

  async imprimerRapport(): Promise<void> {
    if (!this.isBrowser || !this.activeReport) return;
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const r = this.activeReport;
    const doc = new jsPDF({ orientation: 'portrait' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 16;

    const assurerEspace = (h: number) => {
      if (y + h > pageH - 14) { doc.addPage(); y = 16; }
    };

    // En-tête DGTCP
    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text('DGTCP — Rapport de Synthèse & Notifications', 14, y);
    y += 6;
    doc.setFontSize(9.5);
    doc.setTextColor(100);
    doc.text(`${r.periode}`, 14, y);
    y += 8;

    // 1. Objet du constat
    doc.setFontSize(11);
    doc.setTextColor(26, 54, 93);
    doc.text('1. Objet du Constat d\'Alerte', 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(80);
    const descLignes = doc.splitTextToSize(r.description, pageW - 28);
    doc.text(descLignes, 14, y);
    y += descLignes.length * 4.2 + 6;

    // 2. Diagnostic & Impacts
    assurerEspace(20);
    doc.setFontSize(11);
    doc.setTextColor(26, 54, 93);
    doc.text('2. Diagnostic & Analyse d\'Impact', 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(40);
    const diagLignes = doc.splitTextToSize(r.diagnostic, pageW - 28);
    doc.text(diagLignes, 14, y);
    y += diagLignes.length * 4.2 + 2;
    r.impacts.forEach(imp => {
      const l = doc.splitTextToSize(`• ${imp}`, pageW - 32);
      assurerEspace(l.length * 4.2);
      doc.text(l, 18, y);
      y += l.length * 4.2 + 1;
    });
    y += 4;

    const hasNotifs = !!(r.notifications && r.notifications.length > 0);

    // 3. Toutes les notifications incluses (si présentes)
    if (hasNotifs && r.notifications) {
      assurerEspace(24);
      doc.setFontSize(11);
      doc.setTextColor(26, 54, 93);
      doc.text(`3. Détail des Notifications (${r.notifications.length})`, 14, y);
      y += 3;

      autoTable(doc, {
        startY: y,
        head: [['Service', 'Sévérité', 'Notification', 'Indicateur']],
        body: r.notifications.map(n => [
          String(n.domaine),
          n.severite,
          `${n.titre}\n${n.description}`,
          n.chiffreCle || '—'
        ]),
        headStyles: { fillColor: [26, 54, 93] },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 20 },
          2: { cellWidth: 108 },
          3: { cellWidth: 26 }
        }
      });

      y = ((doc as any).lastAutoTable?.finalY ?? y) + 8;
    }

    // 4. Recommandations en dernière position
    assurerEspace(20);
    doc.setFontSize(11);
    doc.setTextColor(25, 135, 84);
    doc.text(`${hasNotifs ? '4.' : '3.'} Recommandations Opérationnelles Immédiates`, 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(40);
    r.recommandations.forEach((rec, idx) => {
      const l = doc.splitTextToSize(`${idx + 1}. ${rec}`, pageW - 32);
      assurerEspace(l.length * 4.2);
      doc.text(l, 18, y);
      y += l.length * 4.2 + 1;
    });

    // Pied de page : date et heure d'impression en bas à droite de chaque page
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

    doc.save(`Rapport_Notifications_DGTCP_${this.selectedExercice}.pdf`);
  }
}
